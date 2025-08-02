import React from 'react';

export interface AuthoringLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Layout used for authoring screens with optional sidebar.
 */
export const AuthoringLayout: React.FC<AuthoringLayoutProps> = ({ sidebar, content }) => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(12rem,1fr)_3fr]">
        <aside className="hidden lg:block">{sidebar}</aside>
        <main>{content}</main>
      </div>
    </div>
  );
};
