const CACHE_NAME = "shopease-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/cart",
  "/search",
  "/account",
  "/deals",
  "/offline",
];

// URLs that should never be cached
const EXCLUDED_PATHS = ["/api/", "/admin/", "/_next/"];

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

function shouldCache(url: URL): boolean {
  return !EXCLUDED_PATHS.some((path) => url.pathname.startsWith(path));
}

self.addEventListener("fetch", (event: any) => {
  const url = new URL(event.request.url);

  // Skip non-http(s) requests
  if (url.protocol === "chrome-extension:" || url.protocol === "about:") return;

  // API requests: network-only with no caching
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: network-first, fall back to cache, then offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && shouldCache(url)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/offline"))
    );
    return;
  }

  // Static assets and images: cache-first with network fallback
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok && shouldCache(url)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Other requests: network-first
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok && shouldCache(url)) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => new Response("Offline", { status: 503 }))
  );
});

self.addEventListener("push", (event: any) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "ShopEase", {
      body: data.body || "New update available",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.url || "/",
      actions: data.actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  event.waitUntil(
    self.clients.openWindow(event.notification.data || "/")
  );
});

self.addEventListener("message", (event: any) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
