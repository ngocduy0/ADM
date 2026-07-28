/* DuyT Booking PWA service worker.
 * Admin pages and APIs are intentionally never cached because they contain private data.
 */
const CACHE_NAME = 'duyt-admin-static-v2';
const STATIC_ASSETS = [
  '/offline',
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
  '/icons/pwa-maskable-512.png',
  '/duyt-logo.png',
  '/duyt-avatar.jpg',
];

function offlineResponse() {
  return caches.match('/offline').then((response) => (
    response
    || new Response('Không có kết nối mạng.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  ));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache private admin pages or APIs.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request).catch(offlineResponse));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(offlineResponse));
    return;
  }

  const cacheable = url.pathname.startsWith('/_next/static/')
    || url.pathname.startsWith('/icons/')
    || url.pathname === '/duyt-logo.png'
    || url.pathname === '/duyt-avatar.jpg'
    || url.pathname === '/manifest.webmanifest';

  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      });
    }),
  );
});
