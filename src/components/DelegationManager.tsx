import React, { useState } from 'react';
import { createDelegationTag, getPrivKey } from '../nostr';

/**
 * Allow users to create delegation tags that authorize another
 * pubkey to publish on their behalf. A simple form collects the
 * delegatee pubkey, event kind and validity duration in days and
 * outputs the generated tag so it can be shared with the delegatee.
 */
export const DelegationManager: React.FC = () => {
  const [pubkey, setPubkey] = useState('');
  const [kind, setKind] = useState('1');
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<string | null>(null);

  const handleCreate = () => {
    const priv = getPrivKey();
    if (!priv || !pubkey) return;
    const now = Math.floor(Date.now() / 1000);
    const until = now + Number(days) * 86400;
    const conditions = `kind=${kind}&created_at>${now}&created_at<${until}`;
    const tag = createDelegationTag(priv, pubkey.trim(), conditions);
    setResult(JSON.stringify(tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          value={pubkey}
          onChange={(e) => setPubkey(e.target.value)}
          placeholder="Delegate pubkey"
          className="flex-1 rounded border p-2"
        />
        <input
          type="number"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-24 rounded border p-2"
          placeholder="kind"
        />
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-24 rounded border p-2"
          placeholder="days"
        />
        <button
          onClick={handleCreate}
          className="rounded bg-primary-600 px-3 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          Create
        </button>
      </div>
      {result && (
        <textarea
          readOnly
          className="w-full rounded border p-2"
          value={result}
        />
      )}
    </div>
  );
};
