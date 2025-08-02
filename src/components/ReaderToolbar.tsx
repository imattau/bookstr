import React from 'react';
import { logEvent } from '../analytics';

export interface ReaderToolbarProps {
  title: string;
  percent: number;
  onBack: () => void;
  onToggleTheme: () => void;
  onFontSize: (delta: 1 | -1) => void;
  onBookmark: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Toolbar for the reader view providing navigation controls.
 */
export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  title,
  percent,
  onBack,
  onToggleTheme,
  onFontSize,
  onBookmark,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  className,
  'data-testid': dataTestId,
}) => (
  <div
    className={`flex items-center justify-between gap-2 p-[var(--space-2)] ${className ?? ''}`}
    data-testid={dataTestId}
  >
    <button onClick={onBack} aria-label="Back" className="px-[var(--space-2)]">
      Back
    </button>
    {onPrev && (
      <button
        onClick={onPrev}
        aria-label="Previous chapter"
        className="px-[var(--space-2)]"
        disabled={!hasPrev}
      >
        Prev
      </button>
    )}
    {onNext && (
      <button
        onClick={onNext}
        aria-label="Next chapter"
        className="px-[var(--space-2)]"
        disabled={!hasNext}
      >
        Next
      </button>
    )}
    <div className="flex-1 text-center truncate">{title}</div>
    <button
      onClick={() => onFontSize(1)}
      aria-label="Increase font"
      className="px-[var(--space-2)]"
    >
      A+
    </button>
    <button
      onClick={() => onFontSize(-1)}
      aria-label="Decrease font"
      className="px-[var(--space-2)]"
    >
      A-
    </button>
    <button onClick={onToggleTheme} aria-label="Toggle theme" className="px-[var(--space-2)]">
      Theme
    </button>
    <button
      onClick={() => {
        logEvent('click_fav');
        onBookmark();
      }}
      aria-label="Bookmark"
      className="px-[var(--space-2)]"
    >
      ★
    </button>
    <span className="ml-2 text-sm text-text-muted">{percent}%</span>
  </div>
);
