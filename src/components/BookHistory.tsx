import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import type { Event as NostrEvent } from 'nostr-tools';

export interface BookHistoryProps {
  bookId: string;
  onClose?: () => void;
}

export const BookHistory: React.FC<BookHistoryProps> = ({
  bookId,
  onClose,
}) => {
  const { list, publish } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const evts = await list([{ '#d': [bookId] }]);
        evts.sort((a, b) => b.created_at - a.created_at);
        setEvents(evts);
      } catch {
        setEvents([]);
      }
    })();
  }, [bookId, list]);

  const handleRevert = async (evt: NostrEvent) => {
    await publish({ kind: evt.kind, content: evt.content, tags: evt.tags });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-[var(--space-2)] sm:p-[var(--space-4)]">
      <div className="w-full max-w-md max-h-screen space-y-2 overflow-y-auto rounded bg-[color:var(--clr-surface)] p-[var(--space-4)]">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-medium">History</h2>
          {onClose && (
            <button onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <ul role="list" className="space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              role="listitem"
              className="space-y-2 rounded border p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span>{new Date(e.created_at * 1000).toLocaleString()}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenId(openId === e.id ? null : e.id)}
                    className="rounded border px-[var(--space-2)] py-[var(--space-1)] text-sm"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleRevert(e)}
                    className="rounded bg-[color:var(--clr-primary-600)] px-[var(--space-2)] py-[var(--space-1)] text-sm text-white"
                  >
                    Revert to this version
                  </button>
                </div>
              </div>
              {openId === e.id && (
                <pre className="whitespace-pre-wrap text-xs">
                  {e.content || JSON.stringify(e.tags)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
