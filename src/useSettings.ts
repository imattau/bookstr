import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';

export interface SettingsState {
  textSize: number;
  density: Density;
  offlineMaxBooks: number;
  setTextSize: (size: number) => void;
  setDensity: (d: Density) => void;
  setOfflineMaxBooks: (n: number) => void;
  hydrate: (
    data: Partial<
      Pick<SettingsState, 'textSize' | 'density' | 'offlineMaxBooks'>
    >,
  ) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      textSize: 16,
      density: 'comfortable',
      offlineMaxBooks: 3,
      setTextSize: (textSize) => set({ textSize }),
      setDensity: (density) => set({ density }),
      setOfflineMaxBooks: (offlineMaxBooks) => set({ offlineMaxBooks }),
      hydrate: (data) => set(data),
    }),
    { name: 'settings-store' },
  ),
);
