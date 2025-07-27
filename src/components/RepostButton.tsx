import React from 'react';
import { FaRetweet } from 'react-icons/fa';
import { useNostr, publishRepost } from '../nostr';
import { useToast } from './ToastProvider';

export interface RepostButtonProps {
  target: string;
  className?: string;
}

export const RepostButton: React.FC<RepostButtonProps> = ({
  target,
  className,
}) => {
  const ctx = useNostr();
  const toast = useToast();

  const handleClick = async () => {
    try {
      await publishRepost(ctx, target);
    } catch {
      toast('Action failed', { type: 'error' });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Repost"
      className={`rounded border px-2 py-1 ${className ?? ''}`}
    >
      <FaRetweet aria-hidden="true" />
    </button>
  );
};
