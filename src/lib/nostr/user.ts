import type { Event } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';
import { DEFAULT_RELAYS, type NostrContextValue } from '../../nostr';

export interface UserProfileMeta {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
}

/**
 * Fetches profile metadata (kind 0) for the given pubkey.
 */
export async function fetchUserProfile(pubkey: string): Promise<UserProfileMeta | null> {
  const pool = new SimplePool();
  const relays = DEFAULT_RELAYS ?? [];
  try {
    const events = (await pool.list(relays, [
      { kinds: [0], authors: [pubkey], limit: 1 },
    ])) as Event[];
    const evt = events[0];
    if (!evt) return null;
    try {
      return JSON.parse(evt.content);
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    if (relays.length) pool.close(relays);
  }
}

/**
 * Toggle following status for the given pubkey. Returns the new following state
 * (true if now following, false if unfollowed).
 */
export async function followUser(
  ctx: NostrContextValue,
  pubkey: string,
): Promise<boolean> {
  const following = ctx.contacts.includes(pubkey);
  const next = following
    ? ctx.contacts.filter((p) => p !== pubkey)
    : [...ctx.contacts, pubkey];
  await ctx.saveContacts(next);
  return !following;
}

