import React from 'react';
import { useNostr, connectNostrWallet, nostrLogin } from '../nostr';

export const LoginButton: React.FC = () => {
  const ctx = useNostr();
  const { pubkey, login, logout } = ctx;
  const [priv, setPriv] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [hasWallet, setHasWallet] = React.useState<boolean>(() => {
    return Boolean((window as any).nostr);
  });

  const handleWalletLogin = async () => {
    setError(null);
    const pk = await connectNostrWallet();
    if (!pk) {
      setHasWallet(false);
      return;
    }
    try {
      await nostrLogin(ctx, pk);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePrivLogin = () => {
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
        className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Logout
      </button>
    );

  return (
    <div className="space-y-2">
      {hasWallet ? (
        <button
          onClick={handleWalletLogin}
          className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          Login with Nostr
        </button>
      ) : (
        <>
          <input
            value={priv}
            onChange={(e) => setPriv(e.target.value)}
            className="w-full rounded border p-2"
            placeholder="Private key"
          />
          {error && <div className="text-red-600">{error}</div>}
          <button
            onClick={handlePrivLogin}
            className="rounded bg-primary-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            Login
          </button>
        </>
      )}
      {error && hasWallet && <div className="text-red-600">{error}</div>}
    </div>
  );
};
