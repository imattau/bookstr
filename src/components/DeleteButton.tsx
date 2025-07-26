import React from 'react';
import { useNostr } from '../nostr';

export interface DeleteButtonProps {
  target: string;
  onDelete?: () => void;
  className?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  target,
  onDelete,
  className,
}) => {
  const { publish } = useNostr();

  const handleClick = async () => {
    try {
      await publish({ kind: 5, content: '', tags: [['e', target]] });
      onDelete?.();
    } catch {
      // ignore publish errors
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Delete"
      className={`rounded border px-2 py-1 ${className ?? ''}`}
    >
      🗑
    </button>
  );
};
