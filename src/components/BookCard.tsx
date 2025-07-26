import React, { useState } from 'react';
import { useNostr, zap } from '../nostr';
import type { Event as NostrEvent } from 'nostr-tools';
import { logEvent } from '../analytics';

interface BookCardProps {
  event: NostrEvent;
}

export const BookCard: React.FC<BookCardProps> = ({ event }) => {
  const title = event.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled';
  const summary = event.tags.find((t) => t[0] === 'summary')?.[1] ?? '';
  const cover = event.tags.find((t) => t[0] === 'image')?.[1];
  const ctx = useNostr();
  const [status, setStatus] = useState<'idle' | 'zapping' | 'done'>('idle');
  const { toggleBookmark, bookmarks } = ctx;

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
        <button
          onClick={handleFav}
          aria-label="Favorite"
          className="rounded border px-2 py-1"
        >
          ★
        </button>
      </div>
    </div>
  );
};
