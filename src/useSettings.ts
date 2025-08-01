import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';

export interface SettingsState {
  textSize: number;
  density: Density;
  offlineMaxBooks: number;
  pushEnabled: boolean;
  yearlyGoal: number;
  reduceMotion: boolean;
  theme: import('./ThemeProvider').Theme;
  advancedMode: boolean;
  maxEventSize: number;
  setTextSize: (size: number) => void;
  setDensity: (d: Density) => void;
  setOfflineMaxBooks: (n: number) => void;
  setPushEnabled: (v: boolean) => void;
  setYearlyGoal: (n: number) => void;
  setReduceMotion: (v: boolean) => void;
  setTheme: (t: import('./ThemeProvider').Theme) => void;
  setAdvancedMode: (v: boolean) => void;
  setMaxEventSize: (n: number) => void;
  hydrate: (
    data: Partial<
      Pick<
        SettingsState,
        | 'textSize'
        | 'density'
        | 'offlineMaxBooks'
        | 'pushEnabled'
        | 'yearlyGoal'
        | 'reduceMotion'
        | 'theme'
        | 'advancedMode'
        | 'maxEventSize'
      >
    >,
  ) => void;
}

/**
 * Global application preferences such as font size and theme.
 *
 * This zustand store persists values to `localStorage` so settings survive
 * across sessions.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      textSize: 16,
      density: 'comfortable',
      offlineMaxBooks: 3,
      pushEnabled: false,
      yearlyGoal: 12,
      reduceMotion: false,
      theme: 'default',
      advancedMode: false,
      maxEventSize: 1000,
      setTextSize: (textSize) => set({ textSize }),
      setDensity: (density) => set({ density }),
      setOfflineMaxBooks: (offlineMaxBooks) => set({ offlineMaxBooks }),
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      setYearlyGoal: (yearlyGoal) => set({ yearlyGoal }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setTheme: (theme) => set({ theme }),
      setAdvancedMode: (advancedMode) => set({ advancedMode }),
      setMaxEventSize: (maxEventSize) => set({ maxEventSize }),
      hydrate: (data) => set(data),
    }),
    { name: 'settings-store' },
  ),
);
