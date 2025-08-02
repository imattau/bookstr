import React, { useEffect, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr } from '../nostr';
import { useToast } from './ToastProvider';
import { logError } from '../lib/logger';

export interface ListPublishWizardProps {
  onPublish?: (id: string) => void;
}

/**
 * Wizard for publishing a new book list.
 */
export const ListPublishWizard: React.FC<ListPublishWizardProps> = ({ onPublish }) => {
  const ctx = useNostr();
  const toast = useToast();
  const { pubkey, list } = ctx;
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [books, setBooks] = useState<Record<string, { title: string; author: string; cover?: string }>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!pubkey) return;
    (async () => {
      setLoading(true);
      try {
        const evts = (await list([
          { kinds: [30001], authors: [pubkey], '#d': ['library'], limit: 1 },
        ])) as NostrEvent[];
        const ids = evts[0]
          ? evts[0].tags.filter((t) => t[0] === 'e').map((t) => t[1])
          : [];
        if (ids.length) {
          const metas = (await list([{ kinds: [41], '#d': ids }])) as NostrEvent[];
          const map: Record<string, { title: string; author: string; cover?: string }> = {};
          metas.forEach((e) => {
            const id = e.tags.find((t) => t[0] === 'd')?.[1];
            if (!id) return;
            map[id] = {
              title: e.tags.find((t) => t[0] === 'title')?.[1] || 'Untitled',
              author: e.pubkey,
              cover: e.tags.find((t) => t[0] === 'image')?.[1],
            };
          });
          setBooks(map);
        }
      } catch (err) {
        logError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [pubkey, list]);

  const toggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const handlePublish = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) {
      toast('Select at least one book', { type: 'error' });
      return;
    }
    setPublishing(true);
    try {
      const d = Math.random().toString(36).slice(2);
      const tags: string[][] = [ ['d', d], ['name', title] ];
      if (summary) tags.push(['summary', summary]);
      ids.forEach((id) => {
        const b = books[id];
        if (b) tags.push(['a', `41:${b.author}:${id}`]);
      });
      const kind = isPrivate ? 10003 : 30004;
      const evt = await ctx.publish({ kind, content: '', tags });
      toast('List published!');
      setStep(0);
      setTitle('');
      setSummary('');
      setIsPrivate(false);
      setSelected({});
      if (onPublish) onPublish(evt.id);
    } catch (err) {
      logError(err);
      toast('Failed to publish list', { type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="space-y-4">
      {step === 0 && (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="List name"
            className="w-full rounded border p-[var(--space-2)]"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Description"
            className="w-full rounded border p-2"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
            Private list
          </label>
          <button
            onClick={next}
            className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-4)] py-[var(--space-2)] text-white"
          >
            Next
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-2">
          {loading && <p>Loading...</p>}
          {!loading && Object.keys(books).length === 0 && (
            <p className="text-sm text-text-muted">No books found in library.</p>
          )}
          <ul className="space-y-1">
            {Object.keys(books).map((id) => {
              const b = books[id];
              return (
                <li key={id} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!selected[id]} onChange={() => toggle(id)} />
                  {b.cover && <img src={b.cover} alt="Cover" className="h-8 w-6 object-cover" />}
                  <span>{b.title}</span>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between gap-2">
            <button onClick={back} className="rounded border px-[var(--space-4)] py-[var(--space-2)]">
              Back
            </button>
            <button
              onClick={next}
              className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-4)] py-[var(--space-2)] text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p>{summary}</p>
          <ul className="space-y-1">
            {Object.keys(selected)
              .filter((k) => selected[k])
              .map((id) => (
                <li key={id}>{books[id]?.title || id}</li>
              ))}
          </ul>
          <div className="flex justify-between gap-2">
            <button onClick={back} className="rounded border px-[var(--space-4)] py-[var(--space-2)]">
              Back
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-4)] py-[var(--space-2)] text-white disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

