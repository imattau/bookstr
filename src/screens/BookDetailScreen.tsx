/**
 * Detailed view of a book showing metadata and chapter ordering.
 *
 * Route params:
 * - `bookId` – retrieved via `useParams` to load the book contents.
 *
 * Hooks: uses `useNostr` for nostr interactions, `useNavigate` for routing and
 * multiple `useEffect` hooks to fetch chapters and metadata.
 */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { SimplePool } from 'nostr-tools';
import type { Filter } from 'nostr-tools';
import { useNostr } from '../nostr';
import { fetchUserRelays } from '../nostr/relays';
import { ChapterEditorModal } from '../components/ChapterEditorModal';
import { BookMetadataEditor } from '../components/BookMetadataEditor';
import { DeleteButton } from '../components/DeleteButton';
import { BookHistory } from '../components/BookHistory';
import { Button, Modal } from '../components/ui';

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
  const { publish, pubkey, relays: ctxRelays = [] } = ctx as any;
  const poolRef = useRef(new SimplePool());
  const [extraRelays, setExtraRelays] = useState<string[]>([]);
  const relaysRef = useRef<string[]>([]);
  const subscribeWithExtras = (filters: Filter[], cb: (evt: any) => void) => {
    const offMain = ctx.subscribe ? ctx.subscribe(filters, cb) : () => {};
    let subExtra: any = null;
    if (extraRelays.length) {
      subExtra = poolRef.current.subscribeMany(extraRelays, filters, {
        onevent: cb,
      });
    }
    return () => {
      offMain?.();
      if (subExtra) (subExtra as any).close();
    };
  };

  const listWithExtras = async (filters: Filter[]) => {
    const main = ctx.list ? await ctx.list(filters) : [];
    if (!extraRelays.length) return main;
    const extra = (await (poolRef.current as any).list(
      extraRelays,
      filters,
    )) as any[];
    return [...main, ...extra];
  };
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
    relaysRef.current = extraRelays;
  }, [extraRelays]);

  useEffect(() => {
    return () => {
      poolRef.current.close(relaysRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authorPubkey) {
      setExtraRelays([]);
      return;
    }
    let stopped = false;
    fetchUserRelays(authorPubkey).then((r) => {
      if (!stopped) setExtraRelays(r);
    });
    return () => {
      stopped = true;
    };
  }, [authorPubkey]);

  useEffect(() => {
    if (!bookId) return undefined;
    const off = subscribeWithExtras(
      [{ kinds: [30023], ids: [bookId], limit: 1 }],
      (evt) => {
        setAuthorPubkey(evt.pubkey);
      },
    );
    return off;
  }, [bookId, ctxRelays, extraRelays]);

  useEffect(() => {
    if (!bookId || !authorPubkey) return undefined;
    const off = subscribeWithExtras(
      [{ kinds: [41], authors: [authorPubkey], '#d': [bookId], limit: 1 }],
      (evt) => {
        setMeta({
          title: evt.tags.find((t: string[]) => t[0] === 'title')?.[1] ?? 'Untitled',
          summary: evt.tags.find((t: string[]) => t[0] === 'summary')?.[1] ?? '',
          cover: evt.tags.find((t: string[]) => t[0] === 'image')?.[1],
          tags: evt.tags
            .filter((t: string[]) => t[0] === 't')
            .map((t: string[]) => t[1]),
        });
      },
    );
    return off;
  }, [bookId, authorPubkey, ctxRelays, extraRelays]);

  useEffect(() => {
    if (!bookId || !authorPubkey) return undefined;
    const off = subscribeWithExtras(
      [{ kinds: [30001], authors: [authorPubkey], '#d': [bookId], limit: 1 }],
      (evt) => {
        const ids = evt.tags
          .filter((t: string[]) => t[0] === 'e')
          .map((t: string[]) => t[1]);
        setChapterIds(ids);
        setListId(evt.id);
      },
    );
    return off;
  }, [bookId, authorPubkey, ctxRelays, extraRelays]);

  useEffect(() => {
    if (!chapterIds.length) return undefined;
    const off = subscribeWithExtras([{ ids: chapterIds }], async (evt) => {
      const d = evt.tags.find((t: string[]) => t[0] === 'd')?.[1];
      let content = evt.content;
      if (d) {
        const parts = (await listWithExtras([
          { kinds: [evt.kind], '#d': [d], authors: [evt.pubkey] },
        ])) as any[];
        const sorted = parts.sort((a, b) => {
          const pa = parseInt(
            a.tags.find((t: string[]) => t[0] === 'part')?.[1] ?? '1',
            10,
          );
          const pb = parseInt(
            b.tags.find((t: string[]) => t[0] === 'part')?.[1] ?? '1',
            10,
          );
          return pa - pb;
        });
        content = sorted.map((p) => p.content).join('');
      }
      setChapters((c) => ({
        ...c,
        [evt.id]: {
          id: evt.id,
          title: evt.tags.find((t: string[]) => t[0] === 'title')?.[1] ?? 'Untitled',
          summary: evt.tags.find((t: string[]) => t[0] === 'summary')?.[1] ?? '',
          content,
        },
      }));
    });
    return off;
  }, [chapterIds, ctxRelays, extraRelays]);

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
    <div className="p-[var(--space-4)] space-y-[var(--space-4)]">
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
              <Button
                onClick={() => navigate(`/read/${bookId}`)}
                className="mt-[var(--space-2)] px-3 py-1"
              >
                Read Book
              </Button>
            </div>
          )}
        </div>
      )}
      {canEdit && (
        <div className="flex justify-end gap-2">
          <Button onClick={() => setEditMeta(true)} className="px-3 py-1">
            Edit Book
          </Button>
          <Button
            variant="primary"
            onClick={() => setModalData({ number: chapterIds.length + 1 })}
            className="px-3 py-1"
          >
            Add Chapter
          </Button>
          <Button onClick={() => setShowHistory(true)} className="px-3 py-1">
            Versions
          </Button>
          <Button onClick={handleDeleteBook} className="px-3 py-1 text-red-600">
            Delete Book
          </Button>
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
                          canEdit && setModalData({ id, number: index + 1 })
                        }
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {ch?.title || 'Chapter'}
                          </h3>
                          {ch?.summary && (
                            <p className="text-sm">{ch.summary}</p>
                          )}
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
