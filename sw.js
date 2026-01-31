/* sw.js - 最強777 cache buster v61 */
const CACHE_NAME = "ultimate7-v61";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js"
];

// install: 先に新SWを入れて待機させない
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

// activate: 古いキャッシュを削除して即適用
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith("ultimate7-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// fetch: 基本はキャッシュ優先、index.htmlだけは更新されやすいようNetwork優先
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 同一オリジンのみ
  if (url.origin !== self.location.origin) return;

  // index.html は network-first（更新反映を早める）
  if (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        const cache = await caches.open(CACHE_NAME);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match("./index.html");
        return cached || caches.match("./") || new Response("offline", { status: 503 });
      }
    })());
    return;
  }

  // その他は cache-first
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, res.clone());
    return res;
  })());
});
