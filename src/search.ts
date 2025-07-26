export interface Suggestion {
  id: string;
  label: string;
  type: 'book' | 'author' | 'tag';
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

export async function search(q: string): Promise<Suggestion[]> {
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
