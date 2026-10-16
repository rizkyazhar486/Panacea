// C6 (bagian rekayasa), tahap 4: Charlson, Paradise, FINDRISC, interpretasi gas darah, balans cairan, DKA anak.
// Acuan ditulis TERPISAH dari rumus/tabel terbitnya, diuji pada sampel acak berbenih, seluruh kombinasi butir ya/tidak, batas persis, dan
// masukan bermusuhan. Bukti rekayasa, BUKAN tinjauan klinis; pita, protokol dan konstanta tanpa sumber dicatat di
// docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  ABG_RANGES, CHARLSON_AGE, CHARLSON_CONDITIONS, DKA_RANGES, FINDRISC_RANGES, FLUID_COMPONENT_ML, PARADISE_EPISODES,
  charlsonAgePoints, charlsonIndex, findrisc, findriscBand, fluidBalance, hollidaySegarDailyMl, interpretAbg, kaliumBand, paradiseCriteria, pediatricDka,
} from '../../src/domains/clinical-calculators/index.ts'

const rand = mulberry32(20261018)
const between = (min: number, max: number) => min + (max - min) * rand()
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
const N = 400

// ── 1. Charlson (Charlson 1987 + usia): bobot per kondisi, pasangan eksklusif, usia 50–59:1, 60–69:2, 70–79:3, ≥ 80:4; kesintasan 0,983^exp(0,9 × skor) ─
const BOBOT: Record<string, number> = { mi: 1, chf: 1, pvd: 1, cva: 1, dementia: 1, copd: 1, ctd: 1, pud: 1, liverMild: 1, dm: 1, hemiplegia: 2, ckd: 2, dmOrgan: 2, tumor: 2, leukemia: 2, lymphoma: 2, liverSevere: 3, mets: 6, aids: 6 }
assert.deepEqual(Object.fromEntries(CHARLSON_CONDITIONS.map((c) => [c.key, c.pts])), BOBOT, 'the condition table is the one this reference assumes')
const refCharlson = (flags: Record<string, boolean>) => Object.entries(BOBOT).reduce((s, [k, w]) => {
  if (!flags[k]) return s
  if (k === 'dm' && flags.dmOrgan) return s
  if (k === 'liverMild' && flags.liverSevere) return s
  if (k === 'tumor' && flags.mets) return s
  return s + w
}, 0)
const refUsia = (a: number) => (a >= 80 ? 4 : a >= 70 ? 3 : a >= 60 ? 2 : a >= 50 ? 1 : 0)
{
  const kunci = Object.keys(BOBOT)
  for (let i = 0; i < N * 3; i++) {
    const flags = Object.fromEntries(kunci.filter(() => rand() < 0.3).map((k) => [k, true])), age = between(18, 110)
    const r = charlsonIndex(age, flags); assert.ok(r.ok); if (!r.ok) continue
    const total = refCharlson(flags) + refUsia(age); assert.deepEqual([r.data.comorbidityPts, r.data.agePts, r.data.total], [refCharlson(flags), refUsia(age), total])
    close(r.data.survival10y, Math.pow(0.983, Math.exp(0.9 * total)) * 100, '10-year survival'); assert.equal(r.data.tone, r.data.survival10y >= 90 ? 'brand' : r.data.survival10y >= 50 ? 'low' : 'critical')
  }
  // Setiap kondisi sendiri, dan setiap pasangan eksklusif.
  for (const k of kunci) assert.equal((charlsonIndex(30, { [k]: true }) as any).data.comorbidityPts, BOBOT[k], `${k} alone`)
  assert.equal((charlsonIndex(30, { dm: true, dmOrgan: true }) as any).data.comorbidityPts, 2, 'diabetes with organ damage replaces plain diabetes'); assert.equal((charlsonIndex(30, { liverMild: true, liverSevere: true }) as any).data.comorbidityPts, 3); assert.equal((charlsonIndex(30, { tumor: true, mets: true }) as any).data.comorbidityPts, 6)
  assert.equal((charlsonIndex(30, Object.fromEntries(kunci.map((k) => [k, true]))) as any).data.comorbidityPts, 33, 'all conditions ticked: 37 minus the three superseded conditions (1 + 1 + 2)')
  for (const [a, p] of [[18, 0], [49.99, 0], [50, 1], [59.99, 1], [60, 2], [69.99, 2], [70, 3], [79.99, 3], [80, 4], [110, 4]] as const) { assert.equal(charlsonAgePoints(a), p, `age points at ${a}`); assert.equal((charlsonIndex(a, {}) as any).data.agePts, p) }
  assert.equal((charlsonIndex(30, {}) as any).data.total, 0); close((charlsonIndex(30, {}) as any).data.survival10y, Math.pow(0.983, 1) * 100, 'score 0 gives 0.983^1')
  for (const bad of [1, 'true', null, 0, {}]) assert.equal((charlsonIndex(30, { mi: bad as never }) as any).data.comorbidityPts, 0, 'only a literal true counts')
  for (const bad of [17.9, 110.1, Number.NaN, Infinity, -1, '50', null, undefined]) assert.equal(charlsonIndex(bad as never, {}).ok, false, `age ${String(bad)}`)
  hostileMatrix('charlsonIndex', { age: 60 }, (i) => charlsonIndex(i.age, {}), (r) => r.ok === true, ['age'], { age: CHARLSON_AGE })
}

// ── 2. Paradise: ≥ 7 dalam 1 tahun, ATAU ≥ 5/tahun selama 2 tahun, ATAU ≥ 3/tahun selama 3 tahun, setiap episode terdokumentasi ─
for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) for (let c = 0; c <= 9; c++) for (const doc of [true, false]) {
  const ref = doc && (a >= 7 || (a >= 5 && b >= 5) || (a >= 3 && b >= 3 && c >= 3)); const r = paradiseCriteria(a, b, c, doc)
  assert.deepEqual(r, { ok: true, data: { meetsCriteria: ref } }, `Paradise ${a}/${b}/${c} documented ${doc}`)
}
assert.equal((paradiseCriteria(7, 0, 0, true) as any).data.meetsCriteria, true); assert.equal((paradiseCriteria(6, 4, 2, true) as any).data.meetsCriteria, false); assert.equal((paradiseCriteria(7, 7, 7, false) as any).data.meetsCriteria, false, 'undocumented episodes never qualify')
for (const bad of [-1, 1.5, 366, Number.NaN, Infinity, '3', null, undefined]) { assert.equal(paradiseCriteria(bad as never, 0, 0, true).ok, false); assert.equal(paradiseCriteria(0, bad as never, 0, true).ok, false); assert.equal(paradiseCriteria(0, 0, bad as never, true).ok, false) }
for (const bad of [1, 'true', null, undefined, 0]) assert.equal(paradiseCriteria(7, 7, 7, bad as never).ok, false, `documentation ${String(bad)} must be yes/no`)
assert.equal(paradiseCriteria(PARADISE_EPISODES.max, 0, 0, true).ok, true); assert.equal(paradiseCriteria(PARADISE_EPISODES.max + 1, 0, 0, true).ok, false)

// ── 3. FINDRISC (Lindström & Tuomilehto 2003): usia, IMT, pinggang, 5 butir, risiko 10 tahun ──────────
const refFind = (v: { age: number; bmi: number; waist: number; sex: 'M' | 'F'; active: boolean; veg: boolean; bpMed: boolean; highGlucose: boolean; family: 0 | 3 | 5 }) => {
  const usia = v.age < 45 ? 0 : v.age < 55 ? 2 : v.age < 65 ? 3 : 4; const imt = v.bmi < 25 ? 0 : v.bmi <= 30 ? 1 : 3
  const lp = v.sex === 'M' ? (v.waist < 94 ? 0 : v.waist <= 102 ? 3 : 4) : (v.waist < 80 ? 0 : v.waist <= 88 ? 3 : 4)
  return usia + imt + lp + (v.active ? 0 : 2) + (v.veg ? 0 : 1) + (v.bpMed ? 2 : 0) + (v.highGlucose ? 5 : 0) + v.family
}
for (let i = 0; i < N * 2; i++) {
  const v = { age: Math.round(between(18, 120)), bmi: Math.round(between(100, 800)) / 10, waist: Math.round(between(300, 2500)) / 10, sex: rand() < 0.5 ? 'M' as const : 'F' as const, active: rand() < 0.5, veg: rand() < 0.5, bpMed: rand() < 0.5, highGlucose: rand() < 0.5, family: ([0, 3, 5] as const)[int(0, 2)]! }
  const r = findrisc(v); assert.equal(r.score, refFind(v)); const s = refFind(v); assert.equal(r.band!.label, s < 7 ? 'Low' : s < 12 ? 'Slightly elevated' : s < 15 ? 'Moderate' : s < 21 ? 'High' : 'Very high', `FINDRISC band at ${s}`); assert.ok(s >= 0 && s <= 26, 'score is within 0–26')
}
{
  const dasar = { age: 30, bmi: 22, waist: 70, sex: 'F' as const, active: true, veg: true, bpMed: false, highGlucose: false, family: 0 as const }
  assert.equal(findrisc(dasar).score, 0)
  const sk = (o: object) => findrisc({ ...dasar, ...o }).score
  for (const [age, p] of [[44, 0], [45, 2], [54, 2], [55, 3], [64, 3], [65, 4]] as const) assert.equal(sk({ age }), p, `age ${age}`)
  for (const [bmi, p] of [[24.9, 0], [25, 1], [30, 1], [30.1, 3]] as const) assert.equal(sk({ bmi }), p, `BMI ${bmi}`)
  for (const [w, pm, pf] of [[79.9, 0, 0], [80, 0, 3], [88, 0, 3], [88.1, 0, 4], [93.9, 0, 4], [94, 3, 4], [102, 3, 4], [102.1, 4, 4]] as const) { assert.equal(sk({ waist: w, sex: 'M' }), pm, `male waist ${w}`); assert.equal(sk({ waist: w, sex: 'F' }), pf, `female waist ${w}`) }
  assert.equal(sk({ active: false }), 2); assert.equal(sk({ veg: false }), 1); assert.equal(sk({ bpMed: true }), 2); assert.equal(sk({ highGlucose: true }), 5); assert.equal(sk({ family: 3 }), 3); assert.equal(sk({ family: 5 }), 5)
  assert.equal(findrisc({ age: 70, bmi: 35, waist: 110, sex: 'M', active: false, veg: false, bpMed: true, highGlucose: true, family: 5 }).score, 4 + 3 + 4 + 2 + 1 + 2 + 5 + 5, 'worst case is 26')
  for (const [s, label] of [[6, 'Low'], [7, 'Slightly elevated'], [11, 'Slightly elevated'], [12, 'Moderate'], [14, 'Moderate'], [15, 'High'], [20, 'High'], [21, 'Very high'], [26, 'Very high']] as const) assert.equal(findriscBand(s).label, label, `band at ${s}`)
  for (const bad of [1, 2, 4, 6, '3', null, undefined, Number.NaN]) assert.equal(findrisc({ ...dasar, family: bad as never }).score, null, `family ${String(bad)}`)
  for (const bad of ['X', '', null, undefined]) assert.equal(findrisc({ ...dasar, sex: bad as never }).score, null, `sex ${String(bad)} never defaults`)
  for (const k of ['active', 'veg', 'bpMed', 'highGlucose']) for (const bad of [1, 'true', null, undefined, 0]) assert.equal(findrisc({ ...dasar, [k]: bad } as never).score, null, `${k}=${String(bad)} must be yes/no`)
  hostileMatrix('findrisc', dasar as Record<string, unknown>, (i) => findrisc(i as never), (r) => r.score !== null, ['age', 'bmi', 'waist'], FINDRISC_RANGES)
}

// ── 4. Gas darah: pH → primer → Winter (1,5 × HCO3 + 8 ± 2) → anion gap terkoreksi albumin (+2,5 per g/dL di bawah 4) → delta ratio ──
for (let i = 0; i < N * 3; i++) {
  const v = { ph: between(6.5, 8), paco2: between(5, 150), hco3: between(1, 60), na: between(90, 200), cl: between(50, 160), albumin: between(0.5, 7) }
  const r = interpretAbg(v) as any; assert.equal(r.ok, true); const { ph, paco2, hco3, na, cl, albumin } = v
  const asid = ph < 7.35, alkal = ph > 7.45
  const primer = asid ? (hco3 < 22 ? 'Metabolic Acidosis' : paco2 > 45 ? 'Respiratory Acidosis' : 'Mixed/unclear acidemia') : alkal ? (hco3 > 26 ? 'Metabolic Alkalosis' : paco2 < 35 ? 'Respiratory Alkalosis' : 'Mixed/unclear alkalemia') : (paco2 > 45 || paco2 < 35 || hco3 > 26 || hco3 < 22) ? 'Normal pH but abnormal PaCO2/HCO3 — possible mixed disorder (full compensation)' : 'Normal'
  assert.equal(r.data.primary, primer); assert.equal(r.data.phStatus, asid ? 'Acidemia' : alkal ? 'Alkalemia' : 'Normal pH')
  const ag = na - (cl + hco3) + 2.5 * (4 - albumin); close(r.data.correctedAnionGap, ag, 'albumin-corrected anion gap'); assert.equal(r.data.anionGapHigh, ag > 12)
  const win = 1.5 * hco3 + 8
  if (primer === 'Metabolic Acidosis') assert.equal(r.data.compensationNote.includes(paco2 < win - 2 ? 'respiratory alkalosis' : paco2 > win + 2 ? 'respiratory acidosis' : 'appropriate'), true, 'Winter band')
  else assert.equal(r.data.compensationNote, '', 'compensation is only assessed in metabolic acidosis')
  if (primer === 'Metabolic Acidosis' && ag > 12) { const dr = (ag - 12) / (24 - hco3); assert.equal(r.data.deltaRatioNote.includes(dr < 0.4 ? 'non-gap' : dr <= 2 ? 'pure high-gap' : 'metabolic alkalosis'), true, `delta ratio ${dr}`) } else assert.equal(r.data.deltaRatioNote, '')
}
{
  const norm = { ph: 7.4, paco2: 40, hco3: 24, na: 140, cl: 104, albumin: 4 }; assert.equal((interpretAbg(norm) as any).data.primary, 'Normal')
  const pri = (o: object) => (interpretAbg({ ...norm, ...o }) as any).data.primary
  for (const [ph, label] of [[7.349, 'Acidemia'], [7.35, 'Normal pH'], [7.45, 'Normal pH'], [7.451, 'Alkalemia']] as const) assert.equal((interpretAbg({ ...norm, ph }) as any).data.phStatus, label, `pH boundary ${ph}`)
  assert.equal(pri({ ph: 7.2, hco3: 15 }), 'Metabolic Acidosis'); assert.equal(pri({ ph: 7.2, hco3: 22, paco2: 60 }), 'Respiratory Acidosis'); assert.equal(pri({ ph: 7.2, hco3: 22, paco2: 45 }), 'Mixed/unclear acidemia', 'HCO3 exactly 22 and PaCO2 exactly 45 are not abnormal'); assert.equal(pri({ ph: 7.2, hco3: 21.99 }), 'Metabolic Acidosis')
  assert.equal(pri({ ph: 7.6, hco3: 35 }), 'Metabolic Alkalosis'); assert.equal(pri({ ph: 7.6, hco3: 26, paco2: 25 }), 'Respiratory Alkalosis'); assert.equal(pri({ ph: 7.6, hco3: 26, paco2: 35 }), 'Mixed/unclear alkalemia'); assert.equal(pri({ ph: 7.6, hco3: 26.01 }), 'Metabolic Alkalosis')
  // pH normal: PaCO2 35–45 dan HCO3 22–26 persis di batas masih "Normal"; sedikit di luar menjadi kemungkinan gangguan campuran.
  for (const [o, hasil] of [[{ paco2: 45 }, 'Normal'], [{ paco2: 45.01 }, 'mixed'], [{ paco2: 35 }, 'Normal'], [{ paco2: 34.99 }, 'mixed'], [{ hco3: 26 }, 'Normal'], [{ hco3: 26.01 }, 'mixed'], [{ hco3: 22 }, 'Normal'], [{ hco3: 21.99 }, 'mixed']] as const) {
    const p = pri(o); assert.equal(hasil === 'Normal' ? p === 'Normal' : p.startsWith('Normal pH but abnormal'), true, `normal-pH boundary ${JSON.stringify(o)} gave "${p}"`)
  }
  // Delta ratio tepat 2 (gap terkoreksi 32, HCO3 14 → 20 / 10) masih "murni gap tinggi"; sedikit di atasnya menjadi alkalosis metabolik penyerta.
  const dr = (na: number) => (interpretAbg({ ph: 7.2, paco2: 29, hco3: 14, na, cl: 104, albumin: 4 }) as any).data.deltaRatioNote
  assert.match(dr(150), /Delta ratio 2\.00 \(0\.4-2\)/, 'a delta ratio of exactly 2 is still pure high-gap acidosis'); assert.match(dr(151), /\(>2\)/, 'above 2 suggests a concomitant metabolic alkalosis')
  // Winter: PaCO2 exactly at the edges (1.5 × 12 + 8 = 26 ± 2) is appropriate.
  const win = (paco2: number) => (interpretAbg({ ph: 7.2, paco2, hco3: 12, na: 140, cl: 104, albumin: 4 }) as any).data.compensationNote
  assert.match(win(24), /appropriate/); assert.match(win(28), /appropriate/); assert.match(win(23.99), /respiratory alkalosis/); assert.match(win(28.01), /respiratory acidosis/)
  close((interpretAbg({ ...norm, albumin: 2 }) as any).data.correctedAnionGap - (interpretAbg(norm) as any).data.correctedAnionGap, 5, 'each g/dL albumin below 4 adds 2.5 to the anion gap'); assert.equal((interpretAbg({ ...norm, na: 140, cl: 100, hco3: 24 }) as any).data.anionGapHigh, true, 'gap 16 is high'); assert.equal((interpretAbg({ ...norm, cl: 104 }) as any).data.anionGapHigh, false)
  hostileMatrix('interpretAbg', norm as Record<string, unknown>, (i) => interpretAbg(i as never), (r) => r.ok === true, ['ph', 'paco2', 'hco3', 'na', 'cl', 'albumin'], ABG_RANGES)
  // Sudut rentang: tidak pernah angka tak hingga; pembagi delta ratio (24 − HCO3) tetap > 2 pada asidosis metabolik.
  for (const ph of [6.5, 8]) for (const hco3 of [1, 21.9, 60]) for (const paco2 of [5, 150]) { const r = interpretAbg({ ph, paco2, hco3, na: 200, cl: 50, albumin: 0.5 }) as any; assert.ok(r.ok && Number.isFinite(r.data.correctedAnionGap), `corner ${ph}/${hco3}/${paco2}`); assert.doesNotMatch(r.data.deltaRatioNote, /Infinity|NaN/) }
}

// ── 5. Balans cairan: Σ masuk − Σ keluar; tiap komponen 0–20000 mL ──────────────────────────────────
const MASUK = ['oralIn', 'ivIn', 'otherIn'] as const, KELUAR = ['urineOut', 'drainOut', 'insensibleOut', 'otherOut'] as const
for (let i = 0; i < N; i++) {
  const v = Object.fromEntries([...MASUK, ...KELUAR].map((k) => [k, Math.round(between(0, 20000))])) as Record<string, number>
  const r = fluidBalance(v as never) as any; const m = MASUK.reduce((s, k) => s + v[k]!, 0), o = KELUAR.reduce((s, k) => s + v[k]!, 0); assert.deepEqual(r.data, { totalIn: m, totalOut: o, balance: m - o })
}
{
  const nol = Object.fromEntries([...MASUK, ...KELUAR].map((k) => [k, 0])) as Record<string, number>
  assert.deepEqual((fluidBalance(nol as never) as any).data, { totalIn: 0, totalOut: 0, balance: 0 }, 'an all-zero chart is a real zero balance (see dossier: blank is also read as 0 by design)')
  assert.equal((fluidBalance({ ...nol, ivIn: 1000, urineOut: 400 } as never) as any).data.balance, 600); assert.equal((fluidBalance({ ...nol, urineOut: 400 } as never) as any).data.balance, -400, 'output without intake is a negative balance')
  for (const k of [...MASUK, ...KELUAR]) for (const bad of [-1, 20001, Number.NaN, Infinity, '5', null, undefined, {}]) assert.equal(fluidBalance({ ...nol, [k]: bad } as never).ok, false, `${k}=${String(bad)}`)
  assert.equal(fluidBalance({ ...nol, ivIn: FLUID_COMPONENT_ML.max } as never).ok, true); assert.equal(fluidBalance({ ...nol, ivIn: FLUID_COMPONENT_ML.max + 1e-6 } as never).ok, false)
  const semua = Object.fromEntries([...MASUK, ...KELUAR].map((k) => [k, 20000])) as Record<string, number>; assert.deepEqual((fluidBalance(semua as never) as any).data, { totalIn: 60000, totalOut: 80000, balance: -20000 })
}

// ── 6. DKA anak: bolus 10 (20 bila syok) mL/kg; defisit = % × kg × 1000; rumatan Holliday-Segar × 2 (48 jam); laju = (total − bolus)/48; insulin = U/kg/jam × kg ─
const refHS = (kg: number) => (kg <= 10 ? 100 * kg : kg <= 20 ? 1000 + 50 * (kg - 10) : 1500 + 20 * (kg - 20))
for (let i = 0; i < N * 2; i++) {
  const v = { weightKg: between(2, 120), dehydrationPct: between(1, 15), potassiumMeq: rand() < 0.2 ? Number.NaN : between(1, 10), insulinRateUKgHr: between(0.01, 0.1), shock: rand() < 0.4 }
  const r = pediatricDka(v); const w = v.weightKg, bolus = (v.shock ? 20 : 10) * w, defisit = (v.dehydrationPct / 100) * w * 1000, rumatan = refHS(w) * 2, total = defisit + rumatan, net = Math.max(0, total - bolus)
  assert.ok(r.fluids); const f = r.fluids!
  close(f.bolusMlPerKg, v.shock ? 20 : 10, 'bolus mL/kg'); close(f.bolusMl, bolus, 'bolus'); close(f.deficitMl, defisit, 'deficit'); close(f.maintenance48hMl, rumatan, 'maintenance'); close(f.total48hMl, total, 'total'); close(f.netAfterBolusMl, net, 'net'); close(f.ratePerHr, net / 48, 'rate')
  close(r.insulinUHr as number, v.insulinRateUKgHr * w, 'insulin U/h'); if (Number.isNaN(v.potassiumMeq)) assert.equal(r.kBand, null, 'potassium not measured: no band, and not "missing"'); else assert.equal(r.kBand!.label.split(' ')[0], v.potassiumMeq < 3.5 ? 'Hypokalemic' : v.potassiumMeq > 5.5 ? 'Hyperkalemic' : 'Normokalemic'); assert.deepEqual(r.missing, [])
}
{
  const dasar = { weightKg: 20, dehydrationPct: 5, potassiumMeq: 4, insulinRateUKgHr: 0.05, shock: false }
  for (const [kg, ml] of [[2, 200], [10, 1000], [15, 1250], [20, 1500], [30, 1700], [120, 3500]] as const) assert.equal(hollidaySegarDailyMl(kg), ml, `Holliday-Segar ${kg} kg`)
  for (const [k, label] of [[3.49, 'Hypokalemic'], [3.5, 'Normokalemic'], [5.5, 'Normokalemic'], [5.51, 'Hyperkalemic']] as const) { assert.equal(kaliumBand(k).label.split(' ')[0], label, `potassium ${k}`); assert.equal(kaliumBand(k).tone, label === 'Normokalemic' ? 'brand' : 'critical') }
  assert.equal(pediatricDka({ ...dasar, shock: true }).fluids!.bolusMlPerKg, 20); for (const bad of [1, 'true', null, undefined, 0]) assert.equal(pediatricDka({ ...dasar, shock: bad as never }).fluids!.bolusMlPerKg, 10, 'only a literal true selects the shock bolus')
  close(pediatricDka({ weightKg: 20, dehydrationPct: 10, potassiumMeq: 4, insulinRateUKgHr: 0.1, shock: false }).fluids!.ratePerHr, (2000 + 3000 - 200) / 48, 'worked case 20 kg, 10 %'); assert.equal(pediatricDka({ ...dasar, weightKg: 2, dehydrationPct: 1 }).fluids!.netAfterBolusMl, 400, 'net = deficit 20 + maintenance 400 - bolus 20')
  assert.equal(pediatricDka({ weightKg: 2, dehydrationPct: 1, potassiumMeq: 4, insulinRateUKgHr: 0.01, shock: true }).fluids!.netAfterBolusMl, Math.max(0, 20 + 400 - 40), 'a shock bolus larger than the deficit never gives a negative rate')
  // Cada parte só dari masukannya sendiri: berat sah + insulin sah tetap menghitung insulin walau dehidrasi kosong.
  const sebagian = pediatricDka({ ...dasar, dehydrationPct: Number.NaN }); assert.equal(sebagian.fluids, null); assert.notEqual(sebagian.insulinUHr, null); assert.deepEqual(sebagian.missing, ['dehydration estimate'])
  const tanpaBerat = pediatricDka({ ...dasar, weightKg: Number.NaN }); assert.equal(tanpaBerat.fluids, null); assert.equal(tanpaBerat.insulinUHr, null)
  for (const bad of [Infinity, -1, 0, '5', null, undefined, {}]) {
    const w = pediatricDka({ ...dasar, weightKg: bad } as never); assert.deepEqual([w.fluids, w.insulinUHr], [null, null], `weight ${String(bad)} blocks both parts`)
    const d = pediatricDka({ ...dasar, dehydrationPct: bad } as never); assert.equal(d.fluids, null, `dehydration ${String(bad)} blocks the fluids`); assert.notEqual(d.insulinUHr, null, 'but not the insulin dose')
    const n = pediatricDka({ ...dasar, insulinRateUKgHr: bad } as never); assert.equal(n.insulinUHr, null, `insulin rate ${String(bad)} blocks the insulin dose`); assert.notEqual(n.fluids, null, 'but not the fluids')
  }
  assert.notEqual(pediatricDka({ ...dasar, potassiumMeq: 11 }).invalid.length, 0, 'an out-of-range potassium is invalid, not silently "not measured"'); assert.equal(pediatricDka({ ...dasar, potassiumMeq: Number.NaN }).invalid.length, 0)
  hostileMatrix('pediatricDka', dasar as Record<string, unknown>, (i) => pediatricDka(i as never), (r) => r.fluids !== null && r.insulinUHr !== null, ['weightKg', 'dehydrationPct', 'insulinRateUKgHr'], DKA_RANGES)
}
console.log('calculator-independent-reference-4: Charlson, Paradise, FINDRISC, blood gas, fluid balance and paediatric DKA match independently written references (all 2×1000 Paradise combinations, every Charlson condition and pair, FINDRISC boundaries), with hostile inputs; passed')
