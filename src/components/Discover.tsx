import React, { useEffect, useRef, useState } from 'react';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { useNostr } from '../nostr';
import { useEventStore } from '../store/events';
import { useSearchParams } from 'react-router-dom';
import { BookCard } from './BookCard';
import { BookCardSkeleton } from './BookCardSkeleton';
import { OnboardingTooltip } from './OnboardingTooltip';
import { logEvent } from '../analytics';
import { CommunityFeed } from './CommunityFeed';

const TAGS = ['All', 'Fiction', 'Mystery', 'Fantasy'];

export const Discover: React.FC = () => {
  const { subscribe, contacts } = useNostr();
  const { addEvent } = useEventStore((s) => ({ addEvent: s.addEvent }));
  const [params, setParams] = useSearchParams();
  const [events, setEvents] = useState<
    (NostrEvent & { repostedBy?: string })[]
  >([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const voteIds = useRef(new Set<string>());
  const [search, setSearch] = useState(params.get('q') || '');
  const [tag, setTag] = useState('All');

  useEffect(() => {
    const q = params.get('q') || '';
    setSearch(q);
  }, [params]);

  const updateSearch = (val: string) => {
    setSearch(val);
    const next = new URLSearchParams(params);
    if (val) next.set('q', val);
    else next.delete('q');
    setParams(next);
  };

  useEffect(() => {
    logEvent('view_discover');
  }, []);

  useEffect(() => {
    const filters: Filter[] = [{ kinds: [30023], limit: 50 }];
    if (contacts.length) filters[0].authors = contacts;
    const offMain = subscribe(filters, (evt) => {
      addEvent(evt);
      setEvents((e) => {
        if (e.find((x) => x.id === evt.id)) return e;
        return [...e, evt];
      });
    });
    const repostFilter: Filter = { kinds: [6], limit: 50 };
    if (contacts.length) repostFilter.authors = contacts;
    const offReposts = subscribe([repostFilter], (evt) => {
      const target = evt.tags.find((t) => t[0] === 'e')?.[1];
      if (!target) return;
      const offTarget = subscribe([{ ids: [target] }], (orig) => {
        addEvent(orig);
        setEvents((e) => {
          const idx = e.findIndex((x) => x.id === orig.id);
          if (idx !== -1) {
            const copy = [...e];
            copy[idx] = { ...copy[idx], repostedBy: evt.pubkey };
            return copy;
          }
          return [...e, { ...orig, repostedBy: evt.pubkey }];
        });
        offTarget();
      });
    });
    return () => {
      offMain();
      offReposts();
    };
  }, [subscribe, contacts]);

  // aggregate votes for known events
  useEffect(() => {
    if (!events.length) return;
    const ids = events.map((e) => e.id);
    const off = subscribe([{ kinds: [7], '#e': ids }], (evt) => {
      addEvent(evt);
      if (voteIds.current.has(evt.id)) return;
      voteIds.current.add(evt.id);
      const target = evt.tags.find((t) => t[0] === 'e')?.[1];
      // only count publishVote events ('+' content)
      if (target && evt.content === '+') {
        setVotes((v) => ({ ...v, [target]: (v[target] ?? 0) + 1 }));
      }
    });
    return off;
  }, [events, subscribe]);

  const bookEvents = events.filter(
    (evt) => !evt.tags.some((t) => t[0] === 'book'),
  );

  const filtered = bookEvents.filter((evt) => {
    let ok = true;
    if (
      contacts.length &&
      !contacts.includes(evt.pubkey) &&
      !contacts.includes(evt.repostedBy ?? '')
    )
      ok = false;
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

  const trending = [...bookEvents]
    .sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0))
    .slice(0, 6);

  const newReleases = [...bookEvents]
    .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
    .slice(0, 6);

  const recommended = filtered.slice(0, 6);
  const noResults = search.trim() !== '' && recommended.length === 0;

  return (
    <div className="pb-4">
      <header className="relative bg-primary-600 py-3 text-center text-white">
        <OnboardingTooltip storageKey="discover-search" text="Search for books">
          <button
            aria-label="Search"
            className="relative absolute left-2 top-1/2 -translate-y-1/2"
          >
            🔍
          </button>
        </OnboardingTooltip>
        <h1 className="text-[18px] font-semibold">Bookstr</h1>
      </header>
      <div className="p-4">
        <input
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
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
        <h2 className="mb-2 font-semibold">Trending Books</h2>
        <div className="grid grid-cols-2 gap-4">
          {trending.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))
            : trending.map((e) => (
                <BookCard
                  key={e.id}
                  event={e as NostrEvent}
                  onDelete={(id) =>
                    setEvents((evts) => evts.filter((x) => x.id !== id))
                  }
                />
              ))}
        </div>
      </section>
      <section className="p-4">
        <h2 className="mb-2 font-semibold">New Releases</h2>
        <div className="grid grid-cols-2 gap-4">
          {newReleases.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))
            : newReleases.map((e) => (
                <BookCard
                  key={e.id}
                  event={e as NostrEvent}
                  onDelete={(id) =>
                    setEvents((evts) => evts.filter((x) => x.id !== id))
                  }
                />
              ))}
        </div>
      </section>
      <section className="p-4">
        <h2 className="mb-2 font-semibold">Recommended for You</h2>
        <div className="grid grid-cols-2 gap-4">
          {noResults ? (
            <p className="col-span-full text-center">No matching books found.</p>
          ) : recommended.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))
          ) : (
            recommended.map((e) => (
              <BookCard
                key={e.id}
                event={e as NostrEvent}
                onDelete={(id) =>
                  setEvents((evts) => evts.filter((x) => x.id !== id))
                }
              />
            ))
          )}
        </div>
      </section>
      <section className="p-4">
        <h2 className="mb-2 font-semibold">Communities</h2>
        <CommunityFeed />
      </section>
    </div>
  );
};
