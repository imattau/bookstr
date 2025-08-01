import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { getPublicKey, SimplePool } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import type { NostrContextValue } from '../nostr';
import { MAX_EVENT_SIZE } from '../nostr';
import { getPrivKey } from './auth';
import { useEffect } from 'react';
import { useNostr } from '../nostr';

const encoder = new TextEncoder();

export async function publishLongPost(
  ctx: NostrContextValue,
  data: {
    title: string;
    summary?: string;
    content: string;
    tags?: string[];
    cover?: string;
    extraTags?: string[][];
  },
  pow = 0,
) {
  const tags: string[][] = [];
  if (data.title) tags.push(['title', data.title]);
  if (data.summary) tags.push(['summary', data.summary]);
  if (data.cover) tags.push(['image', data.cover]);
  data.tags?.forEach((t) => tags.push(['t', t]));
  if (data.extraTags) tags.push(...data.extraTags);

  const sliceContent = (text: string) => {
    const parts: string[] = [];
    let buf = '';
    let size = 0;
    for (const ch of text) {
      const b = encoder.encode(ch).length;
      if (size + b > MAX_EVENT_SIZE && buf) {
        parts.push(buf);
        buf = ch;
        size = b;
      } else {
        buf += ch;
        size += b;
      }
    }
    if (buf) parts.push(buf);
    return parts;
  };

  const parts = sliceContent(data.content);
  if (parts.length === 1) {
    return ctx.publish(
      { kind: 30023, content: data.content, tags },
      undefined,
      pow,
    );
  }

  const dTag = Math.random().toString(36).slice(2);
  let first: NostrEvent | null = null;
  for (let i = 0; i < parts.length; i++) {
    const ptTags = [...tags, ['d', dTag], ['part', String(i + 1)]];
    const evt = await ctx.publish(
      { kind: 30023, content: parts[i], tags: ptTags },
      undefined,
      pow,
    );
    if (i === 0) first = evt;
  }
  return first!;
}

export async function fetchLongPostParts(
  ctx: NostrContextValue,
  evt: NostrEvent,
): Promise<string> {
  const d = evt.tags.find((t) => t[0] === 'd')?.[1];
  if (!d) return evt.content;
  const parts = await ctx.list([
    { kinds: [evt.kind], '#d': [d], authors: [evt.pubkey] },
  ]);
  const sorted = parts.sort((a, b) => {
    const pa = parseInt(a.tags.find((t) => t[0] === 'part')?.[1] ?? '1', 10);
    const pb = parseInt(b.tags.find((t) => t[0] === 'part')?.[1] ?? '1', 10);
    return pa - pb;
  });
  return sorted.map((p) => p.content).join('');
}

export async function publishBookMeta(
  ctx: NostrContextValue,
  bookId: string,
  meta: { title?: string; summary?: string; cover?: string; tags?: string[] },
  pow = 0,
) {
  const tags: string[][] = [['d', bookId]];
  if (meta.title) tags.push(['title', meta.title]);
  if (meta.summary) tags.push(['summary', meta.summary]);
  if (meta.cover) tags.push(['image', meta.cover]);
  meta.tags?.forEach((t) => tags.push(['t', t]));
  return ctx.publish({ kind: 41, content: '', tags }, undefined, pow);
}

export async function publishVote(ctx: NostrContextValue, target: string) {
  return ctx.publish({ kind: 7, content: '+', tags: [['e', target]] });
}

export async function publishFavourite(ctx: NostrContextValue, target: string) {
  return ctx.publish({ kind: 7, content: '★', tags: [['e', target]] });
}

export async function publishRepost(ctx: NostrContextValue, target: string) {
  return ctx.publish({ kind: 6, content: '', tags: [['e', target]] });
}

export async function publishAttachment(
  ctx: NostrContextValue,
  data: { mime: string; url: string; bookId?: string },
) {
  const tags: string[][] = [
    ['mime', data.mime],
    ['url', data.url],
  ];
  if (data.bookId) tags.push(['e', data.bookId]);
  return ctx.publish({ kind: 1064, content: '', tags });
}

export async function sendDM(ctx: NostrContextValue, to: string, text: string) {
  const priv = getPrivKey();
  let cipher: string;
  if (priv) {
    cipher = await (await import('nostr-tools')).nip04.encrypt(priv, to, text);
  } else {
    const nostr = (window as any).nostr;
    if (!nostr?.nip04?.encrypt) throw new Error('not logged in');
    cipher = await nostr.nip04.encrypt(to, text);
  }
  return ctx.publish({ kind: 4, content: cipher, tags: [['p', to]] });
}

export async function sendGroupDM(
  ctx: NostrContextValue,
  to: string[],
  text: string,
) {
  const priv = getPrivKey();
  if (!priv) throw new Error('not logged in');
  const nt = await import('nostr-tools');
  const privBytes = hexToBytes(priv);
  const myPub = getPublicKey(privBytes);
  const recipients = to
    .filter((p) => p !== myPub)
    .map((p) => ({ publicKey: p }));
  const events = nt.nip17.wrapManyEvents(privBytes, recipients, text);
  for (const e of events) {
    await ctx.sendEvent(e);
  }
  return events;
}

export async function verifyNip05(handle: string, pubkey: string) {
  const [name, domain] = handle.split('@');
  if (!name || !domain) return false;
  try {
    const res = await fetch(
      `https://${domain}/.well-known/nostr.json?name=${name}`,
    );
    const data = await res.json();
    return data.names?.[name] === pubkey;
  } catch {
    return false;
  }
}

export async function zap(
  ctx: NostrContextValue,
  event: NostrEvent,
  amount = 1,
) {
  const meta = await new Promise<Record<string, any> | null>((resolve) => {
    let done = false;
    const off = ctx.subscribe(
      [{ kinds: [0], authors: [event.pubkey], limit: 1 }],
      (evt) => {
        if (done) return;
        done = true;
        off();
        try {
          resolve(JSON.parse(evt.content));
        } catch {
          resolve(null);
        }
      },
    );
    setTimeout(() => {
      if (!done) {
        off();
        resolve(null);
      }
    }, 5000);
  });

  const address = meta?.lud16 as string | undefined;
  if (!address) throw new Error('missing lightning address');
  const [name, domain] = address.split('@');
  const infoRes = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
  const info = await infoRes.json();
  const msats = Math.max(info.minSendable, amount * 1000);

  const relays = ctx.relays;
  const zapReq = await ctx.publish({
    kind: 9734,
    content: '',
    tags: [
      ['p', event.pubkey],
      ['e', event.id],
      ['relays', ...relays],
      ['amount', msats.toString()],
    ],
  });

  const nostr = encodeURIComponent(JSON.stringify(zapReq));
  const cb = `${info.callback}?amount=${msats}&nostr=${nostr}`;
  const invRes = await fetch(cb);
  const inv = await invRes.json();
  const invoice: string = inv.pr;

  const webln = (window as any).webln;
  if (webln && webln.sendPayment) {
    try {
      await webln.enable();
      await webln.sendPayment(invoice);
    } catch {
      window.open(`lightning:${invoice}`);
    }
  } else {
    window.open(`lightning:${invoice}`);
  }

  await new Promise<void>((resolve) => {
    const off = ctx.subscribe(
      [{ kinds: [9735], '#bolt11': [invoice], limit: 1 }],
      () => {
        off();
        resolve();
      },
    );
    setTimeout(() => {
      off();
      resolve();
    }, 30000);
  });
}

// ---------------------------------------------------------------------------
// Subscription manager
// ---------------------------------------------------------------------------

type Listener = (evt: NostrEvent) => void;

const pool = new SimplePool();
const subs = new Map<string, { sub: any; listeners: Set<Listener> }>();

function makeKey(relays: string[], filters: Filter[]): string {
  return JSON.stringify({ relays: relays.slice().sort(), filters });
}

export function sharedSubscribe(
  relays: string[],
  filters: Filter[],
  cb: Listener,
): () => void {
  const key = makeKey(relays, filters);
  let entry = subs.get(key);
  if (!entry) {
    const sub = pool.subscribeMany(relays, filters, {
      onevent: (evt: NostrEvent) => {
        const en = subs.get(key);
        if (en) en.listeners.forEach((fn) => fn(evt));
      },
    });
    entry = { sub, listeners: new Set() };
    subs.set(key, entry);
  }
  entry.listeners.add(cb);
  return () => {
    const en = subs.get(key);
    if (!en) return;
    en.listeners.delete(cb);
    if (en.listeners.size === 0) {
      (en.sub as any).unsub();
      subs.delete(key);
    }
  };
}

export function useSubscribe(filters: Filter[], cb: Listener) {
  const { relays } = useNostr();
  useEffect(() => sharedSubscribe(relays, filters, cb), [cb, relays, filters]);
}
