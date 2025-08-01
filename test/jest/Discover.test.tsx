import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Discover } from '../../src/components/Discover';

jest.mock('../../src/analytics', () => ({ logEvent: jest.fn() }));

jest.mock('../../src/nostr', () => ({
  useNostr: () => ({ contacts: [], subscribe: jest.fn() }),
}));

jest.mock('../../src/hooks/useDiscoverBooks', () => ({
  useDiscoverBooks: () => ({
    books: [],
    trending: [],
    newReleases: [],
    loading: false,
    removeBook: jest.fn(),
  }),
}));

describe('Discover', () => {
  it('mobile snapshot', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));
    const { container } = render(
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('desktop snapshot', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    window.dispatchEvent(new Event('resize'));
    const { container } = render(
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
