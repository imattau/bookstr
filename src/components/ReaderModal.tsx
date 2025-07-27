import React from 'react';
import { ReaderView } from './ReaderView';
import { useTheme } from '../ThemeProvider';
import { useReadingStore } from '../store';
import { Notes } from './Notes';
import { queueAction } from '../actions';

interface ReaderModalProps {
  bookId: string;
  title: string;
  html: string;
  onClose: () => void;
}

export const ReaderModal: React.FC<ReaderModalProps> = ({
  bookId,
  title,
  html,
  onClose,
}) => {
  const [fontSize, setFontSize] = React.useState(16);
  const [percent, setPercent] = React.useState(0);
  const { theme, setTheme } = useTheme();
  const { updateProgress, finishBook } = useReadingStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-full w-full flex-col bg-[color:var(--clr-surface)] sm:m-[var(--space-4)] sm:max-w-[360px] sm:rounded-card">
        <div className="relative">
          <div className="h-1 w-full bg-border">
            <div
              className="h-full bg-[color:var(--clr-primary-600)]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="absolute right-2 top-0 text-[12px] text-text-muted">
            {Math.round(percent)}%
          </span>
        </div>
        <div
          className="flex items-center justify-between px-[var(--space-4)]"
          style={{ height: 48 }}
        >
          <button
            onClick={onClose}
            aria-label="Back"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            ←
          </button>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setFontSize((f) => Math.min(24, Math.max(12, f + 2)))
              }
              aria-label="Font size"
              className="text-[14px] text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
            >
              AA
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
              aria-label="Toggle theme"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
            >
              🌙
            </button>
          </div>
        </div>
          <div
          className="flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-2)] text-[color:var(--clr-text)]"
            style={{ fontFamily: 'Georgia,serif', fontSize, lineHeight: '24px' }}
          >
          <ReaderView
            bookId={bookId}
            html={html}
            onPercentChange={(p) => {
              setPercent(p);
              updateProgress(bookId, p);
              queueAction({ type: 'progress', id: bookId, percent: p });
            }}
          />
          <Notes bookId={bookId} />
        </div>
        <div className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)]">
          <button
            onClick={() => {
              finishBook(bookId);
              queueAction({ type: 'finish', id: bookId });
              onClose();
            }}
            className="rounded-[var(--radius-button)] bg-border px-[var(--space-4)] py-[var(--space-2)] text-[14px] text-[color:var(--clr-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            Mark as finished
          </button>
          <button
            aria-label="Home"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            🏠
          </button>
        </div>
      </div>
    </div>
  );
};
