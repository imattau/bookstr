import React from 'react';
import { FaFlag } from 'react-icons/fa';
import { useNostr } from '../nostr';

export interface ReportButtonProps {
  target: string;
  className?: string;
}

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
      className={`rounded border px-2 py-1 ${className ?? ''}`}
    >
      <FaFlag aria-hidden="true" />
    </button>
  );
};
