import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => (
  <div className="min-h-screen bg-[color:var(--clr-surface)] text-[color:var(--clr-text)]">
    {children}
  </div>
);
