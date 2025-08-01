/**
 * Simple IndexedDB helpers for caching rendered book HTML.
 */
import { get, set } from 'idb-keyval';

export async function cacheBookHtml(bookId: string, html: string): Promise<void> {
  try {
    await set(`html-${bookId}`, html);
  } catch {
    // ignore cache errors
  }
}

export async function getCachedBookHtml(bookId: string): Promise<string | undefined> {
  try {
    return await get<string>(`html-${bookId}`);
  } catch {
    return undefined;
  }
}

