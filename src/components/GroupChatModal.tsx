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
import { hexToBytes } from '@noble/hashes/utils';
import { useNostr, sendGroupDM, getPrivKey } from '../nostr';
import { OnboardingTooltip } from './OnboardingTooltip';

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
      [{ kinds: [1059], authors: members, '#p': [pubkey], limit: 20 }],
      (evt: NostrEvent) => {
        (async () => {
          const priv = getPrivKey();
          if (!priv) return;
          const inner = await (
            await import('nostr-tools')
          ).nip17.unwrapEvent(evt, hexToBytes(priv));
          if (!hasAllRecipients(inner.tags as string[][], members)) return;
          setMsgs((m) => {
            const updated = [
              ...m,
              { id: evt.id, from: evt.pubkey, text: inner.content },
            ];
            return updated.slice(-100);
          });
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
          <OnboardingTooltip storageKey="group-send" text="Send to group">
            <button
              onClick={handleSend}
              className="rounded bg-primary-600 px-3 py-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
            >
              Send
            </button>
          </OnboardingTooltip>
        </div>
      </div>
    </div>
  );
};
