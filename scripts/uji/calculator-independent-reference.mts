// C6 (engineering half): verifikasi independen kalkulator klinis rumus-murni.
// Tiap kalkulator dibandingkan dengan implementasi acuan yang DITULIS TERPISAH dari rumus terbitnya (tanpa mengimpor konstanta
// mesin), diuji dengan sampel acak berbenih, invarian metamorfik, batas rentang, dan masukan bermusuhan (NaN, ±Infinity, string,
// null, objek). Ini bukti rekayasa. Ini BUKAN tinjauan klinis: rentang masukan adalah batas kewajaran rekayasa dan ambang pita
// adalah pilihan yang harus ditandatangani klinisi (lihat docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md).
import assert from 'node:assert/strict'
import {
  AA_RANGES, CA_RANGES, CG_RANGES, FENA_RANGES, LDL_RANGES, OSM_RANGES, QTC_RANGES,
  PARKLAND_TBSA_PERCENT, PARKLAND_WEIGHT_KG, MAINTENANCE_WEIGHT_KG, IBW_HEIGHT_CM, SYSTOLIC_MMHG, DIASTOLIC_MMHG,
  aaGradient, cockcroftGault, correctedCalcium, dailyCalories, fena, hollidaySegar, idealBodyWeight, ldlFriedewald,
  meanArterialPressure, parklandVolumes, qtc, serumOsmolality,
  cgBand, calciumBand, fenaBand, ldlBand, osmBand, gapBand, qtcBand,
} from '../../src/domains/clinical-calculators/index.ts'

// ── Peralatan ───────────────────────────────────────────────────────────────────────────────────
function mulberry32(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const rand = mulberry32(20261012)
const between = (min: number, max: number) => min + (max - min) * rand()
const close = (a: number, b: number, what: string, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${what}: engine ${a} vs reference ${b}`)
const N = 400
const HOSTILE: readonly unknown[] = [Number.NaN, Infinity, -Infinity, -1, 0, -1e308, 1e308, '5', '', null, undefined, true, {}, [], [5]]

/** Nilai bermusuhan pada SATU kolom (kolom lain sah) tidak pernah menghasilkan angka, dan tidak pernah melempar. */
function hostileMatrix<I extends Record<string, unknown>>(name: string, base: I, run: (i: I) => unknown, computed: (r: any) => boolean, fields: readonly (keyof I & string)[], ranges: Record<string, { min: number; max: number }>, optional: readonly string[] = []) {
  assert.equal(computed(run(base)), true, `${name}: the base fixture must compute`)
  for (const f of fields) {
    for (const bad of HOSTILE) {
      // 0 dan -1 sah bila berada dalam rentang kolom itu; di luar itu harus ditolak.
      if (typeof bad === 'number' && Number.isFinite(bad) && bad >= ranges[f]!.min && bad <= ranges[f]!.max) continue
      if (bad === undefined && optional.includes(f)) continue // undefined = "tidak diberikan" untuk kolom opsional (null/NaN tetap ditolak)
      let r: unknown
      assert.doesNotThrow(() => { r = run({ ...base, [f]: bad }) }, `${name}.${f}=${String(bad)} must not throw`)
      assert.equal(computed(r), false, `${name}.${f}=${JSON.stringify(bad) ?? String(bad)} must not produce a result`)
    }
    // Batas: min dan max sah; sedikit di luar ditolak.
    const { min, max } = ranges[f]!
    assert.equal(computed(run({ ...base, [f]: min })), true, `${name}.${f} at min`)
    assert.equal(computed(run({ ...base, [f]: max })), true, `${name}.${f} at max`)
    const eps = Math.max(1e-6, Math.abs(max) * 1e-9)
    assert.equal(computed(run({ ...base, [f]: min - eps })), false, `${name}.${f} just below min`)
    assert.equal(computed(run({ ...base, [f]: max + eps })), false, `${name}.${f} just above max`)
  }
}

// ── 1. Cockcroft–Gault (Cockcroft & Gault, Nephron 1976;16:31-41) ───────────────────────────────
const refDevine = (heightCm: number, male: boolean) => (male ? 50 : 45.5) + 2.3 * Math.max(0, heightCm / 2.54 - 60)
const refCg = (age: number, kg: number, scr: number, female: boolean) => ((140 - age) * kg * (female ? 0.85 : 1)) / (72 * scr)
for (let i = 0; i < N; i++) {
  const age = between(18, 120), w = between(20, 400), h = between(100, 250), scr = between(0.1, 20), sex = rand() < 0.5 ? 'F' : 'M'
  const basis = rand() < 0.5 ? 'actual' : 'ideal'
  const r = cockcroftGault({ age, weightKg: w, heightCm: h, scr, sex, weightBasis: basis })
  const kg = basis === 'ideal' ? refDevine(h, sex === 'M') : w
  close(r.crcl as number, refCg(age, kg, scr, sex === 'F'), 'CG crcl'); close(r.usedWeightKg as number, kg, 'CG used weight'); close(r.ibwKg as number, refDevine(h, sex === 'M'), 'CG IBW')
  assert.equal(r.obese, w > refDevine(h, sex === 'M') * 1.25, 'CG obesity flag is actual weight above 125% of IBW')
}
{
  const base = { age: 50, weightKg: 80, heightCm: 175, scr: 1.0, sex: 'M', weightBasis: 'actual' } as const
  const m = cockcroftGault(base).crcl as number, f = cockcroftGault({ ...base, sex: 'F' }).crcl as number
  close(f / m, 0.85, 'CG female factor'); close(cockcroftGault({ ...base, weightKg: 160 }).crcl as number / m, 2, 'CG linear in weight'); close(cockcroftGault({ ...base, scr: 2 }).crcl as number / m, 0.5, 'CG inverse in creatinine')
  assert.ok((cockcroftGault({ ...base, age: 70 }).crcl as number) < m, 'CG falls with age')
  close(cockcroftGault({ ...base, weightBasis: 'ideal', weightKg: 40 }).crcl as number, cockcroftGault({ ...base, weightBasis: 'ideal', weightKg: 300 }).crcl as number, 'CG ideal basis ignores actual weight')
  assert.equal(cockcroftGault({ ...base, heightCm: Number.NaN }).crcl !== null, true, 'height is optional on actual-weight basis')
  assert.equal(cockcroftGault({ ...base, weightBasis: 'ideal', heightCm: Number.NaN }).crcl, null, 'height is required on ideal basis')
  assert.deepEqual(cockcroftGault({ ...base, age: Number.NaN }).missing, ['age'], 'blank age is "missing", never zero')
  assert.equal(cockcroftGault({ ...base, sex: 'X' as never }).crcl, null); assert.equal(cockcroftGault({ ...base, weightBasis: 'x' as never }).crcl, null)
  for (const [c, label] of [[90, 'Normal'], [89.999, 'Mildly reduced'], [60, 'Mildly reduced'], [59.999, 'Moderately reduced'], [30, 'Moderately reduced'], [29.999, 'Severely reduced'], [15, 'Severely reduced'], [14.999, 'Kidney failure']] as const) assert.ok(cgBand(c).label.startsWith(label), `CG band at ${c}`)
}
hostileMatrix('cockcroftGault', { age: 50, weightKg: 80, heightCm: 175, scr: 1.0, sex: 'M', weightBasis: 'actual' } as Record<string, unknown>, (i) => cockcroftGault(i as never), (r) => r.crcl !== null && Number.isFinite(r.crcl), ['age', 'weightKg', 'scr'], CG_RANGES)

// ── 2. Tekanan arteri rata-rata (MAP = DBP + (SBP − DBP)/3) ──────────────────────────────────────
for (let i = 0; i < N; i++) {
  // Batas atas disisakan 7 mmHg agar invarian pergeseran tetap berada di dalam rentang sah.
  const d = between(DIASTOLIC_MMHG.min, DIASTOLIC_MMHG.max - 7), s = between(Math.max(SYSTOLIC_MMHG.min, d + 1), SYSTOLIC_MMHG.max - 7)
  const r = meanArterialPressure(s, d)
  assert.equal(r.ok, true); close((r as any).data.map, d + (s - d) / 3, 'MAP'); assert.ok((r as any).data.map > d && (r as any).data.map < s, 'MAP lies strictly between DBP and SBP')
  close((meanArterialPressure(s + 7, d + 7) as any).data.map - (r as any).data.map, 7, 'MAP shift-invariance', 1e-9)
}
for (const [s, d] of [[120, 80], [90, 60], [200, 120]] as const) close((meanArterialPressure(s, d) as any).data.map, (s + 2 * d) / 3, 'MAP textbook form')
for (const bad of HOSTILE) for (const [s, d] of [[bad, 80], [120, bad]] as const) {
  if (typeof bad === 'number' && Number.isFinite(bad) && ((s === bad && bad >= SYSTOLIC_MMHG.min) || (d === bad && bad >= DIASTOLIC_MMHG.min))) continue
  assert.equal(meanArterialPressure(s as never, d as never).ok, false, `MAP rejects ${JSON.stringify(bad) ?? String(bad)}`)
}
assert.equal(meanArterialPressure(80, 80).ok, false, 'pulse pressure must be positive'); assert.equal(meanArterialPressure(70, 90).ok, false)
assert.equal((meanArterialPressure(80, 45) as any).data.label, 'Very low'); assert.equal((meanArterialPressure(90, 50) as any).data.label, 'Normal'); assert.equal((meanArterialPressure(160, 100) as any).data.label, 'High'); assert.equal((meanArterialPressure(120, 80) as any).data.label, 'Normal')

// ── 3. Kalsium terkoreksi albumin (Payne et al., BMJ 1973;4:643-6) ───────────────────────────────
for (let i = 0; i < N; i++) {
  const ca = between(2, 20), alb = between(0.5, 7); const r = correctedCalcium({ totalCa: ca, albumin: alb })
  close(r.corrected as number, ca + 0.8 * (4 - alb), 'corrected calcium')
}
close(correctedCalcium({ totalCa: 8, albumin: 4 }).corrected as number, 8, 'albumin 4.0 g/dL leaves calcium unchanged')
close((correctedCalcium({ totalCa: 8, albumin: 2 }).corrected as number) - 8, 1.6, 'each g/dL below 4.0 adds 0.8 mg/dL')
close((correctedCalcium({ totalCa: 8, albumin: 5 }).corrected as number) - 8, -0.8, 'albumin above 4.0 lowers it')
for (const [v, label] of [[6.999, 'Severe hypocalcemia'], [7, 'Hypocalcemia'], [8.499, 'Hypocalcemia'], [8.5, 'Normal'], [10.5, 'Normal'], [10.501, 'Hypercalcemia'], [12, 'Hypercalcemia'], [12.001, 'Severe hypercalcemia']] as const) assert.equal(calciumBand(v).label, label, `calcium band at ${v}`)
hostileMatrix('correctedCalcium', { totalCa: 9, albumin: 3.5 } as Record<string, unknown>, (i) => correctedCalcium(i as never), (r) => r.corrected !== null, ['totalCa', 'albumin'], CA_RANGES)
assert.deepEqual(correctedCalcium({ totalCa: Number.NaN, albumin: 3 }).missing, ['measured total calcium'])

// ── 4. Osmolalitas serum terhitung ───────────────────────────────────────────────────────────────
const refOsm = (na: number, glu: number, bun: number, eth = 0) => 2 * na + glu / 18 + bun / 2.8 + eth / 3.7
for (let i = 0; i < N; i++) {
  const na = between(90, 200), glu = between(20, 2000), bun = between(1, 300), eth = rand() < 0.5 ? between(0, 1000) : undefined, meas = rand() < 0.5 ? between(150, 600) : undefined
  const r = serumOsmolality({ na, glucose: glu, bun, ethanol: eth, measured: meas }) as any
  close(r.data.calculated, refOsm(na, glu, bun, eth ?? 0), 'osmolality'); if (meas !== undefined) close(r.data.gap, meas - refOsm(na, glu, bun, eth ?? 0), 'osmolal gap'); else assert.equal(r.data.gap, null, 'no measured value: no gap, not a zero gap')
}
{
  const b = serumOsmolality({ na: 140, glucose: 90, bun: 14 }) as any
  close((serumOsmolality({ na: 141, glucose: 90, bun: 14 }) as any).data.calculated - b.data.calculated, 2, 'each mmol/L of Na adds 2 mOsm/kg')
  close((serumOsmolality({ na: 140, glucose: 108, bun: 14 }) as any).data.calculated - b.data.calculated, 1, 'each 18 mg/dL glucose adds 1 mOsm/kg')
  close((serumOsmolality({ na: 140, glucose: 90, bun: 16.8 }) as any).data.calculated - b.data.calculated, 1, 'each 2.8 mg/dL BUN adds 1 mOsm/kg')
  close((serumOsmolality({ na: 140, glucose: 90, bun: 14, ethanol: 0 }) as any).data.calculated, b.data.calculated, 'ethanol 0 equals no ethanol')
  for (const [v, label] of [[274.999, 'Hypo-osmolal'], [275, 'Normal'], [295, 'Normal'], [295.001, 'Hyperosmolal'], [320, 'Hyperosmolal'], [320.001, 'Severely hyperosmolal']] as const) assert.equal(osmBand(v).label, label, `osm band at ${v}`)
  for (const [v, label] of [[20.001, 'Markedly elevated gap'], [20, 'Elevated gap'], [10.001, 'Elevated gap'], [10, 'Normal gap'], [-10, 'Normal gap'], [-10.001, 'Negative gap — recheck values/units']] as const) assert.equal(gapBand(v).label, label, `gap band at ${v}`)
}
hostileMatrix('serumOsmolality', { na: 140, glucose: 90, bun: 14, ethanol: 10, measured: 290 } as Record<string, unknown>, (i) => serumOsmolality(i as never), (r) => r.ok === true, ['na', 'glucose', 'bun', 'ethanol', 'measured'], OSM_RANGES, ['ethanol', 'measured'])

// ── 5. LDL-C Friedewald (Friedewald et al., Clin Chem 1972;18:499-502) ───────────────────────────
for (let i = 0; i < N; i++) {
  const tc = between(50, 1000), hdl = between(5, Math.min(200, tc - 1)), tg = between(10, 5000)
  const r = ldlFriedewald({ totalChol: tc, hdl, tg }); close(r.nonHdl as number, tc - hdl, 'non-HDL')
  const raw = tc - hdl - tg / 5
  if (tg >= 400) { assert.equal(r.ldl, null, 'Friedewald is not applied at TG ≥ 400'); assert.equal(r.tgTooHigh, true) }
  else if (raw <= 0) { assert.equal(r.ldl, null); assert.equal(r.ldlImplausible, true, 'a non-positive calculated LDL is flagged, never banded') }
  else close(r.ldl as number, raw, 'LDL')
}
{
  const b = ldlFriedewald({ totalChol: 220, hdl: 50, tg: 150 }); close(b.ldl as number, 140, 'LDL textbook case')
  close((ldlFriedewald({ totalChol: 220, hdl: 50, tg: 155 }).ldl as number) - 140, -1, 'each 5 mg/dL TG lowers LDL by 1'); close((ldlFriedewald({ totalChol: 221, hdl: 50, tg: 150 }).ldl as number) - 140, 1, 'TC +1 raises LDL +1'); close((ldlFriedewald({ totalChol: 220, hdl: 51, tg: 150 }).ldl as number) - 140, -1, 'HDL +1 lowers LDL −1')
  assert.notEqual(ldlFriedewald({ totalChol: 220, hdl: 50, tg: 399.99 }).ldl, null); assert.equal(ldlFriedewald({ totalChol: 220, hdl: 50, tg: 400 }).ldl, null); assert.equal(ldlFriedewald({ totalChol: 220, hdl: 50, tg: 400 }).nonHdl, 170, 'non-HDL remains valid at TG ≥ 400')
  assert.deepEqual(ldlFriedewald({ totalChol: 100, hdl: 100, tg: 100 }).invalid, ['HDL must be below total cholesterol'])
  // Tepat nol (100 - 50 - 250/5): tidak sahih dan tidak diberi pita; satu langkah di atasnya sahih.
  const nol = ldlFriedewald({ totalChol: 100, hdl: 50, tg: 250 }); assert.equal(nol.ldl, null, 'a calculated LDL of exactly 0 is not valid'); assert.equal(nol.ldlImplausible, true); assert.equal(nol.band, null)
  assert.equal(ldlFriedewald({ totalChol: 100, hdl: 50, tg: 245 }).ldl, 1, 'one step above zero is valid')
  for (const [v, label] of [[99.999, 'Optimal (<100)'], [100, 'Near optimal (100-129)'], [129.999, 'Near optimal (100-129)'], [130, 'Borderline high (130-159)'], [159.999, 'Borderline high (130-159)'], [160, 'High (160-189)'], [189.999, 'High (160-189)'], [190, 'Very high (≥190)']] as const) assert.equal(ldlBand(v).label, label, `LDL band at ${v}`)
}
// HDL dasar 20: tetap < kolesterol total di seluruh rentang kolom itu (aturan lintas-kolom HDL < total diuji terpisah di atas).
hostileMatrix('ldlFriedewald', { totalChol: 220, hdl: 20, tg: 150 } as Record<string, unknown>, (i) => ldlFriedewald(i as never), (r) => r.complete === true, ['totalChol', 'hdl', 'tg'], LDL_RANGES)

// ── 6. QTc: Bazett (1920), Fridericia (1920), Framingham (Sagie 1992), Hodges (1983) ────────────
for (let i = 0; i < N; i++) {
  const qt = between(200, 700), hr = between(30, 200), sex = rand() < 0.5 ? 'M' : 'F'; const r = qtc({ qtMs: qt, hr, sex })
  const rr = 60 / hr
  close(r.bazett as number, qt / Math.sqrt(rr), 'Bazett'); close(r.fridericia as number, qt / Math.cbrt(rr), 'Fridericia'); close(r.framingham as number, qt + 154 * (1 - rr), 'Framingham'); close(r.hodges as number, qt + 1.75 * (hr - 60), 'Hodges')
}
{
  const r = qtc({ qtMs: 400, hr: 60, sex: 'M' }); for (const k of ['bazett', 'fridericia', 'framingham', 'hodges'] as const) close(r[k] as number, 400, `every correction equals the raw QT at 60 bpm (${k})`)
  const fast = qtc({ qtMs: 340, hr: 120, sex: 'M' }); assert.ok((fast.bazett as number) > (fast.fridericia as number), 'Bazett over-corrects at high rates relative to Fridericia')
  const slow = qtc({ qtMs: 440, hr: 40, sex: 'M' }); assert.ok((slow.bazett as number) < (slow.fridericia as number), 'and under-corrects at low rates')
  assert.equal(qtc({ qtMs: 400, hr: 60, sex: 'X' }).bazett, null, 'unknown sex never defaults'); assert.equal(qtc({ qtMs: 400, hr: 60, sex: undefined }).bazett, null)
  for (const [v, sex, label] of [[429.999, 'M', 'Normal'], [430, 'M', 'Borderline'], [449.999, 'M', 'Borderline'], [450, 'M', 'Prolonged'], [499.999, 'M', 'Prolonged'], [500, 'M', 'High risk — markedly prolonged'],
    [449.999, 'F', 'Normal'], [450, 'F', 'Borderline'], [469.999, 'F', 'Borderline'], [470, 'F', 'Prolonged'], [499.999, 'F', 'Prolonged'], [500, 'F', 'High risk — markedly prolonged']] as const) assert.equal(qtcBand(v, sex).label, label, `QTc band ${sex} ${v}`)
}
hostileMatrix('qtc', { qtMs: 400, hr: 70, sex: 'M' } as Record<string, unknown>, (i) => qtc(i as never), (r) => r.bazett !== null, ['qtMs', 'hr'], QTC_RANGES)

// ── 7. FENa ──────────────────────────────────────────────────────────────────────────────────────
for (let i = 0; i < N; i++) {
  const una = between(0.1, 400), pcr = between(0.1, 30), pna = between(90, 200), ucr = between(1, 1500); const r = fena({ urineNa: una, plasmaCr: pcr, plasmaNa: pna, urineCr: ucr })
  close(r.fena as number, (una / pna) / (ucr / pcr) * 100, 'FENa')
}
{
  const base = { urineNa: 40, plasmaCr: 2, plasmaNa: 140, urineCr: 80 }; const f0 = fena(base).fena as number
  close(fena({ ...base, urineNa: 80, plasmaNa: 280 > 200 ? 140 : 280 }).fena as number, f0 * 2, 'doubling urine Na doubles FENa')
  close(fena({ ...base, urineCr: 160, plasmaCr: 4 }).fena as number, f0, 'scaling both creatinines leaves FENa unchanged')
  close(fena({ urineNa: 20, plasmaCr: 1, plasmaNa: 100, urineCr: 20 }).fena as number, 1, 'worked case giving exactly 1 %')
  for (const [v, label] of [[0.999, 'Prerenal azotemia likely'], [1, 'Indeterminate zone'], [2, 'Indeterminate zone'], [2.001, 'Intrinsic renal injury (e.g. ATN) likely']] as const) assert.equal(fenaBand(v).label, label, `FENa band at ${v}`)
}
hostileMatrix('fena', { urineNa: 40, plasmaCr: 2, plasmaNa: 140, urineCr: 80 } as Record<string, unknown>, (i) => fena(i as never), (r) => r.fena !== null, ['urineNa', 'plasmaCr', 'plasmaNa', 'urineCr'], FENA_RANGES)

// ── 8. Gradien A–a (persamaan gas alveolar disederhanakan, R = 0,8, PH2O = 47 mmHg) ──────────────
for (let i = 0; i < N; i++) {
  const fio2 = between(21, 100), pao2 = between(1, 700), paco2 = between(5, 150), age = between(0, 120), patm = between(400, 800)
  const r = aaGradient({ fio2, pao2, paco2, age, patm }) as any; const pAO2 = (fio2 / 100) * (patm - 47) - paco2 / 0.8
  close(r.data.alveolar, pAO2, 'alveolar PO2'); close(r.data.gradient, pAO2 - pao2, 'A-a gradient'); close(r.data.expectedForAge, age / 4 + 4, 'age-expected gradient'); assert.equal(r.data.elevated, pAO2 - pao2 > age / 4 + 4); assert.equal(r.data.supplementalOxygen, fio2 > 30)
}
{
  const b = aaGradient({ fio2: 21, pao2: 90, paco2: 40, age: 40, patm: 760 }) as any; close(b.data.alveolar, 0.21 * 713 - 50, 'sea-level room-air PAO2')
  // Tepat di batas (bilangan yang dapat dinyatakan persis): gradien 14 = 40/4 + 4 belum dianggap meningkat.
  const tepat = aaGradient({ fio2: 100, pao2: 649, paco2: 40, age: 40, patm: 760 }) as any; assert.equal(tepat.data.gradient, 14); assert.equal(tepat.data.expectedForAge, 14); assert.equal(tepat.data.elevated, false, 'a gradient equal to the age-expected value is not elevated')
  assert.equal((aaGradient({ fio2: 100, pao2: 648, paco2: 40, age: 40, patm: 760 }) as any).data.elevated, true, 'one mmHg above the expected value is elevated')
  close((aaGradient({ fio2: 21, pao2: 100, paco2: 40, age: 40, patm: 760 }) as any).data.gradient - b.data.gradient, -10, 'raising PaO2 by 10 lowers the gradient by 10')
  close((aaGradient({ fio2: 21, pao2: 90, paco2: 48, age: 40, patm: 760 }) as any).data.alveolar - b.data.alveolar, -10, 'raising PaCO2 by 8 lowers alveolar PO2 by 10 (R = 0.8)')
}
hostileMatrix('aaGradient', { fio2: 21, pao2: 90, paco2: 40, age: 40, patm: 760 } as Record<string, unknown>, (i) => aaGradient(i as never), (r) => r.ok === true, ['fio2', 'pao2', 'paco2', 'age', 'patm'], AA_RANGES)

// ── 9. Holliday–Segar, Parkland, berat badan ideal (Broca, Lorentz) ──────────────────────────────
const refHS = (kg: number) => (kg <= 10 ? 100 * kg : kg <= 20 ? 1000 + 50 * (kg - 10) : 1500 + 20 * (kg - 20))
for (let i = 0; i < N; i++) { const kg = between(0.3, 300); const r = hollidaySegar(kg) as any; close(r.data.mlPerDay, refHS(kg), 'Holliday-Segar'); close(r.data.mlPerHour, refHS(kg) / 24, 'Holliday-Segar hourly') }
for (const [kg, ml] of [[10, 1000], [20, 1500], [30, 1700], [5, 500]] as const) close((hollidaySegar(kg) as any).data.mlPerDay, ml, `Holliday-Segar standard value at ${kg} kg`)
for (const kg of [10, 20]) close((hollidaySegar(kg + 1e-9) as any).data.mlPerDay, (hollidaySegar(kg) as any).data.mlPerDay, `Holliday-Segar is continuous at ${kg} kg`, 1e-6)
for (const bad of HOSTILE) assert.equal((hollidaySegar(bad as never) as any).ok, false, `Holliday-Segar rejects ${JSON.stringify(bad) ?? String(bad)}`)
assert.equal((hollidaySegar(MAINTENANCE_WEIGHT_KG.min - 1e-9) as any).ok, false); assert.equal((hollidaySegar(MAINTENANCE_WEIGHT_KG.max + 1e-9) as any).ok, false); assert.equal((hollidaySegar(MAINTENANCE_WEIGHT_KG.min) as any).ok, true)
for (let i = 0; i < N; i++) {
  const kg = between(0.5, 300), tbsa = between(1e-6, 100); const r = parklandVolumes(kg, tbsa) as any
  close(r.data.total24hMl, 4 * kg * tbsa, 'Parkland 24 h'); close(r.data.first8hMlPerHour * 8 + r.data.next16hMlPerHour * 16, 4 * kg * tbsa, 'Parkland halves sum to the total'); close(r.data.first8hMlPerHour, 2 * r.data.next16hMlPerHour, 'first 8 h rate is twice the next 16 h rate')
}
close((parklandVolumes(70, 40) as any).data.total24hMl, 11200, 'Parkland 70 kg x 40 %'); close((parklandVolumes(70, 40) as any).data.first8hMlPerHour, 700, 'Parkland first-8-h rate')
for (const bad of HOSTILE) { for (const [w, t] of [[bad, 20], [70, bad]] as const) { const isGoodNumber = typeof bad === 'number' && Number.isFinite(bad) && ((w === bad && bad >= PARKLAND_WEIGHT_KG.min && bad <= PARKLAND_WEIGHT_KG.max) || (t === bad && bad > PARKLAND_TBSA_PERCENT.min && bad <= PARKLAND_TBSA_PERCENT.max)); if (!isGoodNumber) assert.equal((parklandVolumes(w as never, t as never) as any).ok, false, `Parkland rejects ${JSON.stringify(bad) ?? String(bad)}`) } }
assert.equal((parklandVolumes(70, 0) as any).ok, false, '0 % TBSA is "no burn", not a zero-volume resuscitation'); assert.equal((parklandVolumes(70, 100.0001) as any).ok, false); assert.equal((parklandVolumes(70, 100) as any).ok, true)
{
  const refIbw = (h: number, male: boolean, f: 'broca' | 'lorentz') => f === 'broca' ? (h - 100) * (male ? 0.9 : 0.85) : (h - 100) - (h - 150) / (male ? 4 : 2.5)
  for (let i = 0; i < N; i++) { const h = between(120, 250), male = rand() < 0.5, f = rand() < 0.5 ? 'broca' : 'lorentz'; close((idealBodyWeight(h, male ? 'M' : 'F', f) as any).data.ibwKg, refIbw(h, male, f), `IBW ${f}`) }
  close((idealBodyWeight(170, 'M', 'broca') as any).data.ibwKg, 63, 'Broca male 170 cm'); close((idealBodyWeight(160, 'F', 'broca') as any).data.ibwKg, 51, 'Broca female 160 cm'); close((idealBodyWeight(170, 'M', 'lorentz') as any).data.ibwKg, 65, 'Lorentz male 170 cm'); close((idealBodyWeight(160, 'F', 'lorentz') as any).data.ibwKg, 56, 'Lorentz female 160 cm')
  for (const [act, k] of [['ringan', 30], ['sedang', 35], ['berat', 40]] as const) close((dailyCalories(170, 'M', 'broca', act) as any).data.kcalPerDay, 63 * k, `daily calories ${act}`)
  for (const bad of ['constructor', '__proto__', 'toString', '', null, undefined, 5]) assert.equal((dailyCalories(170, 'M', 'broca', bad as never) as any).ok, false, `activity ${String(bad)} is not a level`)
  for (const bad of ['X', '', null, undefined, 1]) { assert.equal((idealBodyWeight(170, bad as never, 'broca') as any).ok, false); assert.equal((idealBodyWeight(170, 'M', bad as never) as any).ok, false) }
  for (const bad of HOSTILE) { if (typeof bad === 'number' && bad >= IBW_HEIGHT_CM.min && bad <= IBW_HEIGHT_CM.max) continue; assert.equal((idealBodyWeight(bad as never, 'M', 'broca') as any).ok, false, `IBW rejects height ${JSON.stringify(bad) ?? String(bad)}`) }
}
console.log('calculator-independent-reference: 12 calculators match independently written references on 400 seeded cases each; metamorphic invariants, range boundaries and hostile inputs hold; passed')
