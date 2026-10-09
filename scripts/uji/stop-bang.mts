import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stopBang, stopBangBand, STOP_BANG_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { answers: {}, age: 40, bmi: 24, neckCm: 36, sex: 'F' } as const
type In = Parameters<typeof stopBang>[0]
const run = (o: Partial<In> = {}) => stopBang({ ...base, ...o } as In)

// Nilai tangan: tanpa butir → 0/8, Low risk.
assert.equal(run().total, 0); assert.equal(run().band?.label, 'Low risk')
// Semua butir: 4 STOP + BMI 36 + usia 51 + leher 41 + laki-laki = 8 → High risk.
const maks = run({ answers: { snoring: true, tired: true, observed: true, pressure: true }, bmi: 36, age: 51, neckCm: 41, sex: 'M' })
assert.equal(maks.total, 8); assert.equal(maks.stop, 4); assert.equal(maks.bang, 4); assert.equal(maks.band?.label, 'High risk')
// Tiap butir menambah tepat satu poin.
for (const k of ['snoring', 'tired', 'observed', 'pressure'] as const) assert.equal(run({ answers: { [k]: true } }).total, 1, k)
assert.equal(run({ sex: 'M' }).total, 1) // pasangan: hanya jenis kelamin yang beda dengan base
// Batas ambang: BMI >35, usia >50, leher >40 (tepat di ambang = 0 poin).
for (const [k, below, above] of [['bmi', 35, 35.1], ['age', 50, 51], ['neckCm', 40, 40.1]] as const) {
  assert.equal(run({ [k]: below }).total, 0, `${k} tepat di ambang`); assert.equal(run({ [k]: above }).total, 1, `${k} di atas ambang`)
}
// Pita: 0-2 Low, 3-4 Intermediate, 5-8 High.
for (const [s, l] of [[0, 'Low risk'], [2, 'Low risk'], [3, 'Intermediate risk'], [4, 'Intermediate risk'], [5, 'High risk'], [8, 'High risk']] as const) assert.equal(stopBangBand(s).label, l, `skor ${s}`)
assert.equal(stopBangBand(2).tone, 'brand'); assert.equal(stopBangBand(3).tone, 'low'); assert.equal(stopBangBand(5).tone, 'critical')
assert.deepEqual(run(), run())

// Kosong → bernama; tanpa skor/pita. Jenis kelamin kosong membawa poin sendiri → tidak dihitung.
const kosong = run({ age: NaN, bmi: NaN, neckCm: NaN, sex: '' })
assert.deepEqual(kosong.missing, ['age', 'BMI', 'neck circumference', 'sex']); assert.equal(kosong.total, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ sex: '' }).missing, ['sex']); assert.equal(run({ sex: '' }).total, null)
// Regresi: BMI 9000 / leher 1e6 / usia 500 dulu diam-diam memberi poin; kini ditolak tanpa skor.
assert.deepEqual(run({ bmi: 9000 }).invalid, ['BMI must be 10–80 kg/m²']); assert.equal(run({ bmi: 9000 }).total, null)
assert.deepEqual(run({ neckCm: 1e6 }).invalid, ['neck circumference must be 15–80 cm']); assert.deepEqual(run({ age: 500 }).invalid, ['age must be 18–120 years'])
for (const bad of [Infinity, -1, 0]) assert.equal(run({ neckCm: bad }).total, null, `leher ${bad}`)
assert.equal(run({ age: '40' as unknown as number }).total, null)
assert.deepEqual(run({ sex: 'X' as unknown as 'M' }).invalid, ['sex must be M or F'])
assert.deepEqual(run({ answers: { snoring: 1 as unknown as boolean } }).invalid, ['snoring must be yes or no'])
// Batas rentang: diterima; ± ditolak.
for (const [k, rg] of Object.entries(STOP_BANG_RANGES)) {
  assert.equal(run({ [k]: rg.min }).invalid.length, 0, `${k} min`); assert.equal(run({ [k]: rg.max }).invalid.length, 0, `${k} max`)
  assert.equal(run({ [k]: rg.min - 0.01 }).invalid.length, 1, `${k} <min`); assert.equal(run({ [k]: rg.max + 0.01 }).invalid.length, 1, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/SleepApneaScreen.tsx', import.meta.url), 'utf8')
assert.ok(/stopBang\(\{/.test(page) && /parseNumberField\(ageText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('stop-bang: 8 butir, ambang BMI/usia/leher, pita 3/5, kosong/di luar rentang gagal tertutup')
