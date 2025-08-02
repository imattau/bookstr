import React from 'react';
import { RelayListManager } from '../components/RelayListManager';
import { useNostr } from '../nostr';
import { fetchUserRelays } from '../nostr/relays';

/**
 * Manage the user's relay configuration.
 *
 * Provides manual relay editing via `RelayListManager` and a
 * convenience button to pull in relays from followed authors.
 */
export const RelaySettingsPage: React.FC = () => {
  const { relays, contacts, saveRelays } = useNostr();

  const handleAddFromFollows = async () => {
    const next = new Set(relays);
    for (const pk of contacts) {
      try {
        const urls = await fetchUserRelays(pk);
        urls.forEach((u) => next.add(u));
      } catch {
        /* ignore individual failures */
      }
    }
    await saveRelays(Array.from(next));
  };

  return (
    <div className="space-y-4">
      <RelayListManager />
      <button
        onClick={handleAddFromFollows}
        className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      >
        Add relays from followed authors
      </button>
    </div>
  );
};

export default RelaySettingsPage;
