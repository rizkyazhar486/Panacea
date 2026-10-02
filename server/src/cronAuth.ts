import { timingSafeEqual } from 'node:crypto'

// Segar-pendek: rahasia cron dibandingkan dalam waktu konstan. Perbandingan `!==` membocorkan
// panjang awalan yang cocok lewat waktu respons. Panjang berbeda ditolak lebih dulu karena
// timingSafeEqual mensyaratkan buffer sama panjang (panjang rahasia bukan rahasia).
export function cronSecretMatches(supplied: unknown, secret: string | undefined): boolean {
  if (typeof secret !== 'string' || secret.length === 0) return false
  if (typeof supplied !== 'string' || supplied.length === 0) return false
  const a = Buffer.from(supplied, 'utf8')
  const b = Buffer.from(secret, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

// Header `Authorization: Bearer <rahasia>` lebih disukai: query string tercatat di log akses
// dan riwayat proksi. `?key=` tetap diterima agar Render Cron Job yang sudah ada tidak putus.
// Array (`?key=a&key=b`) dan objek ditolak karena bukan string.
export function cronRequestAuthorized(
  req: { query: Record<string, unknown>; headers: Record<string, unknown> },
  secret: string | undefined,
): boolean {
  const header = req.headers.authorization
  if (typeof header === 'string') {
    const m = header.trim().match(/^Bearer\s+(.+)$/i)
    if (m && cronSecretMatches(m[1], secret)) return true
  }
  return cronSecretMatches(req.query.key, secret)
}
