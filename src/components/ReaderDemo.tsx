import React from 'react';
import { ReaderToolbar } from './ReaderToolbar';
import { ReaderView } from './ReaderView';
import { ProgressBar } from './ProgressBar';
import { useTheme } from '../ThemeProvider';

const sampleHtml = `<h1>Chapter 1</h1><p>${'Lorem ipsum dolor sit amet, '.repeat(100)}</p>`;

export const ReaderDemo: React.FC = () => {
  const [percent, setPercent] = React.useState(0);
  const [fontSize, setFontSize] = React.useState(16);
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      <ReaderToolbar
        title="Sample Book"
        percent={Math.round(percent)}
        onBack={() => {}}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'default' : 'dark')}
        onFontSize={(d) =>
          setFontSize((f) => Math.min(24, Math.max(12, f + d * 2)))
        }
        onBookmark={() => {}}
      />
      <ProgressBar value={percent} aria-label="Reading progress" />
      <ReaderView
        bookId="sample"
        html={sampleHtml}
        onPercentChange={setPercent}
        style={{ fontSize }}
        className="flex-1"
      />
    </div>
  );
};
