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

declare let self: ServiceWorkerGlobalScope;

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
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({ cacheName: 'api' }),
);

const bgSync = new BackgroundSyncPlugin('actions', {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/action'),
  new NetworkOnly({ plugins: [bgSync] }),
  'POST',
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open('offline-books');
      const books = await getOfflineBooks();
      await Promise.all(
        books.map((b) =>
          cache.put(
            `/book/${b.id}`,
            new Response(b.html, {
              headers: { 'Content-Type': 'text/html' },
            }),
          ),
        ),
      );
    })(),
  );
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
