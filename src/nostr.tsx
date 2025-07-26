import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useReadingStore, BookStatus } from './store';
import { useSettings } from './useSettings';
import type { Event as NostrEvent, EventTemplate, Filter } from 'nostr-tools';
import {
  SimplePool,
  getPublicKey,
  finalizeEvent,
  getEventHash,
} from 'nostr-tools';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { buildCommentTags } from './commentUtils';
import { validatePrivKey } from './validatePrivKey';

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://nostr.wine',
];

const encoder = new TextEncoder();

// Prevent endless proof-of-work loops from freezing the browser
const MAX_POW_TIME_MS = 5000;
const MAX_POW_ITERATIONS = 500000;

let sessionPrivKey: string | null = null;
export const getPrivKey = () => sessionPrivKey;

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

function checkDelegationConditions(
  cond: string,
  kind: number,
  created: number,
) {
  const parts = cond.split('&');
  for (const p of parts) {
    if (p.startsWith('kind=')) {
      if (kind !== parseInt(p.slice(5), 10)) return false;
    } else if (p.startsWith('created_at<')) {
      if (created >= parseInt(p.slice(11), 10)) return false;
    } else if (p.startsWith('created_at>')) {
      if (created <= parseInt(p.slice(11), 10)) return false;
    }
  }
  return true;
}

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

interface NostrContextValue {
  pubkey: string | null;
  metadata: Record<string, unknown> | null;
  contacts: string[];
  bookmarks: string[];
  relays: string[];
  login: (priv: string) => void;
  logout: () => void;
  publish: (
    event: Omit<EventTemplate, 'created_at'>,
    relays?: string[],
    pow?: number,
  ) => Promise<NostrEvent>;
  subscribe: (filters: Filter[], cb: (event: NostrEvent) => void) => () => void;
  saveProfile: (data: Record<string, unknown>) => Promise<void>;
  saveContacts: (list: string[]) => Promise<void>;
  saveRelays: (list: string[]) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  publishComment: (
    bookId: string,
    text: string,
    parentEventId?: string,
    parentPubkey?: string,
  ) => Promise<void>;
  sendEvent: (event: NostrEvent, relays?: string[]) => Promise<void>;
}

const NostrContext = createContext<NostrContextValue | undefined>(undefined);

export const NostrProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const poolRef = useRef(new SimplePool());
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(
    null,
  );
  const [contacts, setContacts] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [relays, setRelays] = useState<string[]>(DEFAULT_RELAYS);
  const relaysRef = useRef<string[]>(DEFAULT_RELAYS);
  useEffect(() => {
    relaysRef.current = relays;
  }, [relays]);
  const books = useReadingStore((s) => s.books);
  const loadStatuses = useReadingStore((s) => s.loadStatuses);
  const settings = useSettings((s) => ({
    textSize: s.textSize,
    density: s.density,
  }));
  const hydrateSettings = useSettings((s) => s.hydrate);

  useEffect(() => {
    const pool = poolRef.current;
    const storedPub = localStorage.getItem('pubKey');
    if (storedPub) setPubkey(storedPub);
    return () => pool.close(relaysRef.current);
  }, []);

  useEffect(() => {
    if (!pubkey) {
      setRelays(DEFAULT_RELAYS);
      return;
    }
    (poolRef.current as any)
      .list(DEFAULT_RELAYS, [{ kinds: [10002], authors: [pubkey], limit: 1 }])
      .then((events: NostrEvent[]) => {
        if (events[0]) {
          const r = events[0].tags
            .filter((t: string[]) => t[0] === 'r')
            .map((t: string[]) => t[1]);
          if (r.length) setRelays(r);
        }
      });
  }, [pubkey]);

  useEffect(() => {
    if (!pubkey) {
      setMetadata(null);
      setContacts([]);
      setBookmarks([]);
      return;
    }
    (poolRef.current as any)
      .list(relaysRef.current, [{ kinds: [0], authors: [pubkey], limit: 1 }])
      .then((events: NostrEvent[]) => {
        if (events[0]) {
          try {
            setMetadata(JSON.parse(events[0].content));
          } catch {
            setMetadata(null);
          }
        }
      });
    (poolRef.current as any)
      .list(relaysRef.current, [{ kinds: [3], authors: [pubkey], limit: 1 }])
      .then((events: NostrEvent[]) => {
        if (events[0]) {
          const p = events[0].tags.filter((t) => t[0] === 'p').map((t) => t[1]);
          setContacts(p);
        }
      });
    (poolRef.current as any)
      .list(relaysRef.current, [
        { kinds: [30001], authors: [pubkey], '#d': ['bookmarks'], limit: 1 },
      ])
      .then((events: NostrEvent[]) => {
        if (events[0]) {
          const e = events[0].tags
            .filter((t: string[]) => t[0] === 'e')
            .map((t: string[]) => t[1]);
          setBookmarks(e);
        }
      });
    (poolRef.current as any)
      .list(relaysRef.current, [
        { kinds: [30001], authors: [pubkey], '#d': ['library'], limit: 1 },
      ])
      .then((events: NostrEvent[]) => {
        if (events[0]) {
          const statuses = events[0].tags
            .filter((t: string[]) => t[0] === 'e')
            .map((t: string[]): [string, BookStatus] => [
              t[1],
              (t[2] as BookStatus) || 'want',
            ]);
          loadStatuses(statuses);
        }
      });
    (poolRef.current as any)
      .list(relaysRef.current, [
        { kinds: [30033], authors: [pubkey], '#d': ['settings'], limit: 1 },
      ])
      .then((events: NostrEvent[]) => {
        if (events[0]) {
          try {
            hydrateSettings(JSON.parse(events[0].content));
          } catch {
            /* ignore */
          }
        }
      });
  }, [pubkey, relays]);

  const login = (priv: string) => {
    if (!validatePrivKey(priv)) {
      throw new Error('invalid private key');
    }
    sessionPrivKey = priv;
    const pub = getPublicKey(hexToBytes(priv));
    localStorage.setItem('pubKey', pub);
    setPubkey(pub);
  };

  const logout = () => {
    sessionPrivKey = null;
    localStorage.removeItem('pubKey');
    setPubkey(null);
  };

  const publish = async (
    tpl: Omit<EventTemplate, 'created_at'>,
    relaysOverride?: string[],
    pow = 0,
  ) => {
    const priv = sessionPrivKey;
    if (!priv) throw new Error('not logged in');
    const now = Math.floor(Date.now() / 1000);
    const del = tpl.tags?.find((t) => t[0] === 'delegation');
    if (del) {
      const [, delegator, cond, sig] = del;
      const str = `nostr:delegation:${getPublicKey(hexToBytes(priv))}:${cond}`;
      const hash = sha256(encoder.encode(str));
      const okSig = schnorr.verify(sig, hash, delegator);
      const okCond = checkDelegationConditions(cond, tpl.kind, now);
      if (!okSig || !okCond) throw new Error('invalid delegation');
    }
    const tags = tpl.tags ? [...tpl.tags] : [];
    let nonceIndex = -1;
    if (pow > 0) {
      nonceIndex = tags.findIndex((t) => t[0] === 'nonce');
      if (nonceIndex === -1) {
        tags.push(['nonce', '0', pow.toString()]);
        nonceIndex = tags.length - 1;
      } else {
        tags[nonceIndex][1] = '0';
        tags[nonceIndex][2] = pow.toString();
      }
    }
    let eventTemplate = { ...tpl, tags, created_at: now };
    if (pow > 0) {
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
        eventTemplate = { ...tpl, tags, created_at: now };
        const id = getEventHash(eventTemplate);
        const bits = leadingZeroBits(hexToBytes(id));
        if (bits >= pow) break;
        nonce += 1;
      }
    }
    const event = finalizeEvent(eventTemplate, hexToBytes(priv));
    const targets = relaysOverride ?? relaysRef.current;
    await poolRef.current.publish(targets, event);
    return event;
  };

  const subscribe = (filters: Filter[], cb: (evt: NostrEvent) => void) => {
    const sub = poolRef.current.subscribeMany(relaysRef.current, filters, {
      onevent: cb,
    });
    return () => (sub as any).unsub();
  };

  const saveProfile = async (data: Record<string, unknown>) => {
    await publish({ kind: 0, content: JSON.stringify(data), tags: [] });
    setMetadata(data);
  };

  const saveContacts = async (list: string[]) => {
    const tags = list.map((p) => ['p', p]);
    await publish({ kind: 3, content: '', tags });
    setContacts(list);
  };

  const saveRelays = async (list: string[]) => {
    const tags = list.map((r) => ['r', r]);
    await publish({ kind: 10002, content: '', tags }, list);
    relaysRef.current = list;
    setRelays(list);
  };

  const contactsInit = useRef(true);
  useEffect(() => {
    if (contactsInit.current) {
      contactsInit.current = false;
      return;
    }
    saveContacts(contacts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts]);

  const libraryInit = useRef(true);
  useEffect(() => {
    if (libraryInit.current) {
      libraryInit.current = false;
      return;
    }
    if (!pubkey) return;
    const tags = ([['d', 'library']] as string[][]).concat(
      books.map((b) => ['e', b.id, b.status]),
    );
    publish({ kind: 30001, content: '', tags });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, pubkey]);

  const settingsInit = useRef(true);
  useEffect(() => {
    if (settingsInit.current) {
      settingsInit.current = false;
      return;
    }
    if (!pubkey) return;
    publish({
      kind: 30033,
      content: JSON.stringify(settings),
      tags: [['d', 'settings']],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.textSize, settings.density, pubkey]);

  const toggleBookmark = async (id: string) => {
    const prev = bookmarks;
    const next = prev.includes(id)
      ? prev.filter((e) => e !== id)
      : [...prev, id];

    flushSync(() => {
      setBookmarks(next);
    });

    try {
      await publish({
        kind: 30001,
        content: '',
        tags: [['d', 'bookmarks'], ...next.map((e) => ['e', e])],
      });
    } catch (err) {
      flushSync(() => {
        setBookmarks(prev);
      });
      throw err;
    }
  };

  const publishComment = async (
    bookId: string,
    text: string,
    parentEventId?: string,
    parentPubkey?: string,
  ) => {
    const tags = buildCommentTags(bookId, parentEventId, parentPubkey);
    await publish({ kind: 1, content: text, tags });
  };

  const sendEvent = async (event: NostrEvent, relaysOverride?: string[]) => {
    const targets = relaysOverride ?? relaysRef.current;
    await poolRef.current.publish(targets, event);
  };

  return (
    <NostrContext.Provider
      value={{
        pubkey,
        metadata,
        contacts,
        bookmarks,
        relays,
        login,
        logout,
        publish,
        subscribe,
        saveProfile,
        saveContacts,
        saveRelays,
        toggleBookmark,
        publishComment,
        sendEvent,
      }}
    >
      {children}
    </NostrContext.Provider>
  );
};

export function useNostr() {
  const ctx = useContext(NostrContext);
  if (!ctx) throw new Error('useNostr must be used within NostrProvider');
  return ctx;
}

export async function publishLongPost(
  ctx: NostrContextValue,
  data: {
    title: string;
    summary?: string;
    content: string;
    tags?: string[];
    cover?: string;
  },
  pow = 0,
) {
  const tags: string[][] = [];
  if (data.title) tags.push(['title', data.title]);
  if (data.summary) tags.push(['summary', data.summary]);
  if (data.cover) tags.push(['image', data.cover]);
  data.tags?.forEach((t) => tags.push(['t', t]));
  return ctx.publish(
    { kind: 30023, content: data.content, tags },
    undefined,
    pow,
  );
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
  const priv = sessionPrivKey;
  if (!priv) throw new Error('not logged in');
  const cipher = await (
    await import('nostr-tools')
  ).nip04.encrypt(priv, to, text);
  return ctx.publish({ kind: 4, content: cipher, tags: [['p', to]] });
}

export async function sendGroupDM(
  ctx: NostrContextValue,
  to: string[],
  text: string,
) {
  const priv = sessionPrivKey;
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
