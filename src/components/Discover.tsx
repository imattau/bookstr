import React, { useEffect, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr } from '../nostr';
import { BookCard } from './BookCard';

const TAGS = ['All', 'Fiction', 'Mystery', 'Fantasy'];

export const Discover: React.FC = () => {
  const { subscribe } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');

  useEffect(() => {
    const off = subscribe([{ kinds: [30023], limit: 50 }], (evt) =>
      setEvents((e) => {
        if (e.find((x) => x.id === evt.id)) return e;
        return [...e, evt];
      }),
    );
    return off;
  }, [subscribe]);

  const filtered = events.filter((evt) => {
    let ok = true;
    if (tag !== 'All') {
      ok = evt.tags.some(
        (t) => t[0] === 't' && t[1].toLowerCase() === tag.toLowerCase(),
      );
    }
    if (ok && search) {
      const title = evt.tags.find((t) => t[0] === 'title')?.[1] ?? '';
      ok = title.toLowerCase().includes(search.toLowerCase());
    }
    return ok;
  });

  return (
    <div className="pb-4">
      <header className="relative bg-primary-600 py-3 text-center text-white">
        <button
          aria-label="Search"
          className="absolute left-2 top-1/2 -translate-y-1/2"
        >
          🔍
        </button>
        <h1 className="text-[18px] font-semibold">Bookstr</h1>
      </header>
      <div className="p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full rounded border border-border p-2 focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
        />
      </div>
      <div className="flex overflow-x-auto gap-1 px-2 pb-2">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setTag(t)}
            className={`btn-tap whitespace-nowrap rounded px-2 py-1 text-[14px] ${
              tag === t
                ? 'bg-primary-600 text-white'
                : 'border border-border text-primary-600 bg-[color:var(--clr-surface)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 p-4">
        {filtered.map((e) => (
          <BookCard key={e.id} event={e as NostrEvent} />
        ))}
      </div>
    </div>
  );
};
