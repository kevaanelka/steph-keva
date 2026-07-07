// Bump this version whenever you change index.html / schedule.json structure
// so returning visitors get the fresh files instead of a stale cache.
const CACHE_NAME = "us-schedule-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./schedule.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/lock-bg.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first for schedule.json (so edits show up quickly),
// cache-first for everything else in the app shell.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith("schedule.json")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
