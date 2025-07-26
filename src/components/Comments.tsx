import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';
import type { Event as NostrEvent } from 'nostr-tools';

interface Props {
  bookId: string;
}

export const Comments: React.FC<Props> = ({ bookId }) => {
  const { subscribe, publishComment } = useNostr();
  const [comments, setComments] = useState<NostrEvent[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const off = subscribe([{ kinds: [1], '#e': [bookId] }], (evt) =>
      setComments((c) => [...c, evt]),
    );
    return off;
  }, [subscribe, bookId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await publishComment(bookId, text);
    setText('');
  };

  return (
    <div className="space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="rounded border p-2">
          {c.content}
        </div>
      ))}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
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
