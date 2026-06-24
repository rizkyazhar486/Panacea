// Lightweight per-device usage tracking — counts how often each route is
// visited so the Beranda can surface the user's most-used services. Stored in
// localStorage (no server, no PII).
const KEY = 'pmd-usage-v1'

type Counts = Record<string, number>

function read(): Counts {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Counts
  } catch {
    return {}
  }
}

export function trackVisit(path: string) {
  if (!path || path === '/') return // home itself isn't a "service"
  const c = read()
  c[path] = (c[path] || 0) + 1
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    /* ignore */
  }
}

// Return paths ranked by visit count (most used first).
export function rankByUsage<T extends { to: string }>(items: T[]): T[] {
  const c = read()
  return [...items].sort((a, b) => (c[b.to] || 0) - (c[a.to] || 0))
}
