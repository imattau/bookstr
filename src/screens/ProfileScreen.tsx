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
import { useParams, Link } from 'react-router-dom';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { SimplePool } from 'nostr-tools';
import { useNostr } from '../nostr';
import { fetchUserRelays } from '../nostr/relays';
import { FollowButton } from '../components/FollowButton';
import { BookCard } from '../components/BookCard';
import { ListFollowButton } from '../components/ListFollowButton';
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
  const [bookLists, setBookLists] = useState<NostrEvent[]>([]);
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
    const extra = (await (poolRef.current as any).list(
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
        evts.forEach((e: NostrEvent) => uniq.add(e.pubkey));
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

  useEffect(() => {
    if (!pubkey) return;
    (async () => {
      const kinds = pubkey === loggedPubkey ? [10003, 30004] : [30004];
      const evts = (await listWithExtras([
        { kinds, authors: [pubkey] },
      ])) as NostrEvent[];
      evts.forEach(addEvent);
      setBookLists(evts);
    })();
  }, [pubkey, loggedPubkey, addEvent, ctxRelays, extraRelays]);

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
      {pubkey === loggedPubkey && (
        <div className="flex justify-end">
          <Link to="/lists/new" className="rounded border px-2 py-1">
            Create List
          </Link>
        </div>
      )}
      {bookLists.length > 0 && (
        <div>
          <h3 className="font-semibold">Lists</h3>
          <ul role="list" className="space-y-2 mt-2">
            {bookLists.map((evt) => {
              const title =
                evt.tags.find((t: string[]) => t[0] === 'title')?.[1] ||
                evt.tags.find((t: string[]) => t[0] === 'd')?.[1] ||
                evt.tags.find((t: string[]) => t[0] === 'name')?.[1] ||
                'Untitled';
              const d = evt.tags.find((t: string[]) => t[0] === 'd')?.[1];
              let count = 0;
              let tags = evt.tags as string[][];
              if (!tags.some((t: string[]) => t[0] === 'a')) {
                try {
                  const parsed = JSON.parse(evt.content);
                  if (Array.isArray(parsed?.tags)) tags = parsed.tags;
                } catch {
                  /* ignore */
                }
              }
              count = tags.filter((t: string[]) => t[0] === 'a').length;
              return (
                <li key={evt.id} className="flex items-center justify-between" role="listitem">
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-text-muted">{count} books</p>
                  </div>
                  {d && pubkey !== loggedPubkey && (
                    <ListFollowButton author={evt.pubkey} d={d} />
                  )}
                  {d && pubkey === loggedPubkey && (
                    <Link
                      to={`/lists/new?d=${encodeURIComponent(d)}`}
                      className="rounded border px-2 py-1"
                    >
                      Edit list
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
