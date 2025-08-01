export interface Suggestion {
  id: string;
  label: string;
  type: 'book' | 'author' | 'tag';
}

import { SimplePool } from 'nostr-tools';
import { getSearchRelays } from './nostr';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

const HISTORY_KEY = 'search-history';

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function addHistory(q: string) {
  if (!q) return;
  const hist = getHistory().filter((h) => h !== q);
  hist.unshift(q);
  if (hist.length > 10) hist.length = 10;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  } catch {
    /* ignore */
  }
}

export function getSearchHistory(): string[] {
  return getHistory();
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

async function fetchSuggestions(q: string): Promise<Suggestion[]> {
  if (!q) return [];
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    const books = (data.books || []).map((b: any) => ({
      id: b.id,
      label: b.title,
      type: 'book' as const,
    }));
    const authors = (data.authors || []).map((a: any) => ({
      id: a.id,
      label: a.name,
      type: 'author' as const,
    }));
    const tags = (data.tags || []).map((t: any) => ({
      id: t.id ?? t.tag ?? t,
      label: t.tag ?? t.label ?? t,
      type: 'tag' as const,
    }));
    return [...books, ...authors, ...tags];
  } catch {
    return [];
  }
}

let searchRelaysPromise: Promise<string[]> | null = null;

async function fetchRelaySuggestions(q: string): Promise<Suggestion[]> {
  if (!q) return [];
  const pub = localStorage.getItem('pubKey');
  if (!pub) return [];
  try {
    if (!searchRelaysPromise) searchRelaysPromise = getSearchRelays(pub);
    const relays = await searchRelaysPromise;
    if (!relays.length) return [];
    const pool = new SimplePool();
    try {
      const events = (await pool.list(relays, [
        { search: q, limit: 20 },
      ])) as any[];
      return events.map((e) => ({
        id: e.tags?.find((t: any) => t[0] === 'd')?.[1] ?? e.id,
        label:
          e.tags?.find((t: any) => t[0] === 'title')?.[1] ??
          (e.content || '').slice(0, 80),
        type: 'book' as const,
      }));
    } finally {
      if (relays.length) pool.close(relays);
    }
  } catch {
    return [];
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pending: Array<(v: Suggestion[]) => void> = [];

export async function search(q: string): Promise<Suggestion[]> {
  return new Promise((resolve) => {
    pending.push(resolve);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const apiRes = await fetchSuggestions(q);
      const relayRes = await fetchRelaySuggestions(q);
      const map = new Map<string, Suggestion>();
      for (const s of [...apiRes, ...relayRes]) {
        map.set(`${s.type}:${s.id}`, s);
      }
      const res = Array.from(map.values());
      if (q.trim()) addHistory(q.trim());
      pending.forEach((fn) => fn(res));
      pending = [];
    }, 300);
  });
}
