import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fena, fenaBand, FENA_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const base = { urineNa: 20, plasmaNa: 140, urineCr: 60, plasmaCr: 2 }
const run = (o: Record<string, number> = {}) => fena({ ...base, ...o })
const data = (o: Record<string, number> = {}) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data : (undefined as never) }

// Nilai tangan: (20×2)/(140×60)×100 = 0,47619…% → prerenal.
const d = data()
assert.ok(Math.abs(d.fena - (40 / 8400) * 100) < 1e-12)
assert.deepEqual(d.band, { label: 'Prerenal azotemia likely', tone: 'brand' })
// UNa 0 sah: FeNa 0 (urin bebas natrium), bukan "belum diisi".
assert.equal(data({ urineNa: 0 }).fena, 0)
// Pita tepat di batas: <1 prerenal, 1–2 ragu, >2 intrinsik.
for (const [v, l] of [[0.99, 'Prerenal azotemia likely'], [1, 'Indeterminate zone'], [2, 'Indeterminate zone'], [2.01, 'Intrinsic renal injury (e.g. ATN) likely']] as const) assert.equal(fenaBand(v).label, l, `fena ${v}`)
assert.equal(fenaBand(0.99).tone, 'brand'); assert.equal(fenaBand(1).tone, 'low'); assert.equal(fenaBand(2.01).tone, 'critical')
assert.deepEqual(run(), run())

// Regresi vs halaman lama (rumus identik) pada grid.
let n = 0
for (const una of [5, 20, 60, 150]) for (const pcr of [0.8, 2, 6]) for (const pna of [120, 140, 155]) for (const ucr of [20, 60, 200]) {
  const lama = ((una * pcr) / (pna * ucr)) * 100
  const r = data({ urineNa: una, plasmaCr: pcr, plasmaNa: pna, urineCr: ucr })
  assert.equal(r.fena, lama); assert.deepEqual(r.band, fenaBand(lama)); n++
}
assert.equal(n, 4 * 3 * 3 * 3)

// Rentang dipatok literal; batas diterima, di luar ditolak tanpa data.
assert.deepEqual(JSON.parse(JSON.stringify(FENA_RANGES)), {
  urineNa: { min: 0, max: 300, name: 'Urine sodium', unit: ' mEq/L' }, plasmaNa: { min: 90, max: 200, name: 'Plasma sodium', unit: ' mEq/L' },
  urineCr: { min: 1, max: 500, name: 'Urine creatinine', unit: ' mg/dL' }, plasmaCr: { min: 0.1, max: 30, name: 'Plasma creatinine', unit: ' mg/dL' },
})
for (const k of Object.keys(FENA_RANGES) as (keyof typeof FENA_RANGES)[]) {
  const { min, max, name, unit } = FENA_RANGES[k]
  assert.equal(run({ [k]: min }).ok, true, `${k} min`); assert.equal(run({ [k]: max }).ok, true, `${k} max`)
  for (const bad of [min - 0.001, max + 0.001, Number.NaN, Infinity, -Infinity]) {
    const r = run({ [k]: bad }); assert.deepEqual(r, { ok: false, reason: `${name} must be ${min}–${max}${unit}` }, `${k}=${bad}`); assert.equal('data' in r, false)
  }
  for (const salah of [null, '5', undefined, {}] as unknown as number[]) assert.equal(run({ [k]: salah }).ok, false, `${k} tipe`)
}
// Regresi: Na plasma 9999 / kreatinin urin 500000 dulu lolos "> 0" dan memberi FeNa palsu; kolom kosong tidak lagi terbaca 0.
assert.deepEqual(run({ plasmaNa: 9999 }), { ok: false, reason: 'Plasma sodium must be 90–200 mEq/L' })
assert.deepEqual(run({ plasmaCr: 500 }), { ok: false, reason: 'Plasma creatinine must be 0.1–30 mg/dL' })
assert.deepEqual(run({ urineNa: parseNumberField('') }), { ok: false, reason: 'Urine sodium must be 0–300 mEq/L' })
assert.deepEqual(run({ urineNa: -1, plasmaCr: 999 }), { ok: false, reason: 'Urine sodium must be 0–300 mEq/L' }) // urutan terdokumentasi

// Halaman.
const src = readFileSync('src/pages/FenaCalculator.tsx', 'utf8')
assert.ok(src.includes("import { fena, parseNumberField } from '../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src))
assert.ok(!/\/ denom|function interpret|\* 100/.test(src), 'rumus tidak boleh disalin ke halaman')
assert.ok(src.includes('{res.ok ? ('))

console.log('fena: hand value, band cutoffs, UNa 0 valid, 108-case old-formula regression, fail-closed ranges, PNa 9999 rejected')
