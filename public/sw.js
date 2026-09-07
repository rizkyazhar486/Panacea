// Conservative PWA service worker for Panaceamed.
// Navigations are network-first so every launch prefers the newest Vercel shell.
// Fingerprinted same-origin assets are cached, but HTML is NEVER cached under an
// asset URL. That prevents an SPA fallback page from poisoning a .js/.css cache
// entry after a deployment.
const CACHE = 'panaceamed-v16'
const CACHE_PREFIX = 'panaceamed-'
const SHELL = ['./', './index.html', './manifest.webmanifest', './logo-mark.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

// ── Web Push ────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Panaceamed.id', body: 'Anda punya pembaruan baru.', url: './' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './logo-mark.png',
      badge: './logo-mark.png',
      tag: data.tag || 'panaceamed',
      data: { url: data.url || './' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const raw = (event.notification.data && event.notification.data.url) || './'
  let destination
  try {
    destination = new URL(raw, self.registration.scope).href
  } catch {
    destination = self.registration.scope
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('navigate' in client) {
          return client
            .navigate(destination)
            .then((next) => (next && 'focus' in next ? next.focus() : client.focus()))
            .catch(() => client.focus())
        }
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(destination)
    }),
  )
})

function isHtmlResponse(response) {
  return (response.headers.get('content-type') || '').toLowerCase().includes('text/html')
}

function isAssetRequest(request, url) {
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker' ||
    url.pathname.includes('/assets/') ||
    /\.(?:js|mjs|css)$/i.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // backend, Cloudinary, fonts, etc.
  if (url.pathname.includes('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response.ok && isHtmlResponse(response)) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put('./index.html', copy)).catch(() => {})
          }
          return response
        })
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached && !(isAssetRequest(request, url) && isHtmlResponse(cached))) return cached

      // Remove poisoned entries left by an older service worker before retrying.
      if (cached) caches.open(CACHE).then((cache) => cache.delete(request)).catch(() => {})

      return fetch(request).then((response) => {
        // A script/style request must never receive index.html. Treat such a
        // response as a missing asset instead of caching/executing HTML as JS.
        if (isAssetRequest(request, url) && isHtmlResponse(response)) {
          return new Response('', {
            status: 404,
            statusText: 'Static asset resolved to HTML',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }

        if (response.ok && response.type === 'basic' && !isHtmlResponse(response)) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
        }
        return response
      })
    }),
  )
})
