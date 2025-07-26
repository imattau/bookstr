import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import { BookCard } from './BookCard';
import { BookCardSkeleton } from './BookCardSkeleton';
import type { Event as NostrEvent } from 'nostr-tools';

export const BookFeed: React.FC = () => {
  const { subscribe } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>([]);

  useEffect(() => {
    const off = subscribe([{ kinds: [30023], limit: 20 }], (evt) =>
      setEvents((e) => {
        if (e.find((x) => x.id === evt.id)) return e;
        return [...e, evt];
      }),
    );
    return off;
  }, [subscribe]);

  return (
    <div className="space-y-4">
      {events.length === 0
        ? Array.from({ length: 3 }).map((_, i) => <BookCardSkeleton key={i} />)
        : events.map((e) => <BookCard key={e.id} event={e} />)}
    </div>
  );
};
