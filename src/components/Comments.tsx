import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import { DeleteButton } from './DeleteButton';
import { ReportButton } from './ReportButton';
import type { Event as NostrEvent } from 'nostr-tools';

const PAGE_SIZE = 5;

interface CommentsProps {
  bookId: string;
  parentEventId?: string;
  events?: NostrEvent[];
}

export const Comments: React.FC<CommentsProps> = ({
  bookId,
  parentEventId,
  events: initialEvents,
}) => {
  const { subscribe, publishComment, pubkey } = useNostr();
  const [events, setEvents] = useState<NostrEvent[]>(initialEvents ?? []);
  const [text, setText] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (initialEvents) return;
    const off = subscribe([{ kinds: [1], '#e': [bookId] }], (evt) =>
      setEvents((c) => (c.find((e) => e.id === evt.id) ? c : [...c, evt])),
    );
    return off;
  }, [subscribe, bookId, initialEvents]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;

    const parent = parentEventId
      ? events.find((e) => e.id === parentEventId)
      : undefined;
    await publishComment(bookId, content, parentEventId, parent?.pubkey);
    setText('');
  };

  const replies = events.filter((evt) => {
    const parent = evt.tags.find((t) => t[0] === 'e' && t[3] === 'reply')?.[1];
    return parentEventId ? parent === parentEventId : parent === undefined;
  });

  const visibleReplies = replies.slice(0, visibleCount);

  const CommentItem: React.FC<{ comment: NostrEvent }> = ({ comment }) => {
    const [showChildren, setShowChildren] = useState(false);
    const childCount = events.filter((evt) => {
      const parent = evt.tags.find((t) => t[0] === 'e' && t[3] === 'reply')?.[1];
      return parent === comment.id;
    }).length;

    return (
      <div className="space-y-2">
        <div className="rounded border p-2 flex items-start gap-2">
          <span className="flex-1">{comment.content}</span>
          <ReportButton target={comment.id} />
          {pubkey === comment.pubkey && (
            <DeleteButton
              target={comment.id}
              onDelete={() =>
                setEvents((evts) => evts.filter((e) => e.id !== comment.id))
              }
            />
          )}
        </div>
        {showChildren && (
          <Comments bookId={bookId} parentEventId={comment.id} events={events} />
        )}
        {!showChildren && childCount > 0 && (
          <button
            onClick={() => setShowChildren(true)}
            className="ml-4 text-sm text-primary-600"
          >
            Show replies ({childCount})
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`${parentEventId ? 'ml-4' : ''} space-y-2`}>
      {replies.length === 0 && !parentEventId && (
        <p className="text-gray-500">No comments yet – be the first to reply!</p>
      )}
      {visibleReplies.map((c) => (
        <CommentItem key={c.id} comment={c} />
      ))}
      {visibleCount < replies.length && (
        <button
          onClick={() =>
            setVisibleCount((c) => Math.min(c + PAGE_SIZE, replies.length))
          }
          className="text-sm text-primary-600"
        >
          Show more
        </button>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={200}
        className="w-full rounded border p-2"
        placeholder="Add comment"
      />
      <button
        onClick={handleSend}
        className="rounded bg-primary-600 px-2 py-1 text-white"
      >
        Reply
      </button>
    </div>
  );
};
