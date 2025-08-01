import { create } from 'zustand';
import type { Event as NostrEvent } from 'nostr-tools';

/**
 * Central Nostr event store used throughout the app.
 *
 * - `events` holds the raw events keyed by their `id`.
 * - `paramIndex` maps `"kind:pubkey:dTag"` to an event `id` for parametric
 *   replaceable events.
 *
 * Components should retrieve methods or values via selectors to avoid
 * unnecessary rerenders, e.g.:
 *
 * ```ts
 * const addEvent = useEventStore(s => s.addEvent);
 * const event = useEventStore(s => s.events[id]);
 * ```
 */

function paramKey(evt: NostrEvent): string | null {
  const d = evt.tags.find((t) => t[0] === 'd')?.[1];
  if (d && evt.kind >= 30000 && evt.kind < 40000) {
    return `${evt.kind}:${evt.pubkey}:${d}`;
  }
  return null;
}

function shouldReplace(prev: NostrEvent, incoming: NostrEvent): boolean {
  if (incoming.created_at > prev.created_at) return true;
  if (incoming.created_at < prev.created_at) return false;
  return incoming.id > prev.id;
}

interface EventsState {
  events: Record<string, NostrEvent>;
  paramIndex: Record<string, string>;
  addEvent: (evt: NostrEvent) => void;
  addEvents: (evts: NostrEvent[]) => void;
}

/**
 * Central store of Nostr events keyed by id with helper methods to add new
 * events. `paramIndex` enables easy lookup of parametric events by the
 * `"kind:pubkey:dTag"` tuple. Access values with selectors.
 */
export const useEventStore = create<EventsState>((set, get) => ({
  events: {},
  paramIndex: {},
  addEvent: (evt) =>
    set((state) => {
      if (state.events[evt.id]) return state;
      const key = paramKey(evt);
      if (key) {
        const existingId = state.paramIndex[key];
        if (existingId) {
          const existing = state.events[existingId];
          if (existing && !shouldReplace(existing, evt)) {
            return state;
          }
          const events = { ...state.events };
          delete events[existingId];
          events[evt.id] = evt;
          return {
            events,
            paramIndex: { ...state.paramIndex, [key]: evt.id },
          };
        }
        return {
          events: { ...state.events, [evt.id]: evt },
          paramIndex: { ...state.paramIndex, [key]: evt.id },
        };
      }
      return {
        events: { ...state.events, [evt.id]: evt },
      };
    }),
  addEvents: (evts) => {
    evts.forEach((e) => get().addEvent(e));
  },
}));

export const addEvent = (evt: NostrEvent) =>
  useEventStore.getState().addEvent(evt);

export const addEvents = (evts: NostrEvent[]) =>
  useEventStore.getState().addEvents(evts);
