import React, { useEffect, useState } from 'react';
import { getOfflineEdits } from './nostr/offline';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    getOfflineEdits().then((edits) => setPending(edits.length));
    const handler = (e: Event) => {
      const count = (e as CustomEvent<number>).detail as number;
      setPending(count);
    };
    window.addEventListener('offline-queue', handler);
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'request-edits' });
    }
    return () => window.removeEventListener('offline-queue', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--clr-surface)] text-[color:var(--clr-text)]">
      {pending > 0 && (
        <div className="bg-yellow-200 text-center text-sm p-2">
          {pending} action{pending !== 1 ? 's' : ''} pending sync
        </div>
      )}
      {children}
    </div>
  );
};
