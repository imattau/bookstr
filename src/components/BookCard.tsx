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
    <div className="rounded border p-4 space-y-2 bg-[color:var(--clr-surface-alt)]">
      {cover && <img src={cover} alt={title} className="mb-2 rounded" />}
      <h3 className="text-lg font-semibold">{title}</h3>
      {summary && (
        <p className="text-sm text-[color:var(--clr-text-muted)]">{summary}</p>
      )}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => publishVote(nostr, event.id)}
          className="rounded bg-primary-600 px-2 py-1 text-white"
        >
          +1
        </button>
        <button
          onClick={() => publishFavourite(nostr, event.id)}
          className="rounded bg-primary-600 px-2 py-1 text-white"
        >
          ★
        </button>
        <button
          onClick={() => toggleBookmark(event.id)}
          className={`rounded px-2 py-1 ${isBookmarked ? 'bg-primary-300' : 'bg-primary-600 text-white'}`}
        >
          Bookmark
        </button>
        {event.pubkey === pubkey && (
          <span className="ml-auto text-xs">by you</span>
        )}
      </div>
    </div>
  );
};
