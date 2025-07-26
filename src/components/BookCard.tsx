import React, { useState } from 'react';
import { useNostr, zap } from '../nostr';
import { ReactionButton } from './ReactionButton';
import { RepostButton } from './RepostButton';
import { DeleteButton } from './DeleteButton';
import type { Event as NostrEvent } from 'nostr-tools';
import { logEvent } from '../analytics';

interface BookCardProps {
  event: NostrEvent & { repostedBy?: string };
  onDelete?: (id: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ event, onDelete }) => {
  const title = event.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled';
  const summary = event.tags.find((t) => t[0] === 'summary')?.[1] ?? '';
  const cover = event.tags.find((t) => t[0] === 'image')?.[1];
  const ctx = useNostr();
  const [status, setStatus] = useState<'idle' | 'zapping' | 'done'>('idle');
  const { toggleBookmark, bookmarks, pubkey } = ctx;

  const handleZap = async () => {
    setStatus('zapping');
    try {
      await zap(ctx, event);
      logEvent('click_vote', { id: event.id });
      setStatus('done');
    } catch {
      setStatus('idle');
    }
  };

  const handleFav = async () => {
    try {
      await toggleBookmark(event.id);
      logEvent('click_fav', { id: event.id });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded border p-2">
      {event.repostedBy && (
        <p className="mb-1 text-xs text-gray-500">
          Reposted by {event.repostedBy}
        </p>
      )}
      {cover && (
        <img src={cover} alt="" className="mb-2 h-32 w-24 object-cover" />
      )}
      <h3 className="font-semibold">{title}</h3>
      {summary && <p className="text-sm text-gray-500">{summary}</p>}
      <div className="pt-2 flex gap-2">
        <button
          onClick={handleZap}
          className="rounded bg-yellow-500 px-2 py-1 text-white"
        >
          {status === 'zapping'
            ? 'Zapping...'
            : status === 'done'
              ? 'Zapped!'
              : 'Zap'}
        </button>
        <ReactionButton target={event.id} type="vote" />
        <RepostButton target={event.id} />
        <button
          onClick={handleFav}
          aria-label="Favorite"
          className="rounded border px-2 py-1"
        >
          ★
        </button>
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
