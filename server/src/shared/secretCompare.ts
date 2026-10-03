import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Pembanding rahasia waktu-konstan. Kedua sisi di-hash SHA-256 dulu supaya panjangnya sama (timingSafeEqual
 * mensyaratkan itu) tanpa membocorkan panjang rahasia, dan tidak ada perbandingan string yang bergantung data.
 * Gagal tertutup: rahasia yang diharapkan kosong atau masukan bukan string selalu ditolak.
 */
export function safeEqualSecret(supplied: unknown, expected: string | undefined): boolean {
  if (typeof expected !== 'string' || expected === '') return false
  if (typeof supplied !== 'string' || supplied === '') return false
  const a = createHash('sha256').update(supplied, 'utf8').digest()
  const b = createHash('sha256').update(expected, 'utf8').digest()
  return timingSafeEqual(a, b)
}

/**
 * Otorisasi endpoint cron. Header `Authorization: Bearer <rahasia>` dipilih karena tidak masuk log URL dan riwayat
 * peramban; `?key=` tetap diterima agar jadwal yang sudah dikonfigurasi tidak putus. Query yang diulang
 * (`?key=a&key=b`, berbentuk daftar) ditolak.
 */
export function cronAuthorized(
  req: { query: Record<string, unknown>; headers: Record<string, string | string[] | undefined> },
  secret: string | undefined,
): boolean {
  const header = req.headers.authorization
  const bearer = typeof header === 'string' ? /^Bearer\s+(.+)$/i.exec(header.trim())?.[1] : undefined
  if (bearer !== undefined && safeEqualSecret(bearer, secret)) return true
  const key = req.query.key
  return typeof key === 'string' && safeEqualSecret(key, secret)
}
