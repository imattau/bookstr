import React from 'react';
import { useNostr } from '../nostr';

export const Login: React.FC = () => {
  const { pubkey, login, logout } = useNostr();
  const [priv, setPriv] = React.useState('');

  if (pubkey)
    return (
      <button
        onClick={logout}
        className="rounded bg-primary-600 px-4 py-2 text-white"
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
        className="rounded bg-primary-600 px-4 py-2 text-white"
      >
        Login
      </button>
    </div>
  );
};
