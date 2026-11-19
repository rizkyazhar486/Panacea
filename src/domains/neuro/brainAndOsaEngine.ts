/**
 * Pure deterministic Wearable qEEG / Cognitive Age & OSA (PSG / HSAT) Engine.
 *
 * Domain Purity Invariant:
 * - Zero DOM, Web Bluetooth, storage, clock, RNG, or network calls.
 * - Explicit `truthClass` and `clinicallyReviewed: false`.
 * - Elevated AHI / nocturnal hypoxemia flags mandatory clinician referral guidance.
 */

export type EegDeviceVendor = 'muse' | 'emotiv' | 'dreem' | 'neurosity' | 'csv_edf_import'

export interface QeegPowerBands {
  readonly delta: number
  readonly theta: number
  readonly alpha: number
  readonly beta: number
  readonly gamma: number
}

export interface QeegBrainInput {
  readonly chronologicalAgeYears: number
  readonly device: EegDeviceVendor
  readonly bands: QeegPowerBands
  readonly reactionTimeMs?: number | null
  readonly signalQuality01?: number | null
}

export type QeegBrainResult =
  | {
      readonly ok: true
      readonly device: EegDeviceVendor
      readonly relativeBandsPct: QeegPowerBands
      readonly ratios: {
        readonly thetaToBeta: number
        readonly alphaToTheta: number
      }
      readonly focusIndex: number
      readonly relaxationIndex: number
      readonly cognitiveSpeedPercentile: number
      readonly peerPercentile: number
      readonly cognitiveAgeYears: number
      readonly cognitiveDeltaYears: number
      readonly dominantBand: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'
      readonly truthClass: 'estimated'
      readonly clinicallyReviewed: false
      readonly epistemicNotice: string
    }
  | { readonly ok: false; readonly error: string }

export type OsaSeverity = 'Normal' | 'Mild' | 'Moderate' | 'Severe'

export interface OsaSleepInput {
  /** Apnea-Hypopnea Index (events / hour) from PSG or HSAT. */
  readonly ahiEventsPerHour: number
  /** Oxygen Desaturation Index (desaturations / hour). */
  readonly odiEventsPerHour?: number | null
  /** Lowest nocturnal SpO2 (%). */
  readonly spo2NadirPct: number
  readonly snoringIndexPct?: number | null
  readonly respiratoryEffortFlag?: boolean
  readonly studySource?: 'psg' | 'hsat' | 'wearable_screen'
}

export type OsaSleepResult =
  | {
      readonly ok: true
      readonly ahiEventsPerHour: number
      readonly odiEventsPerHour: number | null
      readonly spo2NadirPct: number
      readonly snoringIndexPct: number | null
      readonly respiratoryEffortFlag: boolean
      readonly severity: OsaSeverity
      readonly clinicianReferralRequired: boolean
      readonly referralGuidance: string
      readonly truthClass: 'measured' | 'estimated'
      readonly clinicallyReviewed: false
      readonly epistemicNotice: string
    }
  | { readonly ok: false; readonly error: string }

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
const round = (v: number, d = 2): number => Number(v.toFixed(d))
const isFiniteIn = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

export function evaluateQeegBrainScan(input: QeegBrainInput): QeegBrainResult {
  if (!input || typeof input !== 'object' || !input.bands) {
    return { ok: false, error: 'qEEG input and power bands are required.' }
  }
  if (!isFiniteIn(input.chronologicalAgeYears, 14, 110)) {
    return { ok: false, error: 'chronologicalAgeYears must be within [14..110].' }
  }
  if (input.signalQuality01 !== undefined && input.signalQuality01 !== null) {
    if (!isFiniteIn(input.signalQuality01, 0, 1)) {
      return { ok: false, error: 'signalQuality01 must be within [0..1].' }
    }
    if (input.signalQuality01 < 0.35) {
      return { ok: false, error: 'EEG electrode contact quality too low (<0.35). Adjust headband and re-capture.' }
    }
  }

  const { delta, theta, alpha, beta, gamma } = input.bands
  if (
    !isFiniteIn(delta, 0, 1e6) ||
    !isFiniteIn(theta, 0, 1e6) ||
    !isFiniteIn(alpha, 0, 1e6) ||
    !isFiniteIn(beta, 0, 1e6) ||
    !isFiniteIn(gamma, 0, 1e6)
  ) {
    return { ok: false, error: 'All EEG band powers must be finite non-negative values.' }
  }

  const total = delta + theta + alpha + beta + gamma
  if (total <= 0) {
    return { ok: false, error: 'Total EEG spectral power must be > 0.' }
  }

  const rel: QeegPowerBands = {
    delta: round((delta / total) * 100, 1),
    theta: round((theta / total) * 100, 1),
    alpha: round((alpha / total) * 100, 1),
    beta: round((beta / total) * 100, 1),
    gamma: round((gamma / total) * 100, 1),
  }

  const thetaToBeta = round(theta / Math.max(beta, 1e-3), 2)
  const alphaToTheta = round(alpha / Math.max(theta, 1e-3), 2)

  // Focus favors organized beta+gamma relative to drowsy theta; relaxation favors posterior alpha over beta
  const focusIndex = Math.round(clamp(48 + (rel.beta + rel.gamma * 0.7 - rel.theta * 0.65) * 1.15, 15, 99))
  const relaxationIndex = Math.round(clamp(36 + (rel.alpha * 1.35 - rel.beta * 0.45), 15, 99))

  // Age-matched reaction-time speed percentile (reference median ~245ms + 1.4ms/yr above 20)
  const expectedRtMs = 245 + Math.max(0, input.chronologicalAgeYears - 20) * 1.4
  const observedRtMs = isFiniteIn(input.reactionTimeMs, 120, 1200) ? input.reactionTimeMs : expectedRtMs
  const rtAdvantageMs = expectedRtMs - observedRtMs
  const cognitiveSpeedPercentile = Math.round(clamp(50 + rtAdvantageMs * 0.68, 5, 99))

  const neuralComposite = focusIndex * 0.4 + relaxationIndex * 0.2 + cognitiveSpeedPercentile * 0.4
  const peerPercentile = Math.round(clamp(neuralComposite, 5, 99))
  const cognitiveDeltaYears = round(clamp((55 - peerPercentile) * 0.12, -8.5, 9.5), 1)
  const cognitiveAgeYears = round(clamp(input.chronologicalAgeYears + cognitiveDeltaYears, 14, 110), 1)

  const entries: Array<['delta' | 'theta' | 'alpha' | 'beta' | 'gamma', number]> = [
    ['delta', rel.delta],
    ['theta', rel.theta],
    ['alpha', rel.alpha],
    ['beta', rel.beta],
    ['gamma', rel.gamma],
  ]
  entries.sort((a, b) => b[1] - a[1])
  const dominantBand = entries[0][0]

  return {
    ok: true,
    device: input.device,
    relativeBandsPct: rel,
    ratios: { thetaToBeta, alphaToTheta },
    focusIndex,
    relaxationIndex,
    cognitiveSpeedPercentile,
    peerPercentile,
    cognitiveAgeYears,
    cognitiveDeltaYears,
    dominantBand,
    truthClass: 'estimated',
    clinicallyReviewed: false,
    epistemicNotice:
      'Consumer/research wearable qEEG spectral estimate (truthClass=estimated). Not a clinical diagnostic electroencephalogram or neurological evaluation.',
  }
}

export function evaluateOsaSleepMonitor(input: OsaSleepInput): OsaSleepResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'OSA sleep monitor input must be an object.' }
  }
  if (!isFiniteIn(input.ahiEventsPerHour, 0, 150)) {
    return { ok: false, error: 'ahiEventsPerHour must be within [0..150].' }
  }
  if (!isFiniteIn(input.spo2NadirPct, 40, 100)) {
    return { ok: false, error: 'spo2NadirPct must be within [40..100].' }
  }

  const odi =
    input.odiEventsPerHour === undefined || input.odiEventsPerHour === null
      ? null
      : isFiniteIn(input.odiEventsPerHour, 0, 150)
        ? round(input.odiEventsPerHour, 1)
        : null

  const snoring =
    input.snoringIndexPct === undefined || input.snoringIndexPct === null
      ? null
      : isFiniteIn(input.snoringIndexPct, 0, 100)
        ? round(input.snoringIndexPct, 1)
        : null

  const ahi = round(input.ahiEventsPerHour, 1)
  const nadir = round(input.spo2NadirPct, 1)

  const severity: OsaSeverity =
    ahi >= 30 ? 'Severe' : ahi >= 15 ? 'Moderate' : ahi >= 5 ? 'Mild' : 'Normal'

  const clinicianReferralRequired = severity !== 'Normal' || nadir < 90
  const referralGuidance =
    severity === 'Severe' || nadir < 85
      ? 'Severe AHI or deep nocturnal desaturation detected. Urgent sleep-medicine physician evaluation and formal polysomnography (PSG) recommended.'
      : clinicianReferralRequired
        ? 'Elevated sleep-disordered breathing indicator (AHI >= 5 or SpO2 nadir < 90%). Schedule clinician review for diagnostic PSG/HSAT confirmation.'
        : 'Within nominal AHI (<5/hr) and nocturnal SpO2 range. Continue longitudinal sleep tracking; consult a clinician if daytime somnolence persists.'

  const truthClass: 'measured' | 'estimated' =
    input.studySource === 'psg' || input.studySource === 'hsat' ? 'measured' : 'estimated'

  return {
    ok: true,
    ahiEventsPerHour: ahi,
    odiEventsPerHour: odi,
    spo2NadirPct: nadir,
    snoringIndexPct: snoring,
    respiratoryEffortFlag: Boolean(input.respiratoryEffortFlag),
    severity,
    clinicianReferralRequired,
    referralGuidance,
    truthClass,
    clinicallyReviewed: false,
    epistemicNotice:
      'AASM severity banding (Normal <5, Mild 5–14, Moderate 15–29, Severe >=30). Screening/monitoring summary only; formal OSA diagnosis requires a licensed sleep clinician.',
  }
}
