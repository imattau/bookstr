import React from 'react';
import { useNostr } from '../nostr';

export interface FollowButtonProps {
  pubkey: string;
  className?: string;
}

/**
 * Button that toggles following status for a given pubkey using
 * the contacts list from the Nostr context.
 */
export const FollowButton: React.FC<FollowButtonProps> = ({
  pubkey,
  className,
}) => {
  const { contacts, relays, list, saveContacts, saveRelays } = useNostr();
  const following = contacts.includes(pubkey);

  const toggle = async () => {
    const next = following
      ? contacts.filter((p) => p !== pubkey)
      : [...contacts, pubkey];

    if (!following) {
      try {
        const evts = await list([
          { authors: [pubkey], kinds: [10002], limit: 1 },
        ]);
        const newRelays = evts
          .flatMap((e) =>
            e.tags
              .filter((t) => t[0] === 'r' && t[1])
              .map((t) => t[1] as string),
          );
        const merged = Array.from(new Set([...relays, ...newRelays]));
        if (merged.length > relays.length) saveRelays(merged);
      } catch {
        /* ignore */
      }
    }

    saveContacts(next);
  };

  return (
    <button
      onClick={toggle}
      className={
        className ??
        'rounded-[var(--radius-button)] bg-[color:var(--clr-primary-600)] px-[var(--space-2)] py-[var(--space-1)] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50'
      }
    >
      {following ? 'Unfollow' : 'Follow'}
    </button>
  );
};
