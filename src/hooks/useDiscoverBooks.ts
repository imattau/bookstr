import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { useNostr } from '../nostr';
import { useSubscribe, sharedSubscribe } from '../nostr/events';
import { useEventStore } from '../store/events';

export interface DiscoverBook extends NostrEvent {
  repostedBy?: string;
}


export interface UseDiscoverBooksResult {
  books: DiscoverBook[];
  trending: DiscoverBook[];
  newReleases: DiscoverBook[];
  loading: boolean;
  removeBook: (id: string) => void;
}

/**
 * Hook for building the discovery feed.
 *
 * Subscribes to Nostr relays for long-form posts, reposts and votes from the
 * user's contacts. Events are stored in the event store and used to generate
 * trending and new release lists. State updates as events arrive.
 *
 * @returns Collections of discovered books and helper utilities.
 */

export function useDiscoverBooks(): UseDiscoverBooksResult {
  const { contacts, relays } = useNostr();
  const addEvent = useEventStore((s) => s.addEvent);
  const [events, setEvents] = useState<DiscoverBook[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const voteIds = useRef(new Set<string>());
  const [loading, setLoading] = useState(true);

  const mainFilter = useMemo(() => {
    const f: Filter = { kinds: [30023], limit: 50 };
    if (contacts.length) f.authors = contacts;
    return [f];
  }, [contacts]);

  useSubscribe(mainFilter, (evt) => {
    addEvent(evt);
    setEvents((e) => {
      const d = evt.tags.find((t) => t[0] === 'd')?.[1];
      if (d) {
        const idx = e.findIndex(
          (x) =>
            x.kind === 30023 &&
            x.pubkey === evt.pubkey &&
            x.tags.find((t) => t[0] === 'd')?.[1] === d,
        );
        if (idx !== -1) {
          if (e[idx].created_at >= evt.created_at) return e;
          const copy = [...e];
          copy[idx] = evt;
          return copy;
        }
      }
      if (e.find((x) => x.id === evt.id)) return e;
      return [...e, evt];
    });
    setLoading(false);
  });

  const repostFilter = useMemo(() => {
    const f: Filter = { kinds: [6], limit: 50 };
    if (contacts.length) f.authors = contacts;
    return [f];
  }, [contacts]);

  useSubscribe(repostFilter, (evt) => {
    const target = evt.tags.find((t) => t[0] === 'e')?.[1];
    if (!target) return;
    const offTarget = sharedSubscribe(relays, [{ ids: [target] }], (orig) => {
      addEvent(orig);
      setEvents((e) => {
        const d = orig.tags.find((t) => t[0] === 'd')?.[1];
        if (d) {
          const idx = e.findIndex(
            (x) =>
              x.kind === 30023 &&
              x.pubkey === orig.pubkey &&
              x.tags.find((t) => t[0] === 'd')?.[1] === d,
          );
          if (idx !== -1) {
            if (e[idx].created_at >= orig.created_at) {
              const copy = [...e];
              copy[idx] = { ...copy[idx], repostedBy: evt.pubkey };
              return copy;
            }
            const copy = [...e];
            copy[idx] = { ...orig, repostedBy: evt.pubkey };
            return copy;
          }
        }
        const idx = e.findIndex((x) => x.id === orig.id);
        if (idx !== -1) {
          const copy = [...e];
          copy[idx] = { ...copy[idx], repostedBy: evt.pubkey };
          return copy;
        }
        return [...e, { ...orig, repostedBy: evt.pubkey }];
      });
      offTarget();
    });
  });

  const voteFilter = useMemo(
    () => [{ kinds: [7], '#e': events.map((e) => e.id) }],
    [events],
  );

  useSubscribe(voteFilter, (evt) => {
    addEvent(evt);
    if (voteIds.current.has(evt.id)) return;
    voteIds.current.add(evt.id);
    const target = evt.tags.find((t) => t[0] === 'e')?.[1];
    if (target && evt.content === '+') {
      setVotes((v) => ({ ...v, [target]: (v[target] ?? 0) + 1 }));
    }
  });

  const books = useMemo(
    () => events.filter((evt) => !evt.tags.some((t) => t[0] === 'book')),
    [events],
  );

  const trending = useMemo(
    () =>
      [...books]
        .sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0))
        .slice(0, 6),
    [books, votes],
  );

  const newReleases = useMemo(
    () =>
      [...books]
        .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
        .slice(0, 6),
    [books],
  );

  const removeBook = useCallback((id: string) => {
    setEvents((e) => e.filter((x) => x.id !== id));
  }, []);

  return { books, trending, newReleases, loading, removeBook };
}
