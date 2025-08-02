import React from 'react';
import { render } from '@testing-library/react';
import { LoginModal } from '../../src/components/LoginModal';

jest.mock('../../src/components/ToastProvider', () => ({
  useToast: () => jest.fn(),
}));

jest.mock('../../src/nostr', () => ({
  useNostr: () => ({
    login: jest.fn(),
    logout: jest.fn(),
    loginNip07: jest.fn(),
    pubkey: null,
  }),
}));

jest.mock('../../src/nostr/auth', () => ({
  connectNostrWallet: jest.fn(),
  nostrLogin: jest.fn(),
}));

describe('LoginModal', () => {
  it('matches snapshot', () => {
    const { container } = render(<LoginModal onClose={() => {}} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
