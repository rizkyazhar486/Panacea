// C6 (bagian rekayasa), tahap 9: FIB-4, OST, penapis risiko Framingham (hanya gerbang masukan dan pembungkus; koefisien model BELUM diverifikasi
// ulang), serta validator masukan Ballard/Apgar, pertumbuhan WHO/neonatus/CDC, dan Framingham what-if. Acuan ditulis TERPISAH; indeks OST
// memakai aritmetika bilangan bulat (persepuluh kg). Bukti rekayasa, BUKAN tinjauan klinis; temuan dan konstanta tanpa sumber dicatat di
// docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  APGAR, BIRTH_WEIGHT_G, CDC_AGE_YEARS, CDC_HEIGHT_CM, CDC_WEIGHT_KG, FRAMINGHAM_RANGE, NEONATE_AGE_DAYS, NEONATE_WEIGHT_G, RISK_RANGES, WHO_AGE_MONTHS,
  WHO_LENGTH_CM, WHO_WEIGHT_KG, cvdRisk, fib4, fib4Band, ostBand, ostIndex, parseWhoVisit, validateBallardInputs, validateCdcInputs, validateFraminghamInput,
  validateNeonateInputs, validateWhoGrowthInputs,
} from '../../src/domains/clinical-calculators/index.ts'

// Tabel ditulis ulang sebagai literal: mengubah tabel mesin tidak boleh ikut mengubah acuan.
const lit = (o: Record<string, { min: number; max: number }>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [v.min, v.max]]))
assert.deepEqual(lit(RISK_RANGES as never), { age: [18, 120], weightKg: [20, 400], totChol: [50, 1000], hdl: [5, 200], sbp: [50, 300], ast: [1, 5000], alt: [1, 5000], platelets: [5, 2000] }, 'risk ranges')
assert.deepEqual({ ...BIRTH_WEIGHT_G, ...{ apgarMin: APGAR.min, apgarMax: APGAR.max } }, { min: 200, max: 8000, apgarMin: 0, apgarMax: 10 }, 'Ballard ranges')
assert.deepEqual(lit({ a: WHO_AGE_MONTHS, w: WHO_WEIGHT_KG, l: WHO_LENGTH_CM, d: NEONATE_AGE_DAYS, g: NEONATE_WEIGHT_G, y: CDC_AGE_YEARS, k: CDC_WEIGHT_KG, h: CDC_HEIGHT_CM }), { a: [0, 60], w: [0.5, 60], l: [30, 150], d: [0, 30], g: [200, 8000], y: [2, 20], k: [5, 300], h: [50, 250] }, 'growth ranges')
assert.deepEqual(Object.fromEntries(Object.entries(FRAMINGHAM_RANGE).map(([k, v]) => [k, [v.min, v.max]])), { age: [30, 74], totChol: [100, 500], hdl: [10, 150], sbp: [70, 300] }, 'Framingham input ranges')

const rand = mulberry32(20261023)
const between = (min: number, max: number) => min + (max - min) * rand()
const N = 400

// ── 1. FIB-4 = usia × AST / (trombosit × √ALT), dibulatkan 2 desimal; pita: < 1,3 (usia ≥ 65: < 2,0) rendah, ≤ 2,67 tidak tentu, selebihnya tinggi ──
for (let n = 0; n < N; n++) {
  const age = between(18, 120), ast = between(1, 5000), alt = between(1, 5000), plt = between(5, 2000), r = fib4({ age, ast, alt, platelets: plt })
  const exact = (age * ast) / (plt * Math.sqrt(alt)); assert.ok(r.value !== null && Math.abs(r.value - exact) <= 0.005 + 1e-9, `FIB-4 ${r.value} vs ${exact}`); assert.equal(r.value, Number(r.value.toFixed(2)), 'value has at most 2 decimals')
  const hi = age >= 65 ? 2.0 : 1.3, esperado = r.value < hi ? 'Low' : r.value <= 2.67 ? 'Indeterminate' : 'High'; assert.equal(r.band!.label, esperado, `band for ${r.value} at age ${age}`)
}
for (const [v, age, label] of [[1.29, 64, 'Low'], [1.3, 64, 'Indeterminate'], [1.99, 65, 'Low'], [2.0, 65, 'Indeterminate'], [1.5, 65, 'Low'], [1.5, 64.99, 'Indeterminate'], [2.67, 40, 'Indeterminate'], [2.68, 40, 'High'], [2.67, 80, 'Indeterminate'], [0, 40, 'Low'], [10, 80, 'High']] as const) assert.equal(fib4Band(v, age).label, label, `fib4Band(${v}, ${age})`)
assert.deepEqual([fib4Band(1, 40).tone, fib4Band(2, 40).tone, fib4Band(3, 40).tone], ['brand', 'low', 'critical'], 'tones')
{
  close(fib4({ age: 50, ast: 40, alt: 25, platelets: 200 }).value as number, 2, 'worked case: 50 × 40 / (200 × 5) = 2.00')
  // ACHADO untuk peninjau (tidak diubah): nilai dibulatkan ke 2 desimal SEBELUM pita; 1,2997 tampil 1,30 dan jatuh ke "Indeterminate".
  const k = fib4({ age: 40, ast: 26, alt: 16.008, platelets: 200 }); assert.ok((40 * 26) / (200 * Math.sqrt(16.008)) < 1.3 && k.value === 1.3 && k.band!.label === 'Indeterminate', 'REVIEWER ITEM: rounding happens before banding')
  for (const f of ['age', 'ast', 'alt', 'platelets'] as const) {
    const dasar = { age: 50, ast: 40, alt: 25, platelets: 200 }, kosong = fib4({ ...dasar, [f]: Number.NaN }); assert.deepEqual([kosong.missing.length, kosong.invalid.length, kosong.value, kosong.band], [1, 0, null, null], `${f} NaN is missing`)
  }
  hostileMatrix('fib4', { age: 50, ast: 40, alt: 25, platelets: 200 }, (i) => fib4(i), (r) => (r as { value: unknown }).value !== null, ['age', 'ast', 'alt', 'platelets'], RISK_RANGES)
}

// ── 2. OST = trunc(0,2 × (kg − usia)); > −1 rendah, −1…−4 sedang, < −4 tinggi. Acuan: trunc((persepuluh kg − 10 × usia) / 50) ──
for (let n = 0; n < 20000; n++) {
  const w10 = Math.floor(between(200, 4001)), age = Math.floor(between(18, 121)), r = ostIndex({ weightKg: w10 / 10, age })
  assert.equal(r.value, Math.trunc((w10 - age * 10) / 50), `OST for ${w10 / 10} kg, age ${age}`)
}
for (const [v, label] of [[3, 'Lower risk'], [0, 'Lower risk'], [-0.5, 'Lower risk'], [-1, 'Moderate risk'], [-4, 'Moderate risk'], [-4.0001, 'Higher risk'], [-5, 'Higher risk']] as const) assert.equal(ostBand(v).label, label, `ostBand(${v})`)
assert.deepEqual([ostBand(0).tone, ostBand(-2).tone, ostBand(-9).tone], ['brand', 'low', 'critical'])
{
  assert.equal(ostIndex({ weightKg: 70, age: 60 }).value, 2, 'worked case: 0.2 × 10 = 2'); assert.equal(ostIndex({ weightKg: 50, age: 75 }).value, -5, 'worked case: 0.2 × −25 = −5 (higher risk)'); assert.equal(ostIndex({ weightKg: 50, age: 75 }).band!.label, 'Higher risk')
  assert.ok(ostIndex({ weightKg: 40, age: 41 }).value === 0, 'REVIEWER/ENGINEERING NOTE: a small negative difference truncates to −0, which compares equal to 0 and prints as "0"'); assert.equal(ostIndex({ weightKg: 40, age: 41 }).band!.label, 'Lower risk')
  for (const f of ['age', 'weightKg'] as const) { const k = ostIndex({ age: 60, weightKg: 70, [f]: Number.NaN }); assert.deepEqual([k.missing.length, k.value, k.band], [1, null, null], `${f} NaN is missing`) }
  hostileMatrix('ostIndex', { age: 60, weightKg: 70 }, (i) => ostIndex(i), (r) => (r as { value: unknown }).value !== null, ['age', 'weightKg'], RISK_RANGES)
}

// ── 3. Framingham: hanya gerbang masukan dan pembungkus (koefisien model di lib/riskModels BELUM diverifikasi ulang secara independen) ──
{
  const dasar = { age: 55, sex: 'M' as const, totChol: 210, hdl: 50, sbp: 130, treatedBP: false, smoker: false, diabetic: false }
  const ok = cvdRisk(dasar); assert.deepEqual([ok.missing.length, ok.invalid.length], [0, 0]); assert.ok(typeof ok.riskPct === 'number' && ok.riskPct > 0 && ok.riskPct < 100, 'a plausible risk is produced'); assert.ok(ok.band !== null)
  assert.ok(cvdRisk({ ...dasar, smoker: true, diabetic: true, treatedBP: true, sbp: 160 }).riskPct! > ok.riskPct!, 'adding risk factors increases the risk (monotone sanity)')
  assert.ok(cvdRisk({ ...dasar, age: 70 }).riskPct! > cvdRisk({ ...dasar, age: 40 }).riskPct!, 'older age increases the risk'); assert.ok(cvdRisk({ ...dasar, hdl: 80 }).riskPct! < cvdRisk({ ...dasar, hdl: 35 }).riskPct!, 'higher HDL lowers the risk')
  for (const sx of ['m', 'f', 'X', '', null, undefined, 1, true, {}]) { const r = cvdRisk({ ...dasar, sex: sx as never }); assert.deepEqual([r.riskPct, r.band, r.invalid.includes('sex must be M or F')], [null, null, true], `sex ${String(sx)}`) }
  for (const k of ['treatedBP', 'smoker', 'diabetic'] as const) for (const bad of [0, 1, 'true', null, undefined, {}]) assert.equal(cvdRisk({ ...dasar, [k]: bad as never }).riskPct, null, `${k}=${String(bad)}`)
  const hdl = cvdRisk({ ...dasar, hdl: 150, totChol: 150 }); assert.deepEqual([hdl.riskPct, hdl.invalid.includes('HDL must be below total cholesterol')], [null, true], 'HDL ≥ total cholesterol is refused'); assert.equal(cvdRisk({ ...dasar, hdl: 199, totChol: 200 }).riskPct !== null, true, 'HDL just below total is accepted')
  for (const f of ['age', 'totChol', 'hdl', 'sbp'] as const) { const k = cvdRisk({ ...dasar, [f]: Number.NaN }); assert.deepEqual([k.missing.length, k.riskPct, k.band], [1, null, null], `${f} NaN is missing`) }
  hostileMatrix('cvdRisk', dasar as Record<string, unknown>, (i) => cvdRisk(i as never), (r) => (r as { riskPct: unknown }).riskPct !== null, ['age', 'sbp'], { age: RISK_RANGES.age, sbp: RISK_RANGES.sbp })
  // Colesterol total e HDL dependen (HDL < total), jadi batasnya diuji berpasangan.
  const ada = (o: object) => cvdRisk({ ...dasar, ...o }).riskPct !== null
  assert.ok(ada({ totChol: 50, hdl: 5 }) && ada({ totChol: 1000, hdl: 200 }) && ada({ totChol: 1000, hdl: 5 }), 'total cholesterol 50–1000 and HDL 5–200 are accepted at their limits')
  assert.ok(!ada({ totChol: 49.99, hdl: 5 }) && !ada({ totChol: 1000.01, hdl: 50 }) && !ada({ totChol: 300, hdl: 4.99 }) && !ada({ totChol: 1000, hdl: 200.01 }), 'just outside either range is refused')
  for (const bad of [Number.NaN, Infinity, -1, 0, '5', null, undefined, {}, true]) { assert.ok(!ada({ totChol: bad }), `totChol ${String(bad)}`); assert.ok(!ada({ hdl: bad }), `hdl ${String(bad)}`) }
}

// ── 4. Validator masukan: Ballard/Apgar, WHO, neonatus, CDC, kunjungan WHO dari teks, Framingham what-if ──
{
  const b = { w: 3000, a1: 8, a5: 9 }, run = (i: typeof b) => validateBallardInputs(i.w, i.a1, i.a5), comp = (r: unknown) => (r as { ok: boolean }).ok
  assert.deepEqual(run(b), { ok: true, data: { birthWeightG: 3000, apgar1: 8, apgar5: 9 } })
  for (const bad of [0.5, 5.5, 10.0001, -1, 11, Number.NaN, '8', null, undefined]) { assert.equal(comp(validateBallardInputs(3000, bad as never, 9)), false, `apgar1 ${String(bad)}`); assert.equal(comp(validateBallardInputs(3000, 8, bad as never)), false, `apgar5 ${String(bad)}`) }
  for (const a of [0, 10]) assert.equal(comp(validateBallardInputs(3000, a, a)), true, `Apgar ${a} is a legitimate value`)
  assert.match((validateBallardInputs(3000, 0.5, 9) as { reason: string }).reason, /1-minute APGAR/); assert.match((validateBallardInputs(3000, 8, 0.5) as { reason: string }).reason, /5-minute APGAR/)
  hostileMatrix('ballard weight', b, run, comp, ['w'], { w: BIRTH_WEIGHT_G })
  const who = { a: 12, w: 9, l: 75 }, wr = (i: typeof who) => validateWhoGrowthInputs(i.a, i.w, i.l)
  hostileMatrix('WHO growth', who, wr, comp, ['a', 'w', 'l'], { a: WHO_AGE_MONTHS, w: WHO_WEIGHT_KG, l: WHO_LENGTH_CM })
  const neo = { bw: 3200, d: 5, cw: 3000 }, nr = (i: typeof neo) => validateNeonateInputs(i.bw, i.d, i.cw)
  hostileMatrix('neonate', neo, nr, comp, ['bw', 'd', 'cw'], { bw: NEONATE_WEIGHT_G, d: NEONATE_AGE_DAYS, cw: NEONATE_WEIGHT_G })
  const cdc = { y: 10, w: 32, h: 138 }, cr = (i: typeof cdc) => validateCdcInputs(i.y, i.w, i.h)
  hostileMatrix('CDC growth', cdc, cr, comp, ['y', 'w', 'h'], { y: CDC_AGE_YEARS, w: CDC_WEIGHT_KG, h: CDC_HEIGHT_CM })
  assert.deepEqual(validateWhoGrowthInputs(0, 3.4, 50), { ok: true, data: { ageMonths: 0, weightKg: 3.4, lengthCm: 50 } }, 'age 0 months (a newborn) is a legitimate measurement')
  assert.match((validateWhoGrowthInputs(61, 9, 75) as { reason: string }).reason, /^Age must be 0–60 months$/); assert.match((validateCdcInputs(10, 4, 138) as { reason: string }).reason, /^Weight must be 5–300 kg$/); assert.match((validateNeonateInputs(3200, 31, 3000) as { reason: string }).reason, /^Age must be 0–30 days$/)
  // Teks kolom: kosong bukan 0; usia 0 diketik adalah bayi baru lahir.
  assert.deepEqual(parseWhoVisit('0', '3.4', '50'), { ok: true, data: { ageMo: 0, weightKg: 3.4, heightCm: 50 } }, 'an age typed as 0 is a newborn visit')
  for (const [a, w, h] of [['', '3.4', '50'], [' ', '3.4', '50'], ['0', '', '50'], ['0', '3.4', ' '], ['abc', '3.4', '50'], ['0', '3.4', 'NaN'], ['Infinity', '3.4', '50'], ['-1', '3.4', '50'], ['0', '3.4', '1e9']] as const) assert.equal(parseWhoVisit(a, w, h).ok, false, `parseWhoVisit(${JSON.stringify([a, w, h])})`)
  assert.equal(parseWhoVisit('0x10', '9', '75').ok, true, 'REVIEWER ITEM: parseNumberField uses Number(), so a typed "0x10" reads as 16 (a number input cannot type it, but the parser accepts it)')
  // Framingham what-if: cada campo exige angka; NaN = "belum diisi" dipisahkan dari di luar rentang.
  const fr = { age: 55, totChol: 210, hdl: 50, sbp: 130 }
  assert.deepEqual(validateFraminghamInput(fr), { ok: true, value: fr })
  for (const f of Object.keys(fr) as (keyof typeof fr)[]) {
    const kosong = validateFraminghamInput({ ...fr, [f]: Number.NaN }) as { ok: false; problems: Record<string, string> }; assert.deepEqual([kosong.ok, Object.keys(kosong.problems), /is required$/.test(kosong.problems[f])], [false, [f], true], `${f} NaN is "required"`)
    for (const bad of [Infinity, -1, 0, '5', null, undefined, {}, true, 1e9]) { const r = validateFraminghamInput({ ...fr, [f]: bad } as never) as { ok: false; problems: Record<string, string> }; assert.deepEqual([r.ok, Object.keys(r.problems), /must be/.test(r.problems[f])], [false, [f], true], `${f}=${String(bad)}`) }
  }
  const dois = validateFraminghamInput({ age: Number.NaN, totChol: 5000, hdl: 50, sbp: 130 }) as { ok: false; problems: Record<string, string> }; assert.deepEqual(Object.keys(dois.problems).sort(), ['age', 'totChol'], 'every problem is reported, not only the first')
  hostileMatrix('framingham what-if', fr, (i) => validateFraminghamInput(i), comp, ['age', 'totChol', 'hdl', 'sbp'], { age: FRAMINGHAM_RANGE.age, totChol: FRAMINGHAM_RANGE.totChol, hdl: FRAMINGHAM_RANGE.hdl, sbp: FRAMINGHAM_RANGE.sbp })
}
console.log('calculator-independent-reference-9: FIB-4, OST, Framingham input gates and the newborn/growth/Framingham input validators match independently written references (OST integer reference on 20,000 cases, band boundaries, hostile inputs); Framingham model coefficients not re-derived')
