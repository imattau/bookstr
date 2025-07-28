import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import type { Event as NostrEvent, EventTemplate } from 'nostr-tools';
import { finalizeEvent } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { useNostr } from '../nostr';
import { getPrivKey } from '../nostr/auth';
import { ChapterEditorModal } from '../components/ChapterEditorModal';
import { Button } from '../components/ui';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

async function signEvent(tpl: EventTemplate): Promise<NostrEvent> {
  const priv = getPrivKey();
  const nostr = (window as any).nostr;
  const event = { ...tpl, created_at: Math.floor(Date.now() / 1000) } as NostrEvent;
  if (priv) {
    return finalizeEvent(event, hexToBytes(priv));
  }
  if (nostr && typeof nostr.signEvent === 'function') {
    return nostr.signEvent(event);
  }
  throw new Error('not logged in');
}

interface Chapter {
  id: string;
  title: string;
  summary: string;
}

const ManageChaptersPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const ctx = useNostr();
  const { subscribe, pubkey } = ctx;
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Record<string, Chapter>>({});
  const [modal, setModal] = useState<{ id?: string; number: number } | null>(null);

  useEffect(() => {
    if (!bookId) return;
    const off = subscribe(
      [{ kinds: [30001], '#d': [bookId], limit: 1 }],
      (evt) => {
        const ids = evt.tags.filter((t) => t[0] === 'e').map((t) => t[1]);
        setChapterIds(ids);
      },
    );
    return off;
  }, [bookId, subscribe]);

  useEffect(() => {
    if (!chapterIds.length) return;
    const off = subscribe([{ ids: chapterIds }], (evt) => {
      setChapters((c) => ({
        ...c,
        [evt.id]: {
          id: evt.id,
          title: evt.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled',
          summary: evt.tags.find((t) => t[0] === 'summary')?.[1] ?? '',
        },
      }));
    });
    return off;
  }, [chapterIds, subscribe]);

  const publishList = async (ids: string[]) => {
    if (!bookId) return;
    const evt = await signEvent({
      kind: 30001,
      content: '',
      tags: [['d', bookId], ...ids.map((id) => ['e', id])],
    });
    await fetch(`${API_BASE}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evt),
    });
  };

  const handleDragEnd = async (res: DropResult) => {
    if (!res.destination) return;
    const items = Array.from(chapterIds);
    const [moved] = items.splice(res.source.index, 1);
    items.splice(res.destination.index, 0, moved);
    setChapterIds(items);
    await publishList(items);
  };

  const handleDelete = async (id: string) => {
    const evt = await signEvent({ kind: 5, content: '', tags: [['e', id]] });
    await fetch(`${API_BASE}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evt),
    });
    setChapterIds((arr) => arr.filter((x) => x !== id));
    setChapters((c) => {
      const copy = { ...c };
      delete copy[id];
      return copy;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setModal({ number: chapterIds.length + 1 })}>
          New Draft
        </Button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="chapters">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {chapterIds.length === 0 && (
                <p className="text-center text-text-muted">No chapters yet.</p>
              )}
              {chapterIds.map((id, index) => {
                const ch = chapters[id];
                return (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        className="flex items-start gap-2 rounded border p-2"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{ch?.title || 'Chapter'}</h3>
                          {ch?.summary && <p className="text-sm">{ch.summary}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => setModal({ id, number: index + 1 })}
                            className="px-2 py-1 text-sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(id)}
                            className="px-2 py-1 text-sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {modal && bookId && pubkey && (
        <ChapterEditorModal
          bookId={bookId}
          chapterNumber={modal.number}
          chapterId={modal.id}
          authorPubkey={pubkey}
          onClose={() => setModal(null)}
          viaApi
        />
      )}
    </div>
  );
};

export default ManageChaptersPage;
