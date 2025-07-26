import React, { useEffect, useRef, useState } from 'react';
import { FaThumbsUp, FaStar } from 'react-icons/fa';
import { useNostr, publishVote, publishFavourite } from '../nostr';
import type { Event as NostrEvent } from 'nostr-tools';

export interface ReactionButtonProps {
  target: string;
  type: 'vote' | 'favourite';
  className?: string;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  target,
  type,
  className,
}) => {
  const ctx = useNostr();
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
      if (type === 'vote') {
        await publishVote(ctx, target);
      } else {
        await publishFavourite(ctx, target);
      }
      setActive(true);
    } catch {
      /* ignore publish errors */
    }
  };

  const icon = type === 'vote' ? <FaThumbsUp className="inline" /> : <FaStar className="inline" />;

  return (
    <button
      onClick={handleClick}
      aria-label={type === 'vote' ? 'Vote' : 'Favourite'}
      className={`rounded border px-2 py-1 ${active ? 'border-primary-600 bg-primary-600 text-white' : ''} ${className ?? ''}`}
    >
      {icon} {count > 0 ? count : ''}
    </button>
  );
};
