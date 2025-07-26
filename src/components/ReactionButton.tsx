import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    const symbol = type === 'vote' ? '+' : '★';
    const off = ctx.subscribe(
      [{ kinds: [7], '#e': [target] }],
      (evt: NostrEvent) => {
        if (evt.content === symbol && !ids.current.has(evt.id)) {
          ids.current.add(evt.id);
          setCount((c) => c + 1);
        }
      },
    );
    return off;
  }, [ctx, target, type]);

  const handleClick = async () => {
    try {
      if (type === 'vote') {
        await publishVote(ctx, target);
      } else {
        await publishFavourite(ctx, target);
      }
    } catch {
      /* ignore publish errors */
    }
  };

  const label = type === 'vote' ? '+' : '★';

  return (
    <button
      onClick={handleClick}
      aria-label={type === 'vote' ? 'Vote' : 'Favourite'}
      className={`rounded border px-2 py-1 ${className ?? ''}`}
    >
      {label} {count > 0 ? count : ''}
    </button>
  );
};
