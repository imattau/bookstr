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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-[360px] flex-col rounded-card bg-[color:var(--clr-surface)]">
        <div
          className="flex items-center justify-between px-4"
          style={{ height: 56 }}
        >
          <button onClick={onClose} aria-label="Back" className="btn-tap">
            ←
          </button>
          <h2 className="flex-1 text-center text-[18px] font-semibold">
            {title}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFontSize((f) => Math.min(24, f + 2))}
              aria-label="Font size"
              className="btn-tap"
            >
              AA
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
              aria-label="Toggle theme"
              className="btn-tap"
            >
              🌙
            </button>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto px-4"
          style={{ fontFamily: 'Georgia,serif', fontSize, lineHeight: '24px' }}
        >
          <ReaderView html={html} onPercentChange={setPercent} />
        </div>
        <div className="p-4">
          <button
            onClick={onClose}
            className="btn-tap w-full rounded bg-primary-600 py-3 text-white"
          >
            MARK FINISHED
          </button>
          <div className="relative mt-2 h-1 rounded bg-border">
            <div
              className="h-1 rounded bg-primary-600"
              style={{ width: `${percent}%` }}
            />
            <div
              className="absolute -top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-primary-600"
              style={{ left: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
