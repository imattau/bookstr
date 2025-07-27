import React, { useCallback, useEffect, useState } from 'react';
import type {
  ListChildComponentProps,
  FixedSizeList as FixedSizeListType,
} from 'react-window';
let FixedSizeList: typeof FixedSizeListType;
if (typeof window === 'undefined') {
  (globalThis as any).process = { env: { NODE_ENV: 'production' } };
  FixedSizeList = require('react-window').FixedSizeList;
} else {
  FixedSizeList = require('react-window').FixedSizeList;
}
import { useNavigate } from 'react-router-dom';
import { useNostr } from '../nostr';
import type { Event as NostrEvent, Filter } from 'nostr-tools';
import { BookPublishWizard } from '../components/BookPublishWizard';

interface BookMeta {
  id: string;
  title: string;
  summary: string;
  cover?: string;
  created: number;
  zaps: number;
}

export const BookListScreen: React.FC = () => {
  const { subscribe, list } = useNostr();
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'zapped'>('newest');
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const sortBooks = (arr: BookMeta[], mode: typeof sort) => {
    const copy = [...arr];
    if (mode === 'newest') copy.sort((a, b) => b.created - a.created);
    else if (mode === 'oldest') copy.sort((a, b) => a.created - b.created);
    else copy.sort((a, b) => b.zaps - a.zaps);
    return copy;
  };

  const loadPage = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const filters: Filter[] = [{ kinds: [41], limit: 10 }];
    if (cursor) filters[0].until = cursor;
    const events = (await list(filters)) as NostrEvent[];
    if (!events.length) {
      setLoading(false);
      return;
    }
    const ids = events
      .map((e) => e.tags.find((t) => t[0] === 'd')?.[1])
      .filter(Boolean) as string[];
    const zapEvents = await list([{ kinds: [9735], '#e': ids }]);
    const zapCount: Record<string, number> = {};
    zapEvents.forEach((e) => {
      const id = e.tags.find((t) => t[0] === 'e')?.[1];
      if (id) zapCount[id] = (zapCount[id] || 0) + 1;
    });
    const newBooks = events
      .map((evt) => {
        const bookId = evt.tags.find((t) => t[0] === 'd')?.[1];
        if (!bookId) return null;
        return {
          id: bookId,
          title: evt.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled',
          summary: evt.tags.find((t) => t[0] === 'summary')?.[1] ?? '',
          cover: evt.tags.find((t) => t[0] === 'image')?.[1],
          created: evt.created_at,
          zaps: zapCount[bookId] || 0,
        } as BookMeta;
      })
      .filter(Boolean) as BookMeta[];

    setCursor(events[events.length - 1].created_at - 1);
    setBooks((bs) => {
      const merged = [...bs];
      for (const b of newBooks) {
        if (!merged.find((x) => x.id === b.id)) merged.push(b);
      }
      return sortBooks(merged, sort);
    });
    setLoading(false);
  }, [cursor, list, loading, sort]);

  useEffect(() => {
    setBooks([]);
    setCursor(null);
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const handlePublished = (id: string) => {
    setShow(false);
    navigate(`/book/${id}`);
  };

  const ITEM_HEIGHT = 150;
  const GAP = 8;
  const Row = ({ index, style }: ListChildComponentProps) => {
    const b = books[index];
    if (!b) return null;
    return (
      <div
        style={{ ...style, height: ITEM_HEIGHT }}
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
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded border px-2 py-1"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="zapped">Most Zapped</option>
        </select>
        <button
          onClick={() => setShow(true)}
          className="rounded bg-primary-600 px-3 py-1 text-white"
        >
          Create Book
        </button>
      </div>
      <div className="space-y-2">
        {books.length === 0 && (
          <p className="text-center text-text-muted">No books found.</p>
        )}
        {books.length > 0 && (
          <FixedSizeList
            height={Math.min(600, books.length * (ITEM_HEIGHT + GAP))}
            itemCount={books.length}
            itemSize={ITEM_HEIGHT + GAP}
            width="100%"
          >
            {Row}
          </FixedSizeList>
        )}
        <div className="pt-2">
          <button
            onClick={loadPage}
            disabled={loading}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      </div>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="space-y-2 rounded bg-[color:var(--clr-surface)] p-4 w-full max-w-sm">
            <BookPublishWizard onPublish={handlePublished} />
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShow(false)}
                className="rounded border px-3 py-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
