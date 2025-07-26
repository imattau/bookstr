import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Event as NostrEvent, EventTemplate, Filter } from 'nostr-tools';
import { SimplePool, getPublicKey, finalizeEvent } from 'nostr-tools';

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://nostr.wine',
];

interface NostrContextValue {
  pubkey: string | null;
  metadata: Record<string, unknown> | null;
  contacts: string[];
  bookmarks: string[];
  login: (priv: string) => void;
  logout: () => void;
  publish: (event: EventTemplate) => Promise<NostrEvent>;
  subscribe: (filters: Filter[], cb: (event: NostrEvent) => void) => () => void;
  saveProfile: (data: Record<string, unknown>) => Promise<void>;
  saveContacts: (list: string[]) => Promise<void>;
  toggleBookmark: (id: string) => Promise<void>;
  publishComment: (bookId: string, text: string) => Promise<void>;
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

  useEffect(() => {
    const pool = poolRef.current;
    const stored = localStorage.getItem('privKey');
    if (stored) setPubkey(getPublicKey(stored));
    return () => pool.close(DEFAULT_RELAYS);
  }, []);

  useEffect(() => {
    if (!pubkey) {
      setMetadata(null);
      setContacts([]);
      setBookmarks([]);
      return;
    }
    poolRef.current
      .list(DEFAULT_RELAYS, [{ kinds: [0], authors: [pubkey], limit: 1 }])
      .then((events) => {
        if (events[0]) {
          try {
            setMetadata(JSON.parse(events[0].content));
          } catch {
            setMetadata(null);
          }
        }
      });
    poolRef.current
      .list(DEFAULT_RELAYS, [{ kinds: [3], authors: [pubkey], limit: 1 }])
      .then((events) => {
        if (events[0]) {
          const p = events[0].tags.filter((t) => t[0] === 'p').map((t) => t[1]);
          setContacts(p);
        }
      });
    poolRef.current
      .list(DEFAULT_RELAYS, [
        { kinds: [30001], authors: [pubkey], '#d': ['bookmarks'], limit: 1 },
      ])
      .then((events) => {
        if (events[0]) {
          const e = events[0].tags.filter((t) => t[0] === 'e').map((t) => t[1]);
          setBookmarks(e);
        }
      });
  }, [pubkey]);

  const login = (priv: string) => {
    localStorage.setItem('privKey', priv);
    setPubkey(getPublicKey(priv));
  };

  const logout = () => {
    localStorage.removeItem('privKey');
    setPubkey(null);
  };

  const publish = async (tpl: EventTemplate) => {
    const priv = localStorage.getItem('privKey');
    if (!priv) throw new Error('not logged in');
    const event = finalizeEvent(
      { ...tpl, created_at: Math.floor(Date.now() / 1000) },
      priv,
    );
    await poolRef.current.publish(DEFAULT_RELAYS, event);
    return event;
  };

  const subscribe = (filters: Filter[], cb: (evt: NostrEvent) => void) => {
    const sub = poolRef.current.subscribeMany(DEFAULT_RELAYS, filters, {
      onevent: cb,
    });
    return () => sub.unsub();
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

  const contactsInit = useRef(true);
  useEffect(() => {
    if (contactsInit.current) {
      contactsInit.current = false;
      return;
    }
    saveContacts(contacts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts]);

  const toggleBookmark = async (id: string) => {
    setBookmarks((b) => {
      const idx = b.indexOf(id);
      const next = idx === -1 ? [...b, id] : b.filter((e) => e !== id);
      publish({
        kind: 30001,
        content: '',
        tags: [['d', 'bookmarks'], ...next.map((e) => ['e', e])],
      });
      return next;
    });
  };

  const publishComment = async (bookId: string, text: string) => {
    await publish({ kind: 1, content: text, tags: [['e', bookId]] });
  };

  return (
    <NostrContext.Provider
      value={{
        pubkey,
        metadata,
        contacts,
        bookmarks,
        login,
        logout,
        publish,
        subscribe,
        saveProfile,
        saveContacts,
        toggleBookmark,
        publishComment,
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
) {
  const tags: string[][] = [];
  if (data.title) tags.push(['title', data.title]);
  if (data.summary) tags.push(['summary', data.summary]);
  if (data.cover) tags.push(['image', data.cover]);
  data.tags?.forEach((t) => tags.push(['t', t]));
  return ctx.publish({ kind: 30023, content: data.content, tags });
}

export async function publishVote(ctx: NostrContextValue, target: string) {
  return ctx.publish({ kind: 7, content: '+', tags: [['e', target]] });
}

export async function publishFavourite(ctx: NostrContextValue, target: string) {
  return ctx.publish({ kind: 7, content: '★', tags: [['e', target]] });
}

export async function sendDM(ctx: NostrContextValue, to: string, text: string) {
  const priv = localStorage.getItem('privKey');
  if (!priv) throw new Error('not logged in');
  const cipher = await (
    await import('nostr-tools')
  ).nip04.encrypt(priv, to, text);
  return ctx.publish({ kind: 4, content: cipher, tags: [['p', to]] });
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
  const cb = `${info.callback}?amount=${msats}`;
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
