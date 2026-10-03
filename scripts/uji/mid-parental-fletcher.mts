import assert from 'node:assert/strict'
import { fletcherIndex, midParentalHeight } from '../../src/domains/clinical-calculators/index.ts'

// ── Tinggi target tengah-orangtua ──
const mph = (f: number, m: number, s: 'M' | 'F') => { const r = midParentalHeight(f, m, s); assert.ok(r.ok, `${f}/${m}/${s}`); return r.ok ? r.data : (undefined as never) }
assert.deepEqual(mph(170, 158, 'M'), { targetCm: 170.5, lowCm: 162, highCm: 179 })
assert.deepEqual(mph(170, 158, 'F'), { targetCm: 157.5, lowCm: 149, highCm: 166 })
// Pasangan: hanya jenis kelamin berbeda → selisih tepat 13 cm.
assert.equal(mph(175, 160, 'M').targetCm - mph(175, 160, 'F').targetCm, 13)
// Regresi: identik dengan rumus halaman lama pada seluruh masukan sah.
for (let f = 100; f <= 250; f += 10) for (let m = 100; m <= 250; m += 15) {
  assert.equal(mph(f, m, 'M').targetCm, (f + m + 13) / 2); assert.equal(mph(f, m, 'F').targetCm, (f + m - 13) / 2)
}
const GF = { ok: false, reason: "Father's height must be 100–250 cm" }, GM = { ok: false, reason: "Mother's height must be 100–250 cm" }
for (const [f, m] of [[100, 100], [250, 250]] as const) assert.equal(midParentalHeight(f, m, 'M').ok, true)
for (const f of [99.99, 0, -170, 250.01, NaN, Infinity, +'']) assert.deepEqual(midParentalHeight(f, 158, 'M'), GF, `father ${f}`)
for (const m of [99.99, 0, -158, 250.01, NaN, Infinity, +'']) assert.deepEqual(midParentalHeight(170, m, 'F'), GM, `mother ${m}`)
assert.deepEqual(midParentalHeight(170, 158, 'X' as 'M'), { ok: false, reason: "Child's sex must be selected" })
for (const salah of [undefined, null, '170', {}] as unknown as number[]) assert.equal(midParentalHeight(salah, 158, 'M').ok, false)
assert.equal('data' in (midParentalHeight(0, 158, 'M') as object), false)
// Jebakan nyata: kolom kosong → 0 → halaman lama menampilkan target 85,5 cm.
assert.equal((+'' + 158 + 13) / 2, 85.5)

// ── Indeks Fletcher ──
const fl = (m: 'basic' | 'complete', a: number, b: number, c: number, d = 0) => { const r = fletcherIndex(m, a, b, c, d); assert.ok(r.ok, `${m}${a}${b}${c}${d}`); return r.ok ? r.data : (undefined as never) }
assert.deepEqual(fl('basic', 20, 20, 20), { index: 20, label: 'Normal', tone: 'normal' })
// Dasar mengabaikan 3000 Hz; lengkap memakainya (pasangan: hanya mode berbeda).
assert.equal(fl('basic', 20, 20, 20, 120).index, 20)
assert.equal(fl('complete', 20, 20, 20, 60).index, 30)
// Batas kelas: <26 normal, <41 ringan, <56 sedang, <71 sedang-berat, <91 berat, ≥91 sangat berat.
const kelas = [[25, 'Normal'], [26, 'Mild hearing loss'], [40, 'Mild hearing loss'], [41, 'Moderate hearing loss'], [55, 'Moderate hearing loss'],
  [56, 'Moderately severe hearing loss'], [70, 'Moderately severe hearing loss'], [71, 'Severe hearing loss'], [90, 'Severe hearing loss'], [91, 'Profound (total) hearing loss']] as const
for (const [v, l] of kelas) assert.equal(fl('basic', v, v, v).label, l, `index ${v}`)
assert.equal(fl('basic', 71, 71, 71).tone, 'critical'); assert.equal(fl('basic', 26, 26, 26).tone, 'low')
// Rentang masukan: tepi diterima, satu langkah di luar ditolak dengan alasan, frekuensi 3000 hanya diperiksa pada mode lengkap.
assert.equal(fletcherIndex('basic', -10, 120, 0, 0).ok, true)
for (const v of [-10.01, 120.01, NaN, Infinity, +'' + NaN]) {
  assert.deepEqual(fletcherIndex('basic', v, 20, 20, 20), { ok: false, reason: '500 Hz threshold must be -10–120 dB' }, `500 ${v}`)
  assert.deepEqual(fletcherIndex('complete', 20, 20, 20, v), { ok: false, reason: '3000 Hz threshold must be -10–120 dB' }, `3000 ${v}`)
}
assert.equal(fletcherIndex('basic', 20, 20, 20, NaN).ok, true)
assert.deepEqual(fletcherIndex('basic', 20, 121, 20, 20), { ok: false, reason: '1000 Hz threshold must be -10–120 dB' })
assert.deepEqual(fletcherIndex('basic', 20, 20, -11, 20), { ok: false, reason: '2000 Hz threshold must be -10–120 dB' })
assert.equal(fletcherIndex('weird' as 'basic', 20, 20, 20, 20).ok, false)
for (const salah of [undefined, null, '20', {}] as unknown as number[]) assert.equal(fletcherIndex('basic', salah, 20, 20, 20).ok, false)
assert.equal('data' in (fletcherIndex('basic', NaN, 20, 20, 20) as object), false)
// Determinisme.
assert.deepEqual(fletcherIndex('complete', 30, 40, 50, 60), fletcherIndex('complete', 30, 40, 50, 60))
console.log('mid-parental-fletcher: ok')
