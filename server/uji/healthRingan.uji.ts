// Probe hidup ringan: kecil, tanpa data, hanya GET; render.yaml dan index.ts benar-benar memakainya.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import express from 'express'
import { pasangHealthRingan, JALUR_HEALTH_RINGAN } from '../src/domains/observability/healthRingan.js'

const app = express()
pasangHealthRingan(app)
const srv = app.listen(0); const port = (srv.address() as { port: number }).port
const u = (p: string) => `http://127.0.0.1:${port}${p}`

// positif: 200, teks polos 'ok', kecil, tidak di-cache
const ok = await fetch(u(JALUR_HEALTH_RINGAN)); const badan = await ok.text()
assert.equal(ok.status, 200, 'probe harus 200')
assert.equal(badan, 'ok', 'badan persis "ok"')
assert.match(ok.headers.get('content-type') ?? '', /^text\/plain/, 'teks polos, bukan JSON')
assert.equal(ok.headers.get('cache-control'), 'no-store')
// batas: jauh di bawah /api/health (±1,3 KB); anggaran 16 byte
assert.ok(Buffer.byteLength(badan) <= 16, `badan terlalu besar: ${Buffer.byteLength(badan)} B`)
// tanpa data apa pun yang bisa bocor
for (const kunci of ['commit', 'vapid', 'midtrans', 'google', 'egress', 'penyimpanan']) assert.ok(!badan.includes(kunci), `probe membocorkan: ${kunci}`)

// negatif: metode lain dan jalur turunan ditolak (404), tanpa efek samping
for (const [metode, jalur] of [['POST', JALUR_HEALTH_RINGAN], ['PUT', JALUR_HEALTH_RINGAN], ['GET', `${JALUR_HEALTH_RINGAN}/x`], ['GET', '/healthz2']] as const) {
  const r = await fetch(u(jalur), { method: metode }); assert.equal(r.status, 404, `${metode} ${jalur} harus 404`)
}
srv.close()

// penyambungan nyata: render.yaml menunjuk probe ini, index.ts memasangnya, /api/health penuh tetap ada
const yaml = readFileSync(new URL('../../render.yaml', import.meta.url), 'utf8')
assert.match(yaml, new RegExp(`^\\s*healthCheckPath:\\s*${JALUR_HEALTH_RINGAN}\\s*$`, 'm'), 'render.yaml: healthCheckPath harus /healthz')
const index = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
assert.ok(index.includes('pasangHealthRingan(app)'), 'index.ts harus memasang probe ringan')
assert.ok(index.includes("app.get('/api/health'"), 'regresi: /api/health penuh harus tetap ada')
console.log('healthRingan: lulus')
