/**
 * Worker that backs up the user's history.
 *
 * The worker fetches events from configured Nostr relays and stores them in
 * IndexedDB using `idb-keyval`. It tracks the latest backed up event with a
 * pointer so subsequent runs only fetch new history. The backup runs on a
 * schedule using `setTimeout`, polling every minute while the worker is
 * running.
 */
import { SimplePool } from 'nostr-tools';
import { set } from 'idb-keyval';
import { getPointer, savePointer } from '../lib/cache';

const pool = new SimplePool();
let relays: string[] = [];
let running = false;

async function backup() {
  if (!running) return;
  try {
    const ptr = await getPointer('history');
    let since = 0;
    if (ptr) {
      const [evt] = (await pool.list(relays, [{ ids: [ptr] }])) as any[];
      if (evt) since = evt.created_at;
    }
    const events = (await pool.list(relays, [{ since }])) as any[];
    if (events.length) {
      for (const e of events) {
        await set(`hist-${e.id}`, e);
      }
      await savePointer('history', events[events.length - 1].id);
    }
  } catch {
    /* ignore */
  }
  setTimeout(backup, 60000);
}

self.onmessage = (ev) => {
  if (ev.data?.type === 'start') {
    relays = ev.data.relays;
    running = true;
    backup();
  }
};

export default null as any;
