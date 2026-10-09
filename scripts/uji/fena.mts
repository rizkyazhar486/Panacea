import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fena, fenaBand, FENA_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { urineNa: 20, plasmaCr: 2.0, plasmaNa: 140, urineCr: 60 }
const run = (o: Partial<typeof base> = {}) => fena({ ...base, ...o })

// Positif — nilai referensi tangan: (20×2)/(140×60)×100 = 0,47619 % → prarenal.
const ok = run(); assert.ok(Math.abs(ok.fena! - 0.47619) < 1e-4); assert.equal(ok.band?.label, 'Prerenal azotemia likely'); assert.equal(ok.band?.tone, 'brand')
assert.deepEqual(ok.missing, []); assert.deepEqual(ok.invalid, [])
assert.deepEqual(run(), run()) // deterministik

// Batas pita: tepat 1 → tak tentu (bukan prarenal), tepat 2 → tak tentu (bukan intrinsik), sedikit di atasnya → intrinsik.
assert.equal(fenaBand(0.99).label, 'Prerenal azotemia likely'); assert.equal(fenaBand(1).label, 'Indeterminate zone')
assert.equal(fenaBand(2).label, 'Indeterminate zone'); assert.equal(fenaBand(2.01).label, 'Intrinsic renal injury (e.g. ATN) likely')
assert.equal(fenaBand(2.01).tone, 'critical'); assert.equal(fenaBand(1.5).tone, 'low')
// Pasangan: hanya UNa berbeda (20 → 60) memindahkan 0,48 % ke 1,43 % (tak tentu) dan 120 → 2,86 % (intrinsik).
assert.equal(run({ urineNa: 60 }).band?.label, 'Indeterminate zone'); assert.equal(run({ urineNa: 120 }).band?.label, 'Intrinsic renal injury (e.g. ATN) likely')

// Negatif — kosong: bernama, tanpa angka dan tanpa pita (dulu semua 0 → tidak ada hasil, tetapi halaman menjaga sendiri).
const kosong = run({ urineNa: NaN, plasmaCr: NaN, plasmaNa: NaN, urineCr: NaN })
assert.deepEqual(kosong.missing, ['urine sodium', 'plasma sodium', 'urine creatinine', 'plasma creatinine']); assert.equal(kosong.fena, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ plasmaNa: NaN }).missing, ['plasma sodium']); assert.equal(run({ plasmaNa: NaN }).fena, null)
// Negatif — di luar rentang / bukan angka: ditolak dengan alasan, tanpa angka.
assert.deepEqual(run({ plasmaNa: 1400 }).invalid, ['plasma sodium must be 100–180 mEq/L']); assert.equal(run({ plasmaNa: 1400 }).fena, null)
assert.deepEqual(run({ plasmaCr: 200 }).invalid, ['plasma creatinine must be 0.1–30 mg/dL'])
for (const bad of [Infinity, -20, 0]) assert.equal(run({ urineNa: bad }).fena, null, `UNa ${bad}`)
assert.equal(run({ urineCr: '60' as unknown as number }).fena, null)
// Rentang: batas diterima, ± ditolak.
for (const [k, r] of Object.entries(FENA_RANGES)) {
  assert.notEqual(run({ [k]: r.min }).fena, null, `${k} min`); assert.notEqual(run({ [k]: r.max }).fena, null, `${k} max`)
  assert.equal(run({ [k]: r.min - 0.01 }).fena, null, `${k} <min`); assert.equal(run({ [k]: r.max + 0.01 }).fena, null, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/FenaCalculator.tsx', import.meta.url), 'utf8')
assert.ok(/fena\(\{ urineNa, plasmaCr, plasmaNa, urineCr \}\)/.test(page) && /parseNumberField\(urineNaText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('fena: rumus Espinel, batas pita 1/2, kosong/di luar rentang gagal tertutup')
