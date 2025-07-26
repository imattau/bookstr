import React, { useEffect, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr, sendDM, getPrivKey } from '../nostr';

interface Message {
  id: string;
  from: string;
  text: string;
}

export interface DMModalProps {
  to: string;
  onClose?: () => void;
}

export const DMModal: React.FC<DMModalProps> = ({ to, onClose }) => {
  const ctx = useNostr();
  const { pubkey, subscribe } = ctx;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');

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
          setMsgs((m) => [...m, { id: evt.id, from: evt.pubkey, text: plain }]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 sm:p-4">
      <div className="flex w-full max-h-screen flex-col bg-[color:var(--clr-surface)] sm:max-w-[360px] sm:rounded-md">
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
        <div className="flex-1 space-y-2 overflow-y-auto p-2">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`rounded border p-2 ${m.from === pubkey ? 'self-end bg-primary-100' : 'self-start bg-[color:var(--clr-surface-alt)]'}`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t p-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded border p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
            placeholder="Message"
            aria-label="Message"
          />
          <button
            onClick={handleSend}
            aria-label="Send message"
            className="rounded bg-primary-600 px-3 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
