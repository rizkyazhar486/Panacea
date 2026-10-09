import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { waistHeightRatio, WHTR_RANGES, WHTR_BANDS } from '../../src/domains/clinical-calculators/index.ts'

const base = { waist: 80, height: 170 }
type In = Parameters<typeof waistHeightRatio>[0]
const run = (o: Partial<In> = {}) => waistHeightRatio({ ...base, ...o })
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan: 80 ÷ 170 = 0,470588…; 85 ÷ 170 = 0,5 persis; 102 ÷ 170 = 0,6 persis.
close(run().ratio, 80 / 170); assert.equal(run().band?.label, 'Lower risk'); assert.equal(run().band?.tone, 'brand')
assert.deepEqual(WHTR_BANDS, { increased: 0.5, high: 0.6 })
// Batas pita, berpasangan (hanya pinggang berubah): <0,5 rendah; 0,5 meningkat; <0,6 meningkat; 0,6 tinggi.
assert.equal(run({ waist: 84.9 }).band?.label, 'Lower risk')
assert.equal(run({ waist: 85 }).band?.label, 'Increased risk'); assert.equal(run({ waist: 85 }).band?.tone, 'low')
assert.equal(run({ waist: 101.9 }).band?.label, 'Increased risk')
assert.equal(run({ waist: 102 }).band?.label, 'High risk'); assert.equal(run({ waist: 102 }).band?.tone, 'critical')
assert.deepEqual(run(), run()) // determinisme

// Kosong → bernama, tanpa rasio/pita. Regresi: tinggi kosong dulu → 0 → Infinity → "High risk"; pinggang kosong → "0.00 Lower risk".
const kosong = run({ waist: NaN, height: NaN })
assert.deepEqual(kosong.missing, ['waist circumference', 'height']); assert.equal(kosong.ratio, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ height: NaN }).missing, ['height']); assert.equal(run({ height: NaN }).band, null)
assert.deepEqual(run({ waist: NaN }).missing, ['waist circumference']); assert.equal(run({ waist: NaN }).ratio, null)
// Di luar rentang ditolak dengan alasan; tanpa angka. 0 (nilai lama kolom kosong) ditolak, bukan dibagi.
assert.deepEqual(run({ height: 0 }).invalid, ['height must be 100–230 cm']); assert.equal(run({ height: 0 }).ratio, null)
assert.deepEqual(run({ waist: 0 }).invalid, ['waist circumference must be 40–200 cm']); assert.equal(run({ waist: 0 }).band, null)
assert.deepEqual(run({ waist: 1e6 }).invalid, ['waist circumference must be 40–200 cm'])
for (const bad of [Infinity, -Infinity]) assert.equal(run({ height: bad }).band, null)
assert.equal(run({ height: '170' as unknown as number }).ratio, null)
// Batas rentang literal: diterima; ±1 ditolak.
for (const [k, lo, hi] of [['waist', 40, 200], ['height', 100, 230]] as const) {
  assert.deepEqual(WHTR_RANGES[k].min, lo); assert.deepEqual(WHTR_RANGES[k].max, hi)
  assert.equal(run({ [k]: lo }).invalid.length, 0, `${k} ${lo}`); assert.equal(run({ [k]: hi }).invalid.length, 0, `${k} ${hi}`)
  assert.equal(run({ [k]: lo - 1 }).invalid.length, 1, `${k} ${lo - 1}`); assert.equal(run({ [k]: hi + 1 }).invalid.length, 1, `${k} ${hi + 1}`)
}

// Sumber halaman: memakai mesin domain, profil tersimpan, dan tidak lagi menyulih nilai bawaan.
const halaman = readFileSync('src/pages/SelfAssessmentToolkit.tsx', 'utf8').split('\n').filter((b) => !b.trim().startsWith('//')).join('\n')
assert.ok(/waistHeightRatio\(\{/.test(halaman), 'the page does not use the domain engine')
assert.ok(/getDemoTersimpan\(\)/.test(halaman), 'the page must read the stored profile only')
assert.ok(!/\bgetDemo\(\)/.test(halaman), 'the page substitutes the default profile again')
assert.ok(!/useState\(80\)/.test(halaman), 'the waist field starts pre-filled again')
assert.ok(!/\|\| 0\)/.test(halaman.slice(halaman.indexOf('function WaistHeightRatio'), halaman.indexOf('const TABS'))), 'blank field is read as 0 again')
console.log('waist-height-ratio: ok')
