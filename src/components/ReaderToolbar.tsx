import React from 'react';

export interface ReaderToolbarProps {
  title: string;
  percent: number;
  onBack: () => void;
  onToggleTheme: () => void;
  onFontSize: (delta: 1 | -1) => void;
  onBookmark: () => void;
  className?: string;
  'data-testid'?: string;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  title,
  percent,
  onBack,
  onToggleTheme,
  onFontSize,
  onBookmark,
  className,
  'data-testid': dataTestId,
}) => (
  <div
    className={`flex items-center justify-between gap-2 p-2 ${className ?? ''}`}
    data-testid={dataTestId}
  >
    <button onClick={onBack} aria-label="Back" className="px-2">
      Back
    </button>
    <div className="flex-1 text-center truncate">{title}</div>
    <button
      onClick={() => onFontSize(1)}
      aria-label="Increase font"
      className="px-2"
    >
      A+
    </button>
    <button
      onClick={() => onFontSize(-1)}
      aria-label="Decrease font"
      className="px-2"
    >
      A-
    </button>
    <button onClick={onToggleTheme} aria-label="Toggle theme" className="px-2">
      Theme
    </button>
    <button onClick={onBookmark} aria-label="Bookmark" className="px-2">
      ★
    </button>
    <span className="ml-2 text-sm text-text-muted">{percent}%</span>
  </div>
);
