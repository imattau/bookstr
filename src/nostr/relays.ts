/**
 * Functions for retrieving relay information from user profiles.
 */
import type { Event } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';
import { DEFAULT_RELAYS } from '../nostr';

export async function fetchUserRelays(pubkey: string): Promise<string[]> {
  const pool = new SimplePool();
  const relays = DEFAULT_RELAYS ?? [];
  try {
    const events = (await pool.list(relays, [
      { kinds: [10002], authors: [pubkey], limit: 1 },
    ])) as Event[];
    const evt = events[0];
    if (!evt) return [];
    return evt.tags.filter((t) => t[0] === 'r').map((t) => t[1]);
  } catch {
    return [];
  } finally {
    if (relays.length) pool.close(relays);
  }
}
