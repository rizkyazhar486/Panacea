import assert from 'node:assert/strict'
import { correctedCalcium, calciumBand, CA_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const run = (o: Record<string, number> = {}) => correctedCalcium({ totalCa: 8, albumin: 2.5, ...o })
const data = (o: Record<string, number> = {}) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data : (undefined as never) }
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`)

// Nilai tangan (Payne): 8,0 + 0,8 × (4,0 − 2,5) = 9,2 → total "Hypocalcemia" menjadi terkoreksi "Normal", kategori berubah.
const d = data()
close(d.corrected, 9.2)
assert.deepEqual(d.totalBand, { label: 'Hypocalcemia', tone: 'low' })
assert.deepEqual(d.correctedBand, { label: 'Normal', tone: 'brand' })
assert.equal(d.changesCategory, true)
// Pasangan: albumin 4,0 → koreksi nol, kategori tidak berubah (hanya albumin yang berbeda).
const n = data({ albumin: 4 }); close(n.corrected, 8); assert.equal(n.changesCategory, false)
// Albumin tinggi menurunkan kalsium terkoreksi: 10,4 + 0,8 × (4 − 5) = 9,6.
close(data({ totalCa: 10.4, albumin: 5 }).corrected, 9.6)

// Pita tepat di batas.
for (const [v, l] of [[6.99, 'Severe hypocalcemia'], [7, 'Hypocalcemia'], [8.49, 'Hypocalcemia'], [8.5, 'Normal'], [10.5, 'Normal'], [10.51, 'Hypercalcemia'], [12, 'Hypercalcemia'], [12.01, 'Severe hypercalcemia']] as const) assert.equal(calciumBand(v).label, l, `ca ${v}`)
assert.equal(calciumBand(6.99).tone, 'critical'); assert.equal(calciumBand(8.49).tone, 'low'); assert.equal(calciumBand(10.5).tone, 'brand'); assert.equal(calciumBand(12.01).tone, 'critical')
assert.deepEqual(run(), run()) // determinisme

// Regresi vs halaman lama pada grid.
const lama = (ca: number, alb: number) => ca + 0.8 * (4.0 - alb)
let cnt = 0
for (const ca of [4, 6.5, 7, 8, 8.5, 9.5, 10.5, 11.5, 13]) for (const alb of [1, 2.5, 3.5, 4, 4.5, 6]) { assert.equal(data({ totalCa: ca, albumin: alb }).corrected, lama(ca, alb)); cnt++ }
assert.equal(cnt, 54)

// Rentang dipatok literal; batas diterima, di luar ditolak tanpa data.
assert.deepEqual(JSON.parse(JSON.stringify(CA_RANGES)), { totalCa: { min: 2, max: 25, name: 'Total calcium', unit: ' mg/dL' }, albumin: { min: 0.5, max: 7, name: 'Albumin', unit: ' g/dL' } })
for (const k of Object.keys(CA_RANGES) as (keyof typeof CA_RANGES)[]) {
  const { min, max, name, unit } = CA_RANGES[k]
  assert.equal(run({ [k]: min }).ok, true, `${k} min`); assert.equal(run({ [k]: max }).ok, true, `${k} max`)
  for (const bad of [min - 0.001, max + 0.001, 0, -1, Number.NaN, Infinity, -Infinity]) {
    const r = run({ [k]: bad }); assert.deepEqual(r, { ok: false, reason: `${name} must be ${min}–${max}${unit}` }, `${k}=${bad}`); assert.equal('data' in r, false)
  }
  for (const salah of [null, undefined, '5', {}] as unknown as number[]) assert.equal(run({ [k]: salah }).ok, false, `${k} tipe`)
}
// Regresi: kolom kosong dulu → 0 → "Severe hypocalcemia"; kini ditolak. Teks bukan angka tidak lagi menjadi 0 diam-diam.
assert.deepEqual(run({ totalCa: parseNumberField('') }), { ok: false, reason: 'Total calcium must be 2–25 mg/dL' })
assert.deepEqual(run({ albumin: parseNumberField('abc') }), { ok: false, reason: 'Albumin must be 0.5–7 g/dL' })
assert.deepEqual(run({ totalCa: 0, albumin: -1 }), { ok: false, reason: 'Total calcium must be 2–25 mg/dL' }) // urutan terdokumentasi
// Batas diketahui: kalsium total dalam mmol/L (mis. 2,4) berada di dalam rentang mg/dL dan tidak bisa dibedakan dari angka mg/dL; satuan dijaga oleh label kolom. Nilai ionisasi 1,2 mmol/L ditolak.
assert.equal(run({ totalCa: 1.2 }).ok, false)
console.log('corrected-calcium: OK')
