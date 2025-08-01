import React from 'react';
import { FaFlag } from 'react-icons/fa';
import { useNostr } from '../nostr';

export interface ReportButtonProps {
  target: string;
  className?: string;
}

/**
 * Button allowing users to report inappropriate content.
 */
export const ReportButton: React.FC<ReportButtonProps> = ({
  target,
  className,
}) => {
  const { publish } = useNostr();

  const handleClick = async () => {
    const reason = window.prompt('Reason for report?');
    const content = reason?.trim();
    if (!content) return;
    try {
      await publish({ kind: 1985, content, tags: [['e', target]] });
    } catch {
      // ignore publish errors
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Report"
      className={`rounded-[var(--radius-button)] border px-[var(--space-2)] py-[var(--space-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50 ${className ?? ''}`}
    >
      <FaFlag aria-hidden="true" />
    </button>
  );
};
