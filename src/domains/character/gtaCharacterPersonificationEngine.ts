/**
 * Pure deterministic GTA 6-style 1:1 Character Personification, Longevium
 * Digital Twin Counterfactual, and Neon Sync Outbox engine.
 *
 * Domain Purity Invariant:
 * - Zero `window`, `document`, `localStorage`, `sessionStorage`, `Date.now()`,
 *   `new Date()`, `Math.random()`, or network calls.
 * - Explicit `truthClass` on every derived/simulated output (`clinicallyReviewed: false`).
 */

export type TruthClass = 'measured' | 'estimated' | 'simulated' | 'curated_physiology' | 'retrospective'

export type TurntablePreset = 'anterior' | 'lateral_left' | 'lateral_right' | 'posterior' | 'superior'

export type ZAnatomyLayerKey = 'integument' | 'muscular' | 'skeletal' | 'vascular' | 'nervous' | 'visceral' | 'lymphatic'

export interface GtaCharacterInput {
  readonly profileKey: string
  readonly mrn?: string
  readonly codename?: string
  readonly heightCm: number
  readonly weightKg: number
  readonly bodyFatPct?: number
  readonly restingHrBpm?: number
  readonly hrvMs?: number
  readonly vo2max?: number
  readonly dailySteps?: number
  readonly sleepHours?: number
  readonly hydrationLiters?: number
  readonly posturalAlignment01?: number
  readonly turntablePreset?: TurntablePreset
  readonly activeLayers?: readonly ZAnatomyLayerKey[]
}

export interface GtaCharacterCoreRings {
  readonly healthCore: number
  readonly staminaCore: number
  readonly focusCore: number
  readonly recoveryReserve: number
  readonly readinessScore: number
  readonly overdriveRisk: number
}

export interface GtaCharacterDynamicNeeds {
  readonly sleepDebtHours: number
  readonly hydrationStatus: 'optimal' | 'moderate' | 'low' | 'unobserved'
  readonly metabolicFuel: 'steady' | 'demanding' | 'recovery_priority'
  readonly thermalRecovery: 'ready' | 'suggested' | 'priority'
  readonly stressLoad: 'low' | 'moderate' | 'elevated'
}

export interface GtaCharacterMorphRig {
  readonly heightCm: number
  readonly weightKg: number
  readonly bodyFatPct: number
  readonly leanMassPct: number
  readonly shoulderToWaistRatio: number
  readonly posturalAlignment01: number
  readonly turntablePreset: TurntablePreset
  readonly zAnatomyLayerMask: readonly ZAnatomyLayerKey[]
}

export type GtaCharacterResult =
  | {
      readonly ok: true
      readonly codename: string
      readonly cores: GtaCharacterCoreRings
      readonly needs: GtaCharacterDynamicNeeds
      readonly morph: GtaCharacterMorphRig
      readonly qrPassPayload: string
      readonly barcodePayload: string
      readonly truthClass: 'estimated' | 'simulated'
      readonly clinicallyReviewed: false
      readonly epistemicNotice: string
    }
  | { readonly ok: false; readonly error: string }

const ALL_LAYERS: readonly ZAnatomyLayerKey[] = Object.freeze([
  'integument', 'muscular', 'skeletal', 'vascular', 'nervous', 'visceral', 'lymphatic',
])

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const round = (v: number, d = 1) => Number(v.toFixed(d))
const isFiniteIn = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

function sanitizeToken(raw: string, fallback: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)
  return clean || fallback
}

function deterministicChecksumHex(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return (h >>> 0).toString(16).padStart(8, '0').toUpperCase()
}

export function evaluateGtaCharacterPersonification(input: GtaCharacterInput): GtaCharacterResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Character input must be an object.' }
  }
  if (!isFiniteIn(input.heightCm, 80, 250) || !isFiniteIn(input.weightKg, 20, 400)) {
    return { ok: false, error: 'heightCm [80..250] and weightKg [20..400] must be finite physical measurements.' }
  }
  if (input.bodyFatPct !== undefined && !isFiniteIn(input.bodyFatPct, 2, 70)) {
    return { ok: false, error: 'bodyFatPct must be within [2..70].' }
  }
  if (input.restingHrBpm !== undefined && !isFiniteIn(input.restingHrBpm, 25, 220)) {
    return { ok: false, error: 'restingHrBpm must be within [25..220].' }
  }
  if (input.hrvMs !== undefined && !isFiniteIn(input.hrvMs, 1, 400)) {
    return { ok: false, error: 'hrvMs must be within [1..400].' }
  }
  if (input.vo2max !== undefined && !isFiniteIn(input.vo2max, 5, 100)) {
    return { ok: false, error: 'vo2max must be within [5..100].' }
  }
  if (input.dailySteps !== undefined && !isFiniteIn(input.dailySteps, 0, 150000)) {
    return { ok: false, error: 'dailySteps must be within [0..150000].' }
  }
  if (input.sleepHours !== undefined && !isFiniteIn(input.sleepHours, 0, 24)) {
    return { ok: false, error: 'sleepHours must be within [0..24].' }
  }
  if (input.posturalAlignment01 !== undefined && !isFiniteIn(input.posturalAlignment01, 0, 1)) {
    return { ok: false, error: 'posturalAlignment01 must be within [0..1].' }
  }

  const bmi = input.weightKg / ((input.heightCm / 100) ** 2)
  const measuredSignals = [input.restingHrBpm, input.hrvMs, input.vo2max, input.sleepHours, input.dailySteps].filter(
    (v) => v !== undefined,
  ).length
  const truthClass: 'estimated' | 'simulated' = measuredSignals >= 3 ? 'estimated' : 'simulated'

  const bf = input.bodyFatPct ?? round(clamp(1.2 * bmi - 10.8, 8, 42), 1)
  const leanMassPct = round(clamp(100 - bf, 30, 96), 1)
  const posture = input.posturalAlignment01 ?? 0.72

  const rhr = input.restingHrBpm ?? 64
  const hrv = input.hrvMs ?? 60
  const vo2 = input.vo2max ?? 44
  const steps = input.dailySteps ?? 6500
  const sleep = input.sleepHours ?? 7.2

  const healthCore = Math.round(clamp(72 + (68 - rhr) * 0.75 + (sleep - 7) * 6.5 - Math.abs(bmi - 22.5) * 1.4, 15, 100))
  const staminaCore = Math.round(clamp(42 + vo2 * 0.85 + Math.min(steps, 14000) / 700 + posture * 8, 15, 100))
  const focusCore = Math.round(clamp(46 + hrv * 0.48 + (sleep - 6.5) * 7.5 + posture * 6, 15, 100))
  const recoveryReserve = Math.round(clamp((healthCore * 0.45 + focusCore * 0.55) - Math.max(0, 7.5 - sleep) * 7, 10, 100))
  const readinessScore = Math.round(clamp(healthCore * 0.35 + staminaCore * 0.3 + focusCore * 0.35, 10, 100))
  const overdriveRisk = Math.round(clamp(100 - recoveryReserve + Math.max(0, rhr - 72) * 0.7, 0, 100))

  const sleepDebtHours = round(Math.max(0, 8 - sleep), 1)
  const hydrationStatus: GtaCharacterDynamicNeeds['hydrationStatus'] =
    input.hydrationLiters === undefined
      ? 'unobserved'
      : input.hydrationLiters >= 2.2
        ? 'optimal'
        : input.hydrationLiters >= 1.5
          ? 'moderate'
          : 'low'

  const needs: GtaCharacterDynamicNeeds = Object.freeze({
    sleepDebtHours,
    hydrationStatus,
    metabolicFuel: steps >= 11000 ? 'demanding' : recoveryReserve < 60 ? 'recovery_priority' : 'steady',
    thermalRecovery: overdriveRisk >= 45 ? 'priority' : overdriveRisk >= 28 ? 'suggested' : 'ready',
    stressLoad: overdriveRisk >= 50 ? 'elevated' : overdriveRisk >= 28 ? 'moderate' : 'low',
  })

  const layerMask = input.activeLayers && input.activeLayers.length > 0
    ? Object.freeze(input.activeLayers.filter((l) => ALL_LAYERS.includes(l)))
    : Object.freeze(['integument', 'muscular', 'skeletal', 'vascular'] as const)

  const morph: GtaCharacterMorphRig = Object.freeze({
    heightCm: round(input.heightCm, 1),
    weightKg: round(input.weightKg, 1),
    bodyFatPct: round(bf, 1),
    leanMassPct,
    shoulderToWaistRatio: round(clamp(1.22 + (leanMassPct - 70) * 0.009 + posture * 0.08, 1.05, 1.68), 2),
    posturalAlignment01: round(posture, 2),
    turntablePreset: input.turntablePreset ?? 'anterior',
    zAnatomyLayerMask: layerMask,
  })

  const keyToken = sanitizeToken(input.profileKey, 'rizkyazhar486')
  const mrnToken = sanitizeToken(input.mrn ?? 'PMD-000486', 'PMD-000486')
  const rawBody = `PANACEA-PASS-V1|${mrnToken}|${keyToken}|R${readinessScore}`
  const sig = deterministicChecksumHex(rawBody)
  const qrPassPayload = `${rawBody}|${sig}`
  const barcodePayload = `${mrnToken}-${sig.slice(0, 4)}`

  return Object.freeze({
    ok: true,
    codename: sanitizeToken(input.codename ?? 'PANACEA-01', 'PANACEA-01'),
    cores: Object.freeze({ healthCore, staminaCore, focusCore, recoveryReserve, readinessScore, overdriveRisk }),
    needs,
    morph,
    qrPassPayload,
    barcodePayload,
    truthClass,
    clinicallyReviewed: false,
    epistemicNotice:
      'GTA-style personal readiness & parametric morph model (non-clinical visualization; never autonomous medical clearance or physical actuation).',
  })
}

export type LongeviumInterventionId = 'weight_recomp' | 'sleep_lock' | 'zone2_resistance' | 'anti_inflammatory'

export interface LongeviumBaselineInput {
  readonly chronologicalAgeYears: number
  readonly biologicalAgeYears: number
  readonly cardiovascularRiskPct: number
  readonly metabolicRiskPct: number
  readonly hsCrpMgL: number
  readonly interventions: readonly LongeviumInterventionId[]
}

export interface LongeviumCounterfactualRow {
  readonly marker: string
  readonly unit: string
  readonly nowValue: number
  readonly afterValue: number
  readonly delta: number
}

export type LongeviumCounterfactualResult =
  | {
      readonly ok: true
      readonly rows: readonly LongeviumCounterfactualRow[]
      readonly appliedInterventions: readonly LongeviumInterventionId[]
      readonly truthClass: 'simulated'
      readonly clinicallyReviewed: false
      readonly epistemicNotice: string
    }
  | { readonly ok: false; readonly error: string }

const INTERVENTION_DELTAS: Readonly<Record<LongeviumInterventionId, { bioAge: number; cvPct: number; metPct: number; crp: number }>> = Object.freeze({
  weight_recomp: { bioAge: -1.8, cvPct: -2.4, metPct: -4.2, crp: -0.45 },
  sleep_lock: { bioAge: -1.1, cvPct: -1.2, metPct: -1.9, crp: -0.25 },
  zone2_resistance: { bioAge: -1.6, cvPct: -2.8, metPct: -3.1, crp: -0.35 },
  anti_inflammatory: { bioAge: -0.9, cvPct: -1.5, metPct: -1.8, crp: -0.55 },
})

export function evaluateLongeviumCounterfactual(input: LongeviumBaselineInput): LongeviumCounterfactualResult {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Baseline input required.' }
  if (
    !isFiniteIn(input.chronologicalAgeYears, 18, 120) ||
    !isFiniteIn(input.biologicalAgeYears, 15, 130) ||
    !isFiniteIn(input.cardiovascularRiskPct, 0.1, 95) ||
    !isFiniteIn(input.metabolicRiskPct, 0.1, 95) ||
    !isFiniteIn(input.hsCrpMgL, 0.05, 50)
  ) {
    return { ok: false, error: 'Baseline biological markers must be finite physical values.' }
  }
  const unique = [...new Set(input.interventions)].filter((id): id is LongeviumInterventionId => id in INTERVENTION_DELTAS)
  let dBio = 0, dCv = 0, dMet = 0, dCrp = 0
  for (const id of unique) {
    const eff = INTERVENTION_DELTAS[id]
    dBio += eff.bioAge
    dCv += eff.cvPct
    dMet += eff.metPct
    dCrp += eff.crp
  }
  const afterBio = round(clamp(input.biologicalAgeYears + dBio, Math.max(18, input.chronologicalAgeYears - 12), 120), 1)
  const afterCv = round(clamp(input.cardiovascularRiskPct + dCv, 0.5, 95), 1)
  const afterMet = round(clamp(input.metabolicRiskPct + dMet, 0.5, 95), 1)
  const afterCrp = round(clamp(input.hsCrpMgL + dCrp, 0.15, 50), 2)

  return Object.freeze({
    ok: true,
    appliedInterventions: Object.freeze(unique),
    rows: Object.freeze([
      { marker: 'Biological Age (PhenoAge model)', unit: 'yrs', nowValue: round(input.biologicalAgeYears, 1), afterValue: afterBio, delta: round(afterBio - input.biologicalAgeYears, 1) },
      { marker: '10-Yr Cardiovascular Risk', unit: '%', nowValue: round(input.cardiovascularRiskPct, 1), afterValue: afterCv, delta: round(afterCv - input.cardiovascularRiskPct, 1) },
      { marker: 'Metabolic Disease Risk', unit: '%', nowValue: round(input.metabolicRiskPct, 1), afterValue: afterMet, delta: round(afterMet - input.metabolicRiskPct, 1) },
      { marker: 'Systemic Inflammation (hs-CRP)', unit: 'mg/L', nowValue: round(input.hsCrpMgL, 2), afterValue: afterCrp, delta: round(afterCrp - input.hsCrpMgL, 2) },
    ]),
    truthClass: 'simulated',
    clinicallyReviewed: false,
    epistemicNotice: 'Simulated counterfactual projection ("Now vs. After Changes"). Illustrative lifestyle modeling only — not an individualized clinical prognosis.',
  })
}

export interface NeonOutboxEvent {
  readonly eventId: string
  readonly profileKey: string
  readonly entityType: 'panacea_profiles' | 'panacea_gta_character_state' | 'panacea_digital_twin_snapshots' | 'panacea_fascia_kinetic_assessments'
  readonly idempotencyKey: string
  readonly payloadJson: Readonly<Record<string, unknown>>
  readonly status: 'pending'
  readonly createdAtIso: string
}

export function buildNeonOutboxEvent(params: {
  readonly profileKey: string
  readonly entityType: NeonOutboxEvent['entityType']
  readonly payload: Readonly<Record<string, unknown>>
  readonly createdAtIso: string
}): NeonOutboxEvent {
  const cleanKey = sanitizeToken(params.profileKey, 'rizkyazhar486')
  const digest = deterministicChecksumHex(`${cleanKey}|${params.entityType}|${JSON.stringify(params.payload)}|${params.createdAtIso}`)
  return Object.freeze({
    eventId: `NEON-${digest}`,
    profileKey: cleanKey,
    entityType: params.entityType,
    idempotencyKey: `${cleanKey}:${params.entityType}:${digest}`,
    payloadJson: Object.freeze({ ...params.payload }),
    status: 'pending',
    createdAtIso: params.createdAtIso,
  })
}
