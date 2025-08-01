import React from 'react';
import { FaRetweet } from 'react-icons/fa';
import { useNostr } from '../nostr';
import { publishRepost } from '../nostr/events';
import { queueOfflineEdit } from '../nostr/offline';
import { useToast } from './ToastProvider';
import { logError } from '../lib/logger';

export interface RepostButtonProps {
  target: string;
  className?: string;
}

/**
 * Button to repost a book event, saving offline if needed.
 */
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
    } catch (err) {
      logError(err);
      toast('Action failed', { type: 'error' });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Repost"
      className={`rounded-[var(--radius-button)] border px-[var(--space-2)] py-[var(--space-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50 ${className ?? ''}`}
    >
      <FaRetweet aria-hidden="true" />
    </button>
  );
};
