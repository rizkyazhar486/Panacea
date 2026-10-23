import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { findrisc, findriscBand, findriscAgePts, findriscBmiPts, findriscWaistPts, FINDRISC_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { age: 40, bmi: 22, waist: 85, sex: 'M', active: true, veg: true, bpMed: false, highGlucose: false, family: 0 } as const
type In = Parameters<typeof findrisc>[0]
const run = (o: Partial<In> = {}) => findrisc({ ...base, ...o } as In)

// Nilai tangan: semua nol → 0 poin, pita Low.
assert.equal(run().score, 0); assert.equal(run().band?.label, 'Low')
// Jumlah semua butir: usia 60 (3) + IMT 28 (1) + pinggang M 100 (3) + tak aktif (2) + tanpa sayur (1) + obat TD (2) + glukosa tinggi (5) + keluarga 5 = 22 → Very high.
const maks = run({ age: 60, bmi: 28, waist: 100, active: false, veg: false, bpMed: true, highGlucose: true, family: 5 })
assert.equal(maks.score, 22); assert.equal(maks.band?.label, 'Very high')
// Tiap butir menambah tepat poinnya.
assert.equal(run({ active: false }).score, 2); assert.equal(run({ veg: false }).score, 1); assert.equal(run({ bpMed: true }).score, 2)
assert.equal(run({ highGlucose: true }).score, 5); assert.equal(run({ family: 3 }).score, 3); assert.equal(run({ family: 5 }).score, 5)
// Batas usia: <45 0, 45–54 2, 55–64 3, >64 4.
for (const [a, p] of [[44, 0], [45, 2], [54, 2], [55, 3], [64, 3], [65, 4]] as const) assert.equal(findriscAgePts(a), p, `usia ${a}`)
// Batas IMT: <25 0, 25–30 1, >30 3.
for (const [b, p] of [[24.9, 0], [25, 1], [30, 1], [30.1, 3]] as const) assert.equal(findriscBmiPts(b), p, `IMT ${b}`)
// Pinggang laki-laki <94 0, 94–102 3, >102 4; perempuan <80 0, 80–88 3, >88 4.
for (const [c, p] of [[93.9, 0], [94, 3], [102, 3], [102.1, 4]] as const) assert.equal(findriscWaistPts(c, 'M'), p, `M ${c}`)
for (const [c, p] of [[79.9, 0], [80, 3], [88, 3], [88.1, 4]] as const) assert.equal(findriscWaistPts(c, 'F'), p, `F ${c}`)
assert.notEqual(findriscWaistPts(85, 'M'), findriscWaistPts(85, 'F')) // pasangan: hanya jenis kelamin yang beda
// Batas pita: <7 Low; 7–11 Slightly elevated; 12–14 Moderate; 15–20 High; >20 Very high.
for (const [s, l] of [[6, 'Low'], [7, 'Slightly elevated'], [11, 'Slightly elevated'], [12, 'Moderate'], [14, 'Moderate'], [15, 'High'], [20, 'High'], [21, 'Very high']] as const) assert.equal(findriscBand(s).label, l, `skor ${s}`)
assert.equal(findriscBand(14).tone, 'low'); assert.equal(findriscBand(15).tone, 'critical'); assert.equal(findriscBand(11).risk, '~4% develop diabetes within 10 years')
assert.deepEqual(run(), run())

// Kosong → bernama; tanpa skor/pita.
const kosong = run({ age: NaN, bmi: NaN, waist: NaN })
assert.deepEqual(kosong.missing, ['age', 'BMI', 'waist circumference']); assert.equal(kosong.score, null); assert.equal(kosong.band, null)
// Regresi: usia 500, IMT 9000, pinggang 1e6 lolos "> 0" dulu; kini ditolak.
assert.deepEqual(run({ age: 500 }).invalid, ['age must be 18–120 years']); assert.equal(run({ age: 500 }).score, null)
assert.deepEqual(run({ bmi: 9000 }).invalid, ['BMI must be 10–80 kg/m²']); assert.deepEqual(run({ waist: 1e6 }).invalid, ['waist circumference must be 30–250 cm'])
for (const bad of [Infinity, -1, 0]) assert.equal(run({ waist: bad }).score, null, `pinggang ${bad}`)
assert.equal(run({ age: '40' as unknown as number }).score, null)
assert.deepEqual(run({ sex: 'X' as unknown as 'M' }).invalid, ['sex must be M or F'])
assert.deepEqual(run({ family: 4 as unknown as 0 }).invalid, ['family history must be 0, 3 or 5 points'])
assert.deepEqual(run({ bpMed: 1 as unknown as boolean }).invalid, ['bpMed must be yes or no']); assert.equal(run({ bpMed: 1 as unknown as boolean }).score, null)
// Batas rentang: diterima; ± ditolak.
for (const [k, rg] of Object.entries(FINDRISC_RANGES)) {
  assert.equal(run({ [k]: rg.min }).invalid.length, 0, `${k} min`); assert.equal(run({ [k]: rg.max }).invalid.length, 0, `${k} max`)
  assert.equal(run({ [k]: rg.min - 0.01 }).invalid.length, 1, `${k} <min`); assert.equal(run({ [k]: rg.max + 0.01 }).invalid.length, 1, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/Findrisc.tsx', import.meta.url), 'utf8')
assert.ok(/hitungFindrisc\(\{/.test(page) && /parseNumberField\(ageText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('findrisc: jumlah butir 22, batas usia/IMT/pinggang, pita 7/12/15/21, kosong/di luar rentang gagal tertutup')
