/**
 * Authentication helpers for Nostr sessions.
 */
import type { Event, EventTemplate } from 'nostr-tools';
import type { NostrContextValue } from '../nostr';
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { schnorr } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";

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

const encoder = new TextEncoder();
let sessionPrivKey: string | null = null;

export const getPrivKey = () => sessionPrivKey;
export const setPrivKey = (key: string | null) => {
  sessionPrivKey = key;
};

export function createDelegationTag(
  priv: string,
  delegate: string,
  conditions: string,
) {
  const str = `nostr:delegation:${delegate}:${conditions}`;
  const hash = sha256(encoder.encode(str));
  const sig = bytesToHex(schnorr.sign(hash, hexToBytes(priv)));
  const delegator = bytesToHex(schnorr.getPublicKey(hexToBytes(priv)));
  return ['delegation', delegator, conditions, sig];
}

