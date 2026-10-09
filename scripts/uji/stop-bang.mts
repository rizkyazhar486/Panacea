import assert from 'node:assert/strict'
import { stopBang, stopBangBand, STOP_BANG_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const stop0 = { snoring: false, tired: false, observed: false, pressure: false }
const base = { age: 40, bmi: 25, neckCm: 35, sex: 'F', stop: stop0 } as const
type In = Parameters<typeof stopBang>[0]
const run = (o: Partial<In> = {}) => stopBang({ ...base, ...o } as In)

// Nilai tangan: tanpa butir apa pun → 0, Low risk.
assert.equal(run().total, 0); assert.equal(run().band?.label, 'Low risk')
// Semua butir → 8/8, High risk (STOP 4 + IMT 36, usia 51, leher 41, laki-laki).
const semua = run({ age: 51, bmi: 36, neckCm: 41, sex: 'M', stop: { snoring: true, tired: true, observed: true, pressure: true } })
assert.equal(semua.total, 8); assert.equal(semua.stopScore, 4); assert.equal(semua.bangScore, 4); assert.equal(semua.band?.label, 'High risk')
// Batas BANG: IMT >35, usia >50, leher >40 (tepat di batas = 0 poin; +1 langkah = 1 poin).
for (const [b, p] of [[35, 0], [35.1, 1]] as const) assert.equal(run({ bmi: b }).bangScore, p, `IMT ${b}`)
for (const [a, p] of [[50, 0], [51, 1]] as const) assert.equal(run({ age: a }).bangScore, p, `usia ${a}`)
for (const [n, p] of [[40, 0], [40.1, 1]] as const) assert.equal(run({ neckCm: n }).bangScore, p, `leher ${n}`)
// Pasangan: hanya jenis kelamin yang beda → tepat 1 poin.
assert.equal(run({ sex: 'M' }).total! - run({ sex: 'F' }).total!, 1)
// Tiap butir STOP menambah tepat 1.
for (const k of ['snoring', 'tired', 'observed', 'pressure'] as const) assert.equal(run({ stop: { ...stop0, [k]: true } }).stopScore, 1, k)
// Batas pita: 2 Low, 3 Intermediate, 4 Intermediate, 5 High.
for (const [s, l] of [[0, 'Low risk'], [2, 'Low risk'], [3, 'Intermediate risk'], [4, 'Intermediate risk'], [5, 'High risk'], [8, 'High risk']] as const) assert.equal(stopBangBand(s).label, l, `skor ${s}`)
assert.equal(stopBangBand(2).tone, 'brand'); assert.equal(stopBangBand(4).tone, 'low'); assert.equal(stopBangBand(5).tone, 'critical')
assert.deepEqual(run(), run())

// Kosong → bernama; tanpa skor/pita. Jenis kelamin kosong menahan skor (tidak lagi diam-diam laki-laki).
const kosong = run({ sex: '', age: NaN, bmi: NaN, neckCm: NaN })
assert.deepEqual(kosong.missing, ['sex', 'age', 'BMI', 'neck circumference']); assert.equal(kosong.total, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ sex: '' }).missing, ['sex']); assert.equal(run({ sex: '' }).total, null)
// Batas rentang: tepat di batas diterima; ±1 langkah di luar ditolak dengan alasan.
for (const [k, r] of Object.entries(STOP_BANG_RANGES)) {
  assert.notEqual(run({ [k]: r.min } as Partial<In>).total, null, `${k} min`)
  assert.notEqual(run({ [k]: r.max } as Partial<In>).total, null, `${k} max`)
  const rendah = run({ [k]: r.min - 0.1 } as Partial<In>); const tinggi = run({ [k]: r.max + 0.1 } as Partial<In>)
  assert.deepEqual(rendah.invalid, [`${r.name} must be ${r.min}–${r.max}${r.unit}`]); assert.equal(rendah.total, null)
  assert.deepEqual(tinggi.invalid, [`${r.name} must be ${r.min}–${r.max}${r.unit}`]); assert.equal(tinggi.band, null)
}
// Regresi: usia 500 / leher 1e6 lolos "> 0" dulu dan menambah poin BANG.
assert.equal(run({ age: 500 }).total, null); assert.equal(run({ neckCm: 1e6 }).total, null)
for (const bad of [Infinity, -1, 0]) assert.equal(run({ bmi: bad }).total, null, `IMT ${bad}`)
assert.equal(run({ age: '40' as unknown as number }).total, null)
assert.deepEqual(run({ sex: 'X' as unknown as 'M' }).invalid, ['sex must be M or F'])
assert.deepEqual(run({ stop: { ...stop0, tired: 1 as unknown as boolean } }).invalid, ['tired must be yes or no'])
assert.equal(run({ stop: undefined as unknown as In['stop'] }).total, null)
