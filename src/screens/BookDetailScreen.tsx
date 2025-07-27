import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useNostr } from '../nostr';
import { ChapterEditorModal } from '../components/ChapterEditorModal';
import { BookMetadataEditor } from '../components/BookMetadataEditor';

interface ChapterEvent {
  id: string;
  title: string;
  summary: string;
}

export const BookDetailScreen: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { subscribe, publish, pubkey } = useNostr();
  const [authorPubkey, setAuthorPubkey] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    title: string;
    summary: string;
    cover?: string;
    tags: string[];
  } | null>(null);
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Record<string, ChapterEvent>>({});
  const [modalData, setModalData] = useState<{
    id?: string;
    number: number;
  } | null>(null);
  const [editMeta, setEditMeta] = useState(false);
  const canEdit = pubkey && authorPubkey && pubkey === authorPubkey;

  useEffect(() => {
    if (!bookId) return undefined;
    const off = subscribe(
      [{ kinds: [30023], ids: [bookId], limit: 1 }],
      (evt) => {
        setAuthorPubkey(evt.pubkey);
      },
    );
    return off;
  }, [subscribe, bookId]);

  useEffect(() => {
    if (!bookId || !authorPubkey) return undefined;
    const off = subscribe(
      [{ kinds: [41], authors: [authorPubkey], '#d': [bookId], limit: 1 }],
      (evt) => {
        setMeta({
          title: evt.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled',
          summary: evt.tags.find((t) => t[0] === 'summary')?.[1] ?? '',
          cover: evt.tags.find((t) => t[0] === 'image')?.[1],
          tags: evt.tags.filter((t) => t[0] === 't').map((t) => t[1]),
        });
      },
    );
    return off;
  }, [subscribe, bookId, authorPubkey]);

  useEffect(() => {
    if (!bookId || !authorPubkey) return undefined;
    const off = subscribe(
      [{ kinds: [30001], authors: [authorPubkey], '#d': [bookId], limit: 1 }],
      (evt) => {
        const ids = evt.tags.filter((t) => t[0] === 'e').map((t) => t[1]);
        setChapterIds(ids);
      },
    );
    return off;
  }, [subscribe, bookId, authorPubkey]);

  useEffect(() => {
    if (!chapterIds.length) return undefined;
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
  }, [subscribe, chapterIds]);

  const handleDragEnd = async (res: DropResult) => {
    if (pubkey !== authorPubkey) return;
    if (!res.destination) return;
    const items = Array.from(chapterIds);
    const [moved] = items.splice(res.source.index, 1);
    items.splice(res.destination.index, 0, moved);
    setChapterIds(items);
    const tags = [['d', bookId!], ...items.map((id) => ['e', id])];
    await publish({ kind: 30001, content: '', tags });
  };

  return (
    <div className="p-4 space-y-4">
      {meta && (
        <div className="space-y-2">
          {meta.cover && (
            <img
              src={meta.cover}
              alt={`Cover image for ${meta.title}`}
              className="h-32 w-auto"
            />
          )}
          <h2 className="text-xl font-semibold">{meta.title}</h2>
          {meta.summary && <p>{meta.summary}</p>}
        </div>
      )}
      {canEdit && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setEditMeta(true)}
            className="rounded border px-3 py-1"
          >
            Edit Book
          </button>
          <button
            onClick={() =>
              setModalData({ number: chapterIds.length + 1 })
            }
            className="rounded bg-primary-600 px-3 py-1 text-white"
          >
            Add Chapter
          </button>
        </div>
      )}
      <DragDropContext onDragEnd={canEdit ? handleDragEnd : () => {}}>
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
                  <Draggable
                    key={id}
                    draggableId={id}
                    index={index}
                    isDragDisabled={!canEdit}
                  >
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        className={`rounded border p-2${canEdit ? ' cursor-pointer' : ''}`}
                        onClick={() =>
                          canEdit &&
                          setModalData({ id, number: index + 1 })
                        }
                      >
                        <h3 className="font-semibold">
                          {ch?.title || 'Chapter'}
                        </h3>
                        {ch?.summary && <p className="text-sm">{ch.summary}</p>}
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
      {modalData && bookId && (
        <ChapterEditorModal
          bookId={bookId}
          chapterNumber={modalData.number}
          chapterId={modalData.id}
          authorPubkey={authorPubkey ?? ''}
          onClose={() => setModalData(null)}
        />
      )}
      {editMeta && meta && bookId && (
        <BookMetadataEditor
          bookId={bookId}
          authorPubkey={authorPubkey ?? ''}
          meta={meta}
          onClose={() => setEditMeta(false)}
        />
      )}
    </div>
  );
};
