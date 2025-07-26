import { get, set, del } from 'idb-keyval';

export interface OfflineBook {
  id: string;
  html: string;
}

const INDEX_KEY = 'offline-index';
const MAX_BOOKS = 3;

export async function saveOfflineBook(id: string, html: string): Promise<void> {
  try {
    await set(`offline-${id}`, html);
    const index = ((await get<string[]>(INDEX_KEY)) ?? []).filter(
      (x) => x !== id,
    );
    index.unshift(id);
    const removed = index.slice(MAX_BOOKS);
    if (removed.length) {
      await Promise.all(removed.map((r) => del(`offline-${r}`)));
    }
    await set(INDEX_KEY, index.slice(0, MAX_BOOKS));
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
