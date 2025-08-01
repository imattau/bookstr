/**
 * Service worker script handling caching and background sync.
 */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkOnly,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { getOfflineBooks } from './offlineStore';
import { get, set } from 'idb-keyval';

declare let self: ServiceWorkerGlobalScope;

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith(`${API_BASE}/`),
  new StaleWhileRevalidate({ cacheName: 'api' }),
);

// Cache event list responses separately so they can be reused while a
// background refresh runs. This applies to both API endpoints and relay
// HTTP gateways.
registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    (url.pathname.startsWith(`${API_BASE}/event`) || /relay/i.test(url.hostname)),
  new StaleWhileRevalidate({ cacheName: 'events' }),
);

const bgSync = new BackgroundSyncPlugin('actions', {
  maxRetentionTime: 24 * 60,
});

interface OfflineEdit {
  id: string;
  type: string;
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

async function notifyClients() {
  const edits = await loadEdits();
  if (!edits.length) return;
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  for (const client of clients) {
    client.postMessage({ type: 'pending-edits', edits });
  }
}

async function precacheOfflineBooks() {
  const cache = await caches.open('offline-books');
  const books = await getOfflineBooks();
  await Promise.all(
    books.map((b) =>
      cache.put(
        `/book/${b.id}`,
        new Response(b.html, { headers: { 'Content-Type': 'text/html' } }),
      ),
    ),
  );
}

registerRoute(
  ({ url }) => url.pathname.startsWith(`${API_BASE}/action`),
  new NetworkOnly({ plugins: [bgSync] }),
  'POST',
);

self.addEventListener('install', (event) => {
  event.waitUntil(precacheOfflineBooks());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'refresh-offline') {
    event.waitUntil(precacheOfflineBooks());
  }
  if (event.data?.type === 'queue-edit') {
    event.waitUntil(
      (async () => {
        const edits = await loadEdits();
        edits.push(event.data.edit as OfflineEdit);
        await saveEdits(edits);
      })(),
    );
  }
  if (event.data?.type === 'request-edits') {
    event.waitUntil(
      loadEdits().then((ed) => {
        (event.source as Client)?.postMessage({ type: 'pending-edits', edits: ed });
      }),
    );
  }
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/book/'),
  async ({ request }) => {
    const cache = await caches.open('offline-books');
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw new Error('Network error');
    }
  },
);

registerRoute(
  ({ url }) => url.pathname === '/books',
  async ({ request }) => {
    const cache = await caches.open('offline-pages');
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw new Error('Network error');
    }
  },
);

self.addEventListener('sync', (event) => {
  if (event.tag === 'process-edits') {
    event.waitUntil(notifyClients());
  }
});

self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data?.json();
    } catch {
      return { title: 'Bookstr', body: event.data?.text() } as any;
    }
  })() as { title?: string; body?: string; url?: string };
  const title = data.title || 'Bookstr';
  const options: NotificationOptions = {
    body: data.body,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const url = (event.notification.data as any)?.url || '/';
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(url)) {
            return (client as WindowClient).focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
