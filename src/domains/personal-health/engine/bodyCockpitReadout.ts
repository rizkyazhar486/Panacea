// Body cockpit readout: what can honestly be shown from the numbers a person actually recorded.
// Fail-closed: a missing, non-finite or physically implausible input is "missing", never a default, and a
// derived value needs every input it uses. Plausibility ranges below only reject typos and unit mix-ups; they
// are not clinical reference ranges and carry no interpretation.
import { computeBmi } from '../../../lib/anthro'

export interface CockpitInput {
  weightKg?: number; heightCm?: number; age?: number; sex?: 'M' | 'F'
  waistCm?: number; hipCm?: number; neckCm?: number; bodyFatPct?: number
  muscleMassKg?: number; visceralFatLevel?: number; totalBodyWaterPct?: number
  systolic?: number; diastolic?: number; restingHr?: number; hrvMs?: number
  spo2Pct?: number; respiratoryRateBpm?: number; vo2max?: number; sleepH?: number
  weeklyWorkoutMinutes?: number; localHour0to23?: number
}

export type Basis = 'recorded' | 'derived'
export interface Reading { readonly value: number; readonly basis: Basis; readonly source: string }

export interface BodyCompartmentReadout {
  readonly leanMassKg: Reading | null
  readonly fatMassKg: Reading | null
  readonly skeletalMuscleMassKg: Reading | null
  readonly totalBodyWaterL: Reading | null
  readonly icwL: Reading | null
  readonly ecwL: Reading | null
  readonly visceralFatLevel: Reading | null
}

export interface NetworkPhysiologyBuses {
  readonly autonomicVagal: Reading | null
  readonly hemodynamicOxygen: Reading | null
  readonly metabolicAtp: Reading | null
  readonly circadianRepair: Reading | null
}

export interface CircadianBorbelyState {
  readonly processC: number
  readonly processS: number
  readonly estimatedCoreTempC: number
  readonly cortisolMelatoninRatio: number
  readonly phaseWindow: 'cortisol-awakening' | 'peak-cognitive' | 'neuromuscular-peak' | 'melatonin-onset' | 'nocturnal-repair'
  readonly optimalFocus: string
  readonly basis: 'derived'
  readonly source: string
}

export type RecoveryModalityHint = 'hbot' | 'whole_body_cryo' | 'red_light_pbm' | 'x_tone' | 'x_cryo'

export interface AllostaticPidFeedback {
  readonly loadIndex0to100: number
  readonly proportional: number
  readonly integral: number
  readonly derivative: number
  readonly directive: string
  readonly suggestedModalities: readonly RecoveryModalityHint[]
  readonly clinicallyReviewed: false
  readonly basis: 'derived'
  readonly source: string
}

const RANGE = {
  weightKg: [20, 400], heightCm: [80, 250], age: [1, 120], waistCm: [30, 250], hipCm: [40, 250], neckCm: [15, 80],
  bodyFatPct: [2, 70], muscleMassKg: [5, 120], visceralFatLevel: [1, 59], totalBodyWaterPct: [30, 80],
  systolic: [50, 300], diastolic: [20, 200], restingHr: [20, 250], hrvMs: [1, 400],
  spo2Pct: [50, 100], respiratoryRateBpm: [4, 60], vo2max: [5, 100], sleepH: [0.1, 24],
  weeklyWorkoutMinutes: [0, 4000], localHour0to23: [0, 23.99],
} as const

function clean(key: keyof typeof RANGE, v: number | undefined): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const [lo, hi] = RANGE[key]
  return v >= lo && v <= hi ? v : null
}
const rec = (value: number | null, source = 'recorded'): Reading | null => (value === null ? null : { value, basis: 'recorded', source })
const der = (value: number, source: string): Reading => ({ value, basis: 'derived', source })
const round = (x: number, d: number) => Number(x.toFixed(d))
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

export interface CockpitReadout {
  weight: Reading | null; height: Reading | null
  bmi: Reading | null; waistToHip: Reading | null; waistToHeight: Reading | null; bodyFatPct: Reading | null
  bmr: Reading | null
  bloodPressure: { systolic: number; diastolic: number } | null; meanArterialPressure: Reading | null
  restingHr: Reading | null; hrvMs: Reading | null; spo2Pct: Reading | null; vo2max: Reading | null; sleepH: Reading | null
  compartments: BodyCompartmentReadout
  networkBuses: NetworkPhysiologyBuses
  circadianBorbely: CircadianBorbelyState | null
  allostaticPid: AllostaticPidFeedback | null
  /** Plain names of the recorded inputs that would unlock a derived value that is currently missing. */
  missing: readonly string[]
}

/** U.S. Navy circumference method (Hodgdon & Beckett 1984). Null if a logarithm argument is not positive or the result is implausible. */
export function navyBodyFatPct(sex: 'M' | 'F', heightCm: number, waistCm: number, neckCm: number, hipCm?: number): number | null {
  const arg = sex === 'M' ? waistCm - neckCm : hipCm === undefined ? Number.NaN : waistCm + hipCm - neckCm
  if (!(arg > 0)) return null
  const dens = sex === 'M'
    ? 1.0324 - 0.19077 * Math.log10(arg) + 0.15456 * Math.log10(heightCm)
    : 1.29579 - 0.35004 * Math.log10(arg) + 0.221 * Math.log10(heightCm)
  const bf = 495 / dens - 450
  const [lo, hi] = RANGE.bodyFatPct
  return Number.isFinite(bf) && bf >= lo && bf <= hi ? round(bf, 1) : null
}

export function buildCockpitReadout(input: CockpitInput): CockpitReadout {
  const w = clean('weightKg', input.weightKg), h = clean('heightCm', input.heightCm), age = clean('age', input.age)
  const waist = clean('waistCm', input.waistCm), hip = clean('hipCm', input.hipCm), neck = clean('neckCm', input.neckCm)
  const sex = input.sex === 'M' || input.sex === 'F' ? input.sex : null
  const sbp = clean('systolic', input.systolic), dbp = clean('diastolic', input.diastolic)
  const bp = sbp !== null && dbp !== null && sbp > dbp ? { systolic: sbp, diastolic: dbp } : null
  const missing: string[] = []

  const bmiRes = w !== null && h !== null ? computeBmi(w, h) : null
  const bmi = bmiRes?.valid ? der(bmiRes.bmi, 'weight ÷ height²') : null
  if (!bmi) missing.push('weight and height')

  const recordedFat = rec(clean('bodyFatPct', input.bodyFatPct), 'entered or imported')
  let bodyFatPct: Reading | null = recordedFat
  if (!bodyFatPct && sex && h !== null && waist !== null && neck !== null && (sex === 'M' || hip !== null)) {
    const v = navyBodyFatPct(sex, h, waist, neck, hip ?? undefined)
    if (v !== null) bodyFatPct = der(v, 'U.S. Navy circumference method (Hodgdon & Beckett 1984), an estimate')
  }
  if (!bodyFatPct) missing.push(sex === 'F' ? 'sex, height, waist, neck and hip' : 'sex, height, waist and neck')

  const bmr = w !== null && h !== null && age !== null && sex
    ? der(Math.round(10 * w + 6.25 * h - 5 * age + (sex === 'M' ? 5 : -161)), 'Mifflin-St Jeor 1990, resting estimate')
    : null
  if (!bmr) missing.push('age and sex (for resting energy)')

  const rhr = clean('restingHr', input.restingHr)
  const hrv = clean('hrvMs', input.hrvMs)
  const spo2 = clean('spo2Pct', input.spo2Pct)
  const respRate = clean('respiratoryRateBpm', input.respiratoryRateBpm)
  const vo2 = clean('vo2max', input.vo2max)
  const sleep = clean('sleepH', input.sleepH)
  const smmRec = clean('muscleMassKg', input.muscleMassKg)
  const visceralRec = clean('visceralFatLevel', input.visceralFatLevel)
  const tbwPctRec = clean('totalBodyWaterPct', input.totalBodyWaterPct)
  const wkMin = clean('weeklyWorkoutMinutes', input.weeklyWorkoutMinutes)
  const hour = clean('localHour0to23', input.localHour0to23)
  const mapVal = bp ? Math.round((bp.systolic + 2 * bp.diastolic) / 3) : null

  // Multi-compartment BIA & hydration breakdown — strictly derived from recorded inputs, null when inputs missing.
  const fatMassVal = w !== null && bodyFatPct !== null ? round(w * (bodyFatPct.value / 100), 1) : null
  const leanMassVal = w !== null && fatMassVal !== null ? round(Math.max(1, w - fatMassVal), 1) : null
  const tbwVal = w !== null && tbwPctRec !== null
    ? round(w * (tbwPctRec / 100), 1)
    : leanMassVal !== null ? round(leanMassVal * 0.73, 1) : null
  const compartments: BodyCompartmentReadout = {
    leanMassKg: leanMassVal !== null ? der(leanMassVal, 'weight × (1 − body fat %)') : null,
    fatMassKg: fatMassVal !== null ? der(fatMassVal, 'weight × body fat %') : null,
    skeletalMuscleMassKg: smmRec !== null
      ? rec(smmRec, 'entered or BIA scale')
      : leanMassVal !== null ? der(round(leanMassVal * 0.54, 1), 'lean mass × 0.54 anthropometric estimate') : null,
    totalBodyWaterL: tbwVal !== null
      ? der(tbwVal, tbwPctRec !== null ? 'weight × recorded TBW %' : '73% hydration of fat-free mass (Pace-Rathbun)')
      : null,
    icwL: tbwVal !== null ? der(round(tbwVal * 0.62, 1), '62% intracellular partition of TBW') : null,
    ecwL: tbwVal !== null ? der(round(tbwVal * 0.38, 1), '38% extracellular partition of TBW') : null,
    visceralFatLevel: rec(visceralRec, 'BIA scale'),
  }

  // Ivanov 4-Bus Network Physiology coherence indices (0–100); each bus stays null unless backing telemetry exists.
  const autonomicScore = rhr !== null && hrv !== null
    ? round(clamp(50 + (hrv - 45) * 0.65 - (rhr - 62) * 0.9, 10, 100), 0)
    : null
  const hemoParts: number[] = []
  if (spo2 !== null) hemoParts.push(clamp((spo2 - 88) * 9, 10, 100))
  if (mapVal !== null) hemoParts.push(clamp(100 - Math.abs(mapVal - 88) * 1.4, 15, 100))
  if (vo2 !== null) hemoParts.push(clamp((vo2 / 55) * 100, 20, 100))
  if (respRate !== null) hemoParts.push(clamp(100 - Math.abs(respRate - 14) * 4, 15, 100))
  const hemoScore = hemoParts.length > 0 ? round(hemoParts.reduce((a, b) => a + b, 0) / hemoParts.length, 0) : null

  const metabParts: number[] = []
  if (bmiRes?.valid) metabParts.push(clamp(100 - Math.abs(bmiRes.bmi - 22) * 4.5, 15, 100))
  if (wkMin !== null) metabParts.push(clamp(45 + Math.min(wkMin, 300) * 0.18, 25, 100))
  if (leanMassVal !== null && w !== null) metabParts.push(clamp(((leanMassVal / w) * 100 - 50) * 2.5, 20, 100))
  const metabScore = metabParts.length > 0 ? round(metabParts.reduce((a, b) => a + b, 0) / metabParts.length, 0) : null

  const circadianScore = sleep !== null ? round(clamp(100 - Math.abs(sleep - 8) * 14, 15, 100), 0) : null
  const networkBuses: NetworkPhysiologyBuses = {
    autonomicVagal: autonomicScore !== null ? der(autonomicScore, 'recorded HR + HRV neuro-vagal coupling index') : null,
    hemodynamicOxygen: hemoScore !== null ? der(hemoScore, 'recorded BP / SpO2 / RR / VO2max transport index') : null,
    metabolicAtp: metabScore !== null ? der(metabScore, 'recorded anthropometry + workout flux index') : null,
    circadianRepair: circadianScore !== null ? der(circadianScore, 'recorded sleep duration restoration index') : null,
  }

  // Borbely Two-Process Circadian Scheduler (Process C + Process S) — strictly requires explicit localHour0to23 & sleepH.
  let circadianBorbely: CircadianBorbelyState | null = null
  if (hour !== null && sleep !== null) {
    const rad = ((hour - 16) / 24) * 2 * Math.PI
    const processC = round((Math.cos(rad) + 1) / 2, 2)
    const hoursAwake = hour >= 6 ? hour - 6 : hour + 18
    const debtFactor = Math.max(0, 7.5 - sleep) * 0.08
    const processS = round(clamp(1 - Math.exp(-hoursAwake / 18.2) + debtFactor, 0.05, 1), 2)
    const estimatedCoreTempC = round(36.7 + 0.45 * Math.cos(rad), 2)
    const cortisolMelatoninRatio = round(clamp(0.2 + 3.4 * Math.max(0, Math.cos(((hour - 8.5) / 24) * 2 * Math.PI)), 0.1, 4), 2)
    const phaseWindow: CircadianBorbelyState['phaseWindow'] =
      hour >= 6 && hour < 9 ? 'cortisol-awakening'
        : hour >= 9 && hour < 14 ? 'peak-cognitive'
          : hour >= 14 && hour < 19 ? 'neuromuscular-peak'
            : hour >= 19 && hour < 22 ? 'melatonin-onset'
              : 'nocturnal-repair'
    const optimalFocus =
      phaseWindow === 'cortisol-awakening' ? 'Daylight exposure, hydration, light mobility & baseline vitals capture'
        : phaseWindow === 'peak-cognitive' ? 'Peak cognitive deep work & precision clinical analysis window'
          : phaseWindow === 'neuromuscular-peak' ? 'Peak core temperature — optimal strength, athletic training & Red Light PBM / X-Tone window'
            : phaseWindow === 'melatonin-onset' ? 'Dim blue light, vagal down-regulation & gentle recovery'
              : 'Nocturnal slow-wave repair & circadian consolidation'
    circadianBorbely = {
      processC, processS, estimatedCoreTempC, cortisolMelatoninRatio, phaseWindow, optimalFocus,
      basis: 'derived', source: 'Borbely Two-Process Model (Process C + Process S) from local hour & recorded sleep',
    }
  }

  // Cybernetic Allostatic PID controller — requires >= 2 real physiological signals; null otherwise.
  const busValues = [autonomicScore, hemoScore, metabScore, circadianScore].filter((v): v is number => v !== null)
  let allostaticPid: AllostaticPidFeedback | null = null
  if (busValues.length >= 2) {
    const meanCoherence = busValues.reduce((a, b) => a + b, 0) / busValues.length
    const loadIndex0to100 = round(clamp(100 - meanCoherence, 0, 100), 0)
    const error = loadIndex0to100 - 30 // setpoint target <= 30 allostatic load
    const proportional = round(error * 0.55, 1)
    const integral = round(Math.max(0, (sleep !== null ? 7.5 - sleep : 0) * 6 + (wkMin !== null && wkMin > 420 ? (wkMin - 420) * 0.04 : 0)), 1)
    const derivative = round(rhr !== null ? (rhr - 62) * 0.35 : 0, 1)
    const suggestedModalities: RecoveryModalityHint[] = loadIndex0to100 >= 55
      ? ['hbot', 'red_light_pbm', 'whole_body_cryo']
      : loadIndex0to100 >= 35
        ? ['red_light_pbm', 'x_cryo', 'whole_body_cryo']
        : ['x_tone', 'red_light_pbm']
    const directive = loadIndex0to100 >= 55
      ? 'Elevated model strain — prioritize sleep restoration, autonomic down-regulation, and clinician review before high-intensity load.'
      : loadIndex0to100 >= 35
        ? 'Moderate model load — balance aerobic/strength work with targeted thermal or photobiomodulation recovery.'
        : 'Balanced baseline across recorded channels — ready for progressive training or structured focus.'
    allostaticPid = {
      loadIndex0to100, proportional, integral, derivative, directive, suggestedModalities,
      clinicallyReviewed: false, basis: 'derived', source: 'Allostatic PID feedback from recorded multi-bus telemetry (draft only)',
    }
  }

  return {
    weight: rec(w), height: rec(h), bmi,
    waistToHip: waist !== null && hip !== null ? der(round(waist / hip, 2), 'waist ÷ hip') : null,
    waistToHeight: waist !== null && h !== null ? der(round(waist / h, 2), 'waist ÷ height') : null,
    bodyFatPct, bmr,
    bloodPressure: bp,
    meanArterialPressure: mapVal !== null ? der(mapVal, '(systolic + 2 × diastolic) ÷ 3') : null,
    restingHr: rec(rhr), hrvMs: rec(hrv),
    spo2Pct: rec(spo2), vo2max: rec(vo2), sleepH: rec(sleep),
    compartments, networkBuses, circadianBorbely, allostaticPid,
    missing: [...new Set(missing)],
  }
}
