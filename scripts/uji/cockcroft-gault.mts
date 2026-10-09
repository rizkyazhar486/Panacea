import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cockcroftGault, cgBand, devineIbwKg, CG_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { age: 70, weightKg: 60, heightCm: NaN, scr: 1.4, sex: 'M', weightBasis: 'actual' } as const
type In = Parameters<typeof cockcroftGault>[0]
const run = (o: Partial<In> = {}) => cockcroftGault({ ...base, ...o } as In)
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan: (140−70)×60/(72×1,4) = 4200/100,8 = 41,666…; perempuan ×0,85.
close(run().crcl, 4200 / 100.8); close(run({ sex: 'F' }).crcl, 0.85 * 4200 / 100.8)
assert.equal(run().band?.label, 'Moderately reduced — many drugs need dose adjustment')
// Skala: SCr 2× → klirens ½; usia lebih tua → turun.
close(run({ scr: 2.8 }).crcl, 4200 / 100.8 / 2); assert.ok(run({ age: 80 }).crcl! < run().crcl!)
// Ambang pita: 90 / 60 / 30 / 15 termasuk pita atasnya; sedikit di bawah turun satu pita.
for (const [v, l] of [[90, 'Normal'], [89.99, 'Mildly reduced'], [60, 'Mildly reduced'], [30, 'Moderately reduced — many drugs need dose adjustment']] as const) assert.equal(cgBand(v).label, l, String(v))
assert.equal(cgBand(59.99).tone, 'low'); assert.equal(cgBand(29.99).tone, 'critical'); assert.equal(cgBand(15).tone, 'critical')
assert.equal(cgBand(15).label, 'Severely reduced — significant dose adjustment needed'); assert.equal(cgBand(14.99).label.startsWith('Kidney failure'), true)
// Devine: 170 cm laki-laki = 50 + 2,3×(170/2,54−60); di bawah 60 inci lantai ke dasar.
close(devineIbwKg(170, 'M'), 50 + 2.3 * (170 / 2.54 - 60)); close(devineIbwKg(100, 'F'), 45.5)
// Dasar berat ideal: tinggi wajib, hasil memakai BBI.
const ideal = run({ weightBasis: 'ideal', heightCm: 170 }); close(ideal.usedWeightKg, devineIbwKg(170, 'M'))
close(ideal.crcl, 70 * devineIbwKg(170, 'M') / 100.8)
assert.deepEqual(run({ weightBasis: 'ideal' }).missing, ['height']); assert.equal(run({ weightBasis: 'ideal' }).crcl, null)
assert.deepEqual(run().missing, []) // dasar aktual: tinggi tidak wajib
// Peringatan obesitas: BB > 125% BBI; tepat 125% bukan obesitas (pasangan).
const bbi = devineIbwKg(170, 'M')
assert.equal(run({ heightCm: 170, weightKg: bbi * 1.25 + 0.01 }).obese, true); assert.equal(run({ heightCm: 170, weightKg: bbi * 1.25 }).obese, false)
assert.equal(run().obese, false)
assert.deepEqual(run(), run())

// Kosong → bernama; tanpa klirens/pita (dulu SCr kosong = pita "Kidney failure").
const kosong = run({ age: NaN, weightKg: NaN, scr: NaN })
assert.deepEqual(kosong.missing, ['age', 'weight', 'serum creatinine']); assert.equal(kosong.crcl, null); assert.equal(kosong.band, null)
// Regresi: usia 500 / BB 5000 / SCr 1e-6 lolos "> 0" dulu; kini ditolak dengan alasan.
assert.deepEqual(run({ age: 500 }).invalid, ['age must be 18–120 years']); assert.equal(run({ age: 500 }).crcl, null)
assert.deepEqual(run({ weightKg: 5000 }).invalid, ['weight must be 20–400 kg']); assert.deepEqual(run({ scr: 1e-6 }).invalid, ['serum creatinine must be 0.1–20 mg/dL'])
assert.deepEqual(run({ heightCm: 5 }).invalid, ['height must be 100–250 cm']); assert.equal(run({ heightCm: 5 }).crcl, null) // tinggi salah ditolak walau dasar aktual
for (const bad of [Infinity, -1, 0]) assert.equal(run({ scr: bad }).crcl, null, `SCr ${bad}`)
assert.equal(run({ age: '70' as unknown as number }).crcl, null)
assert.deepEqual(run({ sex: 'X' as unknown as 'M' }).invalid, ['sex must be M or F']); assert.equal(run({ sex: 'X' as unknown as 'M' }).crcl, null)
assert.deepEqual(run({ weightBasis: 'adjusted' as unknown as 'actual' }).invalid, ['weight basis must be actual or ideal'])
// Batas rentang: diterima; ± ditolak.
for (const [k, rg] of Object.entries(CG_RANGES)) {
  const o = k === 'heightCm' ? { heightCm: NaN } : {}
  assert.equal(run({ ...o, [k]: rg.min }).invalid.length, 0, `${k} min`); assert.equal(run({ ...o, [k]: rg.max }).invalid.length, 0, `${k} max`)
  assert.equal(run({ ...o, [k]: rg.min - 0.01 }).invalid.length, 1, `${k} <min`); assert.equal(run({ ...o, [k]: rg.max + 0.01 }).invalid.length, 1, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/CreatinineClearance.tsx', import.meta.url), 'utf8')
assert.ok(/cockcroftGault\(\{/.test(page) && /parseNumberField\(ageText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('cockcroft-gault: nilai tangan 41,67, pita 90/60/30/15, BBI Devine, obesitas 125%, kosong/di luar rentang gagal tertutup')
