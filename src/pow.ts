import type { EventTemplate } from 'nostr-tools';
import { getEventHash } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

const MAX_POW_TIME_MS = 5000;
const MAX_POW_ITERATIONS = 500000;

function leadingZeroBits(bytes: Uint8Array) {
  let count = 0;
  for (const b of bytes) {
    if (b === 0) {
      count += 8;
      continue;
    }
    for (let i = 7; i >= 0; i--) {
      if ((b >> i) & 1) return count;
      count++;
    }
    break;
  }
  return count;
}

export async function applyPow(
  tpl: Omit<EventTemplate, 'created_at'>,
  now: number,
  pow: number,
): Promise<EventTemplate> {
  const tags = tpl.tags ? [...tpl.tags] : [];
  let nonceIndex = tags.findIndex((t) => t[0] === 'nonce');
  if (nonceIndex === -1) {
    tags.push(['nonce', '0', pow.toString()]);
    nonceIndex = tags.length - 1;
  } else {
    tags[nonceIndex][1] = '0';
    tags[nonceIndex][2] = pow.toString();
  }
  let eventTemplate: EventTemplate = { ...tpl, tags, created_at: now } as any;
  let nonce = 0;
  const start = Date.now();
  while (true) {
    if (
      nonce > MAX_POW_ITERATIONS ||
      Date.now() - start > MAX_POW_TIME_MS
    ) {
      throw new Error('proof-of-work timed out');
    }
    tags[nonceIndex][1] = nonce.toString();
    eventTemplate = { ...tpl, tags, created_at: now } as any;
    const id = getEventHash(eventTemplate as any);
    const bits = leadingZeroBits(hexToBytes(id));
    if (bits >= pow) break;
    nonce += 1;
  }
  return eventTemplate;
}
