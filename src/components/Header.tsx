import React from 'react';

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
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  suggestions,
  onSelectSuggestion,
  children,
  className,
  'data-testid': dataTestId,
}) => {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      const s = suggestions[active];
      onSelectSuggestion?.(s.id, s.type);
    }
  };

  return (
    <header className={className} data-testid={dataTestId} role="search">
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
              role="option"
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
    </header>
  );
};
