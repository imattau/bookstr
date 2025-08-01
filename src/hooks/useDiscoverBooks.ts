import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { useNostr } from '../nostr';
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

export function useDiscoverBooks(): UseDiscoverBooksResult {
  const { subscribe, contacts } = useNostr();
  const addEvent = useEventStore((s) => s.addEvent);
  const [events, setEvents] = useState<DiscoverBook[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const voteIds = useRef(new Set<string>());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filters: Filter[] = [{ kinds: [30023], limit: 50 }];
    if (contacts.length) filters[0].authors = contacts;
    const offMain = subscribe(filters, (evt) => {
      addEvent(evt);
      setEvents((e) => {
        if (e.find((x) => x.id === evt.id)) return e;
        return [...e, evt];
      });
      setLoading(false);
    });
    const repostFilter: Filter = { kinds: [6], limit: 50 };
    if (contacts.length) repostFilter.authors = contacts;
    const offReposts = subscribe([repostFilter], (evt) => {
      const target = evt.tags.find((t) => t[0] === 'e')?.[1];
      if (!target) return;
      const offTarget = subscribe([{ ids: [target] }], (orig) => {
        addEvent(orig);
        setEvents((e) => {
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
    return () => {
      offMain();
      offReposts();
    };
  }, [subscribe, contacts]);

  useEffect(() => {
    if (!events.length) return;
    const ids = events.map((e) => e.id);
    const off = subscribe([{ kinds: [7], '#e': ids }], (evt) => {
      addEvent(evt);
      if (voteIds.current.has(evt.id)) return;
      voteIds.current.add(evt.id);
      const target = evt.tags.find((t) => t[0] === 'e')?.[1];
      if (target && evt.content === '+') {
        setVotes((v) => ({ ...v, [target]: (v[target] ?? 0) + 1 }));
      }
    });
    return off;
  }, [events, subscribe]);

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
