import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import { zap } from '../nostr/events';
import { ReactionButton } from './ReactionButton';
import { RepostButton } from './RepostButton';
import { DeleteButton } from './DeleteButton';
import { ReportButton } from './ReportButton';
import { ProgressBar } from './ProgressBar';
import { FaHeart } from 'react-icons/fa';
import type { Event as NostrEvent } from 'nostr-tools';
import { logEvent } from '../analytics';
import { OnboardingTooltip } from './OnboardingTooltip';
import { useReadingStore } from '../store';

interface BookCardProps {
  event: NostrEvent & { repostedBy?: string };
  onDelete?: (id: string) => void;
}
/**
 * Display a book event with reactions and an optional delete callback.
 */

export const BookCard: React.FC<BookCardProps> = ({ event, onDelete }) => {
  const title = event.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled';
  const summary = event.tags.find((t) => t[0] === 'summary')?.[1] ?? '';
  const cover = event.tags.find((t) => t[0] === 'image')?.[1];
  const ctx = useNostr();
  const [status, setStatus] = useState<'idle' | 'zapping' | 'done'>('idle');
  const { toggleBookmark, bookmarks, pubkey, subscribe } = ctx;
  const percent = useReadingStore(
    (s) => s.books.find((b) => b.id === event.id)?.percent ?? 0,
  );
  const [attachments, setAttachments] = useState<
    { id: string; mime: string; url: string }[]
  >([]);

  useEffect(() => {
    const off = subscribe([{ kinds: [1064], '#e': [event.id] }], (evt) => {
      const mime = evt.tags.find((t) => t[0] === 'mime')?.[1];
      const url = evt.tags.find((t) => t[0] === 'url')?.[1];
      if (!mime || !url) return;
      setAttachments((a) =>
        a.find((x) => x.id === evt.id) ? a : [...a, { id: evt.id, mime, url }],
      );
    });
    return off;
  }, [subscribe, event.id]);

  const handleZap = async () => {
    setStatus('zapping');
    try {
      await zap(ctx, event);
      logEvent('click_vote', { id: event.id });
      setStatus('done');
    } catch {
      setStatus('idle');
    }
  };

  const handleFav = async () => {
    try {
      await toggleBookmark(event.id);
      logEvent('click_fav', { id: event.id });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border p-[var(--space-2)] xl:p-[var(--space-1)]">
      {event.repostedBy && (
        <p className="mb-[var(--space-1)] text-xs text-text-muted">
          Reposted by {event.repostedBy}
        </p>
      )}
      {cover && (
        <img
          src={cover}
          alt={`Cover image for ${title}`}
          className="mb-[var(--space-2)] h-32 w-24 object-cover xl:h-28 xl:w-20"
        />
      )}
      <h3 className="font-semibold">{title}</h3>
      {summary && <p className="text-sm text-text-muted">{summary}</p>}
      <div className="mt-2">
        <ProgressBar value={percent} data-testid="book-progress" />
      </div>
      {attachments.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="block text-sm text-blue-600 underline"
        >
          Attachment ({a.mime})
        </a>
      ))}
      <div className="pt-2 flex gap-2">
        <OnboardingTooltip
          storageKey="zap-button"
          text="Send a lightning zap tip"
        >
          <button
            onClick={handleZap}
            className="rounded-[var(--radius-button)] bg-yellow-500 px-[var(--space-2)] py-[var(--space-1)] text-white"
          >
            {status === 'zapping'
              ? 'Zapping...'
              : status === 'done'
                ? 'Zapped!'
                : 'Zap'}
          </button>
        </OnboardingTooltip>
        <ReactionButton target={event.id} type="vote" />
        <RepostButton target={event.id} />
        <ReportButton target={event.id} />
        <button
          onClick={handleFav}
          aria-label="Favorite"
          className="rounded-[var(--radius-button)] border px-[var(--space-2)] py-[var(--space-1)]"
        >
          <FaHeart className="inline" />
        </button>
        {pubkey === event.pubkey && (
          <DeleteButton
            target={event.id}
            onDelete={() => onDelete?.(event.id)}
          />
        )}
      </div>
    </div>
  );
};
/**
 * Display a book event with reactions and an optional delete callback.
 */
