import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationSettingsState {
  newBooks: boolean;
  zapReceipts: boolean;
  chatMentions: boolean;
  setNewBooks: (v: boolean) => void;
  setZapReceipts: (v: boolean) => void;
  setChatMentions: (v: boolean) => void;
  hydrate: (
    data: Partial<
      Pick<NotificationSettingsState, 'newBooks' | 'zapReceipts' | 'chatMentions'>
    >,
  ) => void;
}

export const useNotificationSettings = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      newBooks: true,
      zapReceipts: true,
      chatMentions: true,
      setNewBooks: (newBooks) => set({ newBooks }),
      setZapReceipts: (zapReceipts) => set({ zapReceipts }),
      setChatMentions: (chatMentions) => set({ chatMentions }),
      hydrate: (data) => set(data),
    }),
    { name: 'notification-settings' },
  ),
);
