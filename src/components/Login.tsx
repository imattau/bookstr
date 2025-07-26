import React from 'react';
import { useNostr } from '../nostr';

export const Login: React.FC = () => {
  const { pubkey, login, logout } = useNostr();
  const [priv, setPriv] = React.useState('');

  if (pubkey)
    return (
      <button
        onClick={logout}
        className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Logout
      </button>
    );

  return (
    <div className="space-y-2">
      <input
        value={priv}
        onChange={(e) => setPriv(e.target.value)}
        className="w-full rounded border p-2"
        placeholder="Private key"
      />
      <button
        onClick={() => login(priv)}
        className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Login
      </button>
    </div>
  );
};
