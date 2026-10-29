const CACHE_NAME = 'cashbook-v2'

self.addEventListener('install', () => { self.skipWaiting() })

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // API: never cached
  if (url.pathname.startsWith('/api/')) return

  // Hashed build assets never change for a given URL: cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      })
    )
    return
  }

  // Page loads: network-first so a new deploy is picked up immediately; cached copy only when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((c) => c.put('/', res.clone()))
          return res
        })
        .catch(() => caches.match('/').then((hit) => hit || Response.error()))
    )
  }
})
