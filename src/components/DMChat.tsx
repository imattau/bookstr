import React, { useEffect, useState } from 'react';
import type {
  ListChildComponentProps,
  FixedSizeList as FixedSizeListType,
} from 'react-window';
let FixedSizeList: typeof FixedSizeListType;
if (typeof window === 'undefined') {
  (globalThis as any).process = { env: { NODE_ENV: 'production' } };
  FixedSizeList = require('react-window').FixedSizeList;
} else {
  FixedSizeList = require('react-window').FixedSizeList;
}
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr, sendDM, getPrivKey } from '../nostr';

interface DM {
  id: string;
  from: string;
  text: string;
}

interface DMChatProps {
  to: string;
  onClose?: () => void;
}

export const DMChat: React.FC<DMChatProps> = ({ to, onClose }) => {
  const ctx = useNostr();
  const { pubkey, subscribe } = ctx;
  const [msgs, setMsgs] = useState<DM[]>([]);
  const [text, setText] = useState('');

  const ITEM_HEIGHT = 48;
  const GAP = 8;

  const Row = ({ index, style }: ListChildComponentProps) => {
    const m = msgs[index];
    if (!m) return null;
    return (
      <div
        style={{ ...style, height: ITEM_HEIGHT, marginBottom: GAP }}
        className={`rounded border p-2 ${
          m.from === pubkey
            ? 'self-end bg-primary-100'
            : 'self-start bg-[color:var(--clr-surface-alt)]'
        }`}
      >
        {m.text}
      </div>
    );
  };

  useEffect(() => {
    if (!pubkey) return;
    const off = subscribe(
      [
        { kinds: [4], authors: [pubkey], '#p': [to], limit: 20 },
        { kinds: [4], authors: [to], '#p': [pubkey], limit: 20 },
      ],
      (evt: NostrEvent) => {
        (async () => {
          const priv = getPrivKey();
          const other = evt.pubkey === pubkey ? to : evt.pubkey;
          let plain: string;
          if (priv) {
            plain = await (
              await import('nostr-tools')
            ).nip04.decrypt(priv, other, evt.content);
          } else {
            const nostr = (window as any).nostr;
            if (!nostr?.nip04?.decrypt) return;
            plain = await nostr.nip04.decrypt(other, evt.content);
          }
          setMsgs((m) => {
            const updated = [
              ...m,
              { id: evt.id, from: evt.pubkey, text: plain },
            ];
            return updated.slice(-100);
          });
        })();
      },
    );
    return off;
  }, [subscribe, pubkey, to]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendDM(ctx, to, text);
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-full w-full flex-col bg-[color:var(--clr-surface)] sm:m-4 sm:max-w-[360px] sm:rounded-md">
        <div className="flex items-center justify-between border-b p-2">
          <h2 className="text-lg font-medium">Chat</h2>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex-1 p-2">
          {msgs.length > 0 && (
            <FixedSizeList
              height={Math.min(400, msgs.length * (ITEM_HEIGHT + GAP))}
              itemCount={msgs.length}
              itemSize={ITEM_HEIGHT + GAP}
              width="100%"
            >
              {Row}
            </FixedSizeList>
          )}
        </div>
        <div className="flex gap-2 border-t p-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded border p-2"
            placeholder="Message"
          />
          <button
            onClick={handleSend}
            className="rounded bg-primary-600 px-3 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
