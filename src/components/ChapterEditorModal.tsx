import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import MarkdownPreview from '@uiw/react-markdown-preview';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useNostr, publishAnnouncement } from '../nostr';
import { publishChapter, listChapters, publishToc } from '../nostr/events';
import { queueOfflineEdit } from '../nostr/offline';
import { useToast } from './ToastProvider';
import { logError } from '../lib/logger';

interface Props {
  bookId: string;
  chapterNumber: number;
  chapterId?: string;
  authorPubkey: string;
  onClose: () => void;
  viaApi?: boolean;
  allowAnnouncement?: boolean;
}

const API_BASE =
  (typeof process !== 'undefined' && process.env.VITE_API_BASE) || '/api';

/**
 * Modal for creating or editing a chapter's content and metadata.
 */
export const ChapterEditorModal: React.FC<Props> = ({
  bookId,
  chapterNumber,
  chapterId,
  authorPubkey,
  onClose,
  viaApi,
  allowAnnouncement,
}) => {
  const ctx = useNostr();
  const { subscribe, pubkey } = ctx;
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [cover, setCover] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [announce, setAnnounce] = useState(true);

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
    const tTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const data = {
      title,
      summary: summary || undefined,
      content,
      cover: cover || undefined,
      tags: tTags,
    };
    let evt: any;
    try {
      if (!navigator.onLine) throw new Error('offline');
      evt = await publishChapter(ctx, bookId, chapterNumber, data);
      if (allowAnnouncement && announce && !chapterId) {
        await publishAnnouncement(
          ctx,
          `📚 New chapter: ${title} nostr:naddr/${evt.id}`,
        );
      }
      if (viaApi) {
        await fetch(`${API_BASE}/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evt),
        });
      }
    } catch (err) {
      logError(err);
      await queueOfflineEdit({
        id: Math.random().toString(36).slice(2),
        type: 'chapter',
        data: { ...data, bookId, chapterNumber },
      });
      toast('Saved offline, will sync later');
      onClose();
      return;
    }

    const { toc } = await listChapters(ctx, bookId);
    const ids = toc?.tags.filter((t) => t[0] === 'e').map((t) => t[1]) || [];
    const meta = {
      title: toc?.tags.find((t) => t[0] === 'title')?.[1],
      summary: toc?.tags.find((t) => t[0] === 'summary')?.[1],
      cover: toc?.tags.find((t) => t[0] === 'image')?.[1],
      tags: toc?.tags.filter((t) => t[0] === 't').map((t) => t[1]),
    };
    if (ids.length < chapterNumber) {
      ids.push(evt.id);
    } else {
      ids[chapterNumber - 1] = evt.id;
    }
    const tocEvt = await publishToc(ctx, bookId, ids, meta);
    if (viaApi) {
      await fetch(`${API_BASE}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tocEvt),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-[var(--space-2)] sm:p-[var(--space-4)]">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-2xl max-h-screen overflow-y-auto rounded bg-[color:var(--clr-surface)] p-[var(--space-4)]">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
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
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
            />
            {allowAnnouncement && !chapterId && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={announce}
                  onChange={(e) => setAnnounce(e.target.checked)}
                />
                Post announcement
              </label>
            )}
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
          <div className="hidden lg:block overflow-y-auto rounded border p-[var(--space-2)]">
            <MarkdownPreview source={content} />
          </div>
        </div>
      </div>
    </div>
  );
};
