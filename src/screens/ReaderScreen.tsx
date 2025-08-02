/**
 * Full screen reader for viewing a book's content and tracking progress.
 *
 * Route params:
 * - `bookId` – retrieved via `useParams` to load the desired book.
 *
 * Hooks: uses `useNostr` to fetch chapters, `useTheme` and `useReadingStore`
 * for reader preferences and progress.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '../nostr';
import { fetchLongPostParts, listChapters } from '../nostr/events';
import { ReaderToolbar } from '../components/ReaderToolbar';
import { ProgressBar } from '../components/ProgressBar';
import { ReaderView } from '../components/ReaderView';
import { Button } from '../components/ui';
import { useTheme } from '../ThemeProvider';
import { useReadingStore } from '../store';

export const ReaderScreen: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const ctx = useNostr();
  const { theme, setTheme } = useTheme();
  const updateProgress = useReadingStore((s) => s.updateProgress);
  const finishBook = useReadingStore((s) => s.finishBook);
  const [title, setTitle] = React.useState('');
  const [html, setHtml] = React.useState('');
  const [percent, setPercent] = React.useState(0);
  const [fontSize, setFontSize] = React.useState(16);
  const [chapters, setChapters] = React.useState<any[]>([]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (!bookId) return;
    (async () => {
      const { chapters: chs } = await listChapters(ctx, bookId);
      setChapters(chs);
      if (chs[0]) {
        setTitle(chs[0].tags.find((t) => t[0] === 'title')?.[1] ?? '');
        setHtml(await fetchLongPostParts(ctx, chs[0]));
      }
    })();
  }, [bookId, ctx]);

  React.useEffect(() => {
    (async () => {
      const ch = chapters[idx];
      if (ch) {
        setTitle(ch.tags.find((t) => t[0] === 'title')?.[1] ?? '');
        setHtml(await fetchLongPostParts(ctx, ch));
        setPercent(0);
      }
    })();
  }, [idx, chapters, ctx]);

  const handleFontSize = (d: 1 | -1) =>
    setFontSize((f) => Math.min(24, Math.max(12, f + d * 2)));

  if (!bookId) return null;

  return (
    <div className="flex h-full flex-col">
      <ReaderToolbar
        title={title}
        percent={Math.round(percent)}
        onBack={() => navigate(-1)}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
        onFontSize={handleFontSize}
        onBookmark={() => {}}
        onPrev={() => setIdx((i) => Math.max(0, i - 1))}
        onNext={() => setIdx((i) => Math.min(chapters.length - 1, i + 1))}
        hasPrev={idx > 0}
        hasNext={idx < chapters.length - 1}
      />
      <ProgressBar value={percent} aria-label="Reading progress" />
      <ReaderView
        bookId={bookId}
        html={html}
        onPercentChange={(p) => {
          setPercent(p);
          updateProgress(bookId, p);
        }}
        className="flex-1"
        style={{ fontSize }}
      />
      <div className="p-[var(--space-4)]">
        <Button
          onClick={() => {
            finishBook(bookId);
            navigate(-1);
          }}
          className="w-full px-3 py-2"
        >
          Mark as finished
        </Button>
      </div>
    </div>
  );
};
