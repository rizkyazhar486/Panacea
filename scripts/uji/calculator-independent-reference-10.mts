// C6 (bagian rekayasa), tahap 10: koreksi natrium Katz dan penilaian kalium (electrolyteCorrection), aturan McDonald, zona 2 / kekuatan genggam
// (movementInputs) dan parseNumberField. Acuan ditulis TERPISAH; pembulatan zona 2 diperiksa terhadap aritmetika bilangan bulat (persepuluh tahun).
// Bukti rekayasa, BUKAN tinjauan klinis; temuan dan konstanta tanpa sumber dicatat di docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  GLUCOSE_MG_DL, GRIP_KG, MCDONALD_FUNDAL_CM, POTASSIUM_MEQ_L, SODIUM_MEQ_L, ZONE2_AGE_YEARS, correctedSodium, correctedSodiumKatz, mcdonaldGestationalAge,
  parseNumberField, potassiumAssessment, potassiumDeficit, validateGripKg, zone2HeartRate,
} from '../../src/domains/clinical-calculators/index.ts'

// Tabel ditulis ulang sebagai literal: mengubah tabel mesin tidak boleh ikut mengubah acuan.
assert.deepEqual({ na: { ...SODIUM_MEQ_L }, glu: { ...GLUCOSE_MG_DL }, k: { ...POTASSIUM_MEQ_L }, mc: { ...MCDONALD_FUNDAL_CM }, age: { ...ZONE2_AGE_YEARS }, grip: { ...GRIP_KG } },
  { na: { min: 80, max: 200 }, glu: { min: 20, max: 2000 }, k: { min: 1, max: 10 }, mc: { min: 20, max: 36 }, age: { min: 10, max: 100 }, grip: { min: 1, max: 100 } }, 'range tables')

const rand = mulberry32(20261024)
const between = (min: number, max: number) => min + (max - min) * rand()
const N = 400
const comp = (r: unknown) => (r as { ok: boolean }).ok

// ── 1. Katz: Na + 1,6 × max(0, (glukosa − 100)/100) ──
for (let n = 0; n < N; n++) {
  const na = between(80, 200), g = between(20, 2000), r = correctedSodiumKatz(na, g) as any
  close(r.data.correctedNa, na + 1.6 * Math.max(0, (g - 100) / 100), 'Katz corrected Na')
}
assert.equal((correctedSodiumKatz(130, 100) as any).data.correctedNa, 130, 'glucose 100: no change'); close((correctedSodiumKatz(130, 600) as any).data.correctedNa, 138, 'worked case: 130 + 1.6 × 5 = 138')
assert.equal((correctedSodiumKatz(140, 20) as any).data.correctedNa, 140, 'glucose below 100 is clamped: no negative correction')
{
  // ACHADO untuk peninjau (tidak diubah): dua implementasi Na terkoreksi dalam aplikasi berbeda untuk glukosa < 100 mg/dL dan pada rentang Na.
  const lain = correctedSodium(140, 20) as any; assert.ok(Math.abs(lain.correctedNa - 138.72) < 1e-9 && (correctedSodiumKatz(140, 20) as any).data.correctedNa === 140, 'REVIEWER ITEM: fluidElectrolytes.correctedSodium lowers Na for glucose < 100 (138.72); electrolyteCorrection.correctedSodiumKatz clamps (140)')
  assert.equal(comp(correctedSodiumKatz(85, 100)), true, 'REVIEWER ITEM: Katz accepts Na 80–200'); assert.equal((correctedSodium(85, 100) as any).ok, false, '… while fluidElectrolytes accepts 90–200')
  hostileMatrix('correctedSodiumKatz', { na: 130, g: 400 }, (i) => correctedSodiumKatz(i.na as never, i.g as never), comp, ['na', 'g'], { na: SODIUM_MEQ_L, g: GLUCOSE_MG_DL })
}

// ── 2. Kalium: keparahan < 2,5 atau > 6,5 berat; < 3,0 atau > 6,0 sedang; < 3,5 atau > 5,5 ringan; defisit 200–400 mEq per 1 mEq/L di bawah 4,0 ──
const refSev = (k: number) => (k < 2.5 || k > 6.5 ? 'Severe — monitor ECG closely' : k < 3.0 || k > 6.0 ? 'Moderate' : k < 3.5 || k > 5.5 ? 'Mild' : 'Normal')
for (let k10 = 10; k10 <= 100; k10++) {
  const k = k10 / 10, r = potassiumAssessment(k) as any
  assert.equal(r.data.severity.label, refSev(k), `severity at ${k}`); assert.equal(r.data.severity.tone, r.data.severity.label === 'Normal' ? 'normal' : r.data.severity.label.startsWith('Severe') ? 'critical' : 'low', `tone at ${k}`)
  if (k < 4) { close(r.data.deficitMeq.low, (4 - k) * 200, `deficit low at ${k}`); close(r.data.deficitMeq.high, (4 - k) * 400, `deficit high at ${k}`) } else assert.equal(r.data.deficitMeq, null, `no deficit at ${k}`)
}
for (const [k, label] of [[2.49, 'Severe'], [2.5, 'Moderate'], [2.99, 'Moderate'], [3.0, 'Mild'], [3.49, 'Mild'], [3.5, 'Normal'], [5.5, 'Normal'], [5.51, 'Mild'], [6.0, 'Mild'], [6.01, 'Moderate'], [6.5, 'Moderate'], [6.51, 'Severe'], [1, 'Severe'], [10, 'Severe']] as const) assert.ok((potassiumAssessment(k) as any).data.severity.label.startsWith(label), `K ${k} → ${label}`)
assert.equal((potassiumAssessment(4) as any).data.deficitMeq, null, 'exactly 4.0: no deficit'); assert.ok((potassiumAssessment(3.99) as any).data.deficitMeq.low > 0)
{
  // ACHADO untuk peninjau (tidak diubah): dua perkiraan defisit K berbeda dalam aplikasi (tetap 200–400 mEq per mEq/L vs 0,3–0,6 mEq/kg).
  const a = (potassiumAssessment(3) as any).data.deficitMeq, b = potassiumDeficit(3, 70) as any; assert.deepEqual([a.low, a.high], [200, 400]); close(b.lowMeq, 21, 'weight-based low'); assert.ok(a.low !== b.lowMeq, 'REVIEWER ITEM: the two potassium-deficit estimates (200–400 mEq vs 21–42 mEq at K 3.0, 70 kg) disagree by an order of magnitude')
  hostileMatrix('potassiumAssessment', { k: 3.8 }, (i) => potassiumAssessment(i.k as never), comp, ['k'], { k: POTASSIUM_MEQ_L })
}

// ── 3. McDonald: tinggi fundus = minggu, hanya 20–36 cm ──
for (let c = 20; c <= 36; c += 0.5) assert.deepEqual(mcdonaldGestationalAge(c), { ok: true, data: { gestationalWeeks: c } }, `fundal ${c}`)
hostileMatrix('mcdonaldGestationalAge', { c: 28 }, (i) => mcdonaldGestationalAge(i.c as never), comp, ['c'], { c: MCDONALD_FUNDAL_CM })
assert.equal(comp(mcdonaldGestationalAge(19.99)), false); assert.equal(comp(mcdonaldGestationalAge(36.01)), false)

// ── 4. Zona 2: HRmaks Tanaka = 208 − 0,7 × usia; zona 60–70 % HRmaks, dibulatkan. Acuan bilangan bulat: usia dalam persepuluh tahun ──
for (let a10 = 100; a10 <= 1000; a10++) {
  const r = zone2HeartRate(a10 / 10) as any
  assert.ok(r.ok); close(r.hrMax, (20800 - 7 * a10) / 100, `hrMax at ${a10 / 10}`)
  assert.equal(r.lower, Math.floor((6 * (20800 - 7 * a10) + 500) / 1000), `lower at ${a10 / 10}`); assert.equal(r.upper, Math.floor((7 * (20800 - 7 * a10) + 500) / 1000), `upper at ${a10 / 10}`)
}
{
  const r = zone2HeartRate(30) as any; assert.deepEqual([r.hrMax, r.lower, r.upper], [187, 112, 131], 'worked case: age 30 → 187; zone 112–131 bpm')
  assert.deepEqual([(zone2HeartRate(40) as any).hrMax, (zone2HeartRate(40) as any).lower, (zone2HeartRate(40) as any).upper], [180, 108, 126])
  const kosong = zone2HeartRate(Number.NaN) as any; assert.deepEqual([kosong.ok, kosong.reason], [false, 'age is required'], 'blank age is "required", not 0')
  hostileMatrix('zone2HeartRate', { a: 40 }, (i) => zone2HeartRate(i.a as never), comp, ['a'], { a: ZONE2_AGE_YEARS })
  // Kekuatan genggam: harus diketik, 1–100 kg.
  assert.deepEqual(validateGripKg(30), { ok: true, kg: 30 }); assert.equal((validateGripKg(Number.NaN) as any).reason, 'grip strength is required')
  hostileMatrix('validateGripKg', { g: 30 }, (i) => validateGripKg(i.g as never), comp, ['g'], { g: GRIP_KG })
}

// ── 5. parseNumberField: kosong atau hanya spasi → NaN (bukan 0); teks lain lewat Number() ──
for (const t of ['', ' ', '\t', '\n', '   ']) assert.ok(Number.isNaN(parseNumberField(t)), `"${JSON.stringify(t)}" is blank`)
for (const t of [null, undefined, 5, {}, [], true]) assert.ok(Number.isNaN(parseNumberField(t as never)), `non-string ${String(t)} is NaN`)
assert.equal(parseNumberField('0'), 0, 'a typed 0 is a real 0'); assert.equal(parseNumberField(' 12.5 '), 12.5); assert.equal(parseNumberField('-3'), -3); assert.equal(parseNumberField('1e2'), 100)
for (const t of ['abc', '1,5', '1_000', '--1', '12abc']) assert.ok(Number.isNaN(parseNumberField(t)), `"${t}" is NaN`)
assert.equal(parseNumberField('Infinity'), Infinity, 'infinities pass through (the range gate rejects them)'); assert.equal(parseNumberField('0x10'), 16, 'REVIEWER ITEM: Number() accepts hex text')
console.log('calculator-independent-reference-10: Katz sodium, potassium assessment, McDonald rule, zone-2 heart rate (integer-arithmetic rounding reference), grip validation and parseNumberField match independently written references; two cross-engine inconsistencies recorded for the reviewer')
