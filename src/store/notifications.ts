import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
  unseen: string[];
  add: (id: string) => void;
  markAllSeen: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      unseen: [],
      add: (id: string) =>
        set((state) =>
          state.unseen.includes(id)
            ? state
            : { unseen: [...state.unseen, id] },
        ),
      markAllSeen: () => set({ unseen: [] }),
    }),
    { name: 'notification-store' },
  ),
);
