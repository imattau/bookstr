import React from 'react';
import { render } from '@testing-library/react';
import { BookPublishWizard } from '../../src/components/BookPublishWizard';

jest.mock('../../src/nostr', () => ({
  useNostr: () => ({ publish: jest.fn() }),
}));

jest.mock('../../src/components/ToastProvider', () => ({
  useToast: () => jest.fn(),
}));

describe('BookPublishWizard', () => {
  it('matches snapshot', () => {
    const { container } = render(<BookPublishWizard />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
