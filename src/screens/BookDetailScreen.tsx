import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useNostr, fetchLongPostParts } from '../nostr';
import { ChapterEditorModal } from '../components/ChapterEditorModal';
import { BookMetadataEditor } from '../components/BookMetadataEditor';
import { DeleteButton } from '../components/DeleteButton';
import { BookHistory } from '../components/BookHistory';

interface ChapterEvent {
  id: string;
  title: string;
  summary: string;
  content: string;
}

export const BookDetailScreen: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const ctx = useNostr();
  const { subscribe, publish, list, pubkey } = ctx;
  const [authorPubkey, setAuthorPubkey] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    title: string;
    summary: string;
    cover?: string;
    tags: string[];
  } | null>(null);
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, ChapterEvent>>({});
  const [modalData, setModalData] = useState<{
    id?: string;
    number: number;
  } | null>(null);
  const [editMeta, setEditMeta] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
        setListId(evt.id);
      },
    );
    return off;
  }, [subscribe, bookId, authorPubkey]);

  useEffect(() => {
    if (!chapterIds.length) return undefined;
    const off = subscribe([{ ids: chapterIds }], async (evt) => {
      const content = await fetchLongPostParts(ctx, evt);
      setChapters((c) => ({
        ...c,
        [evt.id]: {
          id: evt.id,
          title: evt.tags.find((t) => t[0] === 'title')?.[1] ?? 'Untitled',
          summary: evt.tags.find((t) => t[0] === 'summary')?.[1] ?? '',
          content,
        },
      }));
    });
    return off;
  }, [subscribe, chapterIds, ctx]);

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

  const handleDeleteBook = async () => {
    if (!listId) return;
    try {
      await publish({
        kind: 5,
        content: '',
        tags: [['e', listId], ...chapterIds.map((id) => ['e', id])],
      });
      setChapterIds([]);
      setChapters({});
    } catch {
      /* ignore */
    }
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
          {bookId && (
            <div>
              <button
                onClick={() => navigate(`/read/${bookId}`)}
                className="mt-2 rounded border px-3 py-1"
              >
                Read Book
              </button>
            </div>
          )}
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
          <button
            onClick={() => setShowHistory(true)}
            className="rounded border px-3 py-1"
          >
            Versions
          </button>
          <button
            onClick={handleDeleteBook}
            className="rounded border px-3 py-1 text-red-600"
          >
            Delete Book
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
                        className={`rounded border p-2 flex items-start gap-2${canEdit ? ' cursor-pointer' : ''}`}
                        onClick={() =>
                          canEdit &&
                          setModalData({ id, number: index + 1 })
                        }
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {ch?.title || 'Chapter'}
                          </h3>
                          {ch?.summary && <p className="text-sm">{ch.summary}</p>}
                        </div>
                        {canEdit && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DeleteButton
                              target={id}
                              onDelete={() => {
                                setChapterIds((c) => c.filter((x) => x !== id));
                                setChapters((c) => {
                                  const copy = { ...c };
                                  delete copy[id];
                                  return copy;
                                });
                              }}
                            />
                          </div>
                        )}
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
      {showHistory && bookId && (
        <BookHistory bookId={bookId} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
};
