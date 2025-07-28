import React from 'react';
import { useNostr } from '../nostr';
import { connectNostrWallet, nostrLogin } from '../nostr/auth';
import { importKey, validatePrivKey } from '../lib/keys';
import { isValidUrl } from '../validators';

export interface LoginModalProps {
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const ctx = useNostr();
  const { login, logout, pubkey } = ctx;
  const [tab, setTab] = React.useState<'priv' | 'nip07' | 'remote'>('priv');

  const [privInput, setPrivInput] = React.useState('');
  const [privError, setPrivError] = React.useState<string | null>(null);

  const [remoteUrl, setRemoteUrl] = React.useState('');
  const [remoteToken, setRemoteToken] = React.useState('');
  const [remoteError, setRemoteError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const hasWallet = React.useMemo(() => Boolean((window as any).nostr), []);

  const handlePrivLogin = () => {
    const key = importKey(privInput);
    if (!key || !validatePrivKey(key)) {
      setPrivError('Invalid private key');
      return;
    }
    try {
      login(key);
      setPrivError(null);
      onClose();
    } catch {
      setPrivError('Invalid private key');
    }
  };

  const handleWalletLogin = async () => {
    setLoading(true);
    try {
      const pk = await connectNostrWallet();
      if (!pk) throw new Error('Wallet not found');
      await nostrLogin(ctx, pk);
      onClose();
    } catch (err: any) {
      setPrivError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteLogin = async () => {
    setLoading(true);
    try {
      const urlOk = isValidUrl(remoteUrl);
      if (!urlOk || !remoteToken) {
        setRemoteError('Enter a valid URL and token');
        setLoading(false);
        return;
      }
      const res = await fetch(`${remoteUrl.replace(/\/$/, '')}/pubkey`, {
        headers: { Authorization: `Bearer ${remoteToken}` },
      });
      const data = await res.json();
      if (!data.pubkey) throw new Error('Invalid response');
      ctx.loginNip07(data.pubkey);
      localStorage.setItem('remoteSignerUrl', remoteUrl);
      localStorage.setItem('remoteSignerToken', remoteToken);
      setRemoteError(null);
      onClose();
    } catch (err: any) {
      setRemoteError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPrivValid = Boolean(importKey(privInput));
  const isRemoteValid = isValidUrl(remoteUrl) && Boolean(remoteToken);

  if (pubkey) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--space-2)]">
          <div className="w-full max-w-sm space-y-4 rounded bg-[color:var(--clr-surface)] p-[var(--space-4)]">
          <p className="text-sm break-all">Logged in as {pubkey}</p>
          <div className="flex justify-end gap-2">
              <button onClick={logout} className="rounded border px-[var(--space-3)] py-[var(--space-1)]">
              Logout
            </button>
              <button onClick={onClose} className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--space-2)]">
        <div className="w-full max-w-sm space-y-4 rounded bg-[color:var(--clr-surface)] p-[var(--space-4)]">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('priv')}
            className={`flex-1 rounded border px-[var(--space-2)] py-[var(--space-1)] ${tab === 'priv' ? 'bg-border' : ''}`}
          >
            Private Key
          </button>
          <button
            onClick={() => setTab('nip07')}
            className={`flex-1 rounded border px-[var(--space-2)] py-[var(--space-1)] ${tab === 'nip07' ? 'bg-border' : ''}`}
          >
            NIP-07
          </button>
          <button
            onClick={() => setTab('remote')}
            className={`flex-1 rounded border px-[var(--space-2)] py-[var(--space-1)] ${tab === 'remote' ? 'bg-border' : ''}`}
          >
            Remote
          </button>
        </div>
        {tab === 'priv' && (
          <div className="space-y-2">
            <input
              value={privInput}
              onChange={(e) => setPrivInput(e.target.value)}
              placeholder="nsec or hex"
              className="w-full rounded border p-[var(--space-2)]"
            />
            {privError && <p className="text-red-600 text-sm">{privError}</p>}
            <button
              onClick={handlePrivLogin}
              disabled={!isPrivValid || loading}
              className="w-full rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white disabled:opacity-50"
            >
              Login
            </button>
          </div>
        )}
        {tab === 'nip07' && (
          <div className="space-y-2">
            {!hasWallet && <p className="text-sm">Nostr wallet not detected.</p>}
            {privError && <p className="text-red-600 text-sm">{privError}</p>}
            <button
              onClick={handleWalletLogin}
              disabled={!hasWallet || loading}
              className="w-full rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white disabled:opacity-50"
            >
              Connect Wallet
            </button>
          </div>
        )}
        {tab === 'remote' && (
          <div className="space-y-2">
            <input
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="Signer URL"
              className="w-full rounded border p-[var(--space-2)]"
            />
            <input
              value={remoteToken}
              onChange={(e) => setRemoteToken(e.target.value)}
              placeholder="Auth token"
              className="w-full rounded border p-[var(--space-2)]"
            />
            {remoteError && <p className="text-red-600 text-sm">{remoteError}</p>}
            <button
              onClick={handleRemoteLogin}
              disabled={!isRemoteValid || loading}
              className="w-full rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white disabled:opacity-50"
            >
              Connect
            </button>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded px-[var(--space-3)] py-[var(--space-1)] border">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
