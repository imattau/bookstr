import type { Event, EventTemplate } from 'nostr-tools';
import type { NostrContextValue } from '../nostr';

/**
 * Attempts to connect to a browser Nostr wallet via NIP-07.
 * Returns the public key on success, otherwise `null`.
 */
export async function connectNostrWallet(): Promise<string | null> {
  const nostr = (window as any).nostr;
  if (!nostr || typeof nostr.getPublicKey !== 'function') return null;
  try {
    return await nostr.getPublicKey();
  } catch {
    return null;
  }
}

/**
 * Sign and publish a NIP-42 authentication event using a Nostr extension.
 */
export async function nostrLogin(
  ctx: NostrContextValue,
  pubkey: string,
): Promise<string> {
  const nostr = (window as any).nostr;
  if (!nostr || typeof nostr.signEvent !== 'function') {
    throw new Error('Nostr extension not available');
  }

  const challenge = Math.random().toString(36).slice(2);
  const event: EventTemplate = {
    kind: 22242,
    content: '',
    tags: [
      ['challenge', challenge],
    ],
    pubkey,
  } as any;

  const signed: Event = await nostr.signEvent({
    ...event,
    created_at: Math.floor(Date.now() / 1000),
  });

  await ctx.sendEvent(signed);
  if (ctx.loginNip07) ctx.loginNip07(pubkey);
  return pubkey;
}
