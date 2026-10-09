import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { packYearScreen, PACK_YEAR_RANGES, USPSTF_2021 } from '../../src/domains/clinical-calculators/index.ts'

const base = { cigsPerDay: 20, yearsSmoked: 25, age: 60, quitYearsAgo: 0 }
type In = Parameters<typeof packYearScreen>[0]
const run = (o: Partial<In> = {}) => packYearScreen({ ...base, ...o })
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan: 20 batang/hari = 1 bungkus × 25 tahun = 25 bungkus-tahun; usia 60, masih merokok → layak.
close(run().packYears, 25); assert.equal(run().status, 'eligible')
close(run({ cigsPerDay: 10, yearsSmoked: 30 }).packYears, 15); assert.equal(run({ cigsPerDay: 10, yearsSmoked: 30 }).status, 'below-pack-years')
// Batas kriteria USPSTF, berpasangan: hanya satu kondisi berubah.
assert.equal(run({ yearsSmoked: 20 }).status, 'eligible') // tepat 20 bungkus-tahun
assert.equal(run({ yearsSmoked: 19.9 }).status, 'below-pack-years')
assert.equal(run({ age: 50 }).status, 'eligible'); assert.equal(run({ age: 49 }).status, 'pack-years-met-other-criteria-not')
assert.equal(run({ age: 80 }).status, 'eligible'); assert.equal(run({ age: 81 }).status, 'pack-years-met-other-criteria-not')
assert.equal(run({ quitYearsAgo: 15 }).status, 'eligible'); assert.equal(run({ quitYearsAgo: 16 }).status, 'pack-years-met-other-criteria-not')
// Tidak merokok (0 batang): 0 bungkus-tahun, bukan layak.
close(run({ cigsPerDay: 0 }).packYears, 0); assert.equal(run({ cigsPerDay: 0 }).status, 'below-pack-years')
assert.deepEqual(USPSTF_2021, { minAge: 50, maxAge: 80, minPackYears: 20, maxYearsSinceQuit: 15 })
assert.deepEqual(run(), run())

// Kosong → bernama, tanpa status. Regresi: usia kosong dulu terbaca 0 ("kriteria belum terpenuhi") dan
// "years since quitting" kosong terbaca 0 = masih merokok sehingga bisa dinyatakan layak.
const kosong = run({ cigsPerDay: NaN, yearsSmoked: NaN, age: NaN, quitYearsAgo: NaN })
assert.deepEqual(kosong.missing, ['cigarettes per day', 'years smoked', 'age', 'years since quitting']); assert.equal(kosong.status, null); assert.equal(kosong.packYears, null)
const tanpaBerhenti = run({ quitYearsAgo: NaN }); assert.deepEqual(tanpaBerhenti.missing, ['years since quitting']); assert.equal(tanpaBerhenti.status, null) // pasangan: sama dengan base kecuali kolom ini
assert.deepEqual(run({ age: NaN }).missing, ['age']); assert.equal(run({ age: NaN }).status, null)
// Di luar rentang ditolak dengan alasan; tanpa angka.
assert.deepEqual(run({ cigsPerDay: 1e6 }).invalid, ['cigarettes per day must be 0–200']); assert.equal(run({ cigsPerDay: 1e6 }).packYears, null)
assert.deepEqual(run({ yearsSmoked: 500 }).invalid, ['years smoked must be 0–90 years']); assert.deepEqual(run({ age: 500 }).invalid, ['age must be 10–120 years'])
assert.deepEqual(run({ quitYearsAgo: -1 }).invalid, ['years since quitting must be 0–100 years']); assert.equal(run({ quitYearsAgo: -1 }).status, null)
for (const bad of [Infinity, -Infinity]) assert.equal(run({ age: bad }).status, null)
assert.equal(run({ age: '60' as unknown as number }).status, null)
// Batas rentang literal: diterima; ±1 ditolak.
for (const [k, lo, hi] of [['cigsPerDay', 0, 200], ['yearsSmoked', 0, 90], ['age', 10, 120], ['quitYearsAgo', 0, 100]] as const) {
  assert.equal(run({ [k]: lo }).invalid.length, 0, `${k} ${lo}`); assert.equal(run({ [k]: hi }).invalid.length, 0, `${k} ${hi}`)
  assert.equal(run({ [k]: lo - 1 }).invalid.length, 1, `${k} ${lo - 1}`); assert.equal(run({ [k]: hi + 1 }).invalid.length, 1, `${k} ${hi + 1}`)
}
assert.equal(PACK_YEAR_RANGES.cigsPerDay.max, 200)

const page = readFileSync(new URL('../../src/pages/SubstanceUseScreen.tsx', import.meta.url), 'utf8')
assert.ok(/packYearScreen\(\{/.test(page) && /parseNumberField\(quitText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.status === 'eligible'/.test(page) && /hasil\.invalid\.length > 0/.test(page), 'halaman tidak memakai status/penolakan mesin')
assert.ok(/Enter 0 for years since quitting/.test(page), 'petunjuk "0 = masih merokok" hilang')
console.log('pack-year-screen: 25 bungkus-tahun, USPSTF 50–80/20/15 berpasangan, kosong ≠ 0, di luar rentang gagal tertutup')
