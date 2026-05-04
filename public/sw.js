// Service Worker — Azul Colchones
// v1: cache básico de shell + listener de push notifications

const CACHE_VERSION = "azul-v1"
const CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]

// Install: pre-cache de assets básicos
self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS).catch(() => null)),
  )
})

// Activate: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Fetch: network-first para HTML/API, cache-first para assets estáticos
self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // Bypass para Next.js internals + APIs (siempre network)
  if (url.pathname.startsWith("/_next/data/") || url.pathname.startsWith("/api/")) {
    return
  }

  // Estáticos: cache-first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => null)
        return res
      })),
    )
    return
  }

  // HTML: network-first con fallback a cache (offline tier 1)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => null)
          return res
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
    )
  }
})

// Push: muestra notificación
self.addEventListener("push", (event) => {
  let data = { title: "Azul Colchones", body: "Nueva notificación", url: "/" }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    if (event.data) data.body = event.data.text()
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "azul-default",
    renotify: true,
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Click en notificación: abre o enfoca la app en la URL indicada
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(targetUrl).catch(() => null)
          return client.focus()
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(targetUrl) : null
    }),
  )
})
