/**
 * Utilities for queuing Nostr edits while offline and processing them later.
 */
import { get, set } from 'idb-keyval';
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

function showMergeModal(
  localText: string,
  remoteText: string,
): Promise<string> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '1em';
    box.style.maxWidth = '600px';
    box.innerHTML = `
      <h3 style="margin:0 0 0.5em 0">Offline Edit Conflict</h3>
      <div style="display:flex;gap:4px">
        <textarea style="width:50%" readonly>${remoteText}</textarea>
        <textarea style="width:50%" readonly>${localText}</textarea>
      </div>
      <div style="margin-top:0.5em;text-align:right">
        <button data-cmd="remote">Keep Remote</button>
        <button data-cmd="local">Keep Local</button>
        <button data-cmd="merge">Merge</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    const done = (val: string) => {
      document.body.removeChild(overlay);
      resolve(val);
    };
    box.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const cmd = target.getAttribute('data-cmd');
      if (!cmd) return;
      if (cmd === 'remote') done(remoteText);
      else if (cmd === 'local') done(localText);
      else if (cmd === 'merge') {
        const ta = document.createElement('textarea');
        ta.style.width = '100%';
        ta.style.height = '200px';
        ta.value = localText;
        const wrap = document.createElement('div');
        wrap.appendChild(ta);
        const ok = document.createElement('button');
        ok.textContent = 'Publish';
        ok.onclick = () => done(ta.value);
        wrap.appendChild(ok);
        box.innerHTML = '';
        box.appendChild(wrap);
      }
    });
  });
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
      content = await showMergeModal(edit.data.content, remote.content);
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
