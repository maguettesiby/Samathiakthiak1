/* Simple Service Worker (offline-light) for SamaThiakThiak */

const CACHE_NAME = 'samathiakthiak-v1';

// Keep this list minimal (low data)
const PRECACHE_URLS = [
  '/',
  '/index.css',
  '/manifest.webmanifest',
  '/images/samathiakthiak-logo.svg',
  '/images/site.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Do not cache API calls
  if (url.pathname.startsWith('/api')) return;

  // Cache-first for our static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // Cache same-origin successful responses
          if (res && res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // Fallback to home for navigations when offline
          if (req.mode === 'navigate') {
            return caches.match('/');
          }
          return cached;
        });
    })
  );
});
