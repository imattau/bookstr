import { get, set, del } from 'idb-keyval';
import { useSettings } from './useSettings';

export interface OfflineBook {
  id: string;
  html: string;
}

const INDEX_KEY = 'offline-index';
const LAST_SYNC_KEY = 'offline-last-sync';
const MODE_KEY = 'offline-enabled';
const BG_SYNC_KEY = 'bg-sync-enabled';

function getMaxBooks(): number {
  try {
    return useSettings.getState().offlineMaxBooks;
  } catch {
    return 3;
  }
}

export async function saveOfflineBook(id: string, html: string): Promise<void> {
  try {
    await set(`offline-${id}`, html);
    const index = ((await get<string[]>(INDEX_KEY)) ?? []).filter(
      (x) => x !== id,
    );
    index.unshift(id);
    const max = getMaxBooks();
    const removed = index.slice(max);
    if (removed.length) {
      await Promise.all(removed.map((r) => del(`offline-${r}`)));
    }
    await set(INDEX_KEY, index.slice(0, max));
    await set(LAST_SYNC_KEY, Date.now());
  } catch {
    // ignore errors
  }
}

export async function getOfflineBooks(): Promise<OfflineBook[]> {
  try {
    const index = (await get<string[]>(INDEX_KEY)) ?? [];
    const items: OfflineBook[] = [];
    for (const id of index) {
      const html = await get<string>(`offline-${id}`);
      if (html) items.push({ id, html });
    }
    return items;
  } catch {
    return [];
  }
}

export async function removeOfflineBook(id: string): Promise<void> {
  try {
    await del(`offline-${id}`);
    const index = ((await get<string[]>(INDEX_KEY)) ?? []).filter(
      (x) => x !== id,
    );
    await set(INDEX_KEY, index);
    await set(LAST_SYNC_KEY, Date.now());
  } catch {
    // ignore errors
  }
}

export async function clearOfflineBooks(): Promise<void> {
  try {
    const index = (await get<string[]>(INDEX_KEY)) ?? [];
    await Promise.all(index.map((id) => del(`offline-${id}`)));
    await del(INDEX_KEY);
    await set(LAST_SYNC_KEY, Date.now());
  } catch {
    // ignore errors
  }
}

export async function pruneOfflineBooks(max: number): Promise<void> {
  try {
    const index = (await get<string[]>(INDEX_KEY)) ?? [];
    const removed = index.slice(max);
    if (removed.length) {
      await Promise.all(removed.map((id) => del(`offline-${id}`)));
    }
    await set(INDEX_KEY, index.slice(0, max));
    await set(LAST_SYNC_KEY, Date.now());
  } catch {
    // ignore errors
  }
}

export async function getCacheSize(): Promise<number> {
  try {
    const index = (await get<string[]>(INDEX_KEY)) ?? [];
    let total = 0;
    for (const id of index) {
      const html = await get<string>(`offline-${id}`);
      if (html) total += new Blob([html]).size;
    }
    return total;
  } catch {
    return 0;
  }
}

export async function getLastSynced(): Promise<number | null> {
  try {
    const ts = await get<number>(LAST_SYNC_KEY);
    return ts ?? null;
  } catch {
    return null;
  }
}

export async function setOfflineMode(enabled: boolean): Promise<void> {
  try {
    await set(MODE_KEY, enabled);
  } catch {
    /* ignore */
  }
}

export async function isOfflineMode(): Promise<boolean> {
  try {
    const val = await get<boolean>(MODE_KEY);
    return val !== false;
  } catch {
    return true;
  }
}

export async function setBackgroundSync(enabled: boolean): Promise<void> {
  try {
    await set(BG_SYNC_KEY, enabled);
  } catch {
    /* ignore */
  }
}

export async function isBackgroundSync(): Promise<boolean> {
  try {
    const val = await get<boolean>(BG_SYNC_KEY);
    return val !== false;
  } catch {
    return true;
  }
}
