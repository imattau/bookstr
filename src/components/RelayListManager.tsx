import React, { useState } from 'react';
import { useNostr } from '../nostr';
import { OnboardingTooltip } from './OnboardingTooltip';

/**
 * Manage the list of relay URLs. Allows adding new relays and
 * removing existing ones. Updates are persisted using kind 10002
 * events via `saveRelays` in the Nostr context.
 */
export const RelayListManager: React.FC = () => {
  const { relays, saveRelays } = useNostr();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const url = input.trim();
    if (!url) return;
    if (relays.includes(url)) {
      setInput('');
      return;
    }
    saveRelays([...relays, url]);
    setInput('');
  };

  const handleRemove = (url: string) => {
    saveRelays(relays.filter((r) => r !== url));
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {relays.map((r) => (
          <li key={r} className="flex items-center gap-2">
            <span className="flex-1 break-all">{r}</span>
            <button
              onClick={() => handleRemove(r)}
              className="rounded bg-red-600 px-2 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded border p-2"
          placeholder="wss://relay.example"
        />
        <OnboardingTooltip storageKey="relay-add" text="Add a relay URL">
          <button
            onClick={handleAdd}
            className="rounded bg-primary-600 px-3 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            Add
          </button>
        </OnboardingTooltip>
      </div>
    </div>
  );
};
