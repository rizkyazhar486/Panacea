import type { LiveNewsItem } from './api'

export function validNews(items: unknown, now = Date.now()): LiveNewsItem[] {
  if (!Array.isArray(items)) return []
  const seen = new Set<string>()
  return items.filter((item): item is LiveNewsItem => {
    if (!item || typeof item.title !== 'string' || !item.title.trim() || typeof item.source !== 'string' || !item.source.trim() || typeof item.link !== 'string' || typeof item.pubDate !== 'string') return false
    if (item.region !== 'domestic' && item.region !== 'international') return false
    const date = Date.parse(item.pubDate)
    if (!Number.isFinite(date) || date > now || date < 0) return false
    try {
      const url = new URL(item.link)
      if (url.protocol !== 'https:' || url.username || url.password) return false
      url.hash = ''
      const key = url.href
      if (seen.has(key)) return false
      seen.add(key)
      return true
    } catch { return false }
  }).sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate)).slice(0, 24)
}
