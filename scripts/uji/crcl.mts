import assert from 'node:assert/strict'
import { creatinineClearance, crclBand, crclIdealBodyWeight, CRCL_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { age: 50, weightKg: 70, heightCm: 175, scr: 1, sex: 'M', basis: 'actual' } as const
const run = (o: Record<string, unknown> = {}) => creatinineClearance({ ...base, ...o } as never)
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan (Cockcroft & Gault 1976): (140−50)×70/(72×1) = 87.5; perempuan ×0,85.
close(run().crcl, 87.5); close(run({ sex: 'F' }).crcl, 87.5 * 0.85)
close(run({ age: 70, weightKg: 60, scr: 1.4, sex: 'F' }).crcl, (70 * 60 * 0.85) / (72 * 1.4))
// Dasar ideal memakai BBI: 175 cm = 68.898 in → 50 + 2.3×8.898 = 70.4655 kg.
close(crclIdealBodyWeight(175, 'M'), 50 + 2.3 * (175 / 2.54 - 60)); close(crclIdealBodyWeight(175, 'F'), 45.5 + 2.3 * (175 / 2.54 - 60))
assert.equal(crclIdealBodyWeight(140, 'M'), 50) // di bawah 5 kaki: tidak negatif
const ideal = run({ basis: 'ideal', weightKg: 120 }); close(ideal.usedWeightKg, crclIdealBodyWeight(175, 'M')); close(ideal.crcl, (90 * crclIdealBodyWeight(175, 'M')) / 72)
assert.notEqual(ideal.crcl, run({ weightKg: 120 }).crcl) // pasangan: hanya dasar berat yang berbeda
assert.deepEqual(run(), run())

// Pita di ambang.
for (const [v, label] of [[90, 'Normal'], [89.9, 'Mildly reduced'], [60, 'Mildly reduced'], [59.9, 'Moderately reduced — many drugs need dose adjustment'], [30, 'Moderately reduced — many drugs need dose adjustment'],
  [29.9, 'Severely reduced — significant dose adjustment needed'], [15, 'Severely reduced — significant dose adjustment needed'], [14.9, 'Kidney failure — many drugs contraindicated or need major adjustment']] as const) assert.equal(crclBand(v).label, label, String(v))
assert.equal(crclBand(30).tone, 'low'); assert.equal(crclBand(29.9).tone, 'critical')
// Obesitas: >125% BBI memicu peringatan; tepat 125% tidak (pasangan).
const ibw = crclIdealBodyWeight(175, 'M')
assert.equal(run({ weightKg: ibw * 1.25 + 0.01 }).obese, true); assert.equal(run({ weightKg: ibw * 1.25 }).obese, false)

// Kosong → bernama, tanpa angka/pita (dulu SCr kosong = 0 → "Kidney failure").
const kosong = run({ scr: NaN }); assert.deepEqual(kosong.missing, ['serum creatinine']); assert.equal(kosong.crcl, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ age: NaN, weightKg: NaN, scr: NaN }).missing, ['age', 'weight', 'serum creatinine'])
// Tinggi hanya wajib untuk dasar ideal.
assert.notEqual(run({ heightCm: NaN }).crcl, null); assert.equal(run({ heightCm: NaN }).ibwKg, null)
assert.deepEqual(run({ heightCm: NaN, basis: 'ideal' }).missing, ['height']); assert.equal(run({ heightCm: NaN, basis: 'ideal' }).crcl, null)
// Regresi: usia 500 / SCr 0.0001 lolos "> 0" dulu; kini ditolak.
assert.deepEqual(run({ age: 500 }).invalid, ['age must be 18–120 years']); assert.equal(run({ age: 500 }).crcl, null)
assert.deepEqual(run({ scr: 0.0001 }).invalid, ['serum creatinine must be 0.1–20 mg/dL']); assert.equal(run({ scr: 0.0001 }).band, null)
assert.deepEqual(run({ heightCm: 30 }).invalid, ['height must be 100–250 cm']); assert.equal(run({ heightCm: 30 }).crcl, null) // tinggi salah ditolak walau opsional
for (const bad of [Infinity, -1, 0, '70' as unknown as number]) assert.equal(run({ weightKg: bad }).crcl, null, `berat ${String(bad)}`)
// Jenis kelamin / dasar berat tak sah.
assert.deepEqual(run({ sex: 'X' }).invalid, ['sex must be M or F']); assert.equal(run({ sex: 'X' }).crcl, null)
assert.deepEqual(run({ basis: 'adjusted' }).invalid, ['weight basis must be actual or ideal']); assert.equal(run({ basis: undefined }).crcl, null)
// Batas rentang diterima; ±0.1 ditolak (pasangan per kolom).
for (const [k, r] of Object.entries(CRCL_RANGES)) {
  assert.notEqual(run({ [k]: r.min }).crcl, null, `${k} min`); assert.notEqual(run({ [k]: r.max }).crcl, null, `${k} max`)
  assert.equal(run({ [k]: r.min - 0.1 }).crcl, null, `${k} <min`); assert.equal(run({ [k]: r.max + 0.1 }).crcl, null, `${k} >max`)
}
console.log('crcl: Cockcroft-Gault (nilai tangan, faktor 0,85, BBI), pita & obesitas di ambang, kosong/di luar rentang/jenis kelamin/dasar tak sah gagal tertutup')
