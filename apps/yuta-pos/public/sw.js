const CACHE_VERSION = 'yuta-pos-static-v1';
const PRECACHE_URLS = [
  '/site.webmanifest',
  '/favicon.ico',
  '/images/logo.svg',
  '/images/apple-touch-icon.png',
  '/images/web-app-manifest-192x192.png',
  '/images/web-app-manifest-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              key.startsWith('yuta-pos-static-') && key !== CACHE_VERSION,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isPrecachedAsset =
    url.origin === self.location.origin && PRECACHE_URLS.includes(url.pathname);
  const isNextStaticAsset =
    url.origin === self.location.origin && url.pathname.startsWith('/_next/static/');

  if (!isPrecachedAsset && !isNextStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse.ok) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        void caches
          .open(CACHE_VERSION)
          .then((cache) => cache.put(request, responseToCache));

        return networkResponse;
      });
    }),
  );
});
