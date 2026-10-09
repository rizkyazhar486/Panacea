import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fena, fenaBand, FENA_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { urineNa: 20, plasmaCr: 2.0, plasmaNa: 140, urineCr: 60 }
const run = (o: Partial<typeof base> = {}) => fena({ ...base, ...o })
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan: (20×2.0)/(140×60)×100 = 40/8400×100 = 0.47619…% → prerenal.
const r = run(); close(r.fena, 40 / 8400 * 100); assert.equal(r.band?.label, 'Prerenal azotemia likely'); assert.equal(r.band?.tone, 'brand')
// Tiap faktor memengaruhi hasil sesuai rumus (UNa↑, PCr↑ naik; PNa↑, UCr↑ turun).
assert.ok(run({ urineNa: 40 }).fena! > r.fena!); assert.ok(run({ plasmaCr: 4 }).fena! > r.fena!); assert.ok(run({ plasmaNa: 150 }).fena! < r.fena!); assert.ok(run({ urineCr: 120 }).fena! < r.fena!)
close(run({ urineNa: 40 }).fena, 2 * r.fena!); close(run({ urineCr: 120 }).fena, r.fena! / 2)
// Ambang pita: <1 prerenal; 1–2 tak tentu (1 dan 2 termasuk); >2 intrinsik.
assert.equal(fenaBand(0.99).label, 'Prerenal azotemia likely'); assert.equal(fenaBand(1).label, 'Indeterminate zone'); assert.equal(fenaBand(2).label, 'Indeterminate zone')
assert.equal(fenaBand(2.01).label, 'Intrinsic renal injury (e.g. ATN) likely'); assert.equal(fenaBand(2.01).tone, 'critical'); assert.equal(fenaBand(1.5).tone, 'low')
// Melalui mesin: FeNa tepat 1% dan 2% (UNa×PCr/(PNa×UCr)×100): UNa 28, PCr 1, PNa 140, UCr 20 → 28/2800×100 = 1.
assert.equal(run({ urineNa: 28, plasmaCr: 1, plasmaNa: 140, urineCr: 20 }).band?.label, 'Indeterminate zone')
assert.equal(run({ urineNa: 27.9, plasmaCr: 1, plasmaNa: 140, urineCr: 20 }).band?.label, 'Prerenal azotemia likely') // pasangan di 1%
assert.equal(run({ urineNa: 56, plasmaCr: 1, plasmaNa: 140, urineCr: 20 }).band?.label, 'Indeterminate zone') // tepat 2%
assert.equal(run({ urineNa: 56.1, plasmaCr: 1, plasmaNa: 140, urineCr: 20 }).band?.label, 'Intrinsic renal injury (e.g. ATN) likely') // pasangan di 2%
assert.deepEqual(run(), run())

// Kosong → bernama; tanpa FeNa/pita (dulu angka 0 memicu "Prerenal azotemia likely").
const kosong = run({ urineNa: NaN, plasmaCr: NaN, plasmaNa: NaN, urineCr: NaN })
assert.deepEqual(kosong.missing, ['urine sodium', 'plasma creatinine', 'plasma sodium', 'urine creatinine']); assert.equal(kosong.fena, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ urineCr: NaN }).missing, ['urine creatinine']); assert.equal(run({ urineCr: NaN }).fena, null)
// Regresi: UNa 1e9, PNa 1 atau UCr 0.0001 lolos "> 0" dulu; kini ditolak, dengan alasan dan tanpa FeNa.
assert.deepEqual(run({ urineNa: 1e9 }).invalid, ['urine sodium must be 0.1–400 mEq/L']); assert.equal(run({ urineNa: 1e9 }).fena, null)
assert.deepEqual(run({ plasmaNa: 1 }).invalid, ['plasma sodium must be 90–200 mEq/L']); assert.deepEqual(run({ urineCr: 0.0001 }).invalid, ['urine creatinine must be 1–1500 mg/dL'])
assert.deepEqual(run({ plasmaCr: 500 }).invalid, ['plasma creatinine must be 0.1–30 mg/dL']); assert.equal(run({ plasmaCr: 500 }).band, null)
for (const bad of [Infinity, -1, 0]) assert.equal(run({ plasmaNa: bad }).fena, null, `PNa ${bad}`)
assert.equal(run({ urineNa: '20' as unknown as number }).fena, null)
// Batas rentang: diterima; ± ditolak.
for (const [k, rg] of Object.entries(FENA_RANGES)) {
  assert.notEqual(run({ [k]: rg.min }).fena, null, `${k} min`); assert.notEqual(run({ [k]: rg.max }).fena, null, `${k} max`)
  assert.equal(run({ [k]: rg.min - 0.01 }).fena, null, `${k} <min`); assert.equal(run({ [k]: rg.max + 0.01 }).fena, null, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/FenaCalculator.tsx', import.meta.url), 'utf8')
assert.ok(/hitungFena\(\{/.test(page) && /parseNumberField\(urineNaText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
assert.ok(/const \[onDiuretics, setOnDiuretics\] = useState\(false\)/.test(page) && /onDiuretics && \(/.test(page), 'peringatan diuretik hilang')
console.log('fena: nilai tangan 0,476%, skala tiap faktor, ambang 1%/2% berpasangan, kosong/di luar rentang gagal tertutup')
