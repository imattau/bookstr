import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import { BookCard } from '../components/BookCard';
import { NoteCard } from '../components/NoteCard';
import type { Event as NostrEvent } from 'nostr-tools';

/**
 * Home feed displaying events from followed users.
 */
export const HomeFeed: React.FC = () => {
  const { contacts, subscribe } = useNostr();
  const [events, setEvents] = useState<
    (NostrEvent & { repostedBy?: string })[]
  >([]);

  useEffect(() => {
    if (contacts.length === 0) return;
    const off = subscribe(
      [{ kinds: [1, 6, 30023, 41], authors: contacts, limit: 100 }],
      (evt) => {
        if (evt.kind === 6) {
          const target = evt.tags.find((t) => t[0] === 'e')?.[1];
          if (!target) return;
          const offTarget = subscribe([{ ids: [target] }], (orig) => {
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
        } else {
          setEvents((e) =>
            e.find((x) => x.id === evt.id) ? e : [...e, evt],
          );
        }
      },
    );
    return off;
  }, [subscribe, contacts]);

  const handleDelete = (id: string) =>
    setEvents((evts) => evts.filter((x) => x.id !== id));

  return (
    <ul role="list" className="space-y-4">
      {events.map((e) => (
        <li key={e.id} role="listitem">
          {e.kind === 30023 ? (
            <BookCard event={e} onDelete={handleDelete} />
          ) : (
            <NoteCard event={e} onDelete={handleDelete} />
          )}
        </li>
      ))}
    </ul>
  );
};
