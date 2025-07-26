import React, { useEffect, useState } from 'react';
import { useNostr } from '../nostr';

interface NotesProps {
  bookId: string;
}

export const Notes: React.FC<NotesProps> = ({ bookId }) => {
  const { publish } = useNostr();
  const [notes, setNotes] = useState<string[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(`notes-${bookId}`);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch {
        setNotes([]);
      }
    }
  }, [bookId]);

  const save = (items: string[]) => {
    setNotes(items);
    localStorage.setItem(`notes-${bookId}`, JSON.stringify(items));
  };

  const handleSave = async (publishNote: boolean) => {
    if (!text.trim()) return;
    const newNotes = [...notes, text];
    save(newNotes);
    if (publishNote) {
      try {
        await publish({ kind: 30078, content: text, tags: [['e', bookId]] });
      } catch {
        // ignore publish errors
      }
    }
    setText('');
  };

  return (
    <div className="space-y-2 border-t p-2">
      <h3 className="font-semibold">Notes</h3>
      {notes.map((note, idx) => (
        <div key={idx} className="rounded border p-2">
          {note}
        </div>
      ))}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded border p-2"
        placeholder="Add a note"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handleSave(false)}
          className="rounded bg-primary-600 px-3 py-1 text-white"
        >
          Save
        </button>
        <button
          onClick={() => handleSave(true)}
          className="rounded bg-primary-600 px-3 py-1 text-white"
        >
          Publish
        </button>
      </div>
    </div>
  );
};
