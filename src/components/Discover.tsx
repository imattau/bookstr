import React, { useEffect, useRef, useState } from 'react';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { useNostr } from '../nostr';
import { BookCard } from './BookCard';
import { useOnboarding } from '../useOnboarding';
import { logEvent } from '../analytics';

const TAGS = ['All', 'Fiction', 'Mystery', 'Fantasy'];

export const Discover: React.FC = () => {
  const { subscribe, contacts } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const voteIds = useRef(new Set<string>());
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');

  useEffect(() => {
    logEvent('discover_view');
  }, []);

  useEffect(() => {
    const filters: Filter[] = [{ kinds: [30023], limit: 50 }];
    if (contacts.length) filters[0].authors = contacts;
    const off = subscribe(filters, (evt) =>
      setEvents((e) => {
        if (e.find((x) => x.id === evt.id)) return e;
        return [...e, evt];
      }),
    );
    return off;
  }, [subscribe, contacts]);

  // aggregate votes for known events
  useEffect(() => {
    if (!events.length) return;
    const ids = events.map((e) => e.id);
    const off = subscribe([{ kinds: [7], '#e': ids }], (evt) => {
      if (voteIds.current.has(evt.id)) return;
      voteIds.current.add(evt.id);
      const target = evt.tags.find((t) => t[0] === 'e')?.[1];
      if (target) {
        setVotes((v) => ({ ...v, [target]: (v[target] ?? 0) + 1 }));
      }
    });
    return off;
  }, [events, subscribe]);

  const filtered = events.filter((evt) => {
    let ok = true;
    if (contacts.length && !contacts.includes(evt.pubkey)) ok = false;
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

  const topRated = [...events]
    .sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0))
    .slice(0, 6);

  const newReleases = [...events]
    .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
    .slice(0, 6);

  const recommended = filtered.slice(0, 6);

  const searchOnboarding = useOnboarding('discover-search', 'Search for books');

  return (
    <div className="pb-4">
      <header className="relative bg-primary-600 py-3 text-center text-white">
        <button
          ref={searchOnboarding.ref as React.RefObject<HTMLButtonElement>}
          onClick={searchOnboarding.dismiss}
          aria-label="Search"
          className={`relative absolute left-2 top-1/2 -translate-y-1/2 ${
            searchOnboarding.show ? 'rounded ring-2 ring-primary-300' : ''
          }`}
        >
          🔍
          {searchOnboarding.Tooltip}
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
      <section className="p-4">
        <h2 className="mb-2 font-semibold">Top Rated</h2>
        <div className="grid grid-cols-2 gap-4">
          {topRated.map((e) => (
            <BookCard key={e.id} event={e as NostrEvent} />
          ))}
        </div>
      </section>
      <section className="p-4">
        <h2 className="mb-2 font-semibold">New Releases</h2>
        <div className="grid grid-cols-2 gap-4">
          {newReleases.map((e) => (
            <BookCard key={e.id} event={e as NostrEvent} />
          ))}
        </div>
      </section>
      <section className="p-4">
        <h2 className="mb-2 font-semibold">Recommended for You</h2>
        <div className="grid grid-cols-2 gap-4">
          {recommended.map((e) => (
            <BookCard key={e.id} event={e as NostrEvent} />
          ))}
        </div>
      </section>
    </div>
  );
};
