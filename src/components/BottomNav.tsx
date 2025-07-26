import React from 'react';
import { FaCompass, FaBookOpen, FaPen, FaBell, FaUser } from 'react-icons/fa';
import type { IconType } from 'react-icons';

type NavKey = 'discover' | 'library' | 'write' | 'activity' | 'profile';

export interface BottomNavProps {
  active: NavKey;
  onChange: (key: NavKey) => void;
  className?: string;
  'data-testid'?: string;
}

const items: Array<{ key: NavKey; label: string; Icon: IconType }> = [
  { key: 'discover', label: 'Discover', Icon: FaCompass },
  { key: 'library', label: 'Library', Icon: FaBookOpen },
  { key: 'write', label: 'Write', Icon: FaPen },
  { key: 'activity', label: 'Activity', Icon: FaBell },
  { key: 'profile', label: 'Profile', Icon: FaUser },
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
    {items.map(({ key, label, Icon }) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        aria-pressed={active === key}
        className="flex flex-col items-center py-2 text-sm"
      >
        <Icon className="text-xl" aria-hidden="true" />
        <span>{label}</span>
      </button>
    ))}
  </nav>
);
