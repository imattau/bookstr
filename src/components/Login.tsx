import React from 'react';
import { useNostr } from '../nostr';

export const Login: React.FC = () => {
  const { pubkey, login, logout } = useNostr();
  const [priv, setPriv] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = () => {
    try {
      login(priv);
      setError(null);
    } catch {
      setError('Invalid private key');
    }
  };

  if (pubkey)
    return (
      <button
        onClick={logout}
        className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-4)] py-[var(--space-2)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Logout
      </button>
    );

  return (
    <div className="space-y-2">
      <input
        value={priv}
        onChange={(e) => setPriv(e.target.value)}
          className="w-full rounded border p-[var(--space-2)]"
        placeholder="Private key"
      />
      {error && <div className="text-red-600">{error}</div>}
      <button
        onClick={handleLogin}
          className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-4)] py-[var(--space-2)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Login
      </button>
    </div>
  );
};
