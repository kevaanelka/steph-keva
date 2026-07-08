// Bump this version whenever you change index.html structure so returning
// visitors get the fresh files instead of a stale cache.
const CACHE_NAME = "us-schedule-v4";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./firebase-config.js",
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

// Network-first for the app shell (HTML/manifest/config) so you always get the
// latest version when online — the cache is only a fallback for offline use.
// Cache-first only for heavy, rarely-changing static assets (icons/photo).
// Live schedule data itself lives in Firestore, which has its own offline cache.
const NETWORK_FIRST_SUFFIXES = ["index.html", "manifest.json", "firebase-config.js", "/"];

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (Firebase SDK, Firestore, fonts) pass through untouched

  const isNetworkFirst = NETWORK_FIRST_SUFFIXES.some((s) => url.pathname === s || url.pathname.endsWith(s));

  if (isNetworkFirst) {
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
