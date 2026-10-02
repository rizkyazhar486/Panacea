// Observabilitas HTTP: ID korelasi, tanpa bocor token/query/badan, ringkasan status & latensi.
import assert from 'node:assert/strict'
import express from 'express'
import { middlewareObservabilitas, ringkasanObservabilitas, aturUlangObservabilitas, jalurAman } from '../src/observabilitas.js'

aturUlangObservabilitas()
const log: string[] = []
let t = 0
const app = express()
app.use(middlewareObservabilitas((b) => log.push(b), () => t))
app.get('/api/ok', (_q, r) => { r.json({ ok: 1 }) })
app.get('/api/lambat', (_q, r) => { t += 2000; r.json({ ok: 1 }) })
app.post('/api/health-webhook/:token', (_q, r) => { r.status(500).json({ e: 1 }) })
app.get('/api/tolak', (_q, r) => { r.status(403).end() })
const srv = app.listen(0); const port = (srv.address() as { port: number }).port
const u = (p: string) => `http://127.0.0.1:${port}${p}`

const r1 = await fetch(u('/api/ok'))
assert.match(r1.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/, 'ID dibuat bila tidak ada')
const r2 = await fetch(u('/api/ok'), { headers: { 'x-request-id': 'klien-abc-12345' } })
assert.equal(r2.headers.get('x-request-id'), 'klien-abc-12345', 'ID klien yang sah diteruskan')
const r3 = await fetch(u('/api/ok'), { headers: { 'x-request-id': 'bad id <script>' } })
assert.notEqual(r3.headers.get('x-request-id'), 'bad id <script>', 'ID klien tidak sah diganti')
assert.equal(log.length, 0, '2xx cepat tidak dicatat per permintaan')

await fetch(u('/api/lambat?email=a@b.id'))
await fetch(u('/api/health-webhook/RAHASIA1234567890abcdef?token=zzz'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pasien: 'Budi' }) })
await fetch(u('/api/tolak'))
srv.close()
assert.equal(log.length, 2, 'hanya 5xx dan permintaan lambat dicatat')
const semua = log.join('\n')
for (const bocor of ['RAHASIA', 'zzz', 'email', 'a@b.id', 'Budi', 'pasien']) assert.ok(!semua.includes(bocor), `log membocorkan: ${bocor}`)
const e = JSON.parse(log[1]); assert.equal(e.jenis, 'http_error'); assert.equal(e.rute, '/api/health-webhook/:token', 'templat rute, bukan URL mentah'); assert.ok(e.id)
assert.equal(JSON.parse(log[0]).jenis, 'http_lambat')
const r = ringkasanObservabilitas()
assert.deepEqual([r.total, r.s2xx, r.s4xx, r.s5xx, r.lambat], [6, 4, 1, 1, 1]); assert.ok(r.p95Ms !== null && r.p95Ms >= 2000)
assert.equal(jalurAman({ baseUrl: '', path: '/api/x/RAHASIAtokenpanjang123' }), '/api/x/:x', 'tanpa rute: segmen panjang disamarkan')
console.log('observabilitas: lulus')
