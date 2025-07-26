import React from 'react';
import { useNostr } from '../nostr';
import { useReadingStore } from '../store';
import { ProgressBar } from './ProgressBar';
import { OnboardingTooltip } from './OnboardingTooltip';

export const Library: React.FC = () => {
  const { contacts } = useNostr();
  const { books, finishBook, yearlyGoal, finishedCount } = useReadingStore();
  const [tab, setTab] = React.useState<
    'want' | 'reading' | 'finished' | 'following'
  >('reading');
  const tabs: Array<{ key: typeof tab; label: string }> = [
    { key: 'want', label: 'Want to Read' },
    { key: 'reading', label: 'Reading' },
    { key: 'finished', label: 'Finished' },
    { key: 'following', label: 'Following' },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--clr-surface)] px-4 pb-4 text-[color:var(--clr-text)]">
      <header
        className="flex items-center justify-between"
        style={{ height: 56 }}
      >
        <h1 className="text-[20px] font-bold text-primary-600">Bookstr</h1>
        <OnboardingTooltip
          storageKey="library-settings"
          text="Library settings"
        >
          <button
            aria-label="Settings"
            className="text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50"
          >
            ⚙
          </button>
        </OnboardingTooltip>
      </header>
      <div className="flex items-end gap-6" style={{ height: 48 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-1 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50 ${tab === t.key ? 'border-b-2 border-primary-600 text-[color:var(--clr-text)]' : 'text-text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-right text-[12px] text-text-muted">
        {finishedCount}/{yearlyGoal} books finished this year
      </p>
      <ProgressBar
        value={Math.min(100, (finishedCount / yearlyGoal) * 100)}
        aria-label="Yearly goal progress"
        className="my-2"
      />
      <div className="mt-4 space-y-2">
        {books
          .filter((item) => {
            if (tab === 'following') {
              return contacts.includes(item.author);
            }
            return item.status === tab;
          })
          .map((item) => (
            <div
              key={item.id}
              className="mb-2 flex items-center gap-4 rounded-[8px] bg-border p-3"
            >
              <img
                src={item.cover}
                alt={`Cover image for ${item.title}`}
                className="h-[84px] w-[56px] rounded-[4px] object-cover"
              />
              <div className="flex-1 space-y-1">
                <h3 className="text-[16px] font-semibold leading-[24px]">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[20px] text-text-muted">
                  {item.author}
                </p>
                <span className="inline-block rounded-[4px] bg-[color:var(--clr-surface-alt)] px-2 py-0.5 text-[12px] text-text-muted">
                  {item.genre}
                </span>
                <div className="mt-1 h-1 rounded bg-border">
                  <div
                    className="h-full rounded bg-primary-600"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-[12px] text-text-muted">
                <button
                  onClick={() => finishBook(item.id)}
                  className="rounded-[6px] bg-[color:var(--clr-surface-alt)] px-3 py-1 text-[14px] text-[color:var(--clr-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50"
                >
                  Mark Finished
                </button>
                <span>{item.percent}%</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
