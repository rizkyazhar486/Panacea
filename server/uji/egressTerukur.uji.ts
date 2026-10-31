// Penghitung byte keluar: angka benar, tanpa membocorkan path/query/badan, tak sah tidak dihitung, batas jumlah kunci.
import assert from 'node:assert/strict'
import express from 'express'
import { middlewareObservabilitas, catatEgress, egressPerRute, aturUlangEgress, MAKS_RUTE_EGRESS } from '../src/domains/observability/observabilitas.js'
import { bungkusFetch, ringkasanEgressKeluar, aturUlangEgressKeluar, ukuranBadan } from '../src/domains/observability/egressKeluar.js'

// --- respons per rute ---
aturUlangEgress()
const app = express()
app.use(middlewareObservabilitas(() => {}))
app.get('/api/besar', (_q, r) => { r.type('text/plain').send('x'.repeat(1000)) })
app.get('/api/kecil/:id', (_q, r) => { r.type('text/plain').send('é') }) // 2 byte UTF-8
app.get('/api/alir', (_q, r) => { r.type('text/plain'); r.write('é'); r.end('é') }) // cabang string: 2 + 2 byte UTF-8
const srv = app.listen(0); const port = (srv.address() as { port: number }).port
const u = (p: string) => `http://127.0.0.1:${port}${p}`
await (await fetch(u('/api/besar'))).text(); await (await fetch(u('/api/besar'))).text()
await (await fetch(u('/api/kecil/abc?token=RAHASIA'))).text()
await (await fetch(u('/api/alir'))).text()
srv.close()
const top = egressPerRute()
assert.deepEqual(top[0], { rute: '/api/besar', n: 2, bytes: 2000 }, 'dua respons 1000 B dijumlah persis')
assert.deepEqual(top[1], { rute: '/api/alir', n: 1, bytes: 4 }, 'string via write/end dihitung byte UTF-8, bukan karakter')
assert.deepEqual(top[2], { rute: '/api/kecil/:id', n: 1, bytes: 2 }, 'templat rute, bukan URL mentah')
assert.ok(!JSON.stringify(top).includes('RAHASIA') && !JSON.stringify(top).includes('abc'), 'query/param tidak bocor')

// negatif: ukuran tak sah tidak mengubah apa pun
const sebelum = JSON.stringify(egressPerRute(100))
for (const buruk of [NaN, Infinity, -1]) catatEgress('/api/x', buruk)
assert.equal(JSON.stringify(egressPerRute(100)), sebelum, 'NaN/Infinity/negatif ditolak tanpa efek samping')

// batas: kunci baru di atas batas digabung ke (lainnya), kunci lama tetap
aturUlangEgress()
for (let i = 0; i < MAKS_RUTE_EGRESS; i++) catatEgress(`/r${i}`, 1)
catatEgress('/baru', 5); catatEgress('/baru2', 7); catatEgress('/r0', 1)
const semua = egressPerRute(1000)
assert.equal(semua.length, MAKS_RUTE_EGRESS + 1, 'tepat satu kunci tambahan')
assert.deepEqual(semua.find((x) => x.rute === '(lainnya)'), { rute: '(lainnya)', n: 2, bytes: 12 })
assert.equal(semua.find((x) => x.rute === '/r0')?.n, 2, 'kunci yang sudah ada tetap dihitung pada batas')
assert.equal(semua.some((x) => x.rute === '/baru'), false)

// --- fetch keluar per host ---
aturUlangEgressKeluar()
const panggilan: string[] = []
const palsu = (async (input: unknown) => { panggilan.push(String(input)); return new Response('ok', { status: String(input).includes('gagal') ? 500 : 200 }) }) as typeof fetch
const f = bungkusFetch(palsu)
await f('https://api.vendor.test/v1/a?key=KUNCI123', { method: 'POST', body: 'halo' })
await f(new URL('https://api.vendor.test/v1/b'), { method: 'POST', body: new URLSearchParams({ a: '1' }) })
await f('https://api.vendor.test/gagal', { method: 'POST', body: JSON.stringify({ a: 1 }) })
await f('https://lain.test/', { method: 'POST', body: new ReadableStream() as unknown as BodyInit })
const v = ringkasanEgressKeluar()
const vendor = v.find((x) => x.host === 'api.vendor.test')!
assert.deepEqual(vendor, { host: 'api.vendor.test', panggilan: 3, bytesBadan: 4 + 3 + 7, badanTakDiketahui: 0, galat: 1 })
assert.deepEqual(v.find((x) => x.host === 'lain.test'), { host: 'lain.test', panggilan: 1, bytesBadan: 0, badanTakDiketahui: 1, galat: 0 }, 'stream = tidak diketahui, bukan nol')
assert.ok(!JSON.stringify(v).includes('KUNCI123') && !JSON.stringify(v).includes('/v1'), 'path/query tidak dicatat')
assert.equal(panggilan.length, 4, 'pembungkus meneruskan setiap panggilan')
assert.equal(ukuranBadan(undefined), 0); assert.equal(ukuranBadan(new Uint8Array(5)), 5); assert.equal(ukuranBadan({}), null)
// galat jaringan dicatat dan dilempar ulang
const putus = bungkusFetch((async () => { throw new Error('putus') }) as typeof fetch)
await assert.rejects(() => putus('https://putus.test/'), /putus/)
assert.equal(ringkasanEgressKeluar(100).find((x) => x.host === 'putus.test')?.galat, 1)
console.log('egressTerukur: lulus')
