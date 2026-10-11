import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stopBang, stopBangBand, STOP_BANG_RANGES, STOP_BANG_THRESHOLDS } from '../../src/domains/clinical-calculators/index.ts'

const base = { snoring: false, tired: false, observed: false, pressure: false, bmi: 24, age: 40, neckCm: 36, sex: 'F' as const }
type In = Parameters<typeof stopBang>[0]
const run = (o: Partial<In> = {}) => stopBang({ ...base, ...o })

// Nilai tangan (Chung 2008): tanpa faktor = 0/8 rendah; semua faktor = 8/8 tinggi.
assert.deepEqual([run().stop, run().bang, run().total, run().band], [0, 0, 0, 'low'])
const semua = run({ snoring: true, tired: true, observed: true, pressure: true, bmi: 40, age: 60, neckCm: 45, sex: 'M' })
assert.deepEqual([semua.stop, semua.bang, semua.total, semua.band], [4, 4, 8, 'high'])
// Pita pada batas: 2→rendah, 3→menengah, 4→menengah, 5→tinggi.
assert.deepEqual([0, 2, 3, 4, 5, 8].map(stopBangBand), ['low', 'low', 'intermediate', 'intermediate', 'high', 'high'])
// Ambang BANG berpasangan: tepat di ambang = 0 poin, +1 langkah = 1 poin (hanya satu kondisi berubah).
assert.equal(run({ bmi: 35 }).bang, 0); assert.equal(run({ bmi: 35.1 }).bang, 1)
assert.equal(run({ age: 50 }).bang, 0); assert.equal(run({ age: 51 }).bang, 1)
assert.equal(run({ neckCm: 40 }).bang, 0); assert.equal(run({ neckCm: 40.1 }).bang, 1)
assert.equal(run({ sex: 'F' }).bang, 0); assert.equal(run({ sex: 'M' }).bang, 1)
for (const k of ['snoring', 'tired', 'observed', 'pressure'] as const) assert.equal(run({ [k]: true }).stop, 1, k)
assert.deepEqual(STOP_BANG_THRESHOLDS, { bmi: 35, age: 50, neckCm: 40 })
assert.deepEqual(run(), run())

// Kosong → bernama, tanpa skor. Pasangan: base lengkap menghasilkan skor.
const kosong = run({ bmi: NaN, age: NaN, neckCm: NaN, sex: '' })
assert.deepEqual(kosong.missing, ['sex', 'BMI', 'age', 'neck circumference']); assert.equal(kosong.total, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ sex: '' }).missing, ['sex']); assert.equal(run({ sex: '' }).total, null) // jenis kelamin tak ditebak
assert.deepEqual(run({ neckCm: NaN }).missing, ['neck circumference']); assert.equal(run({ neckCm: NaN }).total, null)
// Regresi: leher 400 cm dan IMT 9999 dulu mendapat poin; kini ditolak dengan alasan, tanpa skor.
assert.deepEqual(run({ neckCm: 400 }).invalid, ['neck circumference must be 20–100 cm']); assert.equal(run({ neckCm: 400 }).bang, null)
assert.deepEqual(run({ bmi: 9999 }).invalid, ['BMI must be 10–100 kg/m²']); assert.equal(run({ bmi: 9999 }).total, null)
assert.deepEqual(run({ age: -5 }).invalid, ['age must be 10–120 years'])
for (const bad of [Infinity, -Infinity]) assert.equal(run({ age: bad }).total, null)
assert.equal(run({ age: '51' as unknown as number }).total, null)
assert.equal(run({ sex: 'X' as unknown as 'M' }).total, null)
// Batas rentang literal: diterima; ±1 ditolak.
for (const k of ['bmi', 'age', 'neckCm'] as const) {
  const { min, max } = STOP_BANG_RANGES[k]
  assert.equal(run({ [k]: min }).invalid.length, 0, `${k} min`); assert.equal(run({ [k]: max }).invalid.length, 0, `${k} max`)
  assert.equal(run({ [k]: min - 1 }).invalid.length, 1, `${k} min-1`); assert.equal(run({ [k]: max + 1 }).invalid.length, 1, `${k} max+1`)
}

const page = readFileSync(new URL('../../src/pages/SleepApneaScreen.tsx', import.meta.url), 'utf8')
assert.ok(/stopBang\(\{/.test(page) && /parseNumberField\(neckText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.band/.test(page) && /hasil\.invalid\.length > 0/.test(page), 'halaman tidak memakai band/penolakan mesin')
console.log('stop-bang: 0–8 Chung 2008, ambang berpasangan, kosong ≠ 0, di luar rentang gagal tertutup')
