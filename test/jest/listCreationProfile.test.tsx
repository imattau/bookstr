import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ListPublishWizard } from '../../src/components/ListPublishWizard';
import { ProfileScreen } from '../../src/screens/ProfileScreen';

jest.mock('../../src/components/ToastProvider', () => ({
  useToast: () => jest.fn(),
}));

let nostrMocks: any = {};

jest.mock('../../src/nostr', () => ({
  useNostr: () => nostrMocks,
}));

jest.mock('../../src/components/BookCard', () => ({
  BookCard: () => <div data-testid="book-card" />,
}));

jest.mock('../../src/components/ListFollowButton', () => ({
  ListFollowButton: () => <div />,
}));

jest.mock('../../src/store/events', () => ({
  useEventStore: (sel: any) => sel({ addEvent: jest.fn() }),
}));

jest.mock('../../src/nostr/relays', () => ({
  fetchUserRelays: jest.fn(async () => []),
}));

describe('List creation and profile display', () => {
  beforeEach(() => {
    const publishMock = jest.fn(async () => ({ id: 'evt1' }));
    const listMock = jest.fn(async (filters: any[]) => {
      const kinds = filters[0].kinds || [];
      if (kinds.includes(30001)) {
        return [
          { tags: [['e', 'b1']] },
        ];
      }
      if (kinds.includes(41)) {
        return [
          { tags: [['d', 'b1'], ['title', 'Book 1']] },
        ];
      }
      if (kinds.includes(10003) || kinds.includes(30004)) {
        return [
          {
            id: 'l1',
            kind: 30004,
            pubkey: 'pk1',
            created_at: 0,
            content: '',
            tags: [['d', 'list1'], ['name', 'List One'], ['a', '41:pk1:b1']],
          },
          {
            id: 'l2',
            kind: 10003,
            pubkey: 'pk1',
            created_at: 0,
            content: '',
            tags: [['d', 'list2'], ['name', 'List Two'], ['a', '41:pk1:b2']],
          },
        ];
      }
      return [];
    });
    const subscribeMock = jest.fn(() => () => {});
    nostrMocks = {
      pubkey: 'pk1',
      list: listMock,
      publish: publishMock,
      subscribe: subscribeMock,
    };
  });

  test('publishes private and public lists with correct kind', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <ListPublishWizard />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('List name'), {
      target: { value: 'My List' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'Desc' },
    });
    fireEvent.click(screen.getByLabelText('Private list'));
    fireEvent.click(screen.getByText('Next'));
    await screen.findByText('Book 1');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Publish'));
    await waitFor(() => expect(nostrMocks.publish).toHaveBeenCalled());
    expect(nostrMocks.publish.mock.calls[0][0].kind).toBe(10003);

    // rerender for public list
    nostrMocks.publish.mockClear();
    rerender(
      <MemoryRouter>
        <ListPublishWizard />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('List name'), {
      target: { value: 'My Public List' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'Desc' },
    });
    fireEvent.click(screen.getByText('Next'));
    await screen.findByText('Book 1');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Publish'));
    await waitFor(() => expect(nostrMocks.publish).toHaveBeenCalled());
    expect(nostrMocks.publish.mock.calls[0][0].kind).toBe(30004);
  });

  test('shows owned lists on profile with edit options', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<ProfileScreen />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('list1')).toBeInTheDocument());
    expect(screen.getByText('list2')).toBeInTheDocument();
    expect(screen.getByText('Create List')).toBeInTheDocument();
    expect(screen.getAllByText('Edit list').length).toBeGreaterThan(0);
  });
});
