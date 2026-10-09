import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { meldNa, MELD_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { bilirubin: 2, inr: 1.5, creatinine: 1.2, sodium: 135, dialysis: false }
const run = (o: Partial<typeof base> = {}) => meldNa({ ...base, ...o })
const near = (a: number | null, b: number, tol = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < tol, `${a} ≉ ${b}`)

// Nilai tangan: MELD = 3.78 ln2 + 11.2 ln1.5 + 9.57 ln1.2 + 6.43; Na 135 → +1.32·2 − 0.033·MELD·2.
const meld0 = 3.78 * Math.log(2) + 11.2 * Math.log(1.5) + 9.57 * Math.log(1.2) + 6.43
const ref = run(); near(ref.meld, meld0); near(ref.meldNa, meld0 + 1.32 * 2 - 0.033 * meld0 * 2)
// Semua lantai (1,0) → 6,43 (konstanta rumus); Na 137 tidak menambah apa pun.
const lantai = run({ bilirubin: 1, inr: 1, creatinine: 1, sodium: 137 }); near(lantai.meld, 6.43); near(lantai.meldNa, 6.43) // 6,43 ≥ 6 (lantai skor) dan MELD ≤ 11 → tanpa penyesuaian Na
// Dialisis memaksa kreatinin 4,0 dan kreatinin tidak lagi wajib.
const dial = run({ creatinine: Number.NaN, dialysis: true }); assert.deepEqual(dial.missing, [])
near(dial.meld, 3.78 * Math.log(2) + 11.2 * Math.log(1.5) + 9.57 * Math.log(4) + 6.43)
// Tanpa dialisis, kreatinin kosong tidak boleh dilunakkan menjadi 1,0.
assert.deepEqual(run({ creatinine: Number.NaN }).missing, ['creatinine'])
// Langit-langit 40 hanya dari data sah.
assert.equal(run({ bilirubin: 80, inr: 20, creatinine: 4, sodium: 125 }).meldNa, 40)
// Na terjepit [125,137]: 120 setara 125; 140 setara 137.
assert.equal(run({ sodium: 120 }).meldNa, run({ sodium: 125 }).meldNa); assert.equal(run({ sodium: 140 }).meldNa, run({ sodium: 137 }).meldNa)

// Negatif: kosong → missing, tanpa skor (bukan MELD 6 "prioritas rendah").
const kosong = meldNa({ bilirubin: NaN, inr: NaN, creatinine: NaN, sodium: NaN, dialysis: false })
assert.deepEqual(kosong.missing, ['total bilirubin', 'INR', 'creatinine', 'sodium']); assert.equal(kosong.meld, null); assert.equal(kosong.meldNa, null)
// Negatif: di luar rentang / bukan angka → invalid, tanpa skor; berpasangan dengan kasus sah di batas.
for (const [k, lo, hi] of [['bilirubin', 0.1, 80], ['inr', 0.5, 20], ['creatinine', 0.1, 30], ['sodium', 90, 180]] as const) {
  assert.notEqual(run({ [k]: lo }).meldNa, null, `${k} batas bawah sah`); assert.notEqual(run({ [k]: hi }).meldNa, null, `${k} batas atas sah`)
  for (const bad of [lo - 0.01, hi + 0.01, 0, -1, Infinity, -Infinity]) {
    const r = run({ [k]: bad }); assert.equal(r.meldNa, null, `${k}=${bad}`); assert.equal(r.invalid.length, 1); assert.equal(r.missing.length, 0)
  }
}
assert.equal(run({ bilirubin: 5000 }).meldNa, null)
assert.equal(run({ inr: '1.5' as unknown as number }).meldNa, null)
assert.equal(run({ dialysis: 'true' as unknown as boolean }).meldNa, run().meldNa) // hanya `true` tepat yang memicu dialisis
// Kreatinin di luar rentang saat dialisis diabaikan (rumus memaksa 4,0).
assert.notEqual(run({ creatinine: 999, dialysis: true }).meldNa, null)
// Determinisme.
assert.deepEqual(run(), run())
// Halaman memakai domain, bukan `|| 0`.
const halaman = readFileSync(new URL('../../src/pages/clinical/scores/MeldScore.tsx', import.meta.url), 'utf8')
assert.ok(!/\|\| 0\)/.test(halaman)); assert.ok(Object.keys(MELD_RANGES).length === 4)
console.log('meld-na OK')
