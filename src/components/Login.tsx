import React from 'react';
import { useNostr } from '../nostr';
import { Button, Input } from './ui';

/**
 * Simple login form for manual private key entry.
 */
export const Login: React.FC = () => {
  const { pubkey, login, logout } = useNostr();
  const [priv, setPriv] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = () => {
    try {
      login(priv);
      setError(null);
    } catch {
      setError('Invalid private key (64-char hex or nsec)');
    }
  };

  if (pubkey)
    return (
      <Button variant="primary" onClick={logout}>
        Logout
      </Button>
    );

  return (
    <div className="space-y-2">
      <Input
        value={priv}
        onChange={(e) => setPriv(e.target.value)}
        placeholder="Private key"
      />
      {error && <div className="text-red-600">{error}</div>}
      <Button variant="primary" onClick={handleLogin}
      >
        Login
      </Button>
    </div>
  );
};
