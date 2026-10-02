// Kontrak identifiability parameter: syarat minimum sebelum parameter model boleh
// DIPERTIMBANGKAN untuk personalisasi. Hasilnya hanya kandidat — bukan kalibrasi,
// bukan klaim klinis. Tanpa bukti cukup, parameter tetap populasi (fail-closed).
// Murni & deterministik: tidak ada jam/acak tersembunyi.

export type IdentifiabilityObservationState = 'measured' | 'imported' | 'clinician-entered' | 'simulated' | 'derived'

export interface IdentifiabilityObservation {
  at: string
  value: number
  /** Ketidakpastian pengukuran (1σ, satuan sama). null = tidak terkuantifikasi. */
  sigma: number | null
  state: IdentifiabilityObservationState
}

export interface IdentifiabilityPolicy {
  minObservations: number
  minSpanDays: number
  /** Simpangan baku sampel / σ median: sinyal harus terlihat di atas derau ukur. */
  minSignalToNoise: number
}

export const DEFAULT_IDENTIFIABILITY_POLICY: IdentifiabilityPolicy = {
  minObservations: 5,
  minSpanDays: 7,
  minSignalToNoise: 2,
}

export type IdentifiabilityBlocker =
  | 'too-few-observations'
  | 'span-too-short'
  | 'uncertainty-unquantified'
  | 'signal-below-noise'

export interface IdentifiabilityInput {
  parameterId: string
  unit: string
  /** Rentang fisiologis prior; nilai di luar rentang ditolak, bukan dipotong. */
  priorRange: { min: number; max: number }
  observations: readonly IdentifiabilityObservation[]
  policy?: IdentifiabilityPolicy
}

export interface IdentifiabilityAssessment {
  parameterId: string
  unit: string
  status: 'candidate-for-review' | 'population-default-only'
  blockers: readonly IdentifiabilityBlocker[]
  evidence: {
    admissibleCount: number
    rejectedNonPatientCount: number
    rejectedOutOfRangeCount: number
    spanDays: number
    sampleSd: number | null
    medianSigma: number | null
    signalToNoise: number | null
  }
  boundary: {
    personalizationApplied: false
    automaticRecalibrationAllowed: false
    clinicalValidationClaimed: false
  }
}

const PATIENT_STATES = new Set<IdentifiabilityObservationState>(['measured', 'imported', 'clinician-entered'])
const DAY_MS = 86_400_000

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function sampleSd(values: readonly number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1))
}

function assertPolicy(p: IdentifiabilityPolicy): void {
  if (!Number.isInteger(p.minObservations) || p.minObservations < 2) throw new Error('policy.minObservations must be an integer >= 2')
  if (!Number.isFinite(p.minSpanDays) || p.minSpanDays < 0) throw new Error('policy.minSpanDays must be finite and >= 0')
  if (!Number.isFinite(p.minSignalToNoise) || p.minSignalToNoise <= 0) throw new Error('policy.minSignalToNoise must be finite and > 0')
}

export function assessParameterIdentifiability(input: IdentifiabilityInput): IdentifiabilityAssessment {
  const policy = input.policy ?? DEFAULT_IDENTIFIABILITY_POLICY
  assertPolicy(policy)
  if (!input.parameterId.trim()) throw new Error('parameterId is required')
  if (!input.unit.trim()) throw new Error('unit is required')
  const { min, max } = input.priorRange
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw new Error('priorRange must be finite with min < max')

  let nonPatient = 0
  let outOfRange = 0
  const kept: { t: number; value: number; sigma: number | null }[] = []
  for (const o of input.observations) {
    const t = Date.parse(o.at)
    if (!Number.isFinite(t)) throw new Error(`observation timestamp invalid: ${o.at}`)
    if (!Number.isFinite(o.value)) throw new Error('observation value must be finite')
    if (o.sigma !== null && (!Number.isFinite(o.sigma) || o.sigma <= 0)) throw new Error('observation sigma must be null or finite > 0')
    if (!PATIENT_STATES.has(o.state)) { nonPatient++; continue }
    if (o.value < min || o.value > max) { outOfRange++; continue }
    kept.push({ t, value: o.value, sigma: o.sigma })
  }

  const blockers: IdentifiabilityBlocker[] = []
  const times = kept.map((k) => k.t)
  const spanDays = kept.length ? (Math.max(...times) - Math.min(...times)) / DAY_MS : 0
  const distinctTimes = new Set(times).size
  if (distinctTimes < policy.minObservations) blockers.push('too-few-observations')
  if (spanDays < policy.minSpanDays) blockers.push('span-too-short')

  const sigmas = kept.map((k) => k.sigma)
  const allSigma = kept.length > 0 && sigmas.every((s): s is number => s !== null)
  if (!allSigma) blockers.push('uncertainty-unquantified')

  const sd = kept.length >= 2 ? sampleSd(kept.map((k) => k.value)) : null
  const medSigma = allSigma ? median(sigmas as number[]) : null
  const snr = sd !== null && medSigma !== null ? sd / medSigma : null
  if (snr !== null && snr < policy.minSignalToNoise) blockers.push('signal-below-noise')

  return {
    parameterId: input.parameterId,
    unit: input.unit,
    status: blockers.length === 0 ? 'candidate-for-review' : 'population-default-only',
    blockers,
    evidence: {
      admissibleCount: kept.length,
      rejectedNonPatientCount: nonPatient,
      rejectedOutOfRangeCount: outOfRange,
      spanDays,
      sampleSd: sd,
      medianSigma: medSigma,
      signalToNoise: snr,
    },
    boundary: { personalizationApplied: false, automaticRecalibrationAllowed: false, clinicalValidationClaimed: false },
  }
}
