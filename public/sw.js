// Panaceamed stability-first service worker.
// Release: ios-webkit-stability-v18
//
// Important: this worker intentionally does NOT intercept fetch requests.
// iOS WebKit can keep an older installed service worker alive across deploys;
// combining that with SPA/chunk changes can create stale-response loops and,
// under memory pressure, terminate the WebContent process with Safari's
// "A problem repeatedly occurred" screen. Network requests therefore pass
// directly to the browser/CDN. Push + notification routing remain supported.
const CACHE_PREFIX = 'panaceamed-'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

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
