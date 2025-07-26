import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';

export interface SettingsState {
  textSize: number;
  density: Density;
  setTextSize: (size: number) => void;
  setDensity: (d: Density) => void;
  hydrate: (data: Partial<Pick<SettingsState, 'textSize' | 'density'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      textSize: 16,
      density: 'comfortable',
      setTextSize: (textSize) => set({ textSize }),
      setDensity: (density) => set({ density }),
      hydrate: (data) => set(data),
    }),
    { name: 'settings-store' },
  ),
);
