/* Offline support: network-first for pages (so updates arrive), cache-first for
   hashed assets, icons and fonts. Published gift blobs are never cached — a
   re-published gift must not come back stale. Bump the version to invalidate. */
const CACHE = 'dates-v1'
const SHELL = '/dates/'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(SHELL, copy))
          return res
        })
        .catch(() => caches.match(SHELL)),
    )
    return
  }

  const cacheable =
    (url.origin === self.location.origin &&
      (url.pathname.startsWith('/dates/assets/') ||
        url.pathname.startsWith('/dates/fonts/') ||
        url.pathname.startsWith('/dates/icon') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.webmanifest'))) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'

  if (cacheable) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          }),
      ),
    )
  }
})
