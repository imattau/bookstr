import React, { useEffect, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import { useNostr, sendGroupDM } from '../nostr';

interface Message {
  id: string;
  from: string;
  text: string;
}

export interface GroupChatModalProps {
  members: string[];
  onClose?: () => void;
}

function hasAllRecipients(tags: string[][], members: string[]) {
  const ps = tags.filter((t) => t[0] === 'p').map((t) => t[1]);
  return members.every((m) => ps.includes(m));
}

export const GroupChatModal: React.FC<GroupChatModalProps> = ({
  members,
  onClose,
}) => {
  const ctx = useNostr();
  const { pubkey, subscribe } = ctx;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!pubkey) return;
    const others = members.filter((m) => m !== pubkey);
    const off = subscribe(
      [
        { kinds: [4], authors: [pubkey], '#p': others, limit: 20 },
        { kinds: [4], authors: others, '#p': [pubkey], limit: 20 },
      ],
      (evt: NostrEvent) => {
        (async () => {
          const priv = localStorage.getItem('privKey');
          if (!priv) return;
          const all = [...others, pubkey];
          if (!hasAllRecipients(evt.tags as string[][], all)) return;
          let plain: string | null = null;
          if (evt.pubkey === pubkey) {
            for (const p of others) {
              try {
                plain = await (
                  await import('nostr-tools')
                ).nip04.decrypt(priv, p, evt.content);
                break;
              } catch {
                /* ignore */
              }
            }
          } else {
            try {
              plain = await (
                await import('nostr-tools')
              ).nip04.decrypt(priv, evt.pubkey, evt.content);
            } catch {
              /* ignore */
            }
          }
          if (plain) {
            setMsgs((m) => [
              ...m,
              { id: evt.id, from: evt.pubkey, text: plain! },
            ]);
          }
        })();
      },
    );
    return off;
  }, [subscribe, pubkey, members]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendGroupDM(ctx, members, text);
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-full w-full flex-col bg-[color:var(--clr-surface)] sm:m-4 sm:max-w-[360px] sm:rounded-md">
        <div className="flex items-center justify-between border-b p-2">
          <h2 className="text-lg font-medium">Group Chat</h2>
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
