// C6 (bagian rekayasa), tahap 5: target cairan harian, utang tidur 14 malam, bungkus-tahun dan kelayakan penapisan paru (USPSTF 2021).
// Acuan ditulis TERPISAH dari rumus terbitnya, diuji pada sampel acak berbenih, seluruh kombinasi saklar, batas persis, dan masukan
// bermusuhan. Bukti rekayasa, BUKAN tinjauan klinis; konstanta dan ambang tanpa sumber dicatat di
// docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  HYDRATION_RANGES, PACK_YEAR_RANGES, SLEEP_RANGES, hydrationTarget, packYearScreen, sanitizeNights, sleepDebt, validateHours, validateNeed,
} from '../../src/domains/clinical-calculators/index.ts'

// Tabel rentang ditulis ulang sebagai literal: mengubah tabel mesin tidak boleh ikut mengubah acuan.
assert.deepEqual(JSON.parse(JSON.stringify(HYDRATION_RANGES)), { weightKg: { min: 30, max: 200 }, exerciseMin: { min: 0, max: 600 } }, 'hydration ranges')
assert.deepEqual(JSON.parse(JSON.stringify(SLEEP_RANGES)), { need: { min: 5, max: 11 }, hours: { min: 0, max: 16 } }, 'sleep ranges')
assert.deepEqual(Object.fromEntries(Object.entries(PACK_YEAR_RANGES).map(([k, v]) => [k, [v.min, v.max]])), { cigsPerDay: [0, 200], yearsSmoked: [0, 90], age: [10, 120], quitYearsAgo: [0, 100] }, 'pack-year ranges')
const rand = mulberry32(20261019)
const between = (min: number, max: number) => min + (max - min) * rand()
const N = 400

// ── 1. Target cairan: 33 mL/kg + (menit/60) × {0,400,600,800} + panas 500 + hamil 300 + menyusui 700; gelas = round(total/250) ──
const RATE = { none: 0, light: 400, moderate: 600, intense: 800 } as const
type Int = keyof typeof RATE
const refHydration = (w: number, m: number, i: Int, hot: boolean, preg: boolean, bf: boolean) => w * 33 + (m / 60) * RATE[i] + (hot ? 500 : 0) + (preg ? 300 : 0) + (bf ? 700 : 0)
const ints = Object.keys(RATE) as Int[]
for (let n = 0; n < N; n++) {
  const w = between(30, 200), m = between(0, 600), i = ints[Math.floor(rand() * 4)], hot = rand() < 0.5, preg = rand() < 0.5, bf = rand() < 0.5
  const r = hydrationTarget({ weightKg: w, exerciseMin: m, intensity: i, hotClimate: hot, pregnant: preg, breastfeeding: bf })
  assert.ok(r.ok); const ref = refHydration(w, m, i, hot, preg, bf)
  close(r.data.totalMl, ref, 'total mL'); close(r.data.totalL, ref / 1000, 'total L'); assert.equal(r.data.glasses, Math.round(ref / 250), 'glasses')
  close(r.data.rows.reduce((s, x) => s + x.ml, 0), ref, 'rows add up to the total'); assert.ok(r.data.rows.every((x) => x.ml > 0), 'zero rows are not listed')
  assert.equal(r.data.rows[0].label.startsWith('Baseline'), true, 'baseline always first')
}
{
  const dasar = { weightKg: 70, exerciseMin: 60, intensity: 'moderate' as Int, hotClimate: false, pregnant: false, breastfeeding: false }
  const t = (o: object) => { const r = hydrationTarget({ ...dasar, ...o }); assert.ok(r.ok); return r.data.totalMl }
  close(t({}), 70 * 33 + 600, 'worked case: 70 kg, 60 min moderate = 2,910 mL')
  close(t({ hotClimate: true }) - t({}), 500, 'hot climate adds exactly 500'); close(t({ pregnant: true }) - t({}), 300, 'pregnancy adds exactly 300'); close(t({ breastfeeding: true }) - t({}), 700, 'breastfeeding adds exactly 700')
  close(t({ pregnant: true, breastfeeding: true }) - t({}), 1000, 'pregnancy and breastfeeding stack (the page does not treat them as exclusive)')
  close(t({ exerciseMin: 0, intensity: 'intense' }), 70 * 33, 'no minutes, no exercise water whatever the intensity'); close(t({ intensity: 'none' }), 70 * 33, 'intensity none adds nothing')
  assert.ok(t({ intensity: 'light' }) < t({ intensity: 'moderate' }) && t({ intensity: 'moderate' }) < t({ intensity: 'intense' }), 'intensity is monotone')
  assert.ok(t({ weightKg: 71 }) > t({ weightKg: 70 }), 'weight is monotone')
  // Intensitas tak dikenal, termasuk nama sifat Object, ditolak dan tidak melempar.
  for (const bad of ['toString', '__proto__', 'constructor', 'hasOwnProperty', 'Moderate', '', 'extreme', null, undefined, 1, {}]) {
    let r: any; assert.doesNotThrow(() => { r = hydrationTarget({ ...dasar, intensity: bad as never }) }, `intensity ${String(bad)} must not throw`)
    assert.equal(r.ok, false, `intensity ${String(bad)} must be refused`)
  }
  hostileMatrix('hydrationTarget', dasar as Record<string, unknown>, (i) => hydrationTarget(i as never), (r) => (r as { ok: boolean }).ok === true, ['weightKg', 'exerciseMin'], HYDRATION_RANGES)
}

// ── 2. Utang tidur: Σ(kebutuhan − tidur) atas ≤ 14 malam pertama; ≤ 2 baik, ≤ 8 ringan, selebihnya signifikan ──
const night = (i: number, h: number) => ({ date: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`, hours: h })
for (let n = 0; n < N; n++) {
  const need = between(5, 11), len = Math.floor(rand() * 25), nights = Array.from({ length: len }, (_, i) => night(i, between(0, 16)))
  const r = sleepDebt(need, nights); assert.ok(r.ok)
  const used = nights.slice(0, 14), debt = used.reduce((s, x) => s + (need - x.hours), 0), avg = used.length ? used.reduce((s, x) => s + x.hours, 0) / used.length : 0
  close(r.data.debt, debt, 'debt'); close(r.data.avg, avg, 'average'); assert.equal(r.data.counted, used.length, 'counted')
  assert.equal(r.data.tone, debt <= 2 ? 'brand' : debt <= 8 ? 'low' : 'critical', 'tone'); assert.equal(r.data.verdict.startsWith(debt <= 2 ? 'Well-rested' : debt <= 8 ? 'Mild' : 'Significant'), true, 'verdict agrees with tone')
}
{
  // Batas persis memakai kelipatan 0,25 (tepat dalam biner): kebutuhan 8, satu malam.
  for (const [h, tone] of [[6, 'brand'], [5.75, 'low'], [0, 'low'], [8, 'brand']] as const) assert.equal((sleepDebt(8, [night(0, h)]) as any).data.tone, tone, `need 8, slept ${h}`)
  const ringan = (sleepDebt(10, [night(0, 8)]) as any).data; assert.deepEqual([ringan.debt, ringan.tone], [2, 'brand'], 'a debt of exactly 2 h is still "well-rested"')
  const hampir = (sleepDebt(10, [night(0, 7.75)]) as any).data; assert.deepEqual([hampir.debt, hampir.tone], [2.25, 'low'], '2.25 h is mild')
  const delapan = (sleepDebt(10, [night(0, 2), night(1, 10)]) as any).data; assert.deepEqual([delapan.debt, delapan.tone], [8, 'low'], 'a debt of exactly 8 h is still mild')
  const sembilan = (sleepDebt(10, [night(0, 1), night(1, 10)]) as any).data; assert.deepEqual([sembilan.debt, sembilan.tone], [9, 'critical'], '9 h is significant')
  // Surplus mengurangi utang (rumus memang tidak membatasi di nol) dan hanya 14 malam pertama dihitung.
  assert.equal((sleepDebt(8, [night(0, 12)]) as any).data.debt, -4, 'oversleeping gives negative debt and a "well-rested" tone')
  const limaBelas = Array.from({ length: 20 }, (_, i) => night(i, i < 14 ? 7 : 0)); assert.equal((sleepDebt(8, limaBelas) as any).data.debt, 14, 'nights 15+ are ignored'); assert.equal((sleepDebt(8, limaBelas) as any).data.counted, 14)
  assert.deepEqual((sleepDebt(8, []) as any).data, { debt: 0, avg: 0, tone: 'brand', verdict: 'Well-rested — minimal debt', counted: 0 }, 'no nights recorded reads as "no debt" (reviewer item: it is not "unknown")')
  // Kebutuhan dan jam tidur: rentang persis, tidak pernah melempar.
  hostileMatrix('validateNeed', { need: 8 }, (i) => validateNeed(i.need), (r) => (r as { ok: boolean }).ok === true, ['need'], { need: SLEEP_RANGES.need })
  hostileMatrix('validateHours', { hours: 7 }, (i) => validateHours(i.hours), (r) => (r as { ok: boolean }).ok === true, ['hours'], { hours: SLEEP_RANGES.hours })
  hostileMatrix('sleepDebt need', { need: 8 }, (i) => sleepDebt(i.need, [night(0, 7)]), (r) => (r as { ok: boolean }).ok === true, ['need'], { need: SLEEP_RANGES.need })
  // sanitizeNights: bentuk tanggal ketat; yang rusak dibuang dan dihitung.
  const bagus = night(0, 7)
  const campur: unknown[] = [bagus, { date: '2026-10-02', hours: Number.NaN }, { date: '2026-13-01', hours: 7 }, { date: '2026-10-32', hours: 7 }, { date: '26-10-02', hours: 7 }, { date: 20261002, hours: 7 }, { date: '2026-10-02', hours: -1 }, { date: '2026-10-02', hours: 17 }, { date: '2026-10-02', hours: '7' }, null, 'x', 5, [], { hours: 7 }, { date: '2026-10-03', hours: 0 }, { date: '2026-10-04', hours: 16 }]
  const s = sanitizeNights(campur); assert.deepEqual(s.nights.map((x) => x.date), ['2026-10-01', '2026-10-03', '2026-10-04'], 'only well-formed nights survive, in order'); assert.equal(s.dropped, campur.length - 3, 'dropped is reported')
  const koersi = { date: { toString: () => '2026-10-01' }, hours: 7 }; assert.equal(sanitizeNights([koersi]).nights.length, 0, 'a non-string date that merely stringifies to a valid date is dropped')
  for (const notArray of [null, undefined, {}, 'abc', 5]) assert.deepEqual(sanitizeNights(notArray), { nights: [], dropped: 0 }, `non-array ${String(notArray)}`)
  assert.equal(sanitizeNights([{ date: '2026-02-31', hours: 7 }]).nights.length, 1, 'REVIEWER ITEM: only the date SHAPE is checked, so 2026-02-31 is accepted')
}

// ── 3. Bungkus-tahun (batang/20 × tahun) dan kelayakan USPSTF 2021: usia 50–80, ≥ 20 bungkus-tahun, berhenti ≤ 15 tahun, masih merokok atau berhenti ─
const refPack = (c: number, y: number) => (c / 20) * y
const refStatus = (c: number, y: number, age: number, q: number) => {
  const py = refPack(c, y)
  return py >= 20 && age >= 50 && age <= 80 && q <= 15 && c > 0 ? 'eligible' : py >= 20 ? 'pack-years-met-other-criteria-not' : 'below-pack-years'
}
for (let n = 0; n < N * 2; n++) {
  const c = Math.floor(between(0, 80)), y = Math.floor(between(0, 60)), age = Math.floor(between(10, 100)), q = Math.floor(between(0, 40))
  const r = packYearScreen({ cigsPerDay: c, yearsSmoked: y, age, quitYearsAgo: q })
  assert.deepEqual([r.missing.length, r.invalid.length], [0, 0]); close(r.packYears as number, refPack(c, y), 'pack-years'); assert.equal(r.status, refStatus(c, y, age, q), `status for ${c}/day ${y}y age ${age} quit ${q}`)
}
{
  const dasar = { cigsPerDay: 20, yearsSmoked: 20, age: 60, quitYearsAgo: 0 }
  const s = (o: object) => packYearScreen({ ...dasar, ...o })
  assert.equal(s({}).status, 'eligible'); close(s({}).packYears as number, 20, 'one pack a day for 20 years = 20 pack-years')
  // Batas persis: 19 vs 20 bungkus-tahun; usia 49/50 dan 80/81; berhenti 15/16 tahun; 0 batang tidak pernah layak.
  assert.equal(s({ yearsSmoked: 19 }).status, 'below-pack-years'); assert.equal(s({ cigsPerDay: 19, yearsSmoked: 21 }).status, 'below-pack-years', '19 x 21 / 20 = 19.95 < 20'); assert.equal(s({ cigsPerDay: 20, yearsSmoked: 20 }).status, 'eligible')
  assert.equal(s({ age: 49 }).status, 'pack-years-met-other-criteria-not'); assert.equal(s({ age: 50 }).status, 'eligible'); assert.equal(s({ age: 80 }).status, 'eligible'); assert.equal(s({ age: 81 }).status, 'pack-years-met-other-criteria-not')
  assert.equal(s({ quitYearsAgo: 15 }).status, 'eligible'); assert.equal(s({ quitYearsAgo: 16 }).status, 'pack-years-met-other-criteria-not')
  assert.equal(s({ cigsPerDay: 0, yearsSmoked: 60 }).status, 'below-pack-years', 'zero cigarettes is zero pack-years however long'); assert.equal(s({ yearsSmoked: 0 }).status, 'below-pack-years')
  assert.equal(s({ age: 49.5 }).status, 'pack-years-met-other-criteria-not', 'REVIEWER ITEM: fractional age 49.5 is ineligible; 80.5 is also (the cut-offs are inclusive integers)'); assert.equal(s({ age: 80.5 }).status, 'pack-years-met-other-criteria-not')
  // "Belum diisi" (NaN) dipisahkan dari "di luar rentang"; keduanya tidak menghasilkan bungkus-tahun atau status.
  for (const k of Object.keys(dasar)) {
    const kosong = s({ [k]: Number.NaN }); assert.deepEqual([kosong.missing.length, kosong.invalid.length, kosong.packYears, kosong.status], [1, 0, null, null], `${k} NaN is "missing", not "invalid"`)
    for (const bad of [Infinity, -1, '5', null, undefined, {}, true, [] ]) { const r = s({ [k]: bad } as never); assert.deepEqual([r.invalid.length, r.packYears, r.status], [1, null, null], `${k}=${JSON.stringify(bad) ?? String(bad)} is invalid`) }
  }
  const ganda = packYearScreen({ cigsPerDay: Number.NaN, yearsSmoked: -1, age: 60, quitYearsAgo: 0 }); assert.deepEqual([ganda.missing.length, ganda.invalid.length], [1, 1], 'one missing and one invalid are both reported')
  hostileMatrix('packYearScreen', dasar as Record<string, unknown>, (i) => packYearScreen(i as never), (r) => (r as { status: unknown }).status !== null, ['cigsPerDay', 'yearsSmoked', 'age', 'quitYearsAgo'], PACK_YEAR_RANGES)
}
console.log('calculator-independent-reference-5: hydration target, 14-night sleep debt and pack-year/USPSTF screening match independently written references (2×400+800 seeded cases, every switch, exact boundaries, hostile inputs)')
