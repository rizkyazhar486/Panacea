/**
 * Pure deterministic Shenzhen Museum-Grade Biomedical CAD/CAE &
 * AAA Target Archetype (FIFA / NBA 2K 6-Attribute) Engine.
 *
 * Domain Purity Invariant:
 * - Zero DOM, storage, clock, RNG, or network calls.
 * - Explicit `truthClass` on every derived/simulated output (`clinicallyReviewed: false`).
 * - Never fabricates clinical diagnoses or surgical prescriptions.
 */

export type CadCaeTruthClass = 'measured' | 'estimated' | 'simulated' | 'curated_physiology'

export type TargetArchetypeId =
  | 'hybrid_endurance'
  | 'explosive_sprinter'
  | 'longevity_lean'
  | 'metabolic_strength'
  | 'clinical_baseline'

export interface ParametricCadInput {
  readonly heightCm: number
  readonly weightKg: number
  readonly bodyFatPct?: number | null
  readonly waistCm?: number | null
  readonly chestCm?: number | null
  readonly hipCm?: number | null
  readonly thighCm?: number | null
  readonly calfCm?: number | null
  readonly neckCm?: number | null
  readonly plantarArchAngleDeg?: number | null
  readonly thoracicKyphosisDeg?: number | null
  readonly craniofacialIndex?: number | null
}

export interface ParametricCadGeometry {
  readonly ok: true
  readonly truthClass: 'estimated' | 'simulated'
  readonly clinicallyReviewed: false
  readonly anthropometry: {
    readonly heightCm: number
    readonly weightKg: number
    readonly bmi: number
    readonly bodyFatPct: number
    readonly waistCm: number
    readonly chestCm: number
    readonly hipCm: number
    readonly thighCm: number
    readonly calfCm: number
    readonly neckCm: number
  }
  readonly proportions: {
    readonly armSpanToHeightRatio: number
    readonly legToTorsoRatio: number
    readonly shoulderToWaistRatio: number
    readonly waistToHeightRatio: number
    readonly craniofacialIndex: number
    readonly plantarArchAngleDeg: number
    readonly thoracicKyphosisDeg: number
  }
  readonly zAnatomyScaleVector: {
    readonly x: number
    readonly y: number
    readonly z: number
  }
  readonly gltfMorphTargets: Readonly<Record<string, number>>
  readonly epistemicNotice: string
}

export type ParametricCadResult =
  | ParametricCadGeometry
  | { readonly ok: false; readonly error: string }

export interface BiomechanicalCaeInput {
  readonly cad: ParametricCadGeometry
  readonly gaitSpeedMps?: number | null
  readonly restingSystolicMmHg?: number | null
  readonly restingHrBpm?: number | null
  readonly postureAlignment01?: number | null
}

export interface FasciaNodeTension {
  readonly rank: 1 | 2 | 3 | 4 | 5 | 6 | 7
  readonly id: string
  readonly label: string
  readonly stressIndexPct: number
}

export interface BiomechanicalCaeResult {
  readonly ok: true
  readonly truthClass: 'simulated'
  readonly clinicallyReviewed: false
  readonly jointCompressiveLoad: {
    readonly kneeCompressionBw: number
    readonly hipCompressionBw: number
    readonly lumbarShearRatio: number
  }
  readonly plantarTripodStress: {
    readonly heelPct: number
    readonly firstMtpPct: number
    readonly fifthMtpPct: number
    readonly peakStressKpa: number
  }
  readonly superficialFrontLineTension: readonly FasciaNodeTension[]
  readonly vascularWallShearPa: number
  readonly epistemicNotice: string
}

export interface ArchetypeCurrentMetrics {
  readonly vo2max?: number | null
  readonly hrvMs?: number | null
  readonly sleepHours?: number | null
  readonly restingHrBpm?: number | null
  readonly skeletalMusclePct?: number | null
  readonly bodyFatPct?: number | null
  readonly cognitiveScore0100?: number | null
  readonly biologicalAgeDeltaYears?: number | null
}

export interface FifaSixAttributes {
  readonly ovr: number
  readonly vo2: number
  readonly rec: number
  readonly str: number
  readonly cog: number
  readonly bio: number
}

export interface TargetArchetypePreset {
  readonly id: TargetArchetypeId
  readonly label: string
  readonly tag: string
  readonly targetBodyFatPct: number
  readonly targetAttributes: FifaSixAttributes
}

export interface ArchetypeComparisonResult {
  readonly archetype: TargetArchetypePreset
  readonly current: FifaSixAttributes
  readonly target: FifaSixAttributes
  readonly deltas: FifaSixAttributes
  readonly observedInputCount: number
  readonly truthClass: 'estimated' | 'simulated'
  readonly clinicallyReviewed: false
  readonly epistemicNotice: string
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
const round = (v: number, d = 2): number => Number(v.toFixed(d))
const isFiniteIn = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

export const TARGET_ARCHETYPES: readonly TargetArchetypePreset[] = Object.freeze([
  {
    id: 'hybrid_endurance',
    label: 'Hybrid Endurance',
    tag: 'VO2 + Strength',
    targetBodyFatPct: 12.5,
    targetAttributes: { ovr: 89, vo2: 92, rec: 88, str: 84, cog: 88, bio: 91 },
  },
  {
    id: 'explosive_sprinter',
    label: 'Explosive Sprinter',
    tag: 'Power + Recoil',
    targetBodyFatPct: 10.5,
    targetAttributes: { ovr: 88, vo2: 84, rec: 85, str: 94, cog: 86, bio: 89 },
  },
  {
    id: 'longevity_lean',
    label: 'Longevity Lean',
    tag: 'Healthspan Peak',
    targetBodyFatPct: 13.5,
    targetAttributes: { ovr: 91, vo2: 88, rec: 93, str: 82, cog: 93, bio: 96 },
  },
  {
    id: 'metabolic_strength',
    label: 'Metabolic Strength',
    tag: 'Lean Mass',
    targetBodyFatPct: 14.0,
    targetAttributes: { ovr: 87, vo2: 80, rec: 84, str: 95, cog: 85, bio: 88 },
  },
  {
    id: 'clinical_baseline',
    label: 'Balanced Clinical Baseline',
    tag: 'Nominal Health',
    targetBodyFatPct: 17.5,
    targetAttributes: { ovr: 82, vo2: 78, rec: 82, str: 78, cog: 84, bio: 85 },
  },
])

export function buildParametricAnatomicalCad(input: ParametricCadInput): ParametricCadResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'CAD input must be an object.' }
  }
  if (!isFiniteIn(input.heightCm, 90, 245) || !isFiniteIn(input.weightKg, 22, 350)) {
    return { ok: false, error: 'heightCm [90..245] and weightKg [22..350] must be finite physical values.' }
  }

  const hM = input.heightCm / 100
  const bmi = round(input.weightKg / (hM * hM), 1)
  const measuredCircumferences = [
    input.waistCm,
    input.chestCm,
    input.hipCm,
    input.thighCm,
    input.calfCm,
    input.neckCm,
  ].filter((v) => isFiniteIn(v, 15, 220)).length

  const bodyFatPct = isFiniteIn(input.bodyFatPct, 3, 65)
    ? round(input.bodyFatPct, 1)
    : round(clamp(1.2 * bmi - 10.8, 7, 45), 1)

  // Allometric reference estimates only when user circumferences are omitted
  const waistCm = isFiniteIn(input.waistCm, 40, 200) ? round(input.waistCm, 1) : round(clamp(input.heightCm * 0.45 + (bmi - 22) * 1.9, 55, 165), 1)
  const chestCm = isFiniteIn(input.chestCm, 50, 200) ? round(input.chestCm, 1) : round(clamp(waistCm * 1.19 + (22 - bodyFatPct) * 0.35, 68, 175), 1)
  const hipCm = isFiniteIn(input.hipCm, 50, 210) ? round(input.hipCm, 1) : round(clamp(waistCm * 1.15, 70, 180), 1)
  const thighCm = isFiniteIn(input.thighCm, 25, 120) ? round(input.thighCm, 1) : round(clamp(hipCm * 0.57, 36, 95), 1)
  const calfCm = isFiniteIn(input.calfCm, 18, 80) ? round(input.calfCm, 1) : round(clamp(thighCm * 0.66, 26, 62), 1)
  const neckCm = isFiniteIn(input.neckCm, 20, 70) ? round(input.neckCm, 1) : round(clamp(waistCm * 0.46, 28, 56), 1)

  const plantarArchAngleDeg = isFiniteIn(input.plantarArchAngleDeg, 5, 45) ? round(input.plantarArchAngleDeg, 1) : 21.5
  const thoracicKyphosisDeg = isFiniteIn(input.thoracicKyphosisDeg, 10, 75) ? round(input.thoracicKyphosisDeg, 1) : 32.0
  const craniofacialIndex = isFiniteIn(input.craniofacialIndex, 0.65, 1.05) ? round(input.craniofacialIndex, 3) : 0.84

  const shoulderToWaistRatio = round(clamp((chestCm * 1.16) / Math.max(waistCm, 40), 0.95, 1.85), 2)
  const waistToHeightRatio = round(waistCm / input.heightCm, 3)

  // Normalized Z-Anatomy reference rig scale (canonical 173 cm / 68 kg = 1.00)
  const scaleY = round(clamp(input.heightCm / 173, 0.62, 1.38), 3)
  const lateralFactor = Math.sqrt(clamp((input.weightKg / 68) / Math.max(scaleY, 0.5), 0.55, 1.85))
  const scaleX = round(clamp(lateralFactor * (0.94 + (shoulderToWaistRatio - 1.2) * 0.14), 0.72, 1.45), 3)
  const scaleZ = round(clamp(lateralFactor * (0.92 + (bodyFatPct - 16) * 0.008), 0.72, 1.48), 3)

  const truthClass: 'estimated' | 'simulated' = measuredCircumferences >= 2 ? 'estimated' : 'simulated'

  return {
    ok: true,
    truthClass,
    clinicallyReviewed: false,
    anthropometry: {
      heightCm: round(input.heightCm, 1),
      weightKg: round(input.weightKg, 1),
      bmi,
      bodyFatPct,
      waistCm,
      chestCm,
      hipCm,
      thighCm,
      calfCm,
      neckCm,
    },
    proportions: {
      armSpanToHeightRatio: 1.01,
      legToTorsoRatio: 0.96,
      shoulderToWaistRatio,
      waistToHeightRatio,
      craniofacialIndex,
      plantarArchAngleDeg,
      thoracicKyphosisDeg,
    },
    zAnatomyScaleVector: { x: scaleX, y: scaleY, z: scaleZ },
    gltfMorphTargets: Object.freeze({
      torso_volume: round(clamp((bmi - 18) / 18, 0, 1), 3),
      adiposity_index: round(clamp((bodyFatPct - 6) / 36, 0, 1), 3),
      shoulder_breadth: round(clamp((shoulderToWaistRatio - 1.0) / 0.6, 0, 1), 3),
      thoracic_curve: round(clamp((thoracicKyphosisDeg - 18) / 42, 0, 1), 3),
      plantar_arch_lift: round(clamp((plantarArchAngleDeg - 10) / 22, 0, 1), 3),
    }),
    epistemicNotice:
      'Parametric anatomical CAD model derived from anthropometry for educational 3D visualization. Not a medical CT/MRI or diagnostic scan.',
  }
}

export function evaluateBiomechanicalCae(input: BiomechanicalCaeInput): BiomechanicalCaeResult {
  const { cad } = input
  const gaitMps = isFiniteIn(input.gaitSpeedMps, 0.3, 9.5) ? input.gaitSpeedMps : 1.35
  const sbp = isFiniteIn(input.restingSystolicMmHg, 75, 220) ? input.restingSystolicMmHg : 118
  const hr = isFiniteIn(input.restingHrBpm, 35, 190) ? input.restingHrBpm : 64
  const posture = isFiniteIn(input.postureAlignment01, 0, 1) ? input.postureAlignment01 : 0.74

  const speedFactor = 1 + Math.max(0, gaitMps - 1.2) * 0.42
  const archPenalty = clamp((22 - cad.proportions.plantarArchAngleDeg) * 0.025, -0.1, 0.35)
  const kyphosisPenalty = clamp((cad.proportions.thoracicKyphosisDeg - 30) * 0.014, -0.05, 0.38)
  const bmiLoadFactor = clamp(cad.anthropometry.bmi / 22.5, 0.75, 1.75)

  // Finite-element-inspired normalized joint compressive load multiples of body weight (BW)
  const kneeCompressionBw = round(clamp(2.4 * speedFactor * (1 + archPenalty) * (0.85 + 0.15 * bmiLoadFactor), 1.4, 7.8), 2)
  const hipCompressionBw = round(clamp(2.7 * speedFactor * (1 + archPenalty * 0.6) * (0.88 + 0.12 * bmiLoadFactor), 1.6, 8.2), 2)
  const lumbarShearRatio = round(clamp(0.42 + kyphosisPenalty + (1 - posture) * 0.35 + (bmiLoadFactor - 1) * 0.22, 0.2, 1.85), 2)

  // Plantar tripod pressure share (sums deterministically to 100%)
  const archNorm = clamp((cad.proportions.plantarArchAngleDeg - 10) / 22, 0, 1)
  const heelPct = Math.round(clamp(54 - archNorm * 8, 38, 62))
  const firstMtpPct = Math.round(clamp(26 + archNorm * 9, 20, 40))
  const fifthMtpPct = 100 - heelPct - firstMtpPct
  const peakStressKpa = round(clamp(165 + cad.anthropometry.weightKg * 1.45 * speedFactor * (1 + archPenalty), 120, 740), 1)

  const tensionBase = clamp(1 - posture + kyphosisPenalty * 0.6 + archPenalty * 0.5, 0.08, 0.92)
  const superficialFrontLineTension: readonly FasciaNodeTension[] = Object.freeze([
    { rank: 1, id: 'scm', label: 'Sternocleidomastoid', stressIndexPct: Math.round(clamp(26 + tensionBase * 62, 15, 95)) },
    { rank: 2, id: 'sternalis', label: 'Sternalis & Pectoral Fascia', stressIndexPct: Math.round(clamp(22 + tensionBase * 55, 15, 92)) },
    { rank: 3, id: 'rectus_abdominis', label: 'Rectus Abdominis', stressIndexPct: Math.round(clamp(24 + tensionBase * 48, 15, 90)) },
    { rank: 4, id: 'rectus_femoris', label: 'Rectus Femoris / Hip Flexor', stressIndexPct: Math.round(clamp(28 + tensionBase * 58, 18, 94)) },
    { rank: 5, id: 'patellar_tendon', label: 'Patellar Retinaculum', stressIndexPct: Math.round(clamp(25 + tensionBase * 54, 16, 94)) },
    { rank: 6, id: 'tibialis_anterior', label: 'Tibialis Anterior', stressIndexPct: Math.round(clamp(22 + tensionBase * 52, 15, 92)) },
    { rank: 7, id: 'plantar_aponeurosis', label: 'Plantar Arch Tripod', stressIndexPct: Math.round(clamp(27 + (tensionBase + archPenalty) * 56, 18, 96)) },
  ])

  // Simplified Poiseuille-inspired arterial wall-shear proxy (Pa; physiological nominal ~1.2–2.2 Pa)
  const vascularWallShearPa = round(clamp(1.15 + ((sbp - 105) / 110) * 0.72 + ((hr - 55) / 100) * 0.48, 0.65, 3.6), 2)

  return {
    ok: true,
    truthClass: 'simulated',
    clinicallyReviewed: false,
    jointCompressiveLoad: {
      kneeCompressionBw,
      hipCompressionBw,
      lumbarShearRatio,
    },
    plantarTripodStress: {
      heelPct,
      firstMtpPct,
      fifthMtpPct,
      peakStressKpa,
    },
    superficialFrontLineTension,
    vascularWallShearPa,
    epistemicNotice:
      'Simplified deterministic CAE mechanical stress proxy (truthClass=simulated). Educational biomechanics model; not finite-element clinical diagnostics.',
  }
}

export function evaluateArchetypeComparison(
  metrics: ArchetypeCurrentMetrics,
  archetypeId: TargetArchetypeId,
): ArchetypeComparisonResult {
  const archetype = TARGET_ARCHETYPES.find((a) => a.id === archetypeId) ?? TARGET_ARCHETYPES[0]
  const observedInputCount = [
    metrics.vo2max,
    metrics.hrvMs,
    metrics.sleepHours,
    metrics.restingHrBpm,
    metrics.skeletalMusclePct,
    metrics.bodyFatPct,
    metrics.cognitiveScore0100,
  ].filter((v) => typeof v === 'number' && Number.isFinite(v)).length

  const vo2Val = isFiniteIn(metrics.vo2max, 15, 90) ? metrics.vo2max : 42
  const hrvVal = isFiniteIn(metrics.hrvMs, 10, 220) ? metrics.hrvMs : 55
  const sleepVal = isFiniteIn(metrics.sleepHours, 2, 14) ? metrics.sleepHours : 7.0
  const rhrVal = isFiniteIn(metrics.restingHrBpm, 35, 140) ? metrics.restingHrBpm : 64
  const smmPct = isFiniteIn(metrics.skeletalMusclePct, 20, 65) ? metrics.skeletalMusclePct : 41
  const bfPct = isFiniteIn(metrics.bodyFatPct, 4, 55) ? metrics.bodyFatPct : 17
  const cogScore = isFiniteIn(metrics.cognitiveScore0100, 10, 100) ? metrics.cognitiveScore0100 : 76
  const bioDelta = isFiniteIn(metrics.biologicalAgeDeltaYears, -15, 20) ? metrics.biologicalAgeDeltaYears : 0.8

  const vo2 = Math.round(clamp(32 + (vo2Val - 22) * 1.45, 40, 99))
  const rec = Math.round(clamp(38 + (hrvVal - 20) * 0.42 + (sleepVal - 5.5) * 7.5 + (72 - rhrVal) * 0.4, 40, 99))
  const str = Math.round(clamp(44 + (smmPct - 30) * 2.1 - Math.max(0, bfPct - 18) * 0.8, 40, 99))
  const cog = Math.round(clamp(cogScore, 40, 99))
  const bio = Math.round(clamp(82 - bioDelta * 3.8 - Math.max(0, bfPct - 20) * 0.7, 40, 99))
  const ovr = Math.round(clamp(vo2 * 0.22 + rec * 0.22 + str * 0.18 + cog * 0.18 + bio * 0.2, 40, 99))

  const current: FifaSixAttributes = { ovr, vo2, rec, str, cog, bio }
  const target = archetype.targetAttributes
  const deltas: FifaSixAttributes = {
    ovr: target.ovr - current.ovr,
    vo2: target.vo2 - current.vo2,
    rec: target.rec - current.rec,
    str: target.str - current.str,
    cog: target.cog - current.cog,
    bio: target.bio - current.bio,
  }

  return {
    archetype,
    current,
    target,
    deltas,
    observedInputCount,
    truthClass: observedInputCount >= 3 ? 'estimated' : 'simulated',
    clinicallyReviewed: false,
    epistemicNotice:
      'Gamified 6-attribute physiological archetype comparison (OVR/VO2/REC/STR/COG/BIO). Educational goal planning only; not clinically validated.',
  }
}
