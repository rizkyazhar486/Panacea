import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stopBang, stopBangBand, STOPBANG_RANGES, STOPBANG_THRESHOLDS } from '../../src/domains/clinical-calculators/index.ts'

const base = { stop: {}, sex: 'F', bmi: 24, age: 40, neckCm: 35 } as const
type In = Parameters<typeof stopBang>[0]
const run = (o: Partial<In> = {}) => stopBang({ ...base, ...o } as In)

// Positivo: tidak ada poin → 0/8 rendah; semua poin → 8/8 tinggi (nilai tangan: 4 STOP + BMI 36 + usia 51 + leher 41 + laki-laki).
assert.equal(run().total, 0); assert.equal(run().band?.label, 'Low risk'); assert.equal(run().band?.tone, 'brand')
const penuh = run({ stop: { snoring: true, tired: true, observed: true, pressure: true }, sex: 'M', bmi: 36, age: 51, neckCm: 41 })
assert.equal(penuh.stopScore, 4); assert.equal(penuh.bangScore, 4); assert.equal(penuh.total, 8); assert.equal(penuh.band?.label, 'High risk')
assert.deepEqual(run(), run()) // determinisme
// Pita: 2 rendah, 3 menengah, 4 menengah, 5 tinggi.
assert.deepEqual([2, 3, 4, 5].map((n) => stopBangBand(n).label), ['Low risk', 'Intermediate risk', 'Intermediate risk', 'High risk'])
// Batas ambang, berpasangan (hanya satu nilai berubah): tepat di ambang = 0 poin, +0,1/+1 = 1 poin.
assert.equal(run({ bmi: STOPBANG_THRESHOLDS.bmi }).bangScore, 0); assert.equal(run({ bmi: 35.1 }).bangScore, 1)
assert.equal(run({ age: STOPBANG_THRESHOLDS.age }).bangScore, 0); assert.equal(run({ age: 51 }).bangScore, 1)
assert.equal(run({ neckCm: STOPBANG_THRESHOLDS.neckCm }).bangScore, 0); assert.equal(run({ neckCm: 40.1 }).bangScore, 1)
assert.equal(run({ sex: 'F' }).bangScore, 0); assert.equal(run({ sex: 'M' }).bangScore, 1)
// Butir STOP: hanya `true` yang dihitung; kunci asing dan nilai bukan-boolean diabaikan.
assert.equal(run({ stop: { snoring: true } }).stopScore, 1)
assert.equal(run({ stop: { snoring: false, unknown: true } as Record<string, boolean> }).stopScore, 0)
assert.equal(run({ stop: { snoring: 'yes' as unknown as boolean } }).stopScore, 0)

// Kosong → bernama, tanpa skor/pita. Regresi: jenis kelamin kosong dulu jatuh ke 'M' (profil bawaan) dan memberi 1 poin diam-diam.
const kosong = run({ bmi: NaN, age: NaN, neckCm: NaN, sex: '' })
assert.deepEqual(kosong.missing, ['BMI', 'age', 'neck circumference', 'sex']); assert.equal(kosong.total, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ sex: '' }).missing, ['sex']); assert.equal(run({ sex: '' }).total, null)
assert.deepEqual(run({ sex: 'X' as unknown as 'M' }).missing, ['sex'])
assert.deepEqual(run({ neckCm: NaN }).missing, ['neck circumference'])
// Di luar rentang ditolak dengan alasan, tanpa skor — regresi: leher 400 cm / BMI 9999 dulu memberi poin.
assert.deepEqual(run({ neckCm: 400 }).invalid, ['neck circumference must be 20–80 cm']); assert.equal(run({ neckCm: 400 }).total, null)
assert.deepEqual(run({ bmi: 9999 }).invalid, ['BMI must be 10–80 kg/m²']); assert.equal(run({ bmi: 9999 }).band, null)
assert.equal(run({ age: 0 }).total, null); assert.equal(run({ age: -5 }).total, null)
for (const bad of [Infinity, -Infinity]) assert.equal(run({ age: bad }).total, null)
assert.equal(run({ age: '50' as unknown as number }).total, null)
// Penolakan tidak menghapus skor STOP yang sudah dijawab (informasi tetap tampil).
assert.equal(run({ stop: { snoring: true }, neckCm: 400 }).stopScore, 1)
// Batas rentang literal: diterima; ±1 ditolak.
for (const k of ['bmi', 'age', 'neckCm'] as const) {
  const { min, max } = STOPBANG_RANGES[k]
  assert.equal(run({ [k]: min }).invalid.length, 0, `${k} ${min}`); assert.equal(run({ [k]: max }).invalid.length, 0, `${k} ${max}`)
  assert.equal(run({ [k]: min - 1 }).invalid.length, 1, `${k} ${min - 1}`); assert.equal(run({ [k]: max + 1 }).invalid.length, 1, `${k} ${max + 1}`)
}

// Sumber halaman: memakai mesin domain, tidak membaca kolom kosong sebagai 0.
const halaman = readFileSync('src/pages/SleepApneaScreen.tsx', 'utf8').split('\n').filter((b) => !b.trim().startsWith('//')).join('\n')
assert.ok(/stopBang\(\{/.test(halaman), 'the page does not use the domain engine')
assert.ok(!/\|\| 0\)/.test(halaman), 'blank field is read as 0 again')
assert.ok(!/\bgetDemo\(\)/.test(halaman), 'the page substitutes the default profile again')
console.log('stop-bang: ok')
