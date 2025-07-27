import React from 'react';
import { keys, del } from 'idb-keyval';
import { useNostr } from '../nostr';

const AccountSettingsPage: React.FC = () => {
  const { pubkey, logout } = useNostr();
  const [dTags, setDTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const all = await keys();
        setDTags(
          all
            .filter((k) => typeof k === 'string' && (k as string).startsWith('ptr-'))
            .map((k) => (k as string).slice(4)),
        );
      } catch {
        setDTags([]);
      }
    })();
  }, []);

  const handleResetKeychain = async () => {
    try {
      const all = await keys();
      await Promise.all(
        all
          .filter((k) => typeof k === 'string' && (k as string).startsWith('ptr-'))
          .map((k) => del(k as string)),
      );
    } catch {
      /* ignore */
    }
    logout();
  };

  const handleSetupPin = () => {
    alert('PIN/Biometric lock setup is not implemented');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="break-all">Public key: {pubkey ?? 'Not logged in'}</p>
        {dTags.length > 0 && (
          <div>
            <h2 className="text-sm font-medium">d tags</h2>
            <ul className="list-disc pl-4">
              {dTags.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <button onClick={logout} className="rounded border px-3 py-1">
          Log out
        </button>
        <button onClick={handleResetKeychain} className="rounded border px-3 py-1">
          Reset keychain
        </button>
        <button onClick={handleSetupPin} className="rounded border px-3 py-1">
          Set up PIN/Biometric lock
        </button>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
