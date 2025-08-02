/**
 * Utilities for queuing Nostr edits while offline and processing them later.
 */
import { get, set } from 'idb-keyval';
import React from 'react';
import type { NostrContextValue } from '../nostr';
import {
  publishBookMeta,
  publishLongPost,
  publishRepost,
  publishVote,
} from './events';

export interface OfflineEdit {
  id: string;
  type: 'meta' | 'chapter' | 'publish' | 'vote' | 'repost';
  data: any;
}

const EDITS_KEY = 'pending-edits';

async function loadEdits(): Promise<OfflineEdit[]> {
  try {
    return (await get<OfflineEdit[]>(EDITS_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function saveEdits(edits: OfflineEdit[]): Promise<void> {
  try {
    await set(EDITS_KEY, edits);
  } catch {
    /* ignore */
  }
}

function dispatchQueueEvent(count: number) {
  window.dispatchEvent(new CustomEvent('offline-queue', { detail: count }));
}

export async function queueOfflineEdit(edit: OfflineEdit): Promise<void> {
  const edits = await loadEdits();
  edits.push(edit);
  await saveEdits(edits);
  dispatchQueueEvent(edits.length);
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'queue-edit',
      edit,
    });
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('process-edits');
    } catch {
      /* ignore */
    }
  }
}

export async function removeOfflineEdit(id: string): Promise<void> {
  const edits = await loadEdits();
  const remaining = edits.filter((e) => e.id !== id);
  await saveEdits(remaining);
  dispatchQueueEvent(remaining.length);
}

export async function getOfflineEdits(): Promise<OfflineEdit[]> {
  return loadEdits();
}


export async function processOfflineEdits(
  ctx: NostrContextValue,
  edits: OfflineEdit[],
): Promise<void> {
  for (const edit of edits) {
    if (edit.type === 'publish') {
      try {
        await ctx.publish(edit.data.event, edit.data.relays, edit.data.pow);
      } catch {
        /* ignore */
      }
      await removeOfflineEdit(edit.id);
      continue;
    }
    if (edit.type === 'vote') {
      try {
        await publishVote(ctx, edit.data.target);
      } catch {
        /* ignore */
      }
      await removeOfflineEdit(edit.id);
      continue;
    }
    if (edit.type === 'repost') {
      try {
        await publishRepost(ctx, edit.data.target);
      } catch {
        /* ignore */
      }
      await removeOfflineEdit(edit.id);
      continue;
    }
    let remote: any = null;
    try {
      if (edit.type === 'meta') {
        const res = await ctx.list([
          {
            kinds: [41],
            authors: [ctx.pubkey!],
            '#d': [edit.data.bookId],
            limit: 1,
          },
        ]);
        remote = res[0];
      } else if (edit.type === 'chapter') {
        const res = await ctx.list([
          {
            kinds: [30023],
            authors: [ctx.pubkey!],
            '#book': [edit.data.bookId],
            '#chapter': [String(edit.data.chapterNumber)],
            limit: 1,
          },
        ]);
        remote = res[0];
      }
    } catch {
      /* ignore */
    }
    let content = edit.data.content;
    if (remote && remote.content !== edit.data.content) {
      const { createRoot } = await import('react-dom/client');
      const { OfflineMergeModal } = await import('../components/OfflineMergeModal');
      content = await new Promise<string>((resolve) => {
        const root = createRoot(document.createElement('div'));
        root.render(
          <OfflineMergeModal
            localText={edit.data.content}
            remoteText={remote.content}
            onResolve={(val) => {
              root.unmount();
              resolve(val);
            }}
          />,
        );
      });
    }
    if (edit.type === 'meta') {
      await publishBookMeta(ctx, edit.data.bookId, { ...edit.data, content });
    } else if (edit.type === 'chapter') {
      await publishLongPost(ctx, { ...edit.data, content });
    }
    await removeOfflineEdit(edit.id);
  }
}

export function initOfflineSync(ctx: NostrContextValue) {
  if (!navigator.serviceWorker) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'pending-edits') {
      processOfflineEdits(ctx, event.data.edits);
    }
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}
