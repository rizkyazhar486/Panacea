// Observabilitas permintaan HTTP: ID korelasi, durasi, kelas status, log terstruktur.
//
// Yang DICATAT hanya metode, templat rute (bukan URL mentah), status, durasi dan ID.
// Tidak pernah: badan permintaan, query string, header, token di jalur, identitas pengguna.
// Log per permintaan hanya untuk 5xx dan permintaan lambat supaya log tetap bermakna.
import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'

const POLA_ID = /^[A-Za-z0-9._-]{8,64}$/
export const AMBANG_LAMBAT_MS = 1500
const UKURAN_CINCIN = 500

/** Jalur untuk log: templat rute bila ada; bila tidak, segmen panjang/ber-angka disamarkan. */
export function jalurAman(req: Pick<Request, 'baseUrl' | 'path'> & { route?: { path?: unknown } }): string {
  const tmpl = req.route && typeof req.route.path === 'string' ? `${req.baseUrl ?? ''}${req.route.path}` : null
  if (tmpl) return tmpl
  return (req.path || '/').split('/').map((s) => (s.length >= 16 || /\d{3,}/.test(s) ? ':x' : s)).join('/').slice(0, 120)
}

export interface Ringkasan { total: number; s2xx: number; s4xx: number; s5xx: number; lambat: number; p50Ms: number | null; p95Ms: number | null }
const durasi: number[] = []
let idx = 0
const hitung = { total: 0, s2xx: 0, s4xx: 0, s5xx: 0, lambat: 0 }

function persentil(p: number): number | null {
  if (!durasi.length) return null
  const u = [...durasi].sort((a, b) => a - b)
  return Math.round(u[Math.min(u.length - 1, Math.floor((p / 100) * u.length))])
}
export function ringkasanObservabilitas(): Ringkasan { return { ...hitung, p50Ms: persentil(50), p95Ms: persentil(95) } }
export function aturUlangObservabilitas() { durasi.length = 0; idx = 0; Object.assign(hitung, { total: 0, s2xx: 0, s4xx: 0, s5xx: 0, lambat: 0 }) }

/*
 * Byte keluar per templat rute (batas atas: sebelum kompresi bila ada). Tujuannya satu:
 * menunjukkan rute mana yang menghabiskan kuota outbound, bukan menebaknya.
 * Hanya templat rute dan angka; tidak pernah isi, query, header atau identitas.
 */
export const MAKS_RUTE_EGRESS = 200
const LAINNYA = '(lainnya)'
const egress = new Map<string, { n: number; bytes: number }>()

export function catatEgress(rute: string, bytes: number): void {
  if (!Number.isFinite(bytes) || bytes < 0) return // fail-closed: ukuran tak sah tidak dihitung
  const kunci = egress.has(rute) || egress.size < MAKS_RUTE_EGRESS ? rute : LAINNYA
  const e = egress.get(kunci) ?? { n: 0, bytes: 0 }
  e.n++; e.bytes += bytes
  egress.set(kunci, e)
}
export function egressPerRute(top = 8): { rute: string; n: number; bytes: number }[] {
  return [...egress].map(([rute, v]) => ({ rute, ...v })).sort((a, b) => b.bytes - a.bytes).slice(0, Math.max(0, top))
}
export function aturUlangEgress() { egress.clear() }

function ukuranChunk(chunk: unknown, enc: unknown): number {
  if (typeof chunk === 'string') return Buffer.byteLength(chunk, typeof enc === 'string' && Buffer.isEncoding(enc) ? enc : 'utf8')
  if (chunk instanceof Uint8Array) return chunk.byteLength
  return 0
}

export type Pencatat = (baris: string) => void

export function middlewareObservabilitas(catat: Pencatat = (b) => console.log(b), jam: () => number = () => performance.now()) {
  return (req: Request, res: Response, next: NextFunction) => {
    const masuk = req.get('x-request-id')
    const id = masuk && POLA_ID.test(masuk) ? masuk : randomUUID()
    res.locals.requestId = id
    res.setHeader('X-Request-Id', id)
    const t0 = jam()
    let keluar = 0
    const tulis = res.write.bind(res), akhir = res.end.bind(res)
    res.write = ((chunk: unknown, ...a: unknown[]) => { keluar += ukuranChunk(chunk, a[0]); return (tulis as (...x: unknown[]) => boolean)(chunk, ...a) }) as typeof res.write
    res.end = ((chunk?: unknown, ...a: unknown[]) => { keluar += ukuranChunk(chunk, a[0]); return (akhir as (...x: unknown[]) => Response)(chunk, ...a) }) as typeof res.end
    res.on('finish', () => {
      catatEgress(jalurAman(req), keluar)
      const ms = jam() - t0, st = res.statusCode
      hitung.total++
      if (st >= 500) hitung.s5xx++; else if (st >= 400) hitung.s4xx++; else hitung.s2xx++
      if (durasi.length < UKURAN_CINCIN) durasi.push(ms); else { durasi[idx] = ms; idx = (idx + 1) % UKURAN_CINCIN }
      const lambat = ms >= AMBANG_LAMBAT_MS
      if (lambat) hitung.lambat++
      if (st >= 500 || lambat) catat(JSON.stringify({ t: new Date().toISOString(), jenis: st >= 500 ? 'http_error' : 'http_lambat', id, metode: req.method, rute: jalurAman(req), status: st, ms: Math.round(ms) }))
    })
    next()
  }
}
