/**
 * Displays a user's profile and a list of their published books.
 *
 * Route params:
 * - `pubkey` – optional; if omitted the logged in user's profile is shown.
 *
 * Hooks: `useNostr` for network calls and `useParams` to determine which
 * profile to show.
 */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';
import { useNostr } from '../nostr';
import { fetchUserRelays } from '../nostr/relays';
import { FollowButton } from '../components/FollowButton';
import { BookCard } from '../components/BookCard';
import { useEventStore } from '../store/events';

interface ProfileMeta {
  name?: string;
  about?: string;
  picture?: string;
}

export const ProfileScreen: React.FC = () => {
  const {
    pubkey: loggedPubkey,
    relays: ctxRelays = [],
    subscribe,
    list,
  } = useNostr() as any;
  const addEvent = useEventStore((s) => s.addEvent);
  const poolRef = useRef(new SimplePool());
  const [extraRelays, setExtraRelays] = useState<string[]>([]);
  const params = useParams<{ pubkey?: string }>();
  const pubkey = params.pubkey || loggedPubkey;

  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  const [followers, setFollowers] = useState(0);
  const [books, setBooks] = useState<NostrEvent[]>([]);
  const relaysRef = useRef<string[]>([]);

  const subscribeWithExtras = (
    filters: Filter[],
    cb: (evt: NostrEvent) => void,
  ) => {
    const offMain = subscribe(filters, cb);
    let subExtra: any = null;
    if (extraRelays.length) {
      subExtra = poolRef.current.subscribeMany(extraRelays, filters, {
        onevent: cb,
      });
    }
    return () => {
      offMain?.();
      if (subExtra) (subExtra as any).close();
    };
  };

  const listWithExtras = async (filters: Filter[]) => {
    const main = await list(filters);
    if (!extraRelays.length) return main;
    const extra = (await poolRef.current.list(
      extraRelays,
      filters,
    )) as NostrEvent[];
    return [...main, ...extra];
  };

  useEffect(() => {
    relaysRef.current = extraRelays;
  }, [extraRelays]);

  useEffect(() => {
    return () => {
      poolRef.current.close(relaysRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pubkey) {
      setExtraRelays([]);
      return;
    }
    let stopped = false;
    fetchUserRelays(pubkey).then((r) => {
      if (!stopped) setExtraRelays(r);
    });
    return () => {
      stopped = true;
    };
  }, [pubkey]);

  useEffect(() => {
    if (!pubkey) return;
    const off = subscribeWithExtras(
      [{ kinds: [0], authors: [pubkey], limit: 1 }],
      (evt) => {
        try {
          setMeta(JSON.parse(evt.content));
        } catch {
          setMeta(null);
        }
      },
    );
    return off;
  }, [pubkey, ctxRelays, extraRelays]);

  useEffect(() => {
    if (!pubkey) return;
    listWithExtras([{ kinds: [3], '#p': [pubkey] }]).then((evts) => {
      const uniq = new Set<string>();
      evts.forEach((e) => uniq.add(e.pubkey));
      setFollowers(uniq.size);
    });
  }, [pubkey, ctxRelays, extraRelays]);

  useEffect(() => {
    if (!pubkey) return;
    const filters: Filter[] = [
      { kinds: [30023], authors: [pubkey], limit: 20 },
    ];
    const off = subscribeWithExtras(filters, (evt) => {
      addEvent(evt);
      setBooks((b) => (b.find((x) => x.id === evt.id) ? b : [...b, evt]));
    });
    return off;
  }, [pubkey, addEvent, ctxRelays, extraRelays]);

  if (!pubkey) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        {meta?.picture && (
          <img
            src={meta.picture}
            alt={`Avatar for ${meta?.name || pubkey}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div className="flex-1 space-y-1">
          <h2 className="text-xl font-semibold">{meta?.name || pubkey}</h2>
          {meta?.about && (
            <p className="text-sm text-text-muted">{meta.about}</p>
          )}
          <p className="text-sm text-text-muted">{followers} followers</p>
        </div>
        {pubkey !== loggedPubkey && <FollowButton pubkey={pubkey} />}
      </div>
      <ul role="list" className="space-y-2">
        {books.map((evt) => (
          <li key={evt.id} role="listitem">
            <BookCard event={evt} />
          </li>
        ))}
        {books.length === 0 && (
          <p className="text-center text-text-muted">No books found.</p>
        )}
      </ul>
    </div>
  );
};
