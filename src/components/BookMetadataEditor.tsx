import React, { useState, useEffect } from 'react';
import { useNostr } from '../nostr';
import { publishBookMeta } from '../nostr/events';
import { queueOfflineEdit } from '../nostr/offline';
import { useToast } from './ToastProvider';
import { logError } from '../lib/logger';

export interface BookMetadataEditorProps {
  bookId: string;
  authorPubkey: string;
  meta: { title?: string; summary?: string; cover?: string; tags?: string[] };
  onClose: () => void;
}

/**
 * Form for editing book title, summary, cover and tags.
 */
export const BookMetadataEditor: React.FC<BookMetadataEditorProps> = ({
  bookId,
  authorPubkey,
  meta,
  onClose,
}) => {
  const ctx = useNostr();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [cover, setCover] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    setTitle(meta.title || '');
    setSummary(meta.summary || '');
    setCover(meta.cover || '');
    setTags(meta.tags?.join(', ') || '');
  }, [meta]);

  const handleSave = async () => {
    if (ctx.pubkey !== authorPubkey) {
      toast('Action failed', { type: 'error' });
      return;
    }
    const data = {
      title,
      summary,
      cover: cover || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (!navigator.onLine) throw new Error('offline');
      await publishBookMeta(ctx, bookId, data);
      onClose();
    } catch (err) {
      logError(err);
      await queueOfflineEdit({
        id: Math.random().toString(36).slice(2),
        type: 'meta',
        data: { ...data, bookId },
      });
      toast('Saved offline, will sync later');
      onClose();
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-[var(--space-2)] sm:p-[var(--space-4)]">
        <div className="space-y-2 w-full max-w-sm max-h-screen overflow-y-auto rounded bg-[color:var(--clr-surface)] p-[var(--space-4)]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded border p-[var(--space-2)]"
        />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Summary"
          className="w-full rounded border p-[var(--space-2)]"
        />
        <input
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          placeholder="Cover"
          className="w-full rounded border p-[var(--space-2)]"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags comma separated"
          className="w-full rounded border p-[var(--space-2)]"
        />
        <div className="flex justify-end gap-2 pt-[var(--space-2)]">
          <button onClick={onClose} className="rounded border px-[var(--space-3)] py-[var(--space-1)]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-3)] py-[var(--space-1)] text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
