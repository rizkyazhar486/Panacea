// Lightweight per-device usage tracking — counts how often each route is
// visited so the Beranda can surface the user's most-used services. Stored in
// localStorage (no server, no PII).
const KEY = 'pmd-usage-v1'

export type UsageCounts = Record<string, number>

function read(): UsageCounts {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as UsageCounts
  } catch {
    return {}
  }
}

/**
 * Read-only snapshot for privacy-safe local product features such as the Human
 * Passport. This never uploads route history; callers receive only the counts
 * already stored on this device.
 */
export function getUsageCounts(): UsageCounts {
  return { ...read() }
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
