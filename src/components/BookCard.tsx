import React from 'react';

interface BookCardProps {
  event: {
    id: string;
    pubkey: string;
    content: string;
    tags: string[][];
  };
}

export const BookCard: React.FC<BookCardProps> = ({ event }) => {
  const title = event.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled';
  const summary = event.tags.find((t) => t[0] === 'summary')?.[1] ?? '';
  const cover = event.tags.find((t) => t[0] === 'image')?.[1];

  return (
    <div className="rounded border p-2">
      {cover && (
        <img src={cover} alt="" className="mb-2 h-32 w-24 object-cover" />
      )}
      <h3 className="font-semibold">{title}</h3>
      {summary && <p className="text-sm text-gray-500">{summary}</p>}
    </div>
  );
};
