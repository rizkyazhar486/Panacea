(() => {
  'use strict'

  const ALIASES = new Map([
    ['/notifications', '/notifikasi'],
  ])

  function normalizeCommandRoute() {
    const raw = location.hash.replace(/^#/, '') || '/'
    const [path, query = ''] = raw.split('?')
    const target = ALIASES.get(path)
    if (!target) return
    const next = `#${target}${query ? `?${query}` : ''}`
    if (location.hash !== next) location.replace(next)
  }

  window.addEventListener('hashchange', normalizeCommandRoute)
  normalizeCommandRoute()
})()
