import React from 'react';
import { FaThumbsUp, FaStar } from 'react-icons/fa';
import { useToast } from './ToastProvider';
import { logError } from '../lib/logger';
import { queueOfflineEdit } from '../nostr/offline';
import { useReactionContext, useReactions } from '../contexts/ReactionContext';
import { useQueryClient } from '@tanstack/react-query';

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
  const { data } = useReactions(target, type);
  const { reactToContent } = useReactionContext();
  const toast = useToast();
  const queryClient = useQueryClient();
  const count = data?.count ?? 0;
  const active = data?.active ?? false;

  const handleClick = async () => {
    if (active) return;
    try {
      if (!navigator.onLine && type === 'vote') {
        await queueOfflineEdit({
          id: Math.random().toString(36).slice(2),
          type: 'vote',
          data: { target },
        });
        queryClient.setQueryData(['reaction', type, target], {
          count: count + 1,
          active: true,
        });
        toast('Saved offline, will sync later');
        return;
      }
      await reactToContent(target, type);
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
      className={`rounded-[var(--radius-button)] border px-[var(--space-2)] py-[var(--space-1)] ${
        active
          ? 'border-[color:var(--clr-primary-600)] bg-[color:var(--clr-primary-600)] text-white'
          : ''
      } ${className ?? ''}`}
    >
      {icon} {count > 0 ? count : ''}
    </button>
  );
};
