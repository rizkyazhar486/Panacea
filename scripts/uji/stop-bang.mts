import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stopBang, STOP_BANG_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { stop: [false, false, false, false], bmi: 24, ageYears: 40, neckCm: 36, sex: 'F' as const }
// Positif: tanpa poin = 0 rendah; semua poin = 8 tinggi.
assert.deepEqual(stopBang(base), { ok: true, stopScore: 0, bangScore: 0, total: 0, band: 'low' })
assert.deepEqual(stopBang({ stop: [true, true, true, true], bmi: 36, ageYears: 51, neckCm: 41, sex: 'M' }), { ok: true, stopScore: 4, bangScore: 4, total: 8, band: 'high' })
// Pita: 2 rendah, 3 sedang, 4 sedang, 5 tinggi (hanya STOP berubah).
const band = (n: number) => { const r = stopBang({ ...base, stop: [0, 1, 2, 3].map((k) => k < n) }); return r.ok ? r.band : 'x' }
assert.deepEqual([2, 3, 4].map(band), ['low', 'intermediate', 'intermediate'])
// 4 STOP + 0 BANG = 4 sedang; hanya jenis kelamin laki-laki yang menaikkannya ke 5 tinggi.
assert.equal(band(4), 'intermediate')
const four = { ...base, stop: [true, true, true, true] }
assert.deepEqual([stopBang(four), stopBang({ ...four, sex: 'M' })].map((x) => x.ok && x.band), ['intermediate', 'high'])
// Batas ambang: > bukan ≥ (berpasangan: hanya satu nilai berbeda).
const bang = (o: object) => { const r = stopBang({ ...base, ...o }); return r.ok ? r.bangScore : -1 }
assert.deepEqual([bang({ bmi: 35 }), bang({ bmi: 35.1 })], [0, 1])
assert.deepEqual([bang({ ageYears: 50 }), bang({ ageYears: 51 })], [0, 1])
assert.deepEqual([bang({ neckCm: 40 }), bang({ neckCm: 40.1 })], [0, 1])
assert.deepEqual([bang({ sex: 'F' }), bang({ sex: 'M' })], [0, 1])
// Negatif: kosong (NaN) dan jenis kelamin '' → missing, bukan 0 poin / poin laki-laki.
assert.deepEqual(stopBang({ ...base, bmi: NaN, ageYears: NaN, neckCm: NaN, sex: '' }), { ok: false, missing: ['sex', 'BMI', 'age', 'neck circumference'], invalid: [] })
// Negatif: di luar rentang / tak hingga / negatif / bukan angka → invalid. ±1 langkah dari batas.
const r = STOP_BANG_RANGES
for (const [k, label, lo, hi] of [['bmi', 'BMI', r.bmi.min, r.bmi.max], ['ageYears', 'age', r.ageYears.min, r.ageYears.max], ['neckCm', 'neck circumference', r.neckCm.min, r.neckCm.max]] as const) {
  assert.equal(stopBang({ ...base, [k]: lo }).ok, true, `${k} batas bawah`)
  assert.equal(stopBang({ ...base, [k]: hi }).ok, true, `${k} batas atas`)
  for (const bad of [lo - 0.1, hi + 0.1, 0, -5, Infinity, '30' as unknown as number]) assert.deepEqual(stopBang({ ...base, [k]: bad }), { ok: false, missing: [], invalid: [label] }, `${k}=${String(bad)}`)
}
assert.deepEqual(stopBang({ ...base, stop: [true, true, true] }), { ok: false, missing: [], invalid: ['STOP answers'] })
assert.equal(stopBang({ ...base, stop: [1, 0, 0, 0] as unknown as boolean[] }).ok, false)
assert.deepEqual(stopBang(base), stopBang(base))

const kode = readFileSync(new URL('../../src/pages/SleepApneaScreen.tsx', import.meta.url), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
assert.ok(/stopBang\(/.test(kode) && /parseNumberField/.test(kode), 'halaman tidak memakai mesin domain')
assert.ok(!/\|\|\s*0\)/.test(kode), 'kolom kosong kembali terbaca 0')
console.log('stop-bang: 0→rendah, 8→tinggi, ambang > (35/50/40), kosong dan di luar rentang ditolak tanpa skor')
