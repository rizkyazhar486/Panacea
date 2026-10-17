// C6 (bagian rekayasa), tahap 6: cairan & elektrolit (rumatan, resusitasi, Na terkoreksi, laju koreksi Na, defisit K) dan perkiraan waktu glikogen/autofagi.
// Acuan ditulis TERPISAH dari rumus terbitnya, diuji pada sampel acak berbenih, batas persis, dan masukan bermusuhan. Bukti rekayasa,
// BUKAN tinjauan klinis; konstanta tanpa sumber dan temuan perilaku dicatat di docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  AUTOPHAGY_RANGES, FLUID_RANGES, autophagyTiming, correctedSodium, maintenanceFluid, naCorrectionRate, potassiumDeficit, resuscitation,
} from '../../src/domains/clinical-calculators/index.ts'

// Tabel rentang ditulis ulang sebagai literal: mengubah tabel mesin tidak boleh ikut mengubah acuan.
const lit = (o: Record<string, { min: number; max: number }>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [v.min, v.max]]))
assert.deepEqual(lit(FLUID_RANGES as never), { weightKg: [0.5, 300], tbsaPct: [1, 100], sodium: [90, 200], glucose: [20, 2000], potassium: [1, 10] }, 'fluid ranges')
assert.deepEqual(lit(AUTOPHAGY_RANGES as never), { bodyFatPct: [3, 70], hoursSinceMeal: [0, 72] }, 'autophagy ranges')

const rand = mulberry32(20261020)
const between = (min: number, max: number) => min + (max - min) * rand()
const N = 400

// ── 1. Rumatan: Holliday-Segar 100/50/20 mL/kg + Na 3/2/1 dan K 2/1/0,5 mEq/kg (≤10, 11–20, >20 kg) ──
const refDaily = (w: number) => (w <= 10 ? w * 100 : w <= 20 ? 1000 + (w - 10) * 50 : 1500 + (w - 20) * 20)
const refNa = (w: number) => (w <= 10 ? w * 3 : w <= 20 ? 30 + (w - 10) * 2 : 50 + (w - 20) * 1)
const refK = (w: number) => (w <= 10 ? w * 2 : w <= 20 ? 20 + (w - 10) * 1 : 30 + (w - 20) * 0.5)
for (let n = 0; n < N; n++) {
  const w = between(0.5, 300), r = maintenanceFluid(w); assert.ok(r.ok)
  close(r.dailyMl, refDaily(w), 'daily mL'); close(r.hourlyMl, refDaily(w) / 24, 'hourly mL'); close(r.naMeq, refNa(w), 'Na mEq'); close(r.kMeq, refK(w), 'K mEq')
}
for (const [w, d, na, k] of [[0.5, 50, 1.5, 1], [10, 1000, 30, 20], [10.5, 1025, 31, 20.5], [20, 1500, 50, 30], [20.5, 1510, 50.5, 30.25], [70, 2500, 100, 55], [300, 7100, 330, 170]] as const) {
  const r = maintenanceFluid(w) as any; assert.deepEqual([r.dailyMl, r.naMeq, r.kMeq], [d, na, k], `maintenance at ${w} kg`)
}
assert.ok(Math.abs(refDaily(10) - refDaily(10 + 1e-12)) < 1e-6 && Math.abs(refNa(20) - refNa(20 + 1e-12)) < 1e-6, 'the oracle is continuous at the breakpoints, as the engine is')
hostileMatrix('maintenanceFluid', { w: 70 }, (i) => maintenanceFluid(i.w as never), (r) => (r as { ok: boolean }).ok, ['w'], { w: { min: 0.5, max: 300 } })

// ── 2. Resusitasi: sepsis dewasa 30 mL/kg, syok anak 20 mL/kg, luka bakar 4 × kg × %TBSA (separuh 8 jam pertama, separuh 16 jam berikutnya) ──
for (let n = 0; n < N; n++) {
  const w = between(0.5, 300), t = between(1, 100)
  const s = resuscitation('adult-sepsis', w, t) as any; close(s.ml, 30 * w, 'sepsis mL'); assert.deepEqual([s.first8hMl, s.next16hMl], [null, null])
  const p = resuscitation('peds-shock', w, t) as any; close(p.ml, 20 * w, 'peds shock mL'); assert.deepEqual([p.first8hMl, p.next16hMl], [null, null])
  const b = resuscitation('burns', w, t) as any; close(b.ml, 4 * w * t, 'Parkland mL'); close(b.first8hMl, 2 * w * t, 'first 8 h'); close(b.next16hMl, 2 * w * t, 'next 16 h'); assert.equal(b.first8hMl + b.next16hMl, b.ml)
}
{
  assert.equal((resuscitation('burns', 70, 20) as any).ml, 5600, 'worked Parkland case: 70 kg, 20 % TBSA = 5,600 mL')
  // TBSA diabaikan di luar luka bakar, termasuk bila kosong; di luka bakar, kosong/di luar rentang ditolak.
  for (const t of [Number.NaN, 0, 999, -5, 'x', null, undefined]) assert.equal((resuscitation('adult-sepsis', 70, t as never) as any).ok, true, `TBSA ${String(t)} is irrelevant to sepsis`)
  for (const t of [Number.NaN, 0, 100.0001, Infinity, -1, '20', null, undefined]) { const r = resuscitation('burns', 70, t as never) as any; assert.equal(r.ok, false, `burns TBSA ${String(t)}`) }
  assert.deepEqual([(resuscitation('burns', 70, Number.NaN) as any).missing, (resuscitation('burns', 70, 0) as any).invalid.length], [['TBSA burned'], 1], 'blank TBSA is "missing", 0 is "invalid"')
  assert.equal((resuscitation('burns', 70, 100) as any).ok, true); assert.equal((resuscitation('burns', 70, 1) as any).ok, true)
  for (const sc of ['', 'burn', 'Burns', 'toString', '__proto__', null, undefined, 1, {}]) { let r: any; assert.doesNotThrow(() => { r = resuscitation(sc as never, 70, 20) }); assert.equal(r.ok, false, `scenario ${String(sc)}`) }
  hostileMatrix('resuscitation weight', { w: 70 }, (i) => resuscitation('adult-sepsis', i.w as never, 20), (r) => (r as { ok: boolean }).ok, ['w'], { w: { min: 0.5, max: 300 } })
  hostileMatrix('resuscitation TBSA (burns)', { t: 20 }, (i) => resuscitation('burns', 70, i.t as never), (r) => (r as { ok: boolean }).ok, ['t'], { t: { min: 1, max: 100 } })
}

// ── 3. Katz hyperglycemia correction: no correction at/below 100 mg/dL; above reference +0.016 per mg/dL ──
for (let n = 0; n < N; n++) {
  const na = between(90, 200), g = between(20, 2000), r = correctedSodium(na, g) as any
  const reference = g <= 100 ? na : na + (g - 100) * 16 / 1000
  close(r.correctedNa, reference, 'corrected Na')
}
assert.equal((correctedSodium(130, 100) as any).correctedNa, 130, 'glucose 100 changes nothing'); close((correctedSodium(130, 600) as any).correctedNa, 138, 'worked case: Na 130, glucose 600 → 138'); close((correctedSodium(140, 20) as any).correctedNa, 140, 'below-reference glucose adds no hyperglycemia correction')
// Exact boundary pairs use a separately tabulated expected correction, including decimal glucose.
for (const [g, delta] of [[20, 0], [99.9, 0], [100, 0], [100.1, 0.0016], [200, 1.6], [600, 8], [2000, 30.4]] as const) {
  for (const na of [90, 130, 200]) close((correctedSodium(na, g) as any).correctedNa, na + delta, `Katz boundary Na=${na}, glucose=${g}`)
}
hostileMatrix('correctedSodium Na', { na: 130, g: 400 }, (i) => correctedSodium(i.na as never, i.g as never), (r) => (r as { ok: boolean }).ok, ['na', 'g'], { na: { min: 90, max: 200 }, g: { min: 20, max: 2000 } })

// ── 4. Laju koreksi Na (Adrogue-Madias disederhanakan, infusat 140): TBW = kg × (0,6 L | 0,5 P); ΔNa/L = (140 − Na)/(TBW + 1) ──
for (let n = 0; n < N; n++) {
  const na = between(90, 200), w = between(0.5, 300), sex = rand() < 0.5 ? 'M' : 'F', r = naCorrectionRate(na, w, sex) as any
  const tbw = w * (sex === 'M' ? 0.6 : 0.5), per = (140 - na) / (tbw + 1)
  close(r.tbw, tbw, 'TBW'); close(r.naChangePerL, per, 'ΔNa per litre'); close(r.litersFor10, per !== 0 ? 10 / per : 0, 'litres for 10 mEq/L')
}
{
  const r = naCorrectionRate(120, 70, 'M') as any; close(r.tbw, 42, 'worked case TBW'); close(r.naChangePerL, 20 / 43, 'worked case ΔNa/L'); close(r.litersFor10, 21.5, 'worked case litres for +10')
  assert.equal((naCorrectionRate(120, 70, 'F') as any).tbw, 35, 'female factor 0.5')
  // Achados de perilaku (BUKAN diubah di sini): Na = 140 → "0 liter"; Na > 140 → liter negatif; keduanya bukan jawaban yang bermakna.
  const sama = naCorrectionRate(140, 70, 'M') as any; assert.deepEqual([sama.naChangePerL, sama.litersFor10], [0, 0], 'REVIEWER ITEM: current Na = 140 reports 0 litres (no change is possible, not "0 L needed")')
  const tinggi = naCorrectionRate(160, 70, 'M') as any; assert.ok(tinggi.naChangePerL < 0 && tinggi.litersFor10 < 0, 'REVIEWER ITEM: hypernatraemia gives a negative litre figure; the formula assumes a 140 infusate')
  for (const bad of ['m', 'f', 'X', '', null, undefined, 1, true, {}, 'toString']) { const r2 = naCorrectionRate(120, 70, bad as never) as any; assert.equal(r2.ok, false, `sex ${String(bad)}`); assert.deepEqual(r2.invalid, ['sex must be M or F']) }
  const ganda = naCorrectionRate(Number.NaN, 70, 'X') as any; assert.deepEqual([ganda.missing, ganda.invalid], [['sodium'], ['sex must be M or F']], 'a blank field and a bad sex are both reported')
  hostileMatrix('naCorrectionRate', { na: 120, w: 70 }, (i) => naCorrectionRate(i.na as never, i.w as never, 'M'), (r) => (r as { ok: boolean }).ok, ['na', 'w'], { na: { min: 90, max: 200 }, w: { min: 0.5, max: 300 } })
}

// ── 5. Defisit K: (4,0 − K) × kg × 0,3 sampai 0,6, tidak pernah negatif ──
for (let n = 0; n < N; n++) {
  const k = between(1, 10), w = between(0.5, 300), r = potassiumDeficit(k, w) as any
  close(r.lowMeq, Math.max(0, (4 - k) * w * 0.3), 'low'); close(r.highMeq, Math.max(0, (4 - k) * w * 0.6), 'high'); assert.ok(r.lowMeq <= r.highMeq && r.lowMeq >= 0)
}
{
  const r = potassiumDeficit(3, 70) as any; close(r.lowMeq, 21, 'worked case low'); close(r.highMeq, 42, 'worked case high')
  assert.deepEqual([(potassiumDeficit(4, 70) as any).lowMeq, (potassiumDeficit(4, 70) as any).highMeq], [0, 0], 'K = 4.0 → no deficit'); assert.deepEqual([(potassiumDeficit(6, 70) as any).lowMeq, (potassiumDeficit(6, 70) as any).highMeq], [0, 0], 'hyperkalaemia is 0, never negative')
  hostileMatrix('potassiumDeficit', { k: 3, w: 70 }, (i) => potassiumDeficit(i.k as never, i.w as never), (r) => (r as { ok: boolean }).ok, ['k', 'w'], { k: { min: 1, max: 10 }, w: { min: 0.5, max: 300 } })
}

// ── 6. Waktu glikogen (heuristik): sisa = max(0, 14 − (1 − lemak/100) × 2 − jam sejak makan); "mulai" bila sisa ≤ 0 ──
for (let n = 0; n < N; n++) {
  const f = between(3, 70), h = between(0, 72), r = autophagyTiming({ bodyFatPct: f, hoursSinceMeal: h })
  const rem = Math.max(0, 14 - (1 - f / 100) * 2 - h); close(r.hoursRemaining as number, rem, 'hours remaining'); assert.equal(r.started, rem <= 0, 'started')
  assert.deepEqual([r.missing.length, r.invalid.length], [0, 0])
}
{
  const dasar = { bodyFatPct: 50, hoursSinceMeal: 6 }
  assert.deepEqual([autophagyTiming(dasar).hoursRemaining, autophagyTiming(dasar).started], [7, false], 'worked case: 14 − 1 − 6 = 7 h')
  assert.deepEqual([autophagyTiming({ bodyFatPct: 50, hoursSinceMeal: 13 }).hoursRemaining, autophagyTiming({ bodyFatPct: 50, hoursSinceMeal: 13 }).started], [0, true], 'exactly 0 h remaining counts as started')
  assert.deepEqual([autophagyTiming({ bodyFatPct: 50, hoursSinceMeal: 12.75 }).hoursRemaining, autophagyTiming({ bodyFatPct: 50, hoursSinceMeal: 12.75 }).started], [0.25, false], '0.25 h remaining is not yet started')
  assert.equal(autophagyTiming({ bodyFatPct: 50, hoursSinceMeal: 72 }).hoursRemaining, 0, 'never negative'); close(autophagyTiming({ bodyFatPct: 3, hoursSinceMeal: 0 }).hoursRemaining as number, 14 - 0.97 * 2, 'lowest body fat, just eaten')
  assert.ok((autophagyTiming({ bodyFatPct: 70, hoursSinceMeal: 0 }).hoursRemaining as number) > (autophagyTiming({ bodyFatPct: 3, hoursSinceMeal: 0 }).hoursRemaining as number), 'higher body fat → later depletion (monotone as the formula states)')
  for (const k of ['bodyFatPct', 'hoursSinceMeal'] as const) {
    const kosong = autophagyTiming({ ...dasar, [k]: Number.NaN }); assert.deepEqual([kosong.missing.length, kosong.invalid.length, kosong.hoursRemaining, kosong.started], [1, 0, null, null], `${k} NaN is "missing"`)
    for (const bad of [Infinity, -1, '5', null, undefined, {}, true]) { const r = autophagyTiming({ ...dasar, [k]: bad } as never); assert.deepEqual([r.invalid.length, r.hoursRemaining, r.started], [1, null, null], `${k}=${String(bad)} is invalid`) }
  }
  hostileMatrix('autophagyTiming', dasar as Record<string, unknown>, (i) => autophagyTiming(i as never), (r) => (r as { hoursRemaining: unknown }).hoursRemaining !== null, ['bodyFatPct', 'hoursSinceMeal'], AUTOPHAGY_RANGES)
}
console.log('calculator-independent-reference-6: fluid & electrolyte calculators and the glycogen-timing heuristic match independently written references (400 seeded cases each, breakpoints, worked cases, hostile inputs)')
