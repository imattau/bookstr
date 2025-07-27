import React from 'react';

interface IllustrationProps {
  text: string;
}

export const Illustration: React.FC<IllustrationProps> = ({ text }) => (
  <div className="flex flex-col items-center gap-2 py-[var(--space-6)]" role="img" aria-label={text}>
    <span className="text-6xl">📚</span>
    <p className="text-center text-text-muted">{text}</p>
  </div>
);
