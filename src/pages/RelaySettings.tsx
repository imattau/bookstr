import React, { useEffect, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useNostr } from '../nostr';
import { isValidWsUrl } from '../validators';

const DEFAULT_RELAYS = ((import.meta as any).env?.VITE_RELAY_URLS as string | undefined)
  ? ((import.meta as any).env.VITE_RELAY_URLS as string)
      .split(',')
      .map((r: string) => r.trim())
      .filter(Boolean)
  : ['wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nostr.wine'];

type Status = 'connecting' | 'connected' | 'error';

function useRelayStatus(url: string): Status {
  const [status, setStatus] = useState<Status>('connecting');
  useEffect(() => {
    let ws: WebSocket | null = null;
    let opened = false;
    try {
      ws = new WebSocket(url);
      ws.onopen = () => {
        opened = true;
        setStatus('connected');
        ws?.close();
      };
      ws.onerror = () => {
        setStatus('error');
      };
      ws.onclose = () => {
        if (!opened) setStatus('error');
      };
    } catch {
      setStatus('error');
    }
    return () => {
      if (ws && ws.readyState < 2) ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return status;
}

interface RelayRowProps {
  url: string;
  index: number;
  onRemove: (url: string) => void;
}

const RelayRow: React.FC<RelayRowProps> = ({ url, index, onRemove }) => {
  const status = useRelayStatus(url);
  return (
    <Draggable draggableId={url} index={index}>
      {(p) => (
        <li
          ref={p.innerRef}
          {...p.draggableProps}
          {...p.dragHandleProps}
          className="flex items-center gap-2 rounded border p-2"
        >
          <span
            className={
              'h-2 w-2 rounded-full ' +
              (status === 'connected'
                ? 'bg-green-600'
                : status === 'error'
                ? 'bg-red-600'
                : 'bg-gray-400')
            }
          />
          <span className="flex-1 break-all">{url}</span>
          <button
            onClick={() => onRemove(url)}
            className="rounded bg-red-600 px-2 py-1 text-white"
          >
            Remove
          </button>
        </li>
      )}
    </Draggable>
  );
};

export const RelaySettingsPage: React.FC = () => {
  const { pubkey, saveRelays } = useNostr();
  const [relays, setRelays] = useState<string[]>(() => {
    const stored = localStorage.getItem('relay-list');
    if (stored) {
      try {
        return JSON.parse(stored) as string[];
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_RELAYS;
  });
  const [input, setInput] = useState('');
  const [init, setInit] = useState(true);

  useEffect(() => {
    if (init) {
      setInit(false);
      return;
    }
    localStorage.setItem('relay-list', JSON.stringify(relays));
    if (pubkey) saveRelays(relays);
  }, [relays, pubkey, saveRelays, init]);

  const persist = (list: string[]) => {
    setRelays(list);
  };

  const handleAdd = () => {
    const url = input.trim();
    if (!url) return;
    if (!isValidWsUrl(url)) {
      alert('Invalid relay URL');
      return;
    }
    if (relays.includes(url)) {
      setInput('');
      return;
    }
    persist([...relays, url]);
    setInput('');
  };

  const handleRemove = (url: string) => {
    persist(relays.filter((r) => r !== url));
  };

  const handleDragEnd = (res: DropResult) => {
    if (!res.destination) return;
    const arr = Array.from(relays);
    const [moved] = arr.splice(res.source.index, 1);
    arr.splice(res.destination.index, 0, moved);
    persist(arr);
  };

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="relays">
          {(provided) => (
            <ul
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-1"
            >
              {relays.map((r, index) => (
                <RelayRow key={r} url={r} index={index} onRemove={handleRemove} />
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded border p-2"
          placeholder="wss://relay.example"
        />
        <button
          onClick={handleAdd}
          className="rounded bg-primary-600 px-3 py-1 text-white"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default RelaySettingsPage;
