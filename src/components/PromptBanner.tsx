import React from 'react';
import { useNostr } from '../nostr';

interface PromptBannerProps {
  onLogin: () => void;
  onChat: () => void;
}

/**
 * Persistent banner with login and chat controls for larger screens.
 */
export const PromptBanner: React.FC<PromptBannerProps> = ({ onLogin, onChat }) => {
  const { pubkey } = useNostr();
  return (
    <div className="hidden md:flex sticky top-0 z-40 w-full justify-center gap-[var(--space-3)] bg-[color:var(--clr-surface-alt)] border-b p-[var(--space-2)]">
      {!pubkey && (
        <button onClick={onLogin} className="text-sm underline">
          Sign in
        </button>
      )}
      <button onClick={onChat} className="text-sm underline">
        Chat
      </button>
    </div>
  );
};

