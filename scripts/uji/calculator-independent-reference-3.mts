// C6 (bagian rekayasa), tahap 3: Naegele, Widmark BAC, tinggi target orang tua, rasio pinggang-tinggi, tetes infus, koreksi natrium (Katz),
// penilaian kalium, kriteria Light, STOP-Bang, Centor/McIsaac. Tiap mesin dibandingkan dengan acuan yang ditulis TERPISAH dari rumus/tabel
// terbitnya (tanggal Naegele memakai aritmetika hari-sipil sendiri, bukan Date), dengan sampel acak berbenih, batas persis, sudut rentang
// dan masukan bermusuhan. Bukti rekayasa, BUKAN tinjauan klinis; konstanta dan pita yang belum bersumber dicatat di
// docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  BAC_RANGES, CYCLE_LENGTH_DAYS, DRINKS, GLUCOSE_MG_DL, IV_DURATION_HOURS, IV_VOLUME_ML, LIGHTS_RANGES, PARENT_HEIGHT_CM, POTASSIUM_MEQ_L, SODIUM_MEQ_L,
  STOP_BANG_RANGES, WAIST_CM, WHTR_HEIGHT_CM,
  centorMcIsaac, correctedSodiumKatz, ivDrip, lightsCriteria, midParentalHeight, naegele, potassiumAssessment, stopBang, stopBangBand, waistToHeight, widmarkBac,
} from '../../src/domains/clinical-calculators/index.ts'

const rand = mulberry32(20261017)
const between = (min: number, max: number) => min + (max - min) * rand()
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
const N = 400

// ── 1. Naegele: EDD = HPHT + 280 + (siklus − 28) hari; UK = hari sejak HPHT − (siklus − 28) ─────────
// Aritmetika hari-sipil mandiri (Hinnant), tanpa Date.
const jabis = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const hariBulan = (y: number, m: number) => [31, jabis(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]!
function hariDariSipil(y: number, m: number, d: number) { const yy = m <= 2 ? y - 1 : y; const era = Math.floor(yy / 400); const yoe = yy - era * 400; const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1; const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; return era * 146097 + doe - 719468 }
function sipilDariHari(z: number) { z += 719468; const era = Math.floor(z / 146097); const doe = z - era * 146097; const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365); let y = yoe + era * 400; const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)); const mp = Math.floor((5 * doy + 2) / 153); const d = doy - Math.floor((153 * mp + 2) / 5) + 1; const m = mp < 10 ? mp + 3 : mp - 9; if (m <= 2) y++; return { y, m, d } }
const iso = (z: number) => { const { y, m, d } = sipilDariHari(z); return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
const DAY = 86_400_000
assert.equal(iso(hariDariSipil(2026, 10, 17)), '2026-10-17', 'the independent calendar round-trips'); assert.equal(hariDariSipil(1970, 1, 1), 0)
for (let i = 0; i < N * 2; i++) {
  const y = int(1900, 2099), m = int(1, 12), d = int(1, hariBulan(y, m)), cycle = int(20, 60), k = int(0, 420)
  const lmp = hariDariSipil(y, m, d), adj = cycle - 28, now = (lmp + k) * DAY + int(0, DAY - 1)
  const r = naegele(iso(lmp), cycle, now)
  assert.equal(r.ok, true, `naegele ${iso(lmp)} cycle ${cycle} +${k}d`)
  if (!r.ok) continue
  assert.equal(r.data.eddIso, iso(lmp + 280 + adj), `EDD for ${iso(lmp)} cycle ${cycle}`)
  const ga = k - adj
  if (ga < 0) { assert.equal(r.data.gestationalAgeHidden, 'not-started'); assert.equal(r.data.gestationalAge, null) }
  else if (ga > 315) { assert.equal(r.data.gestationalAgeHidden, 'beyond-limit'); assert.equal(r.data.gestationalAge, null) }
  else { assert.equal(r.data.gestationalAgeHidden, null); assert.deepEqual(r.data.gestationalAge, { weeks: Math.floor(ga / 7), days: ga % 7 }, `GA ${ga} days`) }
  // Pada hari EDD usia kehamilan tepat 40 minggu 0 hari untuk siklus berapa pun.
  const hariEdd = naegele(iso(lmp), cycle, (lmp + 280 + adj) * DAY + int(0, DAY - 1)); assert.ok(hariEdd.ok); if (hariEdd.ok) assert.deepEqual(hariEdd.data.gestationalAge, { weeks: 40, days: 0 }, 'GA is 40w0d on the due date for any cycle length')
}
{
  const lmp = hariDariSipil(2026, 1, 1)
  // Hari berganti tepat pada tengah malam UTC.
  const a = naegele('2026-01-01', 28, (lmp + 7) * DAY - 1), b = naegele('2026-01-01', 28, (lmp + 7) * DAY)
  assert.deepEqual([a.ok && a.data.gestationalAge, b.ok && b.data.gestationalAge], [{ weeks: 0, days: 6 }, { weeks: 1, days: 0 }], 'the day rolls over at UTC midnight')
  const batas = (k: number) => { const r = naegele('2026-01-01', 28, (lmp + k) * DAY); return r.ok ? r.data.gestationalAgeHidden : 'error' }
  assert.deepEqual([batas(315), batas(316), batas(0)], [null, 'beyond-limit', null], '315 days (45w0d) is shown, 316 is hidden')
  assert.equal(naegele('2026-01-01', 28, (lmp - 1) * DAY).ok, false, 'LMP in the future is refused'); assert.equal(naegele('2026-01-01', 28, lmp * DAY).ok, true, 'LMP today is accepted')
  assert.deepEqual(naegele('2026-01-01', 35, (lmp + 3) * DAY), { ok: true, data: { eddIso: iso(lmp + 287), gestationalAge: null, gestationalAgeHidden: 'not-started' } }, 'a 35-day cycle starts counting 7 days after the LMP')
  for (const bad of ['2026-02-30', '2026-13-01', '2026-00-10', '2026-1-1', ' 2026-01-01', '2026-01-01 ', '26-01-01', '', 'tomorrow', '1899-12-31', '2101-01-01', null, undefined, 20260101, {}]) assert.equal(naegele(bad as never, 28, lmp * DAY).ok, false, `LMP ${JSON.stringify(bad)} is refused`)
  assert.equal(naegele('2024-02-29', 28, hariDariSipil(2024, 3, 1) * DAY).ok, true, 'a real leap day is accepted'); assert.equal(naegele('2025-02-29', 28, hariDariSipil(2025, 3, 1) * DAY).ok, false, 'a non-leap 29 February is refused'); assert.equal(naegele('1900-02-29', 28, hariDariSipil(1900, 3, 1) * DAY).ok, false, '1900 is not a leap year')
  for (const c of [19, 61, 28.5, 0, -28, Number.NaN, Infinity, '28', null, undefined]) assert.equal(naegele('2026-01-01', c as never, lmp * DAY + DAY * 100).ok, false, `cycle ${String(c)} is refused`)
  for (const c of [CYCLE_LENGTH_DAYS.min, CYCLE_LENGTH_DAYS.max]) assert.equal(naegele('2026-01-01', c, (lmp + 100) * DAY).ok, true)
  for (const now of [Number.NaN, Infinity, -Infinity]) assert.equal(naegele('2026-01-01', 28, now).ok, false, `now ${now} is refused`)
}

// ── 2. Widmark: BAC‰ = A / (r × m) − β × t, dengan A = Σ jumlah × volume × (abv/100) × 0,789 g ───────
const MINUMAN: readonly (readonly [string, number, number])[] = [['Beer (330 ml, 5%)', 330, 5], ['Beer, strong (330 ml, 8%)', 330, 8], ['Wine (150 ml, 12%)', 150, 12], ['Spirits, single (30 ml, 40%)', 30, 40], ['Cocktail (250 ml, 15%)', 250, 15]]
assert.deepEqual(DRINKS.map((d) => [d.label, d.volumeMl, d.abv]), MINUMAN.map((m) => [...m]), 'the drink table is the one this reference assumes')
for (let i = 0; i < N; i++) {
  const sex = rand() < 0.5 ? 'M' : 'F', kg = between(30, 200), h = between(0, 12); const counts: Record<string, number> = {}
  for (const [label] of MINUMAN) if (rand() < 0.7) counts[label] = int(0, 50)
  const gram = MINUMAN.reduce((s, [label, ml, abv]) => s + (counts[label] ?? 0) * ml * (abv / 100) * 0.789, 0)
  const r = widmarkBac({ sex, weightKg: kg, hours: h, counts }); assert.ok(r.ok)
  if (!r.ok) continue
  const promil = Math.max(0, gram / ((sex === 'M' ? 0.68 : 0.55) * kg) - 0.15 * h)
  close(r.data.totalGrams, gram, 'ethanol grams'); close(r.data.permille, promil, 'BAC permille'); close(r.data.percent, promil / 10, 'BAC percent'); close(r.data.unitsUK, gram / 8, 'UK units (8 g)'); close(r.data.standardUS, gram / 14, 'US standard drinks (14 g)')
}
{
  const base = { sex: 'M' as const, weightKg: 70, hours: 0, counts: { 'Beer (330 ml, 5%)': 2 } }
  const b0 = (widmarkBac(base) as any).data.permille
  assert.ok((widmarkBac({ ...base, weightKg: 140 }) as any).data.permille < b0, 'more body weight dilutes'); assert.ok((widmarkBac({ ...base, sex: 'F' }) as any).data.permille > b0, 'the female distribution factor gives a higher estimate'); assert.ok((widmarkBac({ ...base, counts: { 'Beer (330 ml, 5%)': 3 } }) as any).data.permille > b0)
  close(b0 - (widmarkBac({ ...base, hours: 1 }) as any).data.permille, 0.15, 'elimination is 0.15 permille per hour'); assert.equal((widmarkBac({ ...base, hours: 12 }) as any).data.permille, 0, 'never below zero after full elimination'); assert.equal((widmarkBac({ ...base, counts: {} }) as any).data.permille, 0, 'no drinks, no alcohol')
  assert.deepEqual(widmarkBac({ ...base, counts: {} }), { ok: true, data: { totalGrams: 0, unitsUK: 0, standardUS: 0, permille: 0, percent: 0 } })
  for (const bad of ['X', '', null, undefined, 'm']) assert.equal(widmarkBac({ ...base, sex: bad as never }).ok, false, `sex ${String(bad)} never defaults`)
  for (const bad of [-1, 51, Number.NaN, Infinity, '2', {}, true]) assert.equal(widmarkBac({ ...base, counts: { 'Beer (330 ml, 5%)': bad as never } }).ok, false, `drink count ${String(bad)}`)
  hostileMatrix('widmarkBac', base as Record<string, unknown>, (i) => widmarkBac(i as never), (r) => r.ok === true, ['weightKg', 'hours'], BAC_RANGES)
  // Sudut rentang: semua minuman di maksimum pada berat minimum tetap berhingga.
  const semua = Object.fromEntries(MINUMAN.map(([l]) => [l, 50])); const sudut = widmarkBac({ sex: 'F', weightKg: 30, hours: 0, counts: semua }); assert.ok(sudut.ok && Number.isFinite(sudut.data.permille))
}

// ── 3. Tinggi target orang tua: (ayah + ibu ± 13) / 2, rentang ± 8,5 cm ──────────────────────────────
for (let i = 0; i < N; i++) {
  const f = between(100, 250), m = between(100, 250), sex = rand() < 0.5 ? 'M' : 'F'; const r = midParentalHeight(f, m, sex); assert.ok(r.ok)
  if (!r.ok) continue
  const t = (f + m + (sex === 'M' ? 13 : -13)) / 2; close(r.data.targetCm, t, 'target height'); close(r.data.rangeLoCm, t - 8.5, 'range low'); close(r.data.rangeHiCm, t + 8.5, 'range high')
  close((midParentalHeight(f, m, 'M') as any).data.targetCm - (midParentalHeight(f, m, 'F') as any).data.targetCm, 13, 'boys exceed girls by exactly 13 cm'); close((midParentalHeight(m, f, sex) as any).data.targetCm, t, 'symmetric in the parents')
}
hostileMatrix('midParentalHeight(father)', { f: 175, m: 162, s: 'M' }, (i) => midParentalHeight(i.f as never, i.m, i.s as never), (r) => r.ok === true, ['f', 'm'], { f: PARENT_HEIGHT_CM, m: PARENT_HEIGHT_CM })
for (const bad of ['X', '', null, undefined, 1]) assert.equal(midParentalHeight(175, 162, bad as never).ok, false, `child sex ${String(bad)} never defaults`)

// ── 4. Rasio pinggang-tinggi: < 0,5 / < 0,6 / ≥ 0,6 ──────────────────────────────────────────────
for (let i = 0; i < N; i++) { const w = between(40, 200), h = between(100, 230); const r = waistToHeight(w, h); assert.ok(r.ok); if (r.ok) { close(r.data.ratio, w / h, 'ratio'); assert.equal(r.data.label, w / h < 0.5 ? 'Lower risk' : w / h < 0.6 ? 'Increased risk' : 'High risk') } }
for (const [w, h, label] of [[49.9, 100, 'Lower risk'], [50, 100, 'Increased risk'], [59.9, 100, 'Increased risk'], [60, 100, 'High risk'], [115, 230, 'Increased risk'], [138, 230, 'High risk']] as const) assert.equal((waistToHeight(w, h) as any).data.label, label, `WHtR ${w}/${h}`)
hostileMatrix('waistToHeight', { w: 80, h: 170 }, (i) => waistToHeight(i.w, i.h), (r) => r.ok === true, ['w', 'h'], { w: WAIST_CM, h: WHTR_HEIGHT_CM })

// ── 5. Tetes infus: mL/jam = V / jam; tetes/menit = V × faktor / (jam × 60) ───────────────────────
for (let i = 0; i < N; i++) { const v = between(1, 20000), h = between(0.1, 168), f = [15, 20, 60][int(0, 2)]!; const r = ivDrip(v, h, f); assert.ok(r.ok); if (r.ok) { close(r.data.mlPerHour, v / h, 'mL/h'); close(r.data.dropsPerMin, (v * f) / (h * 60), 'drops/min') } }
close((ivDrip(1000, 8, 15) as any).data.dropsPerMin, 31.25, 'worked case 1000 mL over 8 h at 15 drops/mL'); close((ivDrip(500, 4, 20) as any).data.dropsPerMin, 500 * 20 / 240, 'worked case 500 mL over 4 h at 20 drops/mL'); close((ivDrip(60, 1, 60) as any).data.dropsPerMin, 60, 'a 60 drops/mL set at 60 mL/h is 60 drops/min')
for (const bad of [10, 0, 16, 45, 15.5, '15', null, undefined, Number.NaN, Infinity, -15]) assert.equal(ivDrip(1000, 8, bad as never).ok, false, `drop factor ${String(bad)} is refused`)
hostileMatrix('ivDrip', { v: 1000, h: 8, f: 20 }, (i) => ivDrip(i.v, i.h, i.f), (r) => r.ok === true, ['v', 'h'], { v: IV_VOLUME_ML, h: IV_DURATION_HOURS })
for (const v of [1, 20000]) for (const h of [0.1, 168]) for (const f of [15, 20, 60]) { const r = ivDrip(v, h, f); assert.ok(r.ok && Number.isFinite(r.data.dropsPerMin), `range corner ${v}/${h}/${f}`) }

// ── 6. Koreksi natrium (Katz 1973: +1,6 mEq/L per 100 mg/dL glukosa di atas 100) dan penilaian kalium ─
for (let i = 0; i < N; i++) { const na = between(80, 200), g = between(20, 2000); close((correctedSodiumKatz(na, g) as any).data.correctedNa, na + 1.6 * Math.max(0, (g - 100) / 100), 'Katz') }
close((correctedSodiumKatz(130, 100) as any).data.correctedNa, 130, 'glucose 100 changes nothing'); close((correctedSodiumKatz(130, 40) as any).data.correctedNa, 130, 'low glucose never lowers the corrected sodium'); close((correctedSodiumKatz(130, 200) as any).data.correctedNa, 131.6, '+100 mg/dL glucose adds 1.6 mEq/L'); close((correctedSodiumKatz(130, 600) as any).data.correctedNa, 138, '+500 mg/dL adds 8')
hostileMatrix('correctedSodiumKatz', { na: 135, g: 250 }, (i) => correctedSodiumKatz(i.na, i.g), (r) => r.ok === true, ['na', 'g'], { na: SODIUM_MEQ_L, g: GLUCOSE_MG_DL })
for (let i = 0; i < N; i++) {
  const k = between(1, 10); const r = potassiumAssessment(k) as any
  const sev = k < 2.5 || k > 6.5 ? 'Severe — monitor ECG closely' : k < 3.0 || k > 6.0 ? 'Moderate' : k < 3.5 || k > 5.5 ? 'Mild' : 'Normal'
  assert.equal(r.data.severity.label, sev, `potassium ${k}`); if (k < 4) { close(r.data.deficitMeq.low, (4 - k) * 200, 'deficit low'); close(r.data.deficitMeq.high, (4 - k) * 400, 'deficit high') } else assert.equal(r.data.deficitMeq, null, 'no deficit estimate at or above 4.0')
}
for (const [k, label] of [[2.49, 'Severe — monitor ECG closely'], [2.5, 'Moderate'], [2.99, 'Moderate'], [3.0, 'Mild'], [3.49, 'Mild'], [3.5, 'Normal'], [5.5, 'Normal'], [5.51, 'Mild'], [6.0, 'Mild'], [6.01, 'Moderate'], [6.5, 'Moderate'], [6.51, 'Severe — monitor ECG closely']] as const) assert.equal((potassiumAssessment(k) as any).data.severity.label, label, `potassium boundary ${k}`)
assert.equal((potassiumAssessment(4.0) as any).data.deficitMeq, null); assert.notEqual((potassiumAssessment(3.99) as any).data.deficitMeq, null)
hostileMatrix('potassiumAssessment', { k: 4 }, (i) => potassiumAssessment(i.k), (r) => r.ok === true, ['k'], { k: POTASSIUM_MEQ_L })

// ── 7. Kriteria Light (1972): eksudat bila SALAH SATU: rasio protein > 0,5, rasio LDH > 0,6, LDH pleura > ⅔ batas atas serum ─
for (let i = 0; i < N * 2; i++) {
  const v = { pleuralProtein: between(0.1, 15), serumProtein: between(0.5, 15), pleuralLdh: between(1, 20000), serumLdh: between(1, 20000), serumLdhUln: between(1, 2000) }
  const c1 = v.pleuralProtein * 2 > v.serumProtein, c2 = v.pleuralLdh * 5 > v.serumLdh * 3, c3 = v.pleuralLdh * 3 > 2 * v.serumLdhUln
  const r = lightsCriteria(v) as any; assert.deepEqual(r.data.criteria.map((c: any) => c.met), [c1, c2, c3], 'each criterion'); assert.equal(r.data.exudate, c1 || c2 || c3, 'exudate if any criterion is met')
}
{
  const dasar = { pleuralProtein: 1, serumProtein: 10, pleuralLdh: 50, serumLdh: 1000, serumLdhUln: 300 }; assert.equal((lightsCriteria(dasar) as any).data.exudate, false, 'none met: transudate')
  const met = (o: object) => (lightsCriteria({ ...dasar, ...o }) as any).data.criteria.map((c: any) => c.met)
  assert.deepEqual(met({ pleuralProtein: 5, serumProtein: 10 }), [false, false, false], 'a protein ratio of exactly 0.5 is not met'); assert.deepEqual(met({ pleuralProtein: 5.01, serumProtein: 10 }), [true, false, false])
  assert.deepEqual(met({ pleuralLdh: 600, serumLdh: 1000 }), [false, false, true], 'an LDH ratio of exactly 0.6 is not met (the third criterion is separate)'); assert.deepEqual(met({ pleuralLdh: 600.1, serumLdh: 1000 }).slice(0, 2), [false, true])
  assert.deepEqual(met({ pleuralLdh: 200 }), [false, false, false], 'pleural LDH of exactly 2/3 of the upper limit is not met'); assert.deepEqual(met({ pleuralLdh: 200.01 }), [false, false, true])
  // Satu kriteria saja cukup.
  assert.equal((lightsCriteria({ ...dasar, pleuralProtein: 6 }) as any).data.exudate, true)
  hostileMatrix('lightsCriteria', dasar as Record<string, unknown>, (i) => lightsCriteria(i as never), (r) => r.ok === true, Object.keys(dasar) as (keyof typeof dasar)[], LIGHTS_RANGES)
}

// ── 8. STOP-Bang (Chung 2008): 8 butir, 1 poin; BMI > 35, usia > 50, leher > 40 cm, pria; 0–2 rendah, 3–4 menengah, 5–8 tinggi ─
for (let i = 0; i < N * 2; i++) {
  const v = { snoring: rand() < 0.5, tired: rand() < 0.5, observed: rand() < 0.5, pressure: rand() < 0.5, bmi: between(10, 100), age: between(10, 120), neckCm: between(20, 100), sex: rand() < 0.5 ? 'M' as const : 'F' as const }
  const stop = [v.snoring, v.tired, v.observed, v.pressure].filter(Boolean).length, bang = (v.bmi > 35 ? 1 : 0) + (v.age > 50 ? 1 : 0) + (v.neckCm > 40 ? 1 : 0) + (v.sex === 'M' ? 1 : 0)
  const r = stopBang(v); assert.deepEqual([r.stop, r.bang, r.total], [stop, bang, stop + bang]); assert.equal(r.band, stop + bang <= 2 ? 'low' : stop + bang <= 4 ? 'intermediate' : 'high'); assert.ok(stop + bang <= 8)
}
{
  const dasar = { snoring: false, tired: false, observed: false, pressure: false, bmi: 25, age: 40, neckCm: 35, sex: 'F' as const }
  assert.equal(stopBang(dasar).total, 0); assert.equal(stopBang({ ...dasar, bmi: 35 }).total, 0, 'BMI exactly 35 does not score'); assert.equal(stopBang({ ...dasar, bmi: 35.01 }).total, 1); assert.equal(stopBang({ ...dasar, age: 50 }).total, 0, 'age exactly 50 does not score'); assert.equal(stopBang({ ...dasar, age: 50.01 }).total, 1); assert.equal(stopBang({ ...dasar, neckCm: 40 }).total, 0, 'neck exactly 40 cm does not score'); assert.equal(stopBang({ ...dasar, neckCm: 40.01 }).total, 1); assert.equal(stopBang({ ...dasar, sex: 'M' }).total, 1)
  assert.equal(stopBang({ snoring: true, tired: true, observed: true, pressure: true, bmi: 40, age: 60, neckCm: 45, sex: 'M' }).total, 8, 'worst case is 8')
  for (const [t, b] of [[0, 'low'], [2, 'low'], [3, 'intermediate'], [4, 'intermediate'], [5, 'high'], [8, 'high']] as const) assert.equal(stopBangBand(t), b, `band at ${t}`)
  for (const bad of ['', 'X', null, undefined, 'm']) { const r = stopBang({ ...dasar, sex: bad as never }); assert.equal(r.total, null, `sex ${String(bad)} never defaults`) }
  hostileMatrix('stopBang', dasar as Record<string, unknown>, (i) => stopBang(i as never), (r) => r.total !== null, ['bmi', 'age', 'neckCm'], STOP_BANG_RANGES)
}

// ── 9. Centor/McIsaac: empat kriteria + usia (< 15: +1; 15–44: 0; ≥ 45: −1) ──────────────────────────
const RISIKO = (s: number) => (s <= 0 ? 'Very low risk (1-2.5%)' : s === 1 ? 'Low risk (5-10%)' : s === 2 ? 'Moderate risk (11-17%)' : s === 3 ? 'High risk (28-35%)' : 'Very high risk (51-53%)')
for (let i = 0; i < N * 2; i++) {
  const c = { fever: rand() < 0.5, noCough: rand() < 0.5, tenderNodes: rand() < 0.5, exudate: rand() < 0.5 }, age = between(0, 120)
  const skor = [c.fever, c.noCough, c.tenderNodes, c.exudate].filter(Boolean).length + (age < 15 ? 1 : age >= 45 ? -1 : 0); const r = centorMcIsaac(c, age) as any
  assert.equal(r.data.score, skor); assert.equal(r.data.label, RISIKO(skor))
}
{
  const nol = { fever: false, noCough: false, tenderNodes: false, exudate: false }
  for (const [age, adj] of [[0, 1], [14.99, 1], [15, 0], [44.99, 0], [45, -1], [120, -1]] as const) assert.equal((centorMcIsaac(nol, age) as any).data.score, adj, `age adjustment at ${age}`)
  assert.equal((centorMcIsaac({ ...nol, fever: true, noCough: true, tenderNodes: true, exudate: true }, 30) as any).data.score, 4); assert.equal((centorMcIsaac({ ...nol, fever: true, noCough: true, tenderNodes: true, exudate: true }, 10) as any).data.score, 5, 'a child with all four scores 5')
  for (const bad of [-1, 121, Number.NaN, Infinity, '30', null, undefined]) assert.equal(centorMcIsaac(nol, bad as never).ok, false, `age ${String(bad)}`)
  for (const bad of [1, 'true', null, undefined, 0]) assert.equal(centorMcIsaac({ ...nol, fever: bad as never }, 30).ok, false, `a criterion of ${String(bad)} is not yes/no`)
  assert.equal(centorMcIsaac(undefined as never, 30).ok, false, 'missing criteria never default to all-no')
}
console.log('calculator-independent-reference-3: 10 calculators match independently written references (including a mandiri civil-calendar for Naegele), with exact boundaries, range corners and hostile inputs; passed')
