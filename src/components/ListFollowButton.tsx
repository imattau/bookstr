import React from 'react';
import { useListFollows } from '../store/listFollows';

export interface ListFollowButtonProps {
  author: string;
  d: string;
  className?: string;
}

export const ListFollowButton: React.FC<ListFollowButtonProps> = ({
  author,
  d,
  className,
}) => {
  const follows = useListFollows((s) => s.follows);
  const toggle = useListFollows((s) => s.toggle);
  const following = !!follows[`${author}:${d}`];

  const handleClick = () => {
    toggle(author, d);
  };

  return (
    <button
      onClick={handleClick}
      className={
        className ??
        'rounded-[var(--radius-button)] bg-[color:var(--clr-primary-600)] px-[var(--space-2)] py-[var(--space-1)] text-white'
      }
    >
      {following ? 'Unfollow' : 'Follow'}
    </button>
  );
};
