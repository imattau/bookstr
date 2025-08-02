import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { useNostr } from '../nostr';
import { useToast } from './ToastProvider';
import { sanitizeHtml } from '../sanitizeHtml';
import { reportBookPublished } from '../achievements';
import { logError } from '../lib/logger';

export interface BookPublishWizardProps {
  onPublish?: (id: string) => void;
}

/**
 * Multi-step wizard for publishing a new book.
 */
export const BookPublishWizard: React.FC<BookPublishWizardProps> = ({
  onPublish,
}) => {
  const ctx = useNostr();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [cover, setCover] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [pow, setPow] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const previewHtml = useMemo(
    () => sanitizeHtml(marked.parse(content)),
    [content],
  );

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const toast = useToast();

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const { publishChapter, publishToc } = await import('../nostr/events').catch(() =>
        // Node tests can't handle TS ESM import
        require('../nostr/events')
      );
      const bookId = Math.random().toString(36).slice(2);
      const tagArr = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const chapter = await publishChapter(
        ctx,
        bookId,
        1,
        {
          title,
          summary,
          content,
          cover: cover || undefined,
          tags: tagArr,
        },
        pow ? 20 : 0,
      );
      await publishToc(
        ctx,
        bookId,
        [chapter.id],
        { title, summary, cover: cover || undefined, tags: tagArr },
        pow ? 20 : 0,
      );
      setStep(0);
      setTitle('');
      setSummary('');
      setCover('');
      setTags('');
      setContent('');
      setPow(false);
      reportBookPublished();
      if (onPublish) onPublish(bookId);
      toast(
        `Book published! <a href="/book/${bookId}">View book</a>`,
      );
    } catch (err) {
      logError(err);
      toast('Failed to publish book.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 0 && (
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
            className="w-full rounded border p-2"
          />
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
          <input
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="Cover image URL"
              className="w-full rounded border p-[var(--space-2)]"
          />
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
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags comma separated"
              className="w-full rounded border p-[var(--space-2)]"
          />
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
      {step === 3 && (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Markdown content"
              className="w-full rounded border p-[var(--space-2)] min-h-[200px]"
          />
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
      {step === 4 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          {cover && (
            <img
              src={cover}
              alt={title ? `Cover image for ${title}` : 'Book cover'}
              className="max-h-40 w-auto"
            />
          )}
          <p>{summary}</p>
          <div className="flex flex-wrap gap-1">
            {tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t}
                    className="rounded bg-primary-100 px-[var(--space-2)] py-[var(--space-1)] text-sm"
                >
                  {t}
                </span>
              ))}
          </div>
          <div
              className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pow}
              onChange={(e) => setPow(e.target.checked)}
            />
            Enable proof-of-work
          </label>
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
          {publishing && (
              <div className="flex justify-center pt-[var(--space-2)]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--clr-primary-600)] border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
