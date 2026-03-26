/* =========================================
   LeafDetect – Service Worker (Full Offline)
   ========================================= */

const CACHE_NAME = "leafdetect-v3";

// Every file the app needs to work completely offline
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles/main.css",
  "./scripts/tf.min.js",
  "./scripts/app.js",
  "./models/cotton/model.json",
  "./models/cotton/group1-shard1of3.bin",
  "./models/cotton/group1-shard2of3.bin",
  "./models/cotton/group1-shard3of3.bin",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
];

// Install: cache all assets up front
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching all assets for offline use");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: remove any old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log("[SW] Deleting old cache:", k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached; // Serve from cache (works offline)
      }
      // Not in cache — try network and cache the response
      return fetch(event.request).then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return resp;
      });
    })
  );
});
