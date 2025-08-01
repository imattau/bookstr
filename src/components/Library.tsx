import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '../nostr';
import { useReadingStore } from '../store';
import { ProgressBar } from './ProgressBar';
import { OnboardingTooltip } from './OnboardingTooltip';
import {
  useAchievements,
  ACHIEVEMENT_LABELS,
  AchievementId,
} from '../achievements';
import { FaPen, FaTrophy } from 'react-icons/fa';

/**
 * User library with tabs for want, reading, finished and following.
 */
export const Library: React.FC = () => {
  const { contacts } = useNostr();
  const books = useReadingStore((s) => s.books);
  const finishBook = useReadingStore((s) => s.finishBook);
  const yearlyGoal = useReadingStore((s) => s.yearlyGoal);
  const finishedCount = useReadingStore((s) => s.finishedCount);
  const navigate = useNavigate();
  const { unlocked } = useAchievements();
  const iconMap: Record<AchievementId, JSX.Element> = {
    'first-publish': <FaPen />,
    'five-finished': <FaTrophy />,
  };
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
    <div className="min-h-screen bg-[color:var(--clr-surface)] px-[var(--space-4)] pb-[var(--space-4)] text-[color:var(--clr-text)]">
      <header
        className="flex items-center justify-between"
        style={{ height: 56 }}
      >
        <h1 className="text-[20px] font-bold text-[color:var(--clr-primary-600)]">
          Bookstr
        </h1>
        <OnboardingTooltip
          storageKey="library-settings"
          text="Library settings"
        >
          <button
            aria-label="Settings"
            onClick={() => navigate('/settings')}
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
            className={`pb-[var(--space-1)] text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50 ${tab === t.key ? 'border-b-2 border-[color:var(--clr-primary-600)] text-[color:var(--clr-text)]' : 'text-text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-[var(--space-2)] text-right text-[12px] text-text-muted">
        {finishedCount}/{yearlyGoal} books finished this year
      </p>
      <ProgressBar
        value={Math.min(100, (finishedCount / yearlyGoal) * 100)}
        aria-label="Yearly goal progress"
        className="my-[var(--space-2)]"
      />
      {unlocked.length > 0 && (
        <div className="mt-[var(--space-2)] flex gap-2">
          {unlocked.map((id) => (
            <span
              key={id}
              title={ACHIEVEMENT_LABELS[id]}
              className="text-[color:var(--clr-primary-600)] text-xl"
            >
              {iconMap[id]}
            </span>
          ))}
        </div>
      )}
      <ul role="list" className="mt-[var(--space-4)] space-y-2">
        {books
          .filter((item) => {
            if (tab === 'following') {
              return contacts.includes(item.author);
            }
            return item.status === tab;
          })
          .map((item) => (
            <li
              key={item.id}
              role="listitem"
              className="mb-[var(--space-2)] flex items-center gap-4 rounded-card bg-border p-[var(--space-3)]"
            >
              <img
                src={item.cover}
                alt={`Cover image for ${item.title}`}
                className="h-[84px] w-[56px] rounded object-cover"
              />
              <div className="flex-1 space-y-1">
                <h3 className="text-[16px] font-semibold leading-6">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-5 text-text-muted">
                  {item.author}
                </p>
                <span className="inline-block rounded bg-[color:var(--clr-surface-alt)] px-[var(--space-2)] py-[2px] text-[12px] text-text-muted">
                  {item.genre}
                </span>
                <div className="mt-[var(--space-1)] h-1 rounded bg-border">
                  <div
                    className="h-full rounded bg-[color:var(--clr-primary-600)]"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-[12px] text-text-muted">
                <button
                  onClick={() => finishBook(item.id)}
                  className="rounded-[var(--radius-button)] bg-[color:var(--clr-surface-alt)] px-[var(--space-3)] py-[var(--space-1)] text-[14px] text-[color:var(--clr-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600/50"
                >
                  Mark Finished
                </button>
                <span>{item.percent}%</span>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};
