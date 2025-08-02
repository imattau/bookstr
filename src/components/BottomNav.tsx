import React from 'react';
import { FaCompass, FaBookOpen, FaPen, FaBell, FaUser, FaHome } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { useNotificationStore } from '../store/notifications';

type NavKey = 'home' | 'discover' | 'library' | 'write' | 'activity' | 'profile';

export interface BottomNavProps {
  active: NavKey;
  onChange: (key: NavKey) => void;
  className?: string;
  'data-testid'?: string;
}

const items: Array<{ key: NavKey; label: string; Icon: IconType }> = [
  { key: 'home', label: 'Home', Icon: FaHome },
  { key: 'discover', label: 'Discover', Icon: FaCompass },
  { key: 'library', label: 'Library', Icon: FaBookOpen },
  { key: 'write', label: 'Write', Icon: FaPen },
  { key: 'activity', label: 'Activity', Icon: FaBell },
  { key: 'profile', label: 'Profile', Icon: FaUser },
];

/**
 * Bottom navigation bar with five primary sections.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  active,
  onChange,
  className,
  'data-testid': dataTestId,
}) => {
  const unseen = useNotificationStore((s) => s.unseen.length);
  return (
    <nav
      className={`flex justify-around border-t bg-[color:var(--clr-surface-alt)] ${className ?? ''}`}
      data-testid={dataTestId}
    >
      {items.map(({ key, label, Icon }) => (
        <button
          type="button"
          key={key}
          onClick={() => onChange(key)}
          aria-pressed={active === key}
          aria-label={label}
          className="flex flex-col items-center py-[var(--space-2)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          <span className="relative">
            <Icon className="text-xl" aria-hidden="true" />
            {key === 'activity' && unseen > 0 && (
              <span className="absolute -top-1 -right-2 rounded-full bg-red-600 px-1 text-[10px] leading-none text-white">
                {unseen}
              </span>
            )}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};
