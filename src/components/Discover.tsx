import React, { useEffect, useState, useMemo } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import { useDiscoverBooks } from '../hooks/useDiscoverBooks';
import { useNostr } from '../nostr';
import { useSearchParams } from 'react-router-dom';
import { BookCard } from './BookCard';
import { BookCardSkeleton } from './BookCardSkeleton';
import { OnboardingTooltip } from './OnboardingTooltip';
import { logEvent } from '../analytics';
import { CommunityFeed } from './CommunityFeed';
import { Illustration } from './Illustration';

export const Discover: React.FC = () => {
  const {
    books: bookEvents,
    trending,
    newReleases,
    loading,
    removeBook,
  } = useDiscoverBooks();
  const { contacts } = useNostr();
  const [params, setParams] = useSearchParams();
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

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    for (const evt of bookEvents) {
      evt.tags.forEach((t) => {
        if (t[0] === 't') set.add(t[1]);
      });
    }
    return ['All', ...Array.from(set).sort()];
  }, [bookEvents]);

  useEffect(() => {
    if (!tagOptions.includes(tag)) setTag('All');
  }, [tagOptions, tag]);

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

  const recommended = filtered.slice(0, 6);
  const noResults = search.trim() !== '' && recommended.length === 0;

  return (
    <div className="pb-[var(--space-4)]">
      <header className="flex items-center gap-[var(--space-2)] bg-[color:var(--clr-primary-600)] p-[var(--space-3)]">
        <h1 className="text-[18px] font-semibold text-white">Bookstr</h1>
        <OnboardingTooltip storageKey="discover-search" text="Search for books">
          <div className="flex flex-1 items-center gap-1">
            <input
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-[var(--radius-button)] border border-border p-[var(--space-2)] bg-[color:var(--clr-surface)] text-[color:var(--clr-text)] focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
            />
            {search && (
              <button
                onClick={() => updateSearch('')}
                className="rounded bg-primary-500 px-[var(--space-2)] py-[var(--space-1)] text-sm text-white"
              >
                Clear
              </button>
            )}
          </div>
        </OnboardingTooltip>
      </header>
      <div className="flex overflow-x-auto gap-[var(--space-2)] px-[var(--space-2)] pb-[var(--space-2)]">
        {tagOptions.map((t) => (
          <button
            key={t}
            onClick={() => setTag(t)}
            aria-pressed={tag === t}
            aria-label={t}
            className={`btn-tap whitespace-nowrap rounded-[var(--radius-button)] px-[var(--space-2)] py-[var(--space-1)] text-[14px] ${
              tag === t
                ? 'bg-[color:var(--clr-primary-600)] text-white'
                : 'border border-border text-[color:var(--clr-primary-600)] bg-[color:var(--clr-surface)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="p-[var(--space-4)]">
        <h2 className="mb-[var(--space-2)] font-semibold">Trending Books</h2>
        <ul
          role="list"
          className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2 lg:grid-cols-4"
        >
          {loading && trending.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i} role="listitem">
                  <BookCardSkeleton />
                </li>
              ))
            : trending.map((e) => (
                <li key={e.id} role="listitem">
                  <BookCard
                    event={e as NostrEvent}
                    onDelete={(id) => removeBook(id)}
                  />
                </li>
              ))}
        </ul>
      </section>
      <section className="p-[var(--space-4)]">
        <h2 className="mb-[var(--space-2)] font-semibold">New Releases</h2>
        <ul
          role="list"
          className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2 lg:grid-cols-4"
        >
          {loading && newReleases.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i} role="listitem">
                  <BookCardSkeleton />
                </li>
              ))
            : newReleases.map((e) => (
                <li key={e.id} role="listitem">
                  <BookCard
                    event={e as NostrEvent}
                    onDelete={(id) => removeBook(id)}
                  />
                </li>
              ))}
        </ul>
      </section>
      <section className="p-[var(--space-4)]">
        <h2 className="mb-[var(--space-2)] font-semibold">
          Recommended for You
        </h2>
        <ul
          role="list"
          className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2 lg:grid-cols-4"
        >
          {noResults ? (
            <div className="col-span-full">
              <Illustration text="No matching books found." />
            </div>
          ) : loading && recommended.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <li key={i} role="listitem">
                <BookCardSkeleton />
              </li>
            ))
          ) : (
            recommended.map((e) => (
              <li key={e.id} role="listitem">
                <BookCard
                  event={e as NostrEvent}
                  onDelete={(id) => removeBook(id)}
                />
              </li>
            ))
          )}
        </ul>
      </section>
      <section className="p-[var(--space-4)]">
        <h2 className="mb-[var(--space-2)] font-semibold">Communities</h2>
        <CommunityFeed />
      </section>
    </div>
  );
};
