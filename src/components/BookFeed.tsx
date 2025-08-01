import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import { BookCard } from './BookCard';
import { BookCardSkeleton } from './BookCardSkeleton';
import type { Event as NostrEvent } from 'nostr-tools';
import { useEventStore } from '../store/events';

/**
 * Feed showing recent book publications from followed relays.
 */
export const BookFeed: React.FC = () => {
  const { subscribe } = useNostr();
  const addEvent = useEventStore((s) => s.addEvent);
  const [events, setEvents] = useState<
    (NostrEvent & { repostedBy?: string })[]
  >([]);

  useEffect(() => {
    const offMain = subscribe([{ kinds: [30023], limit: 20 }], (evt) => {
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
    });
    const offRepost = subscribe([{ kinds: [6], limit: 20 }], (evt) => {
      const target = evt.tags.find((t) => t[0] === 'e')?.[1];
      if (!target) return;
      const offTarget = subscribe([{ ids: [target] }], (orig) => {
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
    return () => {
      offMain();
      offRepost();
    };
  }, [subscribe, addEvent]);

  return (
    <ul role="list" className="space-y-4">
      {events.length === 0
        ? Array.from({ length: 3 }).map((_, i) => (
            <li key={i} role="listitem">
              <BookCardSkeleton />
            </li>
          ))
        : events.map((e) => (
            <li key={e.id} role="listitem">
              <BookCard
                event={e}
                onDelete={(id) =>
                  setEvents((evts) => evts.filter((x) => x.id !== id))
                }
              />
            </li>
          ))}
    </ul>
  );
};
