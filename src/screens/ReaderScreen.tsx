import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '../nostr';
import { fetchLongPostParts } from '../nostr/events';
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
  const { subscribe } = ctx;
  const { theme, setTheme } = useTheme();
  const updateProgress = useReadingStore((s) => s.updateProgress);
  const finishBook = useReadingStore((s) => s.finishBook);
  const [title, setTitle] = React.useState('');
  const [html, setHtml] = React.useState('');
  const [percent, setPercent] = React.useState(0);
  const [fontSize, setFontSize] = React.useState(16);

  React.useEffect(() => {
    if (!bookId) return;
    const off = subscribe(
      [{ kinds: [30023], ids: [bookId], limit: 1 }],
      async (evt) => {
        setTitle(evt.tags.find((t) => t[0] === 'title')?.[1] ?? '');
        setHtml(await fetchLongPostParts(ctx, evt));
      },
    );
    return off;
  }, [bookId, subscribe, ctx]);

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
