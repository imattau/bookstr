import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import { BookCard } from './BookCard';
import type { Event as NostrEvent } from 'nostr-tools';

export const BookFeed: React.FC = () => {
  const { subscribe } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>([]);

  useEffect(() => {
    const off = subscribe([{ kinds: [30023], limit: 20 }], (evt) =>
      setEvents((e) => [...e, evt]),
    );
    return off;
  }, [subscribe]);

  return (
    <div className="space-y-4">
      {events.map((e) => (
        <BookCard key={e.id} event={e} />
      ))}
    </div>
  );
};
