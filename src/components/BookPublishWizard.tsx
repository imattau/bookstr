import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { useNostr, publishLongPost, publishBookMeta } from '../nostr';
import { useToast } from './ToastProvider';
import { sanitizeHtml } from '../sanitizeHtml';
import { reportBookPublished } from '../achievements';

export interface BookPublishWizardProps {
  onPublish?: (id: string) => void;
}

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
      const evt = await publishLongPost(
        ctx,
        {
          title,
          summary,
          content,
          cover: cover || undefined,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        },
        pow ? 20 : 0,
      );
      await publishBookMeta(
        ctx,
        evt.id,
        {
          title,
          summary,
          cover: cover || undefined,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        },
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
      if (onPublish) onPublish(evt.id);
      toast(
        `Book published! <a href="/book/${evt.id}">View book</a>`,
      );
    } catch {
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
            className="w-full rounded border p-2"
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary"
            className="w-full rounded border p-2"
          />
          <button
            onClick={next}
            className="rounded bg-primary-600 px-4 py-2 text-white"
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
            className="w-full rounded border p-2"
          />
          <div className="flex justify-between gap-2">
            <button onClick={back} className="rounded border px-4 py-2">
              Back
            </button>
            <button
              onClick={next}
              className="rounded bg-primary-600 px-4 py-2 text-white"
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
            className="w-full rounded border p-2"
          />
          <div className="flex justify-between gap-2">
            <button onClick={back} className="rounded border px-4 py-2">
              Back
            </button>
            <button
              onClick={next}
              className="rounded bg-primary-600 px-4 py-2 text-white"
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
            className="w-full rounded border p-2 min-h-[200px]"
          />
          <div className="flex justify-between gap-2">
            <button onClick={back} className="rounded border px-4 py-2">
              Back
            </button>
            <button
              onClick={next}
              className="rounded bg-primary-600 px-4 py-2 text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
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
                  className="rounded bg-primary-100 px-2 py-1 text-sm"
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
            <button onClick={back} className="rounded border px-4 py-2">
              Back
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          </div>
          {publishing && (
            <div className="flex justify-center pt-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
