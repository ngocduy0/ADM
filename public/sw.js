/* DuyT Booking PWA service worker.
 * Admin pages and APIs are intentionally never cached because they contain private data.
 * Web Push notifications are handled here so iPhone can notify while the PWA is closed.
 */
const CACHE_NAME = 'duyt-admin-static-v6';
const STATIC_ASSETS = [
  '/offline',
  '/manifest.webmanifest',
  '/icons/pwa-192.png?v=black-2',
  '/icons/pwa-512.png?v=black-2',
  '/icons/pwa-maskable-512.png?v=black-2',
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
    const raw = event.data.json() || {};
    const notification = raw.notification && typeof raw.notification === 'object'
      ? raw.notification
      : {};
    const data = notification.data && typeof notification.data === 'object'
      ? notification.data
      : {};

    // Supports both legacy payloads and the Declarative Web Push shape used as
    // a lock-screen fallback on newer iOS/iPadOS versions.
    return {
      title: notification.title || raw.title,
      body: notification.body || raw.body,
      url: data.url || notification.navigate || raw.url,
      tag: notification.tag || raw.tag,
      icon: notification.icon || raw.icon,
      badge: notification.badge || raw.badge,
      kind: data.kind || raw.kind,
      tableColor: data.tableColor || raw.tableColor,
    };
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
      icon: payload.icon || '/icons/pwa-192.png?v=black-2',
      badge: payload.badge || '/icons/pwa-192.png?v=black-2',
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

  // Never cache private admin pages or APIs. Navigation stays network-first and
  // falls back to the offline page. Static files rely on the browser/Next cache;
  // avoiding runtime response cloning also prevents mobile Chromium's
  // "Response body is already used" service-worker error.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request).catch(offlineResponse));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(offlineResponse));
  }
});
