import React from 'react';
import { FollowButton } from './FollowButton';

export interface AuthorCardProps {
  pubkey: string;
  name?: string;
}

/**
 * Simple author card showing a name/pubkey with follow button.
 */
export const AuthorCard: React.FC<AuthorCardProps> = ({ pubkey, name }) => {
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      <div className="flex-1">
        <p className="font-medium">{name || pubkey}</p>
      </div>
      <FollowButton pubkey={pubkey} />
    </div>
  );
};
