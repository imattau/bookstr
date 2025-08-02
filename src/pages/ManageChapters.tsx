/**
 * Page for managing chapters of a specific book.
 *
 * Route params:
 * - `bookId` – obtained via `useParams` to load and update chapter metadata.
 *
 * Hooks: `useNostr` for relays and publishing events, `useEffect` for data
 * loading and `useState` for local state.
 */
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
import { listChapters, publishToc } from '../nostr/events';
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
  const { pubkey } = ctx;
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Record<string, Chapter>>({});
  const [modal, setModal] = useState<{ id?: string; number: number } | null>(null);
  const [tocMeta, setTocMeta] = useState<{ title?: string; summary?: string; cover?: string; tags?: string[] }>({});

  const load = async () => {
    if (!bookId) return;
    const { toc, chapters: chEvents } = await listChapters(ctx, bookId);
    const ids = toc?.tags.filter((t) => t[0] === 'e').map((t) => t[1]) || [];
    setChapterIds(ids);
    const map: Record<string, Chapter> = {};
    chEvents.forEach((evt) => {
      map[evt.id] = {
        id: evt.id,
        title: evt.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled',
        summary: evt.tags.find((t) => t[0] === 'summary')?.[1] ?? '',
      };
    });
    setChapters(map);
    if (toc) {
      setTocMeta({
        title: toc.tags.find((t) => t[0] === 'title')?.[1],
        summary: toc.tags.find((t) => t[0] === 'summary')?.[1],
        cover: toc.tags.find((t) => t[0] === 'image')?.[1],
        tags: toc.tags.filter((t) => t[0] === 't').map((t) => t[1]),
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const publishList = async (ids: string[]) => {
    if (!bookId) return;
    const evt = await publishToc(ctx, bookId, ids, tocMeta);
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
    const ids = chapterIds.filter((x) => x !== id);
    setChapterIds(ids);
    setChapters((c) => {
      const copy = { ...c };
      delete copy[id];
      return copy;
    });
    await publishList(ids);
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
          onClose={() => {
            setModal(null);
            load();
          }}
          viaApi
          allowAnnouncement={!modal.id}
        />
      )}
    </div>
  );
};

export default ManageChaptersPage;
