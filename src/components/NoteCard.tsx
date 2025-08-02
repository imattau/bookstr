import React, { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { nip19, type Event as NostrEvent, type Filter } from 'nostr-tools';
import { useNostr } from '../nostr';
import { sanitizeHtml } from '../sanitizeHtml';
import { ReactionButton } from './ReactionButton';
import { RepostButton } from './RepostButton';
import { DeleteButton } from './DeleteButton';
import { ReportButton } from './ReportButton';
import { BookCard } from './BookCard';

interface NoteCardProps {
  event: NostrEvent & { repostedBy?: string };
  onDelete?: (id: string) => void;
}

// simple cache for fetched events
const eventCache = new Map<string, NostrEvent>();

const ChapterSnippet: React.FC<{ event: NostrEvent }> = ({ event }) => {
  const title = event.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled';
  const summary = event.tags.find((t) => t[0] === 'summary')?.[1] ?? '';
  return (
    <div className="rounded-[var(--radius-card)] border p-[var(--space-2)]">
      <h4 className="font-semibold text-sm">{title}</h4>
      {summary && (
        <p className="text-sm text-text-muted">{summary}</p>
      )}
    </div>
  );
};

/**
 * Display a note event with basic interactions and embedded nostr links.
 */
export const NoteCard: React.FC<NoteCardProps> = ({ event, onDelete }) => {
  const { list, pubkey } = useNostr();

  if (event.kind === 30023) {
    return <BookCard event={event} onDelete={onDelete} />;
  }

  const html = useMemo(
    () => sanitizeHtml(marked.parse(event.content)),
    [event.content],
  );

  const refs = useMemo(() => {
    const matches = Array.from(
      event.content.matchAll(/nostr:([a-z0-9]+)/gi),
    );
    const unique = new Set(matches.map((m) => m[1]));
    return Array.from(unique);
  }, [event.content]);

  const [embedded, setEmbedded] = useState<NostrEvent[]>([]);

  useEffect(() => {
    refs.forEach((ref) => {
      const cached = eventCache.get(ref);
      if (cached) {
        setEmbedded((prev) =>
          prev.find((e) => e.id === cached.id) ? prev : [...prev, cached],
        );
        return;
      }
      (async () => {
        try {
          const decoded = nip19.decode(ref);
          let filter: Filter | undefined;
          if (decoded.type === 'nevent' || decoded.type === 'note') {
            const id =
              typeof decoded.data === 'string'
                ? decoded.data
                : decoded.data.id;
            filter = { ids: [id] };
          } else if (decoded.type === 'naddr') {
            const data: any = decoded.data;
            filter = {
              kinds: [data.kind],
              '#d': [data.identifier],
              authors: [data.pubkey],
            };
          }
          if (!filter) return;
          const [evt] = await list([filter]);
          if (evt) {
            eventCache.set(ref, evt);
            setEmbedded((prev) =>
              prev.find((e) => e.id === evt.id) ? prev : [...prev, evt],
            );
          }
        } catch {
          // ignore invalid references
        }
      })();
    });
  }, [refs, list]);

  return (
    <div className="rounded-[var(--radius-card)] border p-[var(--space-2)]">
      {event.repostedBy && (
        <p className="mb-[var(--space-1)] text-xs text-text-muted">
          Reposted by {event.repostedBy}
        </p>
      )}
      <div
        className="prose max-w-none whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {embedded.map((ev) => (
        <div key={ev.id} className="mt-[var(--space-2)]">
          {ev.kind === 30023 ? (
            <BookCard event={ev} />
          ) : (
            <ChapterSnippet event={ev} />
          )}
        </div>
      ))}
      <div className="pt-2 flex gap-2">
        <ReactionButton target={event.id} type="vote" />
        <RepostButton target={event.id} />
        <ReportButton target={event.id} />
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
