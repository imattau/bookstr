import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr } from '../nostr';
import { DeleteButton } from '../components/DeleteButton';

interface BookItem {
  id: string;
  status: string;
  title: string;
  cover?: string;
}

const LibraryPage: React.FC = () => {
  const { pubkey, subscribe, list, publish } = useNostr();
  const navigate = useNavigate();
  const [items, setItems] = useState<BookItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!pubkey) return;
    const off = subscribe(
      [{ kinds: [30001], authors: [pubkey], '#d': ['library'], limit: 1 }],
      (evt) => {
        const ids = evt.tags
          .filter((t) => t[0] === 'e')
          .map((t) => ({ id: t[1], status: t[2] || 'want' }));
        setItems(ids.map((i) => ({ ...i, title: i.id })));
      },
    );
    return off;
  }, [subscribe, pubkey]);

  useEffect(() => {
    if (!pubkey || items.length === 0) return;
    const ids = items.map((b) => b.id);
    list([{ kinds: [41], authors: [pubkey], '#d': ids }]).then((evts) => {
      setItems((bks) =>
        bks.map((b) => {
          const evt = (evts as NostrEvent[]).find((e) =>
            e.tags.find((t) => t[0] === 'd')?.[1] === b.id,
          );
          if (!evt) return b;
          const title = evt.tags.find((t) => t[0] === 'title')?.[1] || 'Untitled';
          const cover = evt.tags.find((t) => t[0] === 'image')?.[1];
          return { ...b, title, cover };
        }),
      );
    });
  }, [items.length, list, pubkey]);

  const persist = (books: BookItem[]) => {
    publish({
      kind: 30001,
      content: '',
      tags: [['d', 'library'], ...books.map((b) => ['e', b.id, b.status])],
    });
  };

  const handleDragEnd = (res: DropResult) => {
    if (!res.destination) return;
    const arr = Array.from(items);
    const [moved] = arr.splice(res.source.index, 1);
    arr.splice(res.destination.index, 0, moved);
    setItems(arr);
    persist(arr);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const archiveIds = async (ids: string[]) => {
    const arr = items.map((b) =>
      ids.includes(b.id) ? { ...b, status: 'archived' } : b,
    );
    setItems(arr);
    persist(arr);
  };

  const deleteIds = async (ids: string[]) => {
    for (const id of ids) {
      try {
        await publish({ kind: 5, content: '', tags: [['e', id]] });
      } catch {
        /* ignore */
      }
    }
  };

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => archiveIds(selectedIds)}
            className="rounded border px-2 py-1"
          >
            Archive
          </button>
          <button
            onClick={() => deleteIds(selectedIds)}
            className="rounded border px-2 py-1"
          >
            Delete
          </button>
        </div>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="library">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {items.map((b, index) => (
                <Draggable key={b.id} draggableId={b.id} index={index}>
                  {(p) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                      className="flex items-center gap-2 rounded border p-2"
                    >
                      <input
                        type="checkbox"
                        checked={!!selected[b.id]}
                        onChange={() => toggleSelect(b.id)}
                      />
                      {b.cover && (
                        <img
                          src={b.cover}
                          alt="Cover"
                          className="h-12 w-8 object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{b.title}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/book/${b.id}`)}
                          className="rounded border px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/book/${b.id}`)}
                          className="rounded border px-2 py-1"
                        >
                          Manage Chapters
                        </button>
                        <button
                          onClick={() => archiveIds([b.id])}
                          className="rounded border px-2 py-1"
                        >
                          Archive
                        </button>
                        <DeleteButton
                          target={b.id}
                          onDelete={() =>
                            setItems((arr) => arr.filter((x) => x.id !== b.id))
                          }
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default LibraryPage;
