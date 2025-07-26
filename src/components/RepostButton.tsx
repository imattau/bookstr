import React from 'react';
import { useNostr, publishRepost } from '../nostr';

export interface RepostButtonProps {
  target: string;
  className?: string;
}

export const RepostButton: React.FC<RepostButtonProps> = ({ target, className }) => {
  const ctx = useNostr();

  const handleClick = async () => {
    try {
      await publishRepost(ctx, target);
    } catch {
      // ignore publish errors
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Repost"
      className={`rounded border px-2 py-1 ${className ?? ''}`}
    >
      🔁
    </button>
  );
};
