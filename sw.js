// Service worker: simple versioned cache-first strategy.
// Bump CACHE_VERSION whenever you ship new files so clients pick them up.
const CACHE_VERSION = 'v4';
const CACHE_NAME = `kids-games-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './games/pacman/',
  './games/pacman/index.html',
  './games/pacman/pacman.css',
  './games/pacman/pacman.js',
  './games/pacman/maze.js',
  './games/pacman/entities.js',
  './games/pacman/input.js',
  './games/pacman/storage.js',
  './games/piano-tiles/',
  './games/piano-tiles/index.html',
  './games/piano-tiles/piano-tiles.css',
  './games/piano-tiles/piano-tiles.js',
  './games/jet/',
  './games/jet/index.html',
  './games/jet/jet.css',
  './games/jet/jet.js',
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
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data === 'GET_VERSION') {
    event.source && event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Only cache successful, same-origin responses.
          if (
            res &&
            res.status === 200 &&
            res.type === 'basic' &&
            new URL(req.url).origin === self.location.origin
          ) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
