import React from 'react';
import { useNostr } from '../nostr';
import { ReactionButton } from './ReactionButton';
import { RepostButton } from './RepostButton';
import { DeleteButton } from './DeleteButton';
import { ReportButton } from './ReportButton';
import type { Event as NostrEvent } from 'nostr-tools';

interface NoteCardProps {
  event: NostrEvent & { repostedBy?: string };
  onDelete?: (id: string) => void;
}

/**
 * Display a note event with basic interactions.
 */
export const NoteCard: React.FC<NoteCardProps> = ({ event, onDelete }) => {
  const { pubkey } = useNostr();
  return (
    <div className="rounded-[var(--radius-card)] border p-[var(--space-2)]">
      {event.repostedBy && (
        <p className="mb-[var(--space-1)] text-xs text-text-muted">
          Reposted by {event.repostedBy}
        </p>
      )}
      <p className="whitespace-pre-wrap">{event.content}</p>
      <div className="pt-2 flex gap-2">
        <ReactionButton target={event.id} type="vote" />
        <RepostButton target={event.id} />
        <ReportButton target={event.id} />
        {pubkey === event.pubkey && (
          <DeleteButton
            target={event.id}
            onDelete={() => onDelete?.(event.id)}
          />
        )}
      </div>
    </div>
  );
};
