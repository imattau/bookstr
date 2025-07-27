import React, { useState, useEffect } from 'react';
import { useNostr } from '../nostr';
import { publishLongPost } from '../nostr/events';
import { queueOfflineEdit } from '../nostr/offline';
import { useToast } from './ToastProvider';

interface Props {
  bookId: string;
  chapterNumber: number;
  chapterId?: string;
  authorPubkey: string;
  onClose: () => void;
  viaApi?: boolean;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

export const ChapterEditorModal: React.FC<Props> = ({
  bookId,
  chapterNumber,
  chapterId,
  authorPubkey,
  onClose,
  viaApi,
}) => {
  const ctx = useNostr();
  const { publish, subscribe, list, pubkey } = ctx;
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [cover, setCover] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!chapterId) return;
    const off = subscribe([{ ids: [chapterId] }], (evt) => {
      setTitle(evt.tags.find((t) => t[0] === 'title')?.[1] ?? '');
      setSummary(evt.tags.find((t) => t[0] === 'summary')?.[1] ?? '');
      setCover(evt.tags.find((t) => t[0] === 'image')?.[1] ?? '');
      const tagVals = evt.tags
        .filter((t) => t[0] === 't')
        .map((t) => t[1])
        .join(', ');
      setTags(tagVals);
      setContent(evt.content);
    });
    return off;
  }, [chapterId, subscribe]);

  const handleSave = async () => {
    if (pubkey !== authorPubkey) {
      toast('Action failed', { type: 'error' });
      return;
    }
    const baseTags: string[][] = [
      ['book', bookId],
      ['chapter', String(chapterNumber)],
    ];
    const tTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const data = {
      title,
      summary: summary || undefined,
      content,
      cover: cover || undefined,
      extraTags: baseTags,
      tags: tTags,
      bookId,
      chapterNumber,
    };
    let evt: any;
    try {
      if (!navigator.onLine) throw new Error('offline');
      evt = await publishLongPost(ctx, data);
      if (viaApi) {
        await fetch(`${API_BASE}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt),
        });
      }
    } catch {
      await queueOfflineEdit({
        id: Math.random().toString(36).slice(2),
        type: 'chapter',
        data,
      });
      toast('Saved offline, will sync later');
      onClose();
      return;
    }

    let listEvt: any = null;
    if (pubkey) {
      await new Promise<void>((resolve) => {
        const off = subscribe(
          [{ kinds: [30001], authors: [authorPubkey], '#d': [bookId], limit: 1 }],
          (e) => {
            listEvt = e;
            off();
            resolve();
          },
        );
        setTimeout(() => {
          off();
          resolve();
        }, 2000);
      });
    }
    const ids =
      listEvt?.tags
        .filter((t: string[]) => t[0] === 'e')
        .map((t: string[]) => t[1]) || [];
    if (ids.length < chapterNumber) {
      ids.push(evt.id);
    } else {
      ids[chapterNumber - 1] = evt.id;
    }
    const tagsOut = [['d', bookId], ...ids.map((i: string) => ['e', i])];
    const listEvent = await publish({ kind: 30001, content: '', tags: tagsOut });
    if (viaApi) {
      await fetch(`${API_BASE}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listEvent),
      });
    }
    onClose();
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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          className="w-full rounded border p-[var(--space-2)] min-h-[120px]"
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
