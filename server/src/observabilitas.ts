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

export type Pencatat = (baris: string) => void

export function middlewareObservabilitas(catat: Pencatat = (b) => console.log(b), jam: () => number = () => performance.now()) {
  return (req: Request, res: Response, next: NextFunction) => {
    const masuk = req.get('x-request-id')
    const id = masuk && POLA_ID.test(masuk) ? masuk : randomUUID()
    res.locals.requestId = id
    res.setHeader('X-Request-Id', id)
    const t0 = jam()
    res.on('finish', () => {
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
