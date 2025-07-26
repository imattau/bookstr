import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '../nostr';

interface BookMeta {
  id: string;
  title: string;
  summary: string;
  cover?: string;
}

export const BookListScreen: React.FC = () => {
  const { subscribe, publish } = useNostr();
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [cover, setCover] = useState('');
  const [tags, setTags] = useState('');
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

  const handleSave = async () => {
    const bookId = crypto.randomUUID();
    const tgs: string[][] = [
      ['d', bookId],
      ['title', title],
      ['summary', summary],
    ];
    if (cover) tgs.push(['image', cover]);
    tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => tgs.push(['t', t]));
    await publish({ kind: 41, content: '', tags: tgs });
    setShow(false);
    setTitle('');
    setSummary('');
    setCover('');
    setTags('');
    navigate(`/book/${bookId}`);
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
            {b.cover && <img src={b.cover} alt="" className="h-24 w-auto" />}
            <h3 className="font-semibold">{b.title}</h3>
            {b.summary && <p className="text-sm">{b.summary}</p>}
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="space-y-2 rounded bg-[color:var(--clr-surface)] p-4 w-full max-w-sm">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded border p-2"
            />
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary"
              className="w-full rounded border p-2"
            />
            <input
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="Cover URL"
              className="w-full rounded border p-2"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags comma separated"
              className="w-full rounded border p-2"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShow(false)}
                className="rounded border px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded bg-primary-600 px-3 py-1 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
