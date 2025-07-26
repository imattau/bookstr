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
  login: (priv: string) => void;
  logout: () => void;
  publish: (event: EventTemplate) => Promise<NostrEvent>;
  subscribe: (filters: Filter[], cb: (event: NostrEvent) => void) => () => void;
}

const NostrContext = createContext<NostrContextValue | undefined>(undefined);

export const NostrProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const poolRef = useRef(new SimplePool());
  const [pubkey, setPubkey] = useState<string | null>(null);

  useEffect(() => {
    const pool = poolRef.current;
    const stored = localStorage.getItem('privKey');
    if (stored) setPubkey(getPublicKey(stored));
    return () => pool.close(DEFAULT_RELAYS);
  }, []);

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

  return (
    <NostrContext.Provider
      value={{ pubkey, login, logout, publish, subscribe }}
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
