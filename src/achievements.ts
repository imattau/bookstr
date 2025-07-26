import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AchievementId = 'first-publish' | 'five-finished';

interface AchievementState {
  unlocked: AchievementId[];
  unlock: (id: AchievementId) => void;
}

export const useAchievements = create<AchievementState>()(
  persist(
    (set) => ({
      unlocked: [],
      unlock: (id) =>
        set((state) =>
          state.unlocked.includes(id)
            ? state
            : { unlocked: [...state.unlocked, id] },
        ),
    }),
    { name: 'achievement-store' },
  ),
);

export const ACHIEVEMENT_LABELS: Record<AchievementId, string> = {
  'first-publish': 'First Book Published',
  'five-finished': '5 Books Finished',
};

export function reportBookPublished(): void {
  useAchievements.getState().unlock('first-publish');
}

export function reportFinishedCount(count: number): void {
  if (count >= 5) {
    useAchievements.getState().unlock('five-finished');
  }
}
