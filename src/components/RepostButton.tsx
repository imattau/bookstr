import React from 'react';
import { FaRetweet } from 'react-icons/fa';
import { useNostr, publishRepost } from '../nostr';
import { queueOfflineEdit } from '../lib/offlineSync';
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
      if (!navigator.onLine) {
        await queueOfflineEdit({
          id: Math.random().toString(36).slice(2),
          type: 'repost',
          data: { target },
        });
        toast('Saved offline, will sync later');
        return;
      }
      await publishRepost(ctx, target);
    } catch {
      toast('Action failed', { type: 'error' });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Repost"
      className={`rounded-[var(--radius-button)] border px-[var(--space-2)] py-[var(--space-1)] ${className ?? ''}`}
    >
      <FaRetweet aria-hidden="true" />
    </button>
  );
};
