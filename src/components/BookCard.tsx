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

        >
          ★
        </button>
        <button
          onClick={() => toggleBookmark(event.id)}

        )}
      </div>
    </div>
  );
};
