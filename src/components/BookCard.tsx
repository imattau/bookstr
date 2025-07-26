import React from 'react';
import { useNostr, publishVote, publishFavourite } from '../nostr';

interface BookCardProps {
  event: {
    id: string;
    pubkey: string;
    content: string;
    tags: string[][];
  };
}

export const BookCard: React.FC<BookCardProps> = ({ event }) => {
  const nostr = useNostr();
  const { toggleBookmark, bookmarks, pubkey } = nostr;
  const title = event.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled';
  const summary = event.tags.find((t) => t[0] === 'summary')?.[1] ?? '';
  const cover = event.tags.find((t) => t[0] === 'image')?.[1];
  const isBookmarked = bookmarks.includes(event.id);

  return (
    <div className="card-hover rounded-card border border-border shadow-1 overflow-hidden bg-[color:var(--clr-surface)]">
      {cover && (
        <img
          src={cover}
          alt={title}
          className="h-[120px] w-full object-cover"
        />
      )}
      <div className="p-4 space-y-1">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        {summary && <p className="text-[12px] text-text-muted">{summary}</p>}
      </div>
      <div className="flex items-center justify-end gap-2 p-2 text-text-muted text-[12px]">
        <button
          onClick={() => publishVote(nostr, event.id)}
          className="btn-tap px-1"
        >
          ♥
        </button>
        <button
          onClick={() => publishFavourite(nostr, event.id)}
          className="btn-tap px-1"
        >
          ★
        </button>
        <button
          onClick={() => toggleBookmark(event.id)}
          className="btn-tap px-1"
        >
          {isBookmarked ? '🔖' : '📑'}
        </button>
        {event.pubkey === pubkey && (
          <span className="ml-auto text-[10px]">by you</span>
        )}
      </div>
    </div>
  );
};
