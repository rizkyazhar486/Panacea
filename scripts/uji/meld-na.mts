import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { meldNa, meldBand, MELD_RANGES } from '../../src/domains/clinical-calculators/index.ts'

const base = { bilirubin: 2.0, inr: 1.5, creatinine: 1.2, sodium: 135, dialysis: false }
const run = (o: Partial<typeof base> = {}) => meldNa({ ...base, ...o })
const close = (a: number | null, b: number, e = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < e, `${a} vs ${b}`)

// Nilai tangan (dihitung tanpa mesin): MELD = 3.78·ln2 + 11.2·ln1.5 + 9.57·ln1.2 + 6.43.
const m = 3.78 * Math.log(2) + 11.2 * Math.log(1.5) + 9.57 * Math.log(1.2) + 6.43
const r = run(); close(r.meld, m); assert.ok(m > 11)
close(r.meldNa, m + 1.32 * 2 - 0.033 * m * 2) // Na 135 → (137 − 135) = 2
assert.equal(r.band?.label, 'Moderate priority'); assert.equal(r.band?.tone, 'low')
// Lantai 1,0: nilai lab di bawah 1 diperlakukan 1; semua di lantai → MELD = 6.43 → dilantai 6; MELD ≤ 11 → tanpa penyesuaian Na.
const lantai = run({ bilirubin: 0.5, inr: 0.8, creatinine: 0.6, sodium: 137 }); close(lantai.meld, 6.43); close(lantai.meldNa, 6.43)
const lantai2 = run({ bilirubin: 0.5, inr: 0.8, creatinine: 0.6, sodium: 125 }); close(lantai2.meldNa, 6.43) // MELD ≤ 11 → Na diabaikan
// Kreatinin dibatasi 4,0 dan dipatok 4,0 pada dialisis (kreatinin tidak diminta).
close(run({ creatinine: 9 }).meld, run({ creatinine: 4 }).meld); close(run({ dialysis: true, creatinine: NaN }).meld, run({ creatinine: 4 }).meld)
assert.equal(run({ dialysis: true, creatinine: NaN }).missing.length, 0)
assert.notEqual(run({ creatinine: 1.2 }).meld, run({ creatinine: 1.2, dialysis: true }).meld)
// Na dibatasi [125, 137]: Na 110 sama dengan 125; Na 140 sama dengan 137 (tanpa penyesuaian).
close(run({ sodium: 110 }).meldNa, run({ sodium: 125 }).meldNa); close(run({ sodium: 150 }).meldNa, run({ sodium: 137 }).meldNa)
// Batas atas 40 dan bawah 6.
const tinggi = run({ bilirubin: 60, inr: 10, creatinine: 20, sodium: 100 }); assert.equal(tinggi.meldNa, 40); assert.equal(tinggi.meld, 40); assert.equal(tinggi.band?.label, 'Extremely high priority')
assert.equal(run({ bilirubin: 0.1, inr: 0.5, creatinine: 0.1, sodium: 137 }).meldNa, 6.43 > 6 ? 6.43 : 6)

// Pita: ≥40, ≥30, ≥20, ≥10 dan di bawahnya (tepat dan ±).
const bands: [number, string, string, string][] = [[9.9, 'Low priority', 'brand', '~2% 3-month mortality'], [10, 'Moderate priority', 'low', '~6% 3-month mortality'], [19.9, 'Moderate priority', 'low', '~6% 3-month mortality'], [20, 'High priority', 'critical', '~20% 3-month mortality'], [29.9, 'High priority', 'critical', '~20% 3-month mortality'], [30, 'Very high priority', 'critical', '~53% 3-month mortality'], [39.9, 'Very high priority', 'critical', '~53% 3-month mortality'], [40, 'Extremely high priority', 'critical', '~71% 3-month mortality']]
for (const [v, label, tone, mort] of bands) { const b = meldBand(v); assert.equal(b.label, label, String(v)); assert.equal(b.tone, tone, String(v)); assert.equal(b.mortality, mort, String(v)) }
assert.deepEqual(run(), run())

// Kosong → bernama, tanpa angka dan tanpa pita (dulu halaman kosong = MELD 6 "Low priority ~2%").
const kosong = run({ bilirubin: NaN, inr: NaN, creatinine: NaN, sodium: NaN })
assert.deepEqual(kosong.missing, ['total bilirubin', 'INR', 'creatinine', 'sodium']); assert.equal(kosong.meld, null); assert.equal(kosong.meldNa, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ sodium: NaN }).missing, ['sodium']); assert.deepEqual(run({ inr: NaN }).missing, ['INR'])
// Regresi: bilirubin 1e9 / INR 1e5 / kreatinin 0.0001 lolos "> 0" dulu; kini ditolak, dengan alasan dan tanpa skor.
assert.deepEqual(run({ bilirubin: 1e9 }).invalid, ['total bilirubin must be 0.1–60 mg/dL']); assert.equal(run({ bilirubin: 1e9 }).meldNa, null)
assert.deepEqual(run({ inr: 100 }).invalid, ['INR must be 0.5–10']); assert.deepEqual(run({ creatinine: 0.001 }).invalid, ['creatinine must be 0.1–20 mg/dL'])
assert.deepEqual(run({ sodium: 5 }).invalid, ['sodium must be 100–180 mEq/L'])
assert.equal(run({ dialysis: true, creatinine: 999 }).meldNa !== null, true) // dialisis: kreatinin tidak dipakai, tidak divalidasi
for (const bad of [Infinity, -1, 0]) assert.equal(run({ inr: bad }).meldNa, null, `INR ${bad}`)
assert.equal(run({ bilirubin: '2' as unknown as number }).meldNa, null)
// Batas rentang: diterima; ± ditolak.
for (const [k, rg] of Object.entries(MELD_RANGES)) {
  assert.notEqual(run({ [k]: rg.min }).meldNa, null, `${k} min`); assert.notEqual(run({ [k]: rg.max }).meldNa, null, `${k} max`)
  assert.equal(run({ [k]: rg.min - 0.01 }).meldNa, null, `${k} <min`); assert.equal(run({ [k]: rg.max + 0.01 }).meldNa, null, `${k} >max`)
}

const page = readFileSync(new URL('../../src/pages/clinical/scores/MeldScore.tsx', import.meta.url), 'utf8')
assert.ok(/hitungMeld\(/.test(page) && /parseNumberField\(bilirubinText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('meld-na: nilai tangan, lantai 1,0, batas Na/kreatinin, dialisis, pita di ambang, kosong/di luar rentang gagal tertutup')
