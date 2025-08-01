/**
 * Wrapper component tracking offline status and queued actions.
 * Displays alerts while rendering its children.
 */
import React, { useEffect, useState } from 'react';
import { getOfflineEdits } from './nostr/offline';
import { useToast } from './components/ToastProvider';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const toast = useToast();

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

  useEffect(() => {
    const updateStatus = () => {
      const status = navigator.onLine;
      setOnline(status);
      if (!status) toast('You are offline', { type: 'error' });
    };
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-[color:var(--clr-surface)] text-[color:var(--clr-text)]">
      {!online && (
        <div className="bg-red-600 text-white text-center text-sm p-2">You are offline</div>
      )}
      {pending > 0 && (
        <div className="bg-yellow-200 text-center text-sm p-2">
          {pending} action{pending !== 1 ? 's' : ''} pending sync
        </div>
      )}
      {children}
    </div>
  );
};
