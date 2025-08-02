import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ListFollowState {
  follows: Record<string, boolean>;
  toggle: (author: string, d: string) => void;
}

export const useListFollows = create<ListFollowState>()(
  persist(
    (set, get) => ({
      follows: {},
      toggle: (author: string, d: string) =>
        set((state) => {
          const key = `${author}:${d}`;
          const next = { ...state.follows };
          if (next[key]) {
            delete next[key];
          } else {
            next[key] = true;
          }
          return { follows: next };
        }),
    }),
    { name: 'list-follow-store' },
  ),
);
