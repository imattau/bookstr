import React from 'react';
import { useSettings } from '../useSettings';
import type { Theme } from '../ThemeProvider';
import { THEMES } from '../ThemeProvider';
import { Input, Button } from '../components/ui';

const UISettingsPage: React.FC = () => {
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const yearlyGoal = useSettings((s) => s.yearlyGoal);
  const setYearlyGoal = useSettings((s) => s.setYearlyGoal);
  const textSize = useSettings((s) => s.textSize);
  const setTextSize = useSettings((s) => s.setTextSize);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const setReduceMotion = useSettings((s) => s.setReduceMotion);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className="w-full rounded border p-2"
        >
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Yearly reading goal</label>
        <Input
          type="number"
          min={1}
          value={yearlyGoal}
          onChange={(e) =>
            setYearlyGoal(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium">
          Font size ({textSize}px)
        </label>
        <input
          type="range"
          min={12}
          max={24}
          value={textSize}
          onChange={(e) => setTextSize(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
          />
          Reduce motion
        </label>
      </div>
    </div>
  );
};

export default UISettingsPage;
