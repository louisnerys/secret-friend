const CACHE_NAME = "secret-friend-cache-v1";
const urlsToCache = ["/", "/login", "/dashboard", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  // Cache-first para requisições de página e estáticos, Network-first para API
  if (
    event.request.url.includes("/rest/v1/") ||
    event.request.url.includes("/functions/v1/")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)),
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Retorna o cache se encontrar, senão vai para a rede
        return response || fetch(event.request);
      }),
    );
  }
});
