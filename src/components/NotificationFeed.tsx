import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaAt, FaReply, FaUserPlus, FaBolt } from 'react-icons/fa';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr } from '../nostr';
import { useEventStore } from '../store/events';

type Notification = {
  id: string;
  type: 'mention' | 'reply' | 'follow' | 'zap';
  event: NostrEvent;
  link?: string;
};

export const NotificationFeed: React.FC = () => {
  const { pubkey, subscribe } = useNostr();
  const addEvent = useEventStore((s) => s.addEvent);
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!pubkey) return;
    const offs: Array<() => void> = [];

    // Mentions and replies
    offs.push(
      subscribe([{ kinds: [1], '#p': [pubkey], limit: 20 }], (evt) => {
        if (evt.pubkey === pubkey) return;
        addEvent(evt);
        const isReply = evt.tags.some((t) => t[0] === 'e' && t[3] === 'reply');
        const bookId =
          evt.tags.find((t) => t[0] === 'e' && t[3] === 'root')?.[1] ??
          evt.tags.find((t) => t[0] === 'e')?.[1];
        const link = bookId ? `/book/${bookId}` : undefined;
        const type = isReply ? 'reply' : 'mention';
        setItems((n) =>
          n.find((x) => x.id === evt.id)
            ? n
            : [...n, { id: evt.id, type, event: evt, link }],
        );
      }),
    );

    // Follows
    offs.push(
      subscribe([{ kinds: [3], '#p': [pubkey], limit: 20 }], (evt) => {
        if (evt.pubkey === pubkey) return;
        addEvent(evt);
        setItems((n) =>
          n.find((x) => x.id === evt.id)
            ? n
            : [
                ...n,
                { id: evt.id, type: 'follow', event: evt, link: '/profile' },
              ],
        );
      }),
    );

    // Zaps
    offs.push(
      subscribe([{ kinds: [9735], '#p': [pubkey], limit: 20 }], (evt) => {
        if (evt.pubkey === pubkey) return;
        addEvent(evt);
        const bookId = evt.tags.find((t) => t[0] === 'e')?.[1];
        const link = bookId ? `/book/${bookId}` : undefined;
        setItems((n) =>
          n.find((x) => x.id === evt.id)
            ? n
            : [...n, { id: evt.id, type: 'zap', event: evt, link }],
        );
      }),
    );

    return () => {
      offs.forEach((off) => off());
    };
  }, [subscribe, pubkey]);

  const iconMap = {
    mention: <FaAt aria-label="Mention" />,
    reply: <FaReply aria-label="Reply" />,
    follow: <FaUserPlus aria-label="Follow" />,
    zap: <FaBolt aria-label="Zap" />,
  } as const;

  return (
    <div className="space-y-2">
      {items.map((n) => (
        <div key={n.id} className="flex items-center gap-2 rounded border p-2">
          <span>{iconMap[n.type]}</span>
          {n.link ? (
            <Link to={n.link} className="text-blue-600 underline">
              {n.type === 'follow'
                ? 'New follower'
                : n.type === 'zap'
                  ? 'Zap received'
                  : n.type === 'reply'
                    ? 'New reply'
                    : 'Mentioned you'}
            </Link>
          ) : (
            <span>
              {n.type === 'follow'
                ? 'New follower'
                : n.type === 'zap'
                  ? 'Zap received'
                  : n.type === 'reply'
                    ? 'New reply'
                    : 'Mentioned you'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
