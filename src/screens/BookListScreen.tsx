import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '../nostr';
import { BookPublishWizard } from '../components/BookPublishWizard';

interface BookMeta {
  id: string;
  title: string;
  summary: string;
  cover?: string;
}

export const BookListScreen: React.FC = () => {
  const { subscribe } = useNostr();
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const off = subscribe([{ kinds: [41] }], (evt) => {
      const bookId = evt.tags.find((t) => t[0] === 'd')?.[1];
      if (!bookId) return;
      setBooks((bs) => {
        if (bs.find((b) => b.id === bookId)) return bs;
        return [
          ...bs,
          {
            id: bookId,
            title: evt.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled',
            summary: evt.tags.find((t) => t[0] === 'summary')?.[1] ?? '',
            cover: evt.tags.find((t) => t[0] === 'image')?.[1],
          },
        ];
      });
    });
    return off;
  }, [subscribe]);

  const handlePublished = (id: string) => {
    setShow(false);
    navigate(`/book/${id}`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShow(true)}
          className="rounded bg-primary-600 px-3 py-1 text-white"
        >
          Create Book
        </button>
      </div>
      <div className="space-y-2">
        {books.map((b) => (
          <div
            key={b.id}
            className="rounded border p-2 cursor-pointer"
            onClick={() => navigate(`/book/${b.id}`)}
          >
            {b.cover && (
              <img
                src={b.cover}
                alt={`Cover image for ${b.title}`}
                className="h-24 w-auto"
              />
            )}
            <h3 className="font-semibold">{b.title}</h3>
            {b.summary && <p className="text-sm">{b.summary}</p>}
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="space-y-2 rounded bg-[color:var(--clr-surface)] p-4 w-full max-w-sm">
            <BookPublishWizard onPublish={handlePublished} />
            <div className="flex justify-end pt-2">
              <button onClick={() => setShow(false)} className="rounded border px-3 py-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
