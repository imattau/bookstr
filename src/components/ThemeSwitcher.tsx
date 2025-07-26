import React from 'react';
import { useTheme, Theme } from '../ThemeProvider';

const themes: Theme[] = ['default', 'dark', 'earthy', 'vibrant', 'pastel'];

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="ml-2 rounded border p-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
      aria-label="Theme"
    >
      {themes.map((t) => (
        <option value={t} key={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  );
};
