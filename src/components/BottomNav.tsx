import React from 'react';

type NavKey = 'discover' | 'library' | 'write' | 'activity' | 'profile';

export interface BottomNavProps {
  active: NavKey;
  onChange: (key: NavKey) => void;
  className?: string;
  'data-testid'?: string;
}

const items: Array<{ key: NavKey; label: string }> = [
  { key: 'discover', label: 'Discover' },
  { key: 'library', label: 'Library' },
  { key: 'write', label: 'Write' },
  { key: 'activity', label: 'Activity' },
  { key: 'profile', label: 'Profile' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  active,
  onChange,
  className,
  'data-testid': dataTestId,
}) => (
  <nav
    className={`flex justify-around border-t bg-[color:var(--clr-surface-alt)] ${className ?? ''}`}
    data-testid={dataTestId}
  >
    {items.map((item) => (
      <button
        key={item.key}
        onClick={() => onChange(item.key)}
        aria-pressed={active === item.key}
        className="flex flex-col items-center py-2 text-sm"
      >
        {item.label}
      </button>
    ))}
  </nav>
);
