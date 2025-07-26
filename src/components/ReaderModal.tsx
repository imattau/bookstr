import React from 'react';
import { ReaderView } from './ReaderView';
import { useTheme } from '../ThemeProvider';

interface ReaderModalProps {
  title: string;
  html: string;
  onClose: () => void;
}

export const ReaderModal: React.FC<ReaderModalProps> = ({
  title,
  html,
  onClose,
}) => {
  const [fontSize, setFontSize] = React.useState(16);
  const [percent, setPercent] = React.useState(0);
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-full w-full flex-col bg-[#FFFFFF] dark:bg-[#161A20] sm:m-4 sm:max-w-[360px] sm:rounded-[8px]">
        <div className="relative">
          <div className="h-1 w-full bg-[#E6E6EC] dark:bg-[#262B33]">
            <div
              className="h-full bg-[#5A3999]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="absolute right-2 top-0 text-[12px] text-text-muted">
            {Math.round(percent)}%
          </span>
        </div>
        <div
          className="flex items-center justify-between px-4"
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
          className="flex-1 overflow-y-auto px-4 py-2 text-[#111214] dark:text-[#F3F4F6]"
          style={{ fontFamily: 'Georgia,serif', fontSize, lineHeight: '24px' }}
        >
          <ReaderView html={html} onPercentChange={setPercent} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-[6px] bg-[#E6E6EC] px-4 py-2 text-[14px] text-[#111214] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50 dark:bg-[#262B33] dark:text-[#F3F4F6]"
          >
            Mark as finished
          </button>
          <button
            aria-label="Home"
            className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#E6E6EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50 dark:bg-[#262B33]"
          >
            🏠
          </button>
        </div>
      </div>
    </div>
  );
};
