/* =========================================
   LeafDetect – Service Worker (Full Offline)
   ========================================= */

const CACHE_NAME = "leafdetect-v4";

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

// URLs that must ALWAYS be fetched live (never served from cache)
const NEVER_CACHE = [
  "jsonbin.io",          // report data API
  "dashboard.html",      // admin dashboard always needs fresh data
  "openstreetmap.org",   // map tiles
  "unpkg.com",           // leaflet CDN
];

function shouldBypassCache(url) {
  return NEVER_CACHE.some(pattern => url.includes(pattern));
}

// Fetch: network-first for live data, cache-first for app assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // Always go to network for dashboard and API calls
  if (shouldBypassCache(url)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails for dashboard, still try cache as fallback
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache-first for everything else (app shell, model files, etc.)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
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
