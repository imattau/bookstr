import { get, set } from 'idb-keyval';

const PREFIX = 'ptr-';

export async function savePointer(d: string, id: string): Promise<void> {
  try {
    await set(`${PREFIX}${d}`, id);
  } catch {
    // ignore
  }
}

export async function getPointer(d: string): Promise<string | null> {
  try {
    return (await get<string>(`${PREFIX}${d}`)) ?? null;
  } catch {
    return null;
  }
}
