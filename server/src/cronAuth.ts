import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Kunci cron dibandingkan lewat digest SHA-256 + timingSafeEqual: panjang kunci tidak
 * bocor dan tidak ada pembanding string yang bergantung pada data. Rahasia kosong atau
 * kunci kosong/bukan string selalu ditolak (fail closed).
 */
export function cronKeyMatches(supplied: unknown, secret: string | undefined): boolean {
  if (!secret || typeof supplied !== 'string' || supplied.length === 0) return false
  const digest = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(digest(supplied), digest(secret))
}

export interface CronKeySource {
  headers: Record<string, string | string[] | undefined>
  query: Record<string, unknown>
}

/**
 * Urutan sumber: `Authorization: Bearer` → `x-cron-key` → query `?key=` (lama, tetap
 * diterima agar Render Cron Job yang ada tidak putus; query tercatat di log akses).
 */
export function extractCronKey(req: CronKeySource): { key: string | undefined; via: 'bearer' | 'header' | 'query' | 'none' } {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const auth = one(req.headers.authorization)
  const bearer = auth && /^Bearer\s+(.+)$/i.exec(auth.trim())
  if (bearer) return { key: bearer[1], via: 'bearer' }
  const header = one(req.headers['x-cron-key'])
  if (header) return { key: header, via: 'header' }
  if (typeof req.query.key === 'string') return { key: req.query.key, via: 'query' }
  return { key: undefined, via: 'none' }
}

export function cronAuthorized(req: CronKeySource, secret: string | undefined): boolean {
  return cronKeyMatches(extractCronKey(req).key, secret)
}
