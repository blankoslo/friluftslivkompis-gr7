/* Friluftskompis offline service worker (T1). */

const TILE_CACHE = "kartverket-tiles-v1";
const DATA_CACHE = "friluft-data-v1";
const APP_CACHE = "friluft-app-v1";
const KARTVERKET_HOST = "cache.kartverket.no";

const APP_PRECACHE = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      try {
        await cache.addAll(APP_PRECACHE);
      } catch (e) {
        console.warn("[sw] app precache failed", e);
      }
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const allowed = new Set([TILE_CACHE, DATA_CACHE, APP_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !allowed.has(k)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.host === KARTVERKET_HOST) {
    event.respondWith(cacheFirst(req, TILE_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    if (
      url.pathname === "/api/cabins" ||
      url.pathname.startsWith("/api/cabins/") ||
      url.pathname.startsWith("/api/ut-trips/") ||
      url.pathname.startsWith("/api/trips/")
    ) {
      event.respondWith(networkFirst(req, DATA_CACHE));
      return;
    }

    if (
      url.pathname.startsWith("/_next/static/") ||
      url.pathname === "/sw.js"
    ) {
      event.respondWith(cacheFirst(req, APP_CACHE));
      return;
    }

    if (req.mode === "navigate") {
      event.respondWith(navigationHandler(req));
      return;
    }
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw e;
  }
}

async function navigationHandler(req) {
  const cache = await caches.open(APP_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    const dataCache = await caches.open(DATA_CACHE);
    const dataHit = await dataCache.match(req, { ignoreSearch: true });
    if (dataHit) return dataHit;
    const fallback = await cache.match("/");
    if (fallback) return fallback;
    return new Response("Offline – ingen lagret versjon.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
