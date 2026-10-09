import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { correctedCalcium, calciumBand, CA_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const run = (totalCa: number, albumin: number) => correctedCalcium({ totalCa, albumin })
const close = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} vs ${b}`)

// Nilai tangan (Payne): 7.6 + 0.8×(4.0−2.0) = 9.2 → Normal; total 7.6 → Hypocalcemia → kategori berubah.
const a = run(7.6, 2.0); close(a.corrected, 9.2); assert.equal(a.totalBand?.label, 'Hypocalcemia'); assert.equal(a.correctedBand?.label, 'Normal'); assert.equal(a.changesCategory, true)
// Albumin 4.0 → tanpa koreksi; albumin > 4 menurunkan nilai (rumus apa adanya).
close(run(9.0, 4.0).corrected, 9.0); assert.equal(run(9.0, 4.0).changesCategory, false); close(run(9.0, 5.0).corrected, 9.0 - 0.8)
assert.equal(run(9.0, 4.0).totalBand?.tone, 'brand'); assert.equal(run(7.6, 2.0).totalBand?.tone, 'low')

// Ambang pita tepat dan ±: <7.0 berat rendah; <8.5 rendah; ≤10.5 normal; ≤12 tinggi; >12 berat tinggi.
const bands: [number, string][] = [[6.9, 'Severe hypocalcemia'], [7.0, 'Hypocalcemia'], [8.4, 'Hypocalcemia'], [8.5, 'Normal'], [10.5, 'Normal'], [10.6, 'Hypercalcemia'], [12, 'Hypercalcemia'], [12.1, 'Severe hypercalcemia']]
for (const [v, label] of bands) assert.equal(calciumBand(v).label, label, String(v))
assert.equal(calciumBand(6.9).tone, 'critical'); assert.equal(calciumBand(12.1).tone, 'critical'); assert.equal(calciumBand(8.0).tone, 'low'); assert.equal(calciumBand(11).tone, 'low')
// Pasangan: hanya albumin yang berbeda memindahkan kategori terkoreksi di ambang 8.5 (8.0 + 0.8×(4−alb)).
assert.notEqual(run(8.0, 3.4).correctedBand?.label, run(8.0, 3.3).correctedBand?.label) // 8.48 vs 8.56
assert.deepEqual(run(7.6, 2.0), run(7.6, 2.0))

// Kosong → bernama; tanpa pita/angka (dulu 0 → "Severe hypocalcemia").
const k = run(NaN, NaN); assert.deepEqual(k.missing, ['measured total calcium', 'serum albumin']); assert.equal(k.corrected, null); assert.equal(k.totalBand, null); assert.equal(k.changesCategory, null)
assert.deepEqual(run(8, NaN).missing, ['serum albumin']); assert.deepEqual(run(NaN, 3).missing, ['measured total calcium'])
// Regresi: Ca 5000 / albumin 0.01 lolos "> 0" dulu; kini ditolak dengan alasan.
assert.deepEqual(run(5000, 3).invalid, ['measured total calcium must be 2–20 mg/dL']); assert.equal(run(5000, 3).corrected, null)
assert.deepEqual(run(8, 0.01).invalid, ['serum albumin must be 0.5–7 g/dL']); assert.equal(run(8, 0.01).totalBand, null)
for (const bad of [Infinity, -1, 0]) assert.equal(run(bad, 3).corrected, null, `Ca ${bad}`)
assert.equal(run('8' as unknown as number, 3).corrected, null)
// Batas rentang: diterima; ± ditolak (pasangan per kolom).
for (const [key, r] of Object.entries(CA_RANGES)) {
  const f = (v: number) => (key === 'totalCa' ? run(v, 3) : run(8, v))
  assert.notEqual(f(r.min).corrected, null, `${key} min`); assert.notEqual(f(r.max).corrected, null, `${key} max`)
  assert.equal(f(r.min - 0.01).corrected, null, `${key} <min`); assert.equal(f(r.max + 0.01).corrected, null, `${key} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/CorrectedCalcium.tsx', import.meta.url), 'utf8')
assert.ok(/correctedCalcium\(/.test(page) && /parseNumberField\(totalText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('corrected-calcium: Payne 9.2, semua ambang pita, kosong/di luar rentang gagal tertutup, kolom kosong tak pernah jadi "Severe hypocalcemia"')
