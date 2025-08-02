import React from 'react';

interface TagSidebarProps {
  tags: string[];
  selectedTag: string;
  onSelect: (tag: string) => void;
}

export const TagSidebar: React.FC<TagSidebarProps> = ({
  tags,
  selectedTag,
  onSelect,
}) => (
  <aside className="hidden md:block md:w-48 p-[var(--space-4)]">
    <ul className="flex flex-col gap-[var(--space-2)]">
      {tags.map((t) => (
        <li key={t}>
          <button
            onClick={() => onSelect(t)}
            aria-pressed={selectedTag === t}
            aria-label={t}
            className={`btn-tap w-full text-left rounded-[var(--radius-button)] px-[var(--space-2)] py-[var(--space-1)] text-[14px] ${
              selectedTag === t
                ? 'bg-[color:var(--clr-primary-600)] text-white'
                : 'border border-border text-[color:var(--clr-primary-600)] bg-[color:var(--clr-surface)]'
            }`}
          >
            {t}
          </button>
        </li>
      ))}
    </ul>
  </aside>
);

export default TagSidebar;
