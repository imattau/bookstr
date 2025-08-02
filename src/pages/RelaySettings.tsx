import React, { useState, useEffect } from 'react';
import { useNostr } from '../nostr';

interface RelayEntry {
  url: string;
  read: boolean;
  write: boolean;
  search: boolean;
}

/**
 * Manage relay URLs and their permissions.
 *
 * Displays existing relays from `useNostr().relays` and allows users to add or
 * remove relays as well as toggle read/write/search flags. Changes are persisted
 * using `saveRelays` from the Nostr context.
 */
export const RelaySettingsPage: React.FC = () => {
  const { relays, saveRelays } = useNostr();
  const [items, setItems] = useState<RelayEntry[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setItems(
      relays.map((url: string) => ({
        url,
        read: true,
        write: true,
        search: false,
      })),
    );
  }, [relays]);

  const persist = (next: RelayEntry[]) => {
    setItems(next);
    saveRelays(next.map((r) => r.url));
  };

  const handleAdd = () => {
    const url = input.trim();
    if (!url || items.find((r) => r.url === url)) return;
    persist([...items, { url, read: true, write: true, search: false }]);
    setInput('');
  };

  const handleRemove = (url: string) => {
    persist(items.filter((r) => r.url !== url));
  };

  const handleFlagChange = (
    url: string,
    key: 'read' | 'write' | 'search',
    value: boolean,
  ) => {
    const next = items.map((r) => (r.url === url ? { ...r, [key]: value } : r));
    setItems(next);
    saveRelays(next.map((r) => r.url));
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.url} className="rounded border p-[var(--space-2)]">
            <div className="flex items-center gap-2">
              <span className="flex-1 break-all">{r.url}</span>
              <button
                onClick={() => handleRemove(r.url)}
                className="rounded bg-red-600 px-[var(--space-2)] py-[var(--space-1)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
              >
                Remove
              </button>
            </div>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={r.read}
                  onChange={(e) =>
                    handleFlagChange(r.url, 'read', e.target.checked)
                  }
                />
                Read
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={r.write}
                  onChange={(e) =>
                    handleFlagChange(r.url, 'write', e.target.checked)
                  }
                />
                Write
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={r.search}
                  onChange={(e) =>
                    handleFlagChange(r.url, 'search', e.target.checked)
                  }
                />
                Search
              </label>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded border p-[var(--space-2)]"
          placeholder="wss://relay.example"
        />
        <button
          onClick={handleAdd}
          className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default RelaySettingsPage;
