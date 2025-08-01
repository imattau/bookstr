import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useReadingStore, BookStatus } from './store';
import { useSettings } from './useSettings';
import type { Event as NostrEvent, EventTemplate, Filter } from 'nostr-tools';
import { SimplePool, getPublicKey, finalizeEvent } from 'nostr-tools';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { buildCommentTags } from './commentUtils';
import { getPrivKey, setPrivKey } from './nostr/auth';
import {
  loadKey,
  importKey,
  generateKey,
  validatePrivKey,
  saveKey,
} from './lib/keys';
import { initOfflineSync } from './nostr/offline';
import { savePointer, getPointer } from './lib/cache';

const DEFAULT_RELAYS = ((import.meta as any).env?.VITE_RELAY_URLS as
  | string
  | undefined)
  ? ((import.meta as any).env.VITE_RELAY_URLS as string)
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
  : ['wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nostr.wine'];
const encoder = new TextEncoder();

// Maximum size for long-form event content in bytes
export let MAX_EVENT_SIZE = 1000;
try {
  const stored = localStorage.getItem('max-event-size');
  if (stored) {
    const num = parseInt(stored, 10);
    if (!Number.isNaN(num) && num > 0) MAX_EVENT_SIZE = num;
  }
} catch {
  /* ignore */
}

export function setMaxEventSize(size: number) {
  MAX_EVENT_SIZE = size;
  try {
    localStorage.setItem('max-event-size', String(size));
  } catch {
    /* ignore */
  }
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


export interface NostrContextValue {
  pubkey: string | null;
  nip07: boolean;
  metadata: Record<string, unknown> | null;
  contacts: string[];
  bookmarks: string[];
  relays: string[];
  login: (priv: string) => void;
  loginNip07: (pubkey: string) => void;
  logout: () => void;
  publish: (
    event: Omit<EventTemplate, 'created_at'>,
    relays?: string[],
    pow?: number,
  ) => Promise<NostrEvent>;
  list: (filters: Filter[]) => Promise<NostrEvent[]>;
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
  const [nip07, setNip07] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(
    null,
  );
  const [contacts, setContacts] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [relays, setRelays] = useState<string[]>(DEFAULT_RELAYS);
  const [keyError, setKeyError] = useState<boolean>(false);
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
    const rawPriv = localStorage.getItem('privKey');
    const priv = loadKey();
    const nip07Flag = localStorage.getItem('nip07');
    setNip07(nip07Flag === '1');
    if (priv) {
      const pub = bytesToHex(schnorr.getPublicKey(hexToBytes(priv)));
      if (storedPub && storedPub !== pub) {
        setKeyError(true);
      } else {
        setPrivKey(priv);
        setPubkey(pub);
      }
    } else {
      if (rawPriv) setKeyError(true);
      if (storedPub) setPubkey(storedPub);
    }
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
  }, [pubkey, relays, loadStatuses, hydrateSettings]);

  const login = (raw: string) => {
    const priv = importKey(raw);
    if (!priv || !validatePrivKey(priv)) {
      throw new Error('invalid private key');
    }
    setPrivKey(priv);
    saveKey(priv);
    const pub = getPublicKey(hexToBytes(priv));
    localStorage.setItem('pubKey', pub);
    localStorage.setItem('nip07', '0');
    setPubkey(pub);
    setNip07(false);
    setKeyError(false);
  };

  const loginNip07 = (pub: string) => {
    setPrivKey(null);
    localStorage.removeItem('privKey');
    setPubkey(pub);
    setNip07(true);
    localStorage.setItem('pubKey', pub);
    localStorage.setItem('nip07', '1');
  };

  const logout = () => {
    setPrivKey(null);
    localStorage.removeItem('pubKey');
    localStorage.removeItem('nip07');
    localStorage.removeItem('privKey');
    setPubkey(null);
    setNip07(false);
  };

  const publish = useCallback(
    async (
      tpl: Omit<EventTemplate, 'created_at'>,
      relaysOverride?: string[],
      pow = 0,
    ) => {
      const priv = getPrivKey();
      const nostr = (window as any).nostr;
      if (!priv && !(nostr && typeof nostr.signEvent === 'function')) {
        throw new Error('not logged in');
      }
    const now = Math.floor(Date.now() / 1000);
    const del = tpl.tags?.find((t) => t[0] === 'delegation');
    if (del && priv) {
      const [, delegator, cond, sig] = del;
      const str = `nostr:delegation:${getPublicKey(hexToBytes(priv))}:${cond}`;
      const hash = sha256(encoder.encode(str));
      const okSig = schnorr.verify(sig, hash, delegator);
      const okCond = checkDelegationConditions(cond, tpl.kind, now);
      if (!okSig || !okCond) throw new Error('invalid delegation');
    }
    let tags = tpl.tags ? [...tpl.tags] : [];
    let eventTemplate: EventTemplate & { created_at: number } = {
      ...tpl,
      tags,
      created_at: now,
    };
    if (pow > 0) {
      const { applyPow } = await import('./pow');
      eventTemplate = await applyPow(tpl, now, pow);
    }
    let event: NostrEvent;
    if (priv) {
      event = finalizeEvent(eventTemplate as any, hexToBytes(priv));
    } else {
      event = await nostr.signEvent(eventTemplate as any);
    }
      const targets = relaysOverride ?? relaysRef.current;
      await poolRef.current.publish(targets, event);
      return event;
    },
    [],
  );

  const applyPointers = async (filters: Filter[]): Promise<Filter[]> => {
    return Promise.all(
      filters.map(async (f) => {
        const d = (f as any)['#d']?.[0];
        if (!d) return f;
        const ptr = await getPointer(d);
        if (!ptr) return f;
        try {
          const [evt] = (await poolRef.current.list(relaysRef.current, [
            { ids: [ptr] },
          ])) as NostrEvent[];
          if (evt) return { ...f, since: evt.created_at } as Filter;
        } catch {
          /* ignore */
        }
        return f;
      }),
    );
  };

  const list = useCallback(async (filters: Filter[]) => {
    const final = await applyPointers(filters);
    const evts = (await poolRef.current.list(
      relaysRef.current,
      final,
    )) as NostrEvent[];
    evts.forEach((e) => {
      const d = e.tags.find((t) => t[0] === 'd')?.[1];
      if (d) savePointer(d, e.id);
    });
    return evts;
  }, []);

  const subscribe = (filters: Filter[], cb: (evt: NostrEvent) => void) => {
    let unsub: (() => void) | null = null;
    let stopped = false;
    (async () => {
      const final = await applyPointers(filters);
      if (stopped) return;
      const sub = poolRef.current.subscribeMany(relaysRef.current, final, {
        onevent: (evt: NostrEvent) => {
          const d = evt.tags.find((t) => t[0] === 'd')?.[1];
          if (d) savePointer(d, evt.id);
          cb(evt);
        },
      });
      unsub = () => (sub as any).unsub();
    })();
    return () => {
      stopped = true;
      if (unsub) unsub();
    };
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

  const sendEvent = useCallback(async (event: NostrEvent, relaysOverride?: string[]) => {
    const targets = relaysOverride ?? relaysRef.current;
    await poolRef.current.publish(targets, event);
  }, []);

  useEffect(() => {
    if (!pubkey) return;
    const off = initOfflineSync({
      sendEvent,
      publish,
      list,
      pubkey,
    } as any);
    return off;
  }, [pubkey, sendEvent, publish, list]);

  const handleImportKey = () => {
    const input = prompt('Enter your private key');
    if (!input) return;
    try {
      login(input);
      setKeyError(false);
    } catch {
      alert('Invalid key');
    }
  };

  const handleGenerateKey = () => {
    const priv = generateKey();
    login(priv);
    alert(`Your new private key:\n${priv}`);
    setKeyError(false);
  };

  return (
    <NostrContext.Provider
      value={{
        pubkey,
        nip07,
        metadata,
        contacts,
        bookmarks,
        relays,
        login,
        loginNip07,
        logout,
        publish,
        list,
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
      {keyError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2">
          <div className="space-y-2 w-full max-w-sm rounded bg-[color:var(--clr-surface)] p-[var(--space-4)]">
            <p className="text-sm">
              Stored key is corrupted. Import your backup or generate a new one.
              Events signed with a new key cannot overwrite old ones.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleImportKey}
                className="rounded border px-3 py-1"
              >
                Import key
              </button>
              <button
                onClick={handleGenerateKey}
                className="rounded bg-primary-600 px-3 py-1 text-white"
              >
                Generate new key
              </button>
            </div>
          </div>
        </div>
      )}
    </NostrContext.Provider>
  );
};

export function useNostr() {
  const ctx = useContext(NostrContext);
  if (!ctx) throw new Error('useNostr must be used within NostrProvider');
  return ctx;
}
