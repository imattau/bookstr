import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { useNostr } from '../nostr';
import { useToast } from './ToastProvider';
import { logError } from '../lib/logger';

export interface DeleteButtonProps {
  target: string;
  onDelete?: () => void;
  className?: string;
}

/**
 * Button to delete an event by id and trigger optional callback.
 */
export const DeleteButton: React.FC<DeleteButtonProps> = ({
  target,
  onDelete,
  className,
}) => {
  const { publish } = useNostr();
  const toast = useToast();

  const handleClick = async () => {
    try {
      await publish({ kind: 5, content: '', tags: [['e', target]] });
      onDelete?.();
    } catch (err) {
      logError(err);
      toast('Action failed', { type: 'error' });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Delete"
      className={`rounded-[var(--radius-button)] border px-[var(--space-2)] py-[var(--space-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50 ${className ?? ''}`}
    >
      <FaTrash aria-hidden="true" />
    </button>
  );
};
