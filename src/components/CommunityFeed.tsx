import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import type { Event as NostrEvent } from 'nostr-tools';
import { NoteCard } from './NoteCard';

/**
 * Feed listing community posts from kind 172 events.
 */
export const CommunityFeed: React.FC = () => {
  const { subscribe } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>([]);

  useEffect(() => {
    const off = subscribe([{ kinds: [172], limit: 20 }], (evt) =>
      setEvents((e) => {
        if (e.find((x) => x.id === evt.id)) return e;
        return [...e, evt];
      }),
    );
    return off;
  }, [subscribe]);

  return (
    <ul role="list" className="space-y-4">
      {events.map((evt) => (
        <li key={evt.id} role="listitem">
          <NoteCard event={evt} />
        </li>
      ))}
    </ul>
  );
};
