/* Competitor Pulse — minimal offline shell service worker */
const CACHE = 'cp-shell-v1';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Never cache API calls (Supabase) — always network.
  if (url.hostname.includes('supabase.co')) return;
  // SPA navigation: network first, fallback to cached shell.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }
  // Static assets: cache first, then network.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request)),
  );
});
