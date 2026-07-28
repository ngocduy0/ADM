/* DuyT Booking PWA service worker.
 * Admin pages and APIs are intentionally never cached because they contain private data.
 * Web Push notifications are handled here so iPhone can notify while the PWA is closed.
 */
const CACHE_NAME = 'duyt-admin-static-v3';
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

function readPushPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    return { body: event.data.text() };
  }
}

function safeAdminUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || '/admin/notifications'), self.location.origin);
    if (url.origin !== self.location.origin || !url.pathname.startsWith('/admin')) {
      return new URL('/admin/notifications', self.location.origin).href;
    }
    return url.href;
  } catch {
    return new URL('/admin/notifications', self.location.origin).href;
  }
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

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  const title = String(payload.title || 'DuyT Booking');
  const body = String(payload.body || 'Bạn có thông báo mới.');
  const url = safeAdminUrl(payload.url);

  event.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body,
      icon: payload.icon || '/icons/pwa-192.png',
      badge: payload.badge || '/icons/pwa-192.png',
      tag: payload.tag || `duyt-${Date.now()}`,
      renotify: true,
      silent: false,
      data: {
        url,
        kind: payload.kind || 'system',
        tableColor: payload.tableColor || '',
      },
    });

    if (typeof self.registration.setAppBadge === 'function') {
      await self.registration.setAppBadge(1).catch(() => undefined);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = safeAdminUrl(event.notification.data && event.notification.data.url);

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        if ('navigate' in client) await client.navigate(targetUrl).catch(() => undefined);
        await client.focus();
        if (typeof self.registration.setAppBadge === 'function') {
          await self.registration.clearAppBadge().catch(() => undefined);
        }
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
    if (typeof self.registration.setAppBadge === 'function') {
      await self.registration.clearAppBadge().catch(() => undefined);
    }
  })());
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
