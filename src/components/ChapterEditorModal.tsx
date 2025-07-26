import React, { useState, useEffect } from 'react';
import { useNostr } from '../nostr';

interface Props {
  bookId: string;
  chapterNumber: number;
  chapterId?: string;
  onClose: () => void;
}

export const ChapterEditorModal: React.FC<Props> = ({
  bookId,
  chapterNumber,
  chapterId,
  onClose,
}) => {
  const { publish, subscribe, pubkey } = useNostr();
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
    const chTags: string[][] = [
      ['book', bookId],
      ['chapter', String(chapterNumber)],
    ];
    if (title) chTags.push(['title', title]);
    if (summary) chTags.push(['summary', summary]);
    if (cover) chTags.push(['image', cover]);
    tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => chTags.push(['t', t]));
    const evt = await publish({ kind: 30023, content, tags: chTags });

    let listEvt: any = null;
    if (pubkey) {
      await new Promise<void>((resolve) => {
        const off = subscribe(
          [{ kinds: [30001], authors: [pubkey], '#d': [bookId], limit: 1 }],
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
    await publish({ kind: 30001, content: '', tags: tagsOut });
    onClose();
  };

  return (
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
          placeholder="Cover"
          className="w-full rounded border p-2"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags comma separated"
          className="w-full rounded border p-2"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          className="w-full rounded border p-2 min-h-[120px]"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded border px-3 py-1">
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
  );
};
