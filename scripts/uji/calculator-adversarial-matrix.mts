// ENG-C6-02: matriks masukan adversarial lintas SEMUA engine registry. Tiap engine punya satu adaptor (tanda tangan fungsi berbeda-beda);
// tiap kolom numerik diserang dengan kelas: kosong (NaN/undefined/''), NaN, +Infinity, -Infinity, negatif, tepat di bawah batas bawah,
// tepat di atas batas atas, dan salah-unit (teks "70 kg"/"70"). Yang diverifikasi: ditolak dengan ALASAN BERNAMA (bukan angka), hasil tolak
// tidak membawa angka hingga (tidak ada "angka masuk akal dari sampah"), alasan berbeda antar kolom (alasan menyebut kolomnya, bukan
// "input salah" generik), dan pasangan kontrol: nilai tepat di batas bawah dan batas atas DITERIMA sehingga aturan rentang yang menolak.
// BATAS: matriks menyerang kolom numerik dan kolom kategorikal yang tercantum di adaptor. Ia tidak membuktikan kebenaran klinis nilai.
import assert from 'node:assert/strict'
import * as pkg from '../../src/domains/clinical-calculators/index.ts'
import { readFileSync } from 'node:fs'

type Rng = Readonly<{ min: number; max: number; exclusiveMin?: boolean }>
type Vals = Record<string, unknown>
export interface Adapter {
  id: string
  label: string
  /** Kolom numerik yang diserang beserta rentang sah yang dideklarasikan engine. */
  fields: Record<string, Rng>
  /** Masukan sah penuh; harus diterima. */
  base: Vals
  call: (v: Vals) => unknown
  /** Jalur hasil tolak yang SENGAJA tetap berisi angka karena turunan dari kolom lain yang sah (alasan wajib di dokumen). */
  partial?: string[]
  /** Kolom diserang -> jalur hasil yang wajib kosong karena bergantung pada kolom itu. */
  own?: Record<string, string[]>
  /** Kolom diserang -> penggantian masukan dasar agar kolom itu benar-benar dipakai (mis. tinggi hanya dipakai pada berat ideal). */
  baseFor?: Record<string, Vals>
  /** Kolom yang kosongnya sah (opsional); kelas kosong dilewati untuk kolom ini. */
  optionalBlank?: string[]
  /** Kolom kategorikal (enum teks) dan boolean yang diserang dengan nilai bukan-anggota. */
  enums?: string[]
  bools?: string[]
  /** Nilai kategorikal yang SENGAJA sah walau terlihat kosong (mis. '' = belum pernah donor). */
  enumValid?: Record<string, unknown[]>
  /** Masukan lain yang diubah agar nilai batas tidak melanggar aturan lintas-kolom (mis. HDL < kolesterol total). Kunci: `kolom@min|max`. */
  edgeBase?: Record<string, Vals>
}

const R = (t: Record<string, { min: number; max: number }>, ...keys: string[]): Record<string, Rng> => Object.fromEntries(keys.map((k) => [k, t[k]!]))
const A = pkg as Record<string, any>

// ── deteksi penolakan ──────────────────────────────────────────────────────────────────────────────
/** Alasan bernama bila hasil adalah penolakan, null bila diterima. Lempar galat dianggap penolakan bernama dengan pesan galatnya. */
export function rejection(run: () => unknown): { rejected: boolean; reason: string; value: unknown } {
  let value: unknown
  try { value = run() } catch (e) { return { rejected: true, reason: `throw: ${(e as Error).message}`, value: undefined } }
  const v = value as any
  if (v && typeof v === 'object') {
    if (v.ok === false) {
      const parts: string[] = []
      if (typeof v.reason === 'string') parts.push(v.reason)
      if (v.problems && typeof v.problems === 'object') parts.push(...Object.values(v.problems as Record<string, string>))
      if (Array.isArray(v.missing)) parts.push(...v.missing.map((m: string) => `missing ${m}`))
      if (Array.isArray(v.invalid)) parts.push(...v.invalid)
      return { rejected: true, reason: parts.join('; '), value }
    }
    const parts: string[] = []
    if (Array.isArray(v.missing) && v.missing.length > 0) parts.push(...v.missing.map((m: string) => `missing ${m}`))
    if (Array.isArray(v.invalid) && v.invalid.length > 0) parts.push(...v.invalid)
    if (typeof v.error === 'string' && v.error) parts.push(v.error)
    if (parts.length > 0) return { rejected: true, reason: parts.join('; '), value }
  }
  return { rejected: false, reason: '', value }
}

/** Angka hingga di mana pun di hasil tolak (kecuali di dalam teks alasan) = "angka masuk akal dari sampah". */
export function finiteNumbers(x: unknown, path = ''): string[] {
  if (typeof x === 'number') return Number.isFinite(x) ? [path || '(root)'] : []
  if (Array.isArray(x)) return x.flatMap((e, i) => finiteNumbers(e, `${path}[${i}]`))
  if (x && typeof x === 'object') return Object.entries(x).flatMap(([k, e]) => finiteNumbers(e, path ? `${path}.${k}` : k))
  return []
}

// ── kelas serangan ─────────────────────────────────────────────────────────────────────────────────
const EPS = 1e-6
export type Klass = 'nan' | 'blank-undefined' | 'blank-empty-string' | 'infinity' | '-infinity' | 'negative' | 'below-min' | 'above-max' | 'unit-text' | 'numeric-text'
export function attacks(r: Rng, base: unknown, unit = 'mg/dL'): Array<{ klass: Klass; value: unknown }> {
  const out: Array<{ klass: Klass; value: unknown }> = [
    { klass: 'nan', value: Number.NaN },
    { klass: 'blank-undefined', value: undefined },
    { klass: 'blank-empty-string', value: '' },
    { klass: 'infinity', value: Number.POSITIVE_INFINITY },
    { klass: '-infinity', value: Number.NEGATIVE_INFINITY },
    { klass: 'above-max', value: r.max + EPS * Math.max(1, Math.abs(r.max)) },
    { klass: 'unit-text', value: `${String(base)} ${unit}` },
    { klass: 'numeric-text', value: String(base) },
  ]
  if (r.min >= 0) out.push({ klass: 'negative', value: -1 })
  if (!r.exclusiveMin || r.min > 0) out.push({ klass: 'below-min', value: r.min - EPS * Math.max(1, Math.abs(r.min)) })
  return out
}

// ── adaptor ────────────────────────────────────────────────────────────────────────────────────────
const CR = { cigsPerDay: 0 }
void CR
export const ADAPTERS: Adapter[] = [
  { id: 'aaGradient', label: 'aaGradient', fields: R(A.AA_RANGES, 'fio2', 'pao2', 'paco2', 'age', 'patm'), base: { fio2: 21, pao2: 90, paco2: 40, age: 40, patm: 760 }, call: (v) => A.aaGradient(v) },
  { id: 'autophagyTiming', label: 'autophagyTiming', fields: R(A.AUTOPHAGY_RANGES, 'bodyFatPct', 'hoursSinceMeal'), base: { bodyFatPct: 20, hoursSinceMeal: 16 }, call: (v) => A.autophagyTiming(v) },
  { id: 'bloodGas', label: 'interpretAbg', fields: R(A.ABG_RANGES, 'ph', 'paco2', 'hco3', 'na', 'cl', 'albumin'), base: { ph: 7.4, paco2: 40, hco3: 24, na: 140, cl: 104, albumin: 4 }, call: (v) => A.interpretAbg(v) },
  { id: 'correctedCalcium', label: 'correctedCalcium', fields: R(A.CA_RANGES, 'totalCa', 'albumin'), base: { totalCa: 9, albumin: 4 }, call: (v) => A.correctedCalcium(v) },
  { id: 'cockcroftGault', label: 'cockcroftGault', fields: R(A.CG_RANGES, 'age', 'weightKg', 'heightCm', 'scr'), base: { age: 50, weightKg: 70, heightCm: 170, scr: 1, sex: 'M', weightBasis: 'actual' }, call: (v) => A.cockcroftGault(v),
    partial: ['ibwKg'], baseFor: { heightCm: { weightBasis: 'ideal' } }, enums: ['sex', 'weightBasis'] },
  { id: 'childPugh', label: 'childPugh', fields: R(A.CP_RANGES, 'bilirubin', 'albumin', 'inr'), base: { bilirubin: 1, albumin: 4, inr: 1, ascites: 1, enceph: 1 }, call: (v) => A.childPugh(v) },
  { id: 'fena', label: 'fena', fields: R(A.FENA_RANGES, 'urineNa', 'plasmaCr', 'plasmaNa', 'urineCr'), base: { urineNa: 20, plasmaCr: 1, plasmaNa: 140, urineCr: 100 }, call: (v) => A.fena(v) },
  { id: 'findrisc', label: 'findrisc', fields: R(A.FINDRISC_RANGES, 'age', 'bmi', 'waist'), base: { age: 50, bmi: 25, waist: 90, sex: 'M', active: true, veg: true, bpMed: false, highGlucose: false, family: 0 }, call: (v) => A.findrisc(v), enums: ['sex', 'family'], bools: ['active', 'veg', 'bpMed', 'highGlucose'] },
  { id: 'glasgowBlatchford', label: 'glasgowBlatchford', fields: R(A.GBS_RANGES, 'bun', 'hgb', 'sbp'), base: { bun: 10, hgb: 14, sbp: 120, sex: 'M', flags: {} }, call: (v) => A.glasgowBlatchford(v), enums: ['sex'] },
  { id: 'graceScore', label: 'graceScore', fields: R(A.GRACE_RANGES, 'age', 'hr', 'sbp', 'creat'), base: { age: 60, hr: 80, sbp: 120, creat: 1, killip: 1, arrest: false, stDev: false, markers: false }, call: (v) => A.graceScore(v), enums: ['killip'], bools: ['arrest', 'stDev', 'markers'] },
  { id: 'hydrationTarget', label: 'hydrationTarget', fields: R(A.HYDRATION_RANGES, 'weightKg', 'exerciseMin'), base: { weightKg: 70, exerciseMin: 30, intensity: 'moderate', hotClimate: false, pregnant: false, breastfeeding: false }, call: (v) => A.hydrationTarget(v), enums: ['intensity'], bools: ['hotClimate', 'pregnant', 'breastfeeding'] },
  { id: 'ldlFriedewald', label: 'ldlFriedewald', fields: R(A.LDL_RANGES, 'totalChol', 'hdl', 'tg'), base: { totalChol: 200, hdl: 50, tg: 150 }, call: (v) => A.ldlFriedewald(v), edgeBase: { 'totalChol@min': { hdl: 10 }, 'hdl@max': { totalChol: 1000 } } },
  { id: 'lightsCriteria', label: 'lightsCriteria', fields: R(A.LIGHTS_RANGES, 'pleuralProtein', 'serumProtein', 'pleuralLdh', 'serumLdh', 'serumLdhUln'), base: { pleuralProtein: 3, serumProtein: 6.5, pleuralLdh: 200, serumLdh: 300, serumLdhUln: 250 }, call: (v) => A.lightsCriteria(v) },
  { id: 'maddreyScore', label: 'maddreyScore', fields: R(A.MADDREY_RANGES, 'bilirubin', 'patientPt', 'controlPt'), base: { bilirubin: 3, patientPt: 18, controlPt: 12 }, call: (v) => A.maddreyScore(v) },
  { id: 'meldNa', label: 'meldNa', fields: R(A.MELD_RANGES, 'bilirubin', 'inr', 'creatinine', 'sodium'), base: { bilirubin: 2, inr: 1.5, creatinine: 1.2, sodium: 135, dialysis: false }, call: (v) => A.meldNa(v), bools: ['dialysis'] },
  { id: 'news2', label: 'news2', fields: R(A.NEWS2_RANGES, 'rr', 'spo2', 'sbp', 'hr', 'temp'), base: { rr: 16, spo2: 97, sbp: 120, hr: 70, temp: 36.8, onOxygen: false, alert: true }, call: (v) => A.news2(v), bools: ['onOxygen', 'alert'] },
  { id: 'packYearScreen', label: 'packYearScreen', fields: R(A.PACK_YEAR_RANGES, 'cigsPerDay', 'yearsSmoked', 'age', 'quitYearsAgo'), base: { cigsPerDay: 20, yearsSmoked: 30, age: 60, quitYearsAgo: 0 }, call: (v) => A.packYearScreen(v) },
  { id: 'serumOsmolality', label: 'serumOsmolality', fields: R(A.OSM_RANGES, 'na', 'glucose', 'bun'), base: { na: 140, glucose: 90, bun: 14 }, call: (v) => A.serumOsmolality(v) },
  { id: 'sofaScore', label: 'sofaScore', fields: R(A.SOFA_RANGES, 'pf', 'plt', 'bili', 'creat', 'gcs'), base: { pf: 400, plt: 200, bili: 1, creat: 1, gcs: 15, supported: false, cv: 0 }, call: (v) => A.sofaScore(v),
    partial: ['points'], own: { pf: ['points.resp'], plt: ['points.coag'], bili: ['points.liver'], creat: ['points.renal'], gcs: ['points.cns'] }, bools: ['supported'] },
  { id: 'stopBang', label: 'stopBang', fields: R(A.STOP_BANG_RANGES, 'bmi', 'age', 'neckCm'), base: { snoring: false, tired: false, observed: false, pressure: false, bmi: 25, age: 40, neckCm: 38, sex: 'M' }, call: (v) => A.stopBang(v), enums: ['sex'], bools: ['snoring', 'tired', 'observed', 'pressure'] },
  { id: 'riskScreens', label: 'fib4', fields: R(A.RISK_RANGES, 'age', 'ast', 'alt', 'platelets'), base: { age: 50, ast: 30, alt: 30, platelets: 250 }, call: (v) => A.fib4(v) },
  { id: 'riskScreens', label: 'ostIndex', fields: R(A.RISK_RANGES, 'age', 'weightKg'), base: { age: 60, weightKg: 60 }, call: (v) => A.ostIndex(v) },
  { id: 'riskScreens', label: 'cvdRisk', fields: R(A.RISK_RANGES, 'age', 'totChol', 'hdl', 'sbp'), base: { age: 50, sex: 'M', totChol: 200, hdl: 50, sbp: 120, treatedBP: false, smoker: false, diabetic: false }, call: (v) => A.cvdRisk(v), edgeBase: { 'totChol@min': { hdl: 10 }, 'hdl@max': { totChol: 1000 } }, enums: ['sex'], bools: ['treatedBP', 'smoker', 'diabetic'] },
  { id: 'qtc', label: 'qtc', fields: R(A.QTC_RANGES, 'qtMs', 'hr'), base: { qtMs: 400, hr: 70, sex: 'M' }, call: (v) => A.qtc(v), enums: ['sex'] },
  { id: 'widmarkBac', label: 'widmarkBac', fields: R(A.BAC_RANGES, 'weightKg', 'hours'), base: { sex: 'M', weightKg: 70, hours: 2, counts: {} }, call: (v) => A.widmarkBac(v), enums: ['sex'] },
  { id: 'meanArterialPressure', label: 'meanArterialPressure', fields: { systolic: A.SYSTOLIC_MMHG, diastolic: A.DIASTOLIC_MMHG }, base: { systolic: 120, diastolic: 80 }, call: (v) => A.meanArterialPressure(v.systolic, v.diastolic), edgeBase: { 'systolic@min': { diastolic: 20 }, 'diastolic@max': { systolic: 300 } } },
  { id: 'parkland', label: 'parklandVolumes', fields: { weightKg: A.PARKLAND_WEIGHT_KG, tbsaPercent: { ...A.PARKLAND_TBSA_PERCENT, exclusiveMin: true } }, base: { weightKg: 70, tbsaPercent: 20 }, call: (v) => A.parklandVolumes(v.weightKg, v.tbsaPercent) },
  { id: 'hollidaySegar', label: 'hollidaySegar', fields: { weightKg: A.MAINTENANCE_WEIGHT_KG }, base: { weightKg: 20 }, call: (v) => A.hollidaySegar(v.weightKg) },
  { id: 'ivDrip', label: 'ivDrip', fields: { volumeMl: A.IV_VOLUME_ML, hours: A.IV_DURATION_HOURS }, base: { volumeMl: 500, hours: 4, dropFactor: 20 }, call: (v) => A.ivDrip(v.volumeMl, v.hours, v.dropFactor), enums: ['dropFactor'] },
  { id: 'pedsDose', label: 'pedsDose', fields: { weightKg: A.PEDS_WEIGHT_KG, frequencyPerDay: A.PEDS_FREQUENCY_PER_DAY }, base: { weightKg: 10, dose: 50, frequencyPerDay: 3, concentration: 125 }, call: (v) => A.pedsDose(v.weightKg, v.dose, v.frequencyPerDay, v.concentration) },
  { id: 'mcdonaldRule', label: 'mcdonaldGestationalAge', fields: { fundalHeightCm: A.MCDONALD_FUNDAL_CM }, base: { fundalHeightCm: 28 }, call: (v) => A.mcdonaldGestationalAge(v.fundalHeightCm) },
  { id: 'waistToHeight', label: 'waistToHeight', fields: { waistCm: A.WAIST_CM, heightCm: A.WHTR_HEIGHT_CM }, base: { waistCm: 80, heightCm: 170 }, call: (v) => A.waistToHeight(v.waistCm, v.heightCm) },
  { id: 'midParentalHeight', label: 'midParentalHeight', fields: { fatherCm: A.PARENT_HEIGHT_CM, motherCm: A.PARENT_HEIGHT_CM }, base: { fatherCm: 175, motherCm: 162, childSex: 'M' }, call: (v) => A.midParentalHeight(v.fatherCm, v.motherCm, v.childSex), enums: ['childSex'] },
  { id: 'denverAge', label: 'validateDenverAge', fields: { ageMonths: A.DENVER_AGE_MONTHS }, base: { ageMonths: 24 }, call: (v) => A.validateDenverAge(v.ageMonths) },
  { id: 'centor', label: 'centorMcIsaac', fields: { ageYears: A.CENTOR_AGE_YEARS }, base: { ageYears: 30 }, call: (v) => A.centorMcIsaac({ fever: false, noCough: false, tenderNodes: false, exudate: false }, v.ageYears) },
  { id: 'charlson', label: 'charlsonIndex', fields: { age: A.CHARLSON_AGE }, base: { age: 60 }, call: (v) => A.charlsonIndex(v.age, {}) },
  { id: 'fletcher', label: 'fletcherIndex', fields: { t500: A.THRESHOLD_DB_HL, t1000: A.THRESHOLD_DB_HL, t2000: A.THRESHOLD_DB_HL, t3000: A.THRESHOLD_DB_HL }, base: { t500: 20, t1000: 20, t2000: 20, t3000: 20 }, call: (v) => A.fletcherIndex('complete', v.t500, v.t1000, v.t2000, v.t3000) },
  { id: 'paradise', label: 'paradiseCriteria', fields: { a: A.PARADISE_EPISODES, b: A.PARADISE_EPISODES, c: A.PARADISE_EPISODES }, base: { a: 1, b: 1, c: 1 }, call: (v) => A.paradiseCriteria(v.a, v.b, v.c, true) },
  { id: 'fluidBalance', label: 'fluidBalance', fields: Object.fromEntries(['oralIn', 'ivIn', 'otherIn', 'urineOut', 'drainOut', 'insensibleOut', 'otherOut'].map((k) => [k, A.FLUID_COMPONENT_ML])), base: { oralIn: 500, ivIn: 500, otherIn: 0, urineOut: 600, drainOut: 0, insensibleOut: 400, otherOut: 0 }, call: (v) => A.fluidBalance(v) },
  { id: 'electrolyteCorrection', label: 'correctedSodiumKatz', fields: { measuredNa: A.SODIUM_MEQ_L, glucose: A.GLUCOSE_MG_DL }, base: { measuredNa: 130, glucose: 400 }, call: (v) => A.correctedSodiumKatz(v.measuredNa, v.glucose) },
  { id: 'electrolyteCorrection', label: 'potassiumAssessment', fields: { measuredK: A.POTASSIUM_MEQ_L }, base: { measuredK: 4 }, call: (v) => A.potassiumAssessment(v.measuredK) },
  { id: 'fluidElectrolytes', label: 'maintenanceFluid', fields: R(A.FLUID_RANGES, 'weightKg'), base: { weightKg: 20 }, call: (v) => A.maintenanceFluid(v.weightKg) },
  { id: 'fluidElectrolytes', label: 'potassiumDeficit', fields: { currentK: A.FLUID_RANGES.potassium, weightKg: A.FLUID_RANGES.weightKg }, base: { currentK: 3, weightKg: 70 }, call: (v) => A.potassiumDeficit(v.currentK, v.weightKg) },
  { id: 'fluidElectrolytes', label: 'correctedSodium', fields: { measuredNa: A.FLUID_RANGES.sodium, glucose: A.FLUID_RANGES.glucose }, base: { measuredNa: 130, glucose: 400 }, call: (v) => A.correctedSodium(v.measuredNa, v.glucose) },
  { id: 'fluidElectrolytes', label: 'naCorrectionRate', fields: { currentNa: A.FLUID_RANGES.sodium, weightKg: A.FLUID_RANGES.weightKg }, base: { currentNa: 120, weightKg: 70, sex: 'M' }, call: (v) => A.naCorrectionRate(v.currentNa, v.weightKg, v.sex), enums: ['sex'] },
  { id: 'fluidElectrolytes', label: 'resuscitation(burns)', fields: { weightKg: A.FLUID_RANGES.weightKg, tbsaPct: A.FLUID_RANGES.tbsaPct }, base: { weightKg: 70, tbsaPct: 20 }, call: (v) => A.resuscitation('burns', v.weightKg, v.tbsaPct) },
  { id: 'bloodDonationScreen', label: 'bloodDonationScreen', fields: R(A.DONATION_RANGES, 'age', 'weightKg'), base: { age: 30, weightKg: 70, lastDonation: '', now: '2026-06-01T00:00:00Z', pregnant: false, recentIllness: false, recentTattoo: false, chronicCondition: false }, call: (v) => A.bloodDonationScreen(v), enums: ['lastDonation', 'now'], enumValid: { lastDonation: [''] }, bools: ['pregnant', 'recentIllness', 'recentTattoo', 'chronicCondition'] },
  { id: 'caffeineSleep', label: 'caffeineAtBedtime', fields: { customMg: A.CAFFEINE_RANGES.customMg, halfLifeH: A.CAFFEINE_RANGES.halfLifeH }, base: { servings: {}, customMg: 100, consumedAt: '08:00', bedtime: '22:00', halfLifeH: 5 }, call: (v) => A.caffeineAtBedtime(v), optionalBlank: ['customMg'] },
  { id: 'idealBodyWeight', label: 'idealBodyWeight', fields: { heightCm: A.IBW_HEIGHT_CM }, base: { heightCm: 170, sex: 'M', formula: 'broca' }, call: (v) => A.idealBodyWeight(v.heightCm, v.sex, v.formula), enums: ['sex', 'formula'] },
  { id: 'idealBodyWeight', label: 'dailyCalories', fields: { heightCm: A.IBW_HEIGHT_CM }, base: { heightCm: 170, sex: 'F', formula: 'lorentz', activity: 'sedang' }, call: (v) => A.dailyCalories(v.heightCm, v.sex, v.formula, v.activity), enums: ['sex', 'formula', 'activity'] },
  { id: 'naegele', label: 'naegele', fields: { cycleLengthDays: A.CYCLE_LENGTH_DAYS }, base: { lmpIso: '2026-03-01', cycleLengthDays: 28, nowMs: Date.UTC(2026, 5, 1) }, call: (v) => A.naegele(v.lmpIso, v.cycleLengthDays, v.nowMs) },
  { id: 'pediatricDka', label: 'pediatricDka', fields: R(A.DKA_RANGES, 'weightKg', 'dehydrationPct', 'potassiumMeq', 'insulinRateUKgHr'), base: { weightKg: 30, dehydrationPct: 7, potassiumMeq: 4, insulinRateUKgHr: 0.1, shock: false }, call: (v) => A.pediatricDka(v),
    partial: ['fluids', 'insulinUHr'], own: { weightKg: ['fluids', 'insulinUHr'], dehydrationPct: ['fluids'], insulinRateUKgHr: ['insulinUHr'], potassiumMeq: ['kBand'] }, optionalBlank: ['potassiumMeq'] },
  { id: 'sirirajStrokeScore', label: 'sirirajStrokeScore', fields: { diastolicMmHg: A.DIASTOLIC_MMHG }, base: { consciousness: 0, vomiting: 0, headache: 0, diastolicMmHg: 80, atheroma: 0 }, call: (v) => A.sirirajStrokeScore(v) },
  { id: 'sleepDebt', label: 'sleepDebt(need)', fields: { need: A.SLEEP_RANGES.need }, base: { need: 8 }, call: (v) => A.sleepDebt(v.need, [{ date: '2026-06-01', hours: 6 }]) },
  { id: 'sleepDebt', label: 'sleepDebt(night hours)', fields: { hours: A.SLEEP_RANGES.hours }, base: { hours: 7 }, call: (v) => A.sleepDebt(8, [{ date: '2026-06-01', hours: v.hours }]) },
  { id: 'sleepDebt', label: 'validateHours', fields: { hours: A.SLEEP_RANGES.hours }, base: { hours: 7 }, call: (v) => A.validateHours(v.hours) },
  { id: 'framinghamInputs', label: 'validateFraminghamInput', fields: R(A.FRAMINGHAM_RANGE, 'age', 'totChol', 'hdl', 'sbp'), base: { age: 50, totChol: 200, hdl: 50, sbp: 120 }, call: (v) => A.validateFraminghamInput(v) },
]

const ids = JSON.parse(readFileSync(new URL('../../governance/CALCULATOR_REVIEW_REGISTRY.json', import.meta.url), 'utf8')).entries.map((e: { id: string }) => e.id) as string[]

const isBlankKlass = (k: Klass) => k === 'nan' || k === 'blank-undefined' || k === 'blank-empty-string'
const underPath = (p: string, roots: string[]) => roots.some((r) => p === r || p.startsWith(`${r}.`) || p.startsWith(`${r}[`))
const isNullish = (root: unknown, path: string) => {
  let cur: any = root
  for (const part of path.split('.')) { if (cur == null) return true; cur = cur[part] }
  return cur == null
}
const CAT_PROBES: unknown[] = [undefined, null, '', 'zzz', 7, Number.NaN]
const BOOL_PROBES: unknown[] = ['yes', 1, null]

let runs = 0
const gaps: string[] = []
for (const a of ADAPTERS) {
  // Kontrol: masukan sah penuh harus diterima (jika tidak, seluruh baris matriks tak berarti).
  const ctl = rejection(() => a.call(a.base))
  if (ctl.rejected) { gaps.push(`${a.label}: BASELINE REJECTED: ${ctl.reason}`); continue }
  for (const [field, rng] of Object.entries(a.fields)) {
    const baseFor = { ...a.base, ...(a.baseFor?.[field] ?? {}) }
    for (const { klass, value } of attacks(rng, a.base[field])) {
      if (isBlankKlass(klass) && a.optionalBlank?.includes(field)) continue
      runs++
      const res = rejection(() => a.call({ ...baseFor, [field]: value }))
      const tag = `${a.label}.${field} ${klass}`
      if (!res.rejected) { gaps.push(`${tag}: ACCEPTED ${typeof value === 'number' ? value : JSON.stringify(value)} -> ${JSON.stringify(res.value)?.slice(0, 80)}`); continue }
      if (res.reason.trim() === '') { gaps.push(`${tag}: rejected without a reason`); continue }
      const leaks = finiteNumbers(res.value).filter((p) => !underPath(p, a.partial ?? []))
      if (leaks.length > 0) gaps.push(`${tag}: rejection still carries numbers at ${leaks.join(',')}`)
      for (const own of a.own?.[field] ?? []) if (!isNullish(res.value, own)) gaps.push(`${tag}: ${own} must be empty when ${field} is rejected`)
    }
    // Pasangan kontrol: tepat di batas yang dideklarasikan DITERIMA, sehingga aturan rentang (bukan hal lain) yang menolak di luar batas.
    for (const [edge, value] of [['min', rng.min], ['max', rng.max]] as const) {
      if (edge === 'min' && rng.exclusiveMin) continue
      runs++
      const res = rejection(() => a.call({ ...baseFor, ...(a.edgeBase?.[`${field}@${edge}`] ?? {}), [field]: value }))
      if (res.rejected) gaps.push(`${a.label}.${field} at-${edge} ${value}: REJECTED though inside the declared range: ${res.reason}`)
    }
  }
  // Pasangan positif: boolean sungguhan (true dan false) DITERIMA, sehingga yang menolak 'yes'/1/null adalah aturan tipe itu.
  for (const field of a.bools ?? []) for (const value of [true, false]) {
    runs++
    const res = rejection(() => a.call({ ...a.base, [field]: value }))
    if (res.rejected) gaps.push(`${a.label}.${field} bool ${value}: REJECTED a real boolean: ${res.reason}`)
  }
  for (const [kind, names, probes] of [['enum', a.enums ?? [], CAT_PROBES], ['bool', a.bools ?? [], BOOL_PROBES]] as const) {
    for (const field of names) for (const value of probes) {
      if (a.enumValid?.[field]?.includes(value)) continue
      runs++
      const res = rejection(() => a.call({ ...a.base, [field]: value }))
      const tag = `${a.label}.${field} ${kind} ${typeof value === 'number' ? value : JSON.stringify(value)}`
      if (!res.rejected) gaps.push(`${tag}: ACCEPTED -> ${JSON.stringify(res.value)?.slice(0, 80)}`)
      else if (res.reason.trim() === '') gaps.push(`${tag}: rejected without a reason`)
    }
  }
}
// Alasan harus menyebut kolomnya: untuk satu kelas, alasan antar kolom tidak boleh identik (kecuali engine hanya punya satu kolom).
for (const a of ADAPTERS) {
  const fields = Object.entries(a.fields)
  if (fields.length < 2) continue
  const seen = new Map<string, string>()
  for (const [field, rng] of fields) {
    const v = attacks(rng, a.base[field]).find((x) => x.klass === 'above-max')!.value
    const r = rejection(() => a.call({ ...a.base, [field]: v })).reason
    if (r === '') continue
    const prev = seen.get(r)
    if (prev !== undefined && prev !== field && new Set(fields.map(([, g]) => `${g.min}-${g.max}`)).size > 1) gaps.push(`${a.label}: fields ${prev} and ${field} share the same rejection reason "${r}"`)
    seen.set(r, field)
  }
}
// ── pengendali negatif: matriks sendiri harus bisa menangkap engine yang buruk ─────────────────────────────────────────
// Engine palsu yang mengembalikan angka untuk NaN harus terdeteksi sebagai "ACCEPTED"; alasan kosong harus terdeteksi; hasil tolak yang
// masih membawa angka hingga harus terdeteksi.
const fakeRange: Rng = { min: 1, max: 10 }
const fakeBad = (x: unknown) => ({ ok: true, data: { v: Number(x) * 2 } })
assert.equal(rejection(() => fakeBad(Number.NaN)).rejected, false, 'engine returning an object for NaN is not a rejection')
assert.equal(rejection(() => ({ ok: false, reason: 'x' })).rejected, true)
assert.equal(rejection(() => ({ missing: ['a'], invalid: [] })).reason, 'missing a')
assert.equal(rejection(() => { throw new Error('boom') }).reason, 'throw: boom')
assert.deepEqual(finiteNumbers({ a: 1, b: [2, { c: Number.NaN }], d: 'x', e: null }), ['a', 'b[0]'])
assert.deepEqual(attacks(fakeRange, 5).map((k) => k.klass).sort(), ['above-max', 'below-min', 'blank-empty-string', 'blank-undefined', 'infinity', '-infinity', 'nan', 'negative', 'numeric-text', 'unit-text'].sort())
assert.ok(!attacks({ min: -10, max: 120 }, 20).some((k) => k.klass === 'negative'), 'negative class is skipped where negatives are valid')

console.log(`calculator-adversarial-matrix: ${runs} adversarial runs over ${ADAPTERS.length} adapters / ${new Set(ADAPTERS.map((a) => a.id)).size} engines`)
const covered = new Set(ADAPTERS.map((a) => a.id))
const uncovered = ids.filter((i) => !covered.has(i))
assert.deepEqual(uncovered, [], `registry engines without an adversarial adapter: ${uncovered.join(', ')}`)
assert.deepEqual([...covered].filter((c) => !ids.includes(c)), [], 'adapter for an engine that is not in the registry')
for (const g of gaps) console.error('GAP', g)
assert.equal(gaps.length, 0, `${gaps.length} adversarial gaps (see GAP lines above)`)
console.log(`calculator-adversarial-matrix: ok; every registry engine rejects blank/NaN/Infinity/negative/out-of-range/unit-text with a named reason`)
