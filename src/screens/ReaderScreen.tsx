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
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const activeChapterRef = React.useRef<HTMLButtonElement>(null);

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

  React.useEffect(() => {
    activeChapterRef.current?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  const handleFontSize = (d: 1 | -1) =>
    setFontSize((f) => Math.min(24, Math.max(12, f + d * 2)));

  if (!bookId) return null;

  const navProps =
    chapters.length > 1
      ? {
          onPrev: () => setIdx((i) => Math.max(0, i - 1)),
          onNext: () => setIdx((i) => Math.min(chapters.length - 1, i + 1)),
          hasPrev: idx > 0,
          hasNext: idx < chapters.length - 1,
        }
      : {};

  return (
    <div className="flex h-full flex-col">
      <ReaderToolbar
        title={title}
        percent={percent}
        onBack={() => navigate(-1)}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
        onFontSize={handleFontSize}
        onBookmark={() => {}}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarVisible={sidebarOpen}
        className="sticky top-0 z-10 bg-[color:var(--clr-surface)]"
        {...navProps}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="hidden w-48 overflow-y-auto border-r bg-[color:var(--clr-surface-alt)] lg:block">
            <ul className="flex flex-col">
              {chapters.map((ch, i) => {
                const t = ch.tags.find((tt: any) => tt[0] === 'title')?.[1] ?? `Chapter ${i + 1}`;
                return (
                  <li key={ch.id ?? i}>
                    <button
                      ref={i === idx ? activeChapterRef : undefined}
                      onClick={() => setIdx(i)}
                      aria-current={i === idx ? 'true' : undefined}
                      className={`block w-full text-left px-[var(--space-2)] py-[var(--space-1)] text-sm ${
                        i === idx
                          ? 'bg-[color:var(--clr-primary-600)] text-white'
                          : 'hover:bg-[color:var(--clr-surface)]'
                      }`}
                    >
                      {t}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
        <div className="flex flex-1 flex-col">
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
          <div className="flex flex-col gap-[var(--space-4)] p-[var(--space-4)]">
            {idx < chapters.length - 1 && percent >= 100 && (
              <Button
                onClick={() => setIdx((i) => Math.min(chapters.length - 1, i + 1))}
                className="w-full px-3 py-2"
              >
                Next Chapter
              </Button>
            )}
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
      </div>
    </div>
  );
};
