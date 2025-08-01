import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';

export interface HeaderProps {
  onSearch: (q: string) => void;
  suggestions?: Array<{
    id: string;
    label: string;
    type: 'book' | 'author' | 'tag';
  }>;
  onSelectSuggestion?: (id: string, type: string) => void;
  children?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  onLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  suggestions,
  onSelectSuggestion,
  children,
  className,
  onLogin,
  'data-testid': dataTestId,
}) => {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const nested = location.pathname.split('/').filter(Boolean).length > 1;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      const s = suggestions[active];
      onSelectSuggestion?.(s.id, s.type);
    }
  };

  React.useEffect(() => {
    if (!suggestions) return;
    setActive((a) => Math.min(Math.max(a, -1), suggestions.length - 1));
  }, [suggestions]);

  return (
    <header className={className} data-testid={dataTestId} role="search">
      {nested && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          <FaChevronLeft />
        </button>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSelectSuggestion?.(q, 'search');
        }}
        className="flex items-center gap-2 p-2"
      >
        <input
          value={q}
          onChange={(e) => {
            const val = e.target.value;
            setQ(val);
            onSearch(val);
          }}
          onKeyDown={handleKeyDown}
          aria-activedescendant={active >= 0 ? `suggestion-${active}` : undefined}
          className="flex-1 rounded border p-2"
          placeholder="Search"
        />
      </form>
      {suggestions && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="bg-[color:var(--clr-surface-alt)] shadow-1"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={active === i}
              className={`p-2 hover:bg-primary-300 cursor-pointer ${
                active === i ? 'bg-primary-300' : ''
              }`}
              onMouseDown={() => onSelectSuggestion?.(s.id, s.type)}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {children}
      {onLogin && (
        <button
          onClick={onLogin}
          className="p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          Login
        </button>
      )}
    </header>
  );
};
