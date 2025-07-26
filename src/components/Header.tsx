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

  return (
    <header className={className} data-testid={dataTestId} role="search">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(q);
        }}
        className="flex items-center gap-2 p-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded border p-2"
          placeholder="Search"
        />
      </form>
      {suggestions && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="bg-[color:var(--clr-surface-alt)] shadow-1"
        >
          {suggestions.map((s) => (
            <li
              key={s.id}
              role="option"
              className="p-2 hover:bg-primary-300 cursor-pointer"
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
