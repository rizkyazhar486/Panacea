// The private sync link a phone exporter (Health Auto Export for Apple Watch / Apple Health) posts to. One builder
// for every page that shows it, so no page can hand out a link that points at the website instead of the backend.
//
// Fail closed: a missing or relative API origin, or a token that is not a plain URL-safe string, yields null and
// the page shows no link rather than a link that silently drops every sync.

const TOKEN = /^[A-Za-z0-9_-]{16,256}$/

export function healthWebhookUrl(apiOrigin: unknown, token: unknown): string | null {
  if (typeof apiOrigin !== 'string' || typeof token !== 'string' || !TOKEN.test(token)) return null
  let origin: URL
  try {
    origin = new URL(apiOrigin)
  } catch {
    return null
  }
  if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && (origin.hostname === 'localhost' || origin.hostname === '127.0.0.1'))) return null
  const base = `${origin.origin}${origin.pathname.replace(/\/+$/, '')}`
  return `${base}/api/health-webhook/${token}`
}
