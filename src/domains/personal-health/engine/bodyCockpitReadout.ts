// Body cockpit readout: what can honestly be shown from the numbers a person actually recorded.
// Fail-closed: a missing, non-finite or physically implausible input is "missing", never a default, and a
// derived value needs every input it uses. Plausibility ranges below only reject typos and unit mix-ups; they
// are not clinical reference ranges and carry no interpretation.
import { computeBmi } from '../../../lib/anthro'

export interface CockpitInput {
  weightKg?: number; heightCm?: number; age?: number; sex?: 'M' | 'F'
  waistCm?: number; hipCm?: number; neckCm?: number; bodyFatPct?: number
  systolic?: number; diastolic?: number; restingHr?: number; hrvMs?: number
  spo2Pct?: number; vo2max?: number; sleepH?: number
}

export type Basis = 'recorded' | 'derived'
export interface Reading { readonly value: number; readonly basis: Basis; readonly source: string }

const RANGE = {
  weightKg: [20, 400], heightCm: [80, 250], age: [1, 120], waistCm: [30, 250], hipCm: [40, 250], neckCm: [15, 80],
  bodyFatPct: [2, 70], systolic: [50, 300], diastolic: [20, 200], restingHr: [20, 250], hrvMs: [1, 400],
  spo2Pct: [50, 100], vo2max: [5, 100], sleepH: [0.1, 24],
} as const

function clean(key: keyof typeof RANGE, v: number | undefined): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  const [lo, hi] = RANGE[key]
  return v >= lo && v <= hi ? v : null
}
const rec = (value: number | null, source = 'recorded'): Reading | null => (value === null ? null : { value, basis: 'recorded', source })
const der = (value: number, source: string): Reading => ({ value, basis: 'derived', source })
const round = (x: number, d: number) => Number(x.toFixed(d))

export interface CockpitReadout {
  weight: Reading | null; height: Reading | null
  bmi: Reading | null; waistToHip: Reading | null; waistToHeight: Reading | null; bodyFatPct: Reading | null
  bmr: Reading | null
  bloodPressure: { systolic: number; diastolic: number } | null; meanArterialPressure: Reading | null
  restingHr: Reading | null; hrvMs: Reading | null; spo2Pct: Reading | null; vo2max: Reading | null; sleepH: Reading | null
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

  return {
    weight: rec(w), height: rec(h), bmi,
    waistToHip: waist !== null && hip !== null ? der(round(waist / hip, 2), 'waist ÷ hip') : null,
    waistToHeight: waist !== null && h !== null ? der(round(waist / h, 2), 'waist ÷ height') : null,
    bodyFatPct, bmr,
    bloodPressure: bp,
    meanArterialPressure: bp ? der(Math.round((bp.systolic + 2 * bp.diastolic) / 3), '(systolic + 2 × diastolic) ÷ 3') : null,
    restingHr: rec(clean('restingHr', input.restingHr)), hrvMs: rec(clean('hrvMs', input.hrvMs)),
    spo2Pct: rec(clean('spo2Pct', input.spo2Pct)), vo2max: rec(clean('vo2max', input.vo2max)), sleepH: rec(clean('sleepH', input.sleepH)),
    missing: [...new Set(missing)],
  }
}
