import React, { useEffect, useRef, useState } from 'react';
import { FaThumbsUp, FaStar } from 'react-icons/fa';
import { useNostr } from '../nostr';
import { publishVote, publishFavourite } from '../nostr/events';
import { queueOfflineEdit } from '../nostr/offline';
import { useToast } from './ToastProvider';
import { logError } from '../lib/logger';
import type { Event as NostrEvent } from 'nostr-tools';

export interface ReactionButtonProps {
  target: string;
  type: 'vote' | 'favourite';
  className?: string;
}

/**
 * Button for voting or marking a post as favourite.
 */
export const ReactionButton: React.FC<ReactionButtonProps> = ({
  target,
  type,
  className,
}) => {
  const ctx = useNostr();
  const toast = useToast();
  const [count, setCount] = useState(0);
  const ids = useRef(new Set<string>());
  const [active, setActive] = useState(false);

  useEffect(() => {
    const symbol = type === 'vote' ? '+' : '★';
    const off = ctx.subscribe(
      [{ kinds: [7], '#e': [target] }],
      (evt: NostrEvent) => {
        if (evt.content === symbol && !ids.current.has(evt.id)) {
          ids.current.add(evt.id);
          setCount((c) => c + 1);
          if (evt.pubkey === ctx.pubkey) setActive(true);
        }
      },
    );
    return off;
  }, [ctx, target, type]);

  const handleClick = async () => {
    if (active) return;
    try {
      if (!navigator.onLine && type === 'vote') {
        await queueOfflineEdit({
          id: Math.random().toString(36).slice(2),
          type: 'vote',
          data: { target },
        });
        setCount((c) => c + 1);
        setActive(true);
        toast('Saved offline, will sync later');
        return;
      }
      if (type === 'vote') {
        await publishVote(ctx, target);
      } else {
        await publishFavourite(ctx, target);
      }
      setActive(true);
    } catch (err) {
      logError(err);
      toast('Action failed', { type: 'error' });
    }
  };

  const icon =
    type === 'vote' ? (
      <FaThumbsUp className="inline" />
    ) : (
      <FaStar className="inline" />
    );

  return (
    <button
      onClick={handleClick}
      aria-label={type === 'vote' ? 'Vote' : 'Favourite'}
      className={`rounded-[var(--radius-button)] border px-[var(--space-2)] py-[var(--space-1)] ${active ? 'border-[color:var(--clr-primary-600)] bg-[color:var(--clr-primary-600)] text-white' : ''} ${className ?? ''}`}
    >
      {icon} {count > 0 ? count : ''}
    </button>
  );
};
