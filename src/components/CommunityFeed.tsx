import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import type { Event as NostrEvent } from 'nostr-tools';

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
      {events.map((evt) => {
        const name = evt.tags.find((t) => t[0] === 'name')?.[1] || 'Unnamed';
        return (
          <li key={evt.id} role="listitem" className="rounded border p-2">
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm whitespace-pre-wrap">{evt.content}</p>
          </li>
        );
      })}
    </ul>
  );
};
