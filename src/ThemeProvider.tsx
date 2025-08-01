import React from 'react';
import { useSettings } from './useSettings';

export type Theme = 'default' | 'dark' | 'earthy' | 'vibrant' | 'pastel';

export const THEMES: Theme[] = [
  'default',
  'dark',
  'earthy',
  'vibrant',
  'pastel',
];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme | ((t: Theme) => Theme)) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const textSize = useSettings((s) => s.textSize);
  const reduceMotion = useSettings((s) => s.reduceMotion);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  React.useEffect(() => {
    document.documentElement.style.fontSize = `${textSize}px`;
  }, [textSize]);

  React.useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduce-motion',
      reduceMotion ? 'true' : 'false',
    );
  }, [reduceMotion]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Access the current theme and updater from `ThemeProvider`.
 */
export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
