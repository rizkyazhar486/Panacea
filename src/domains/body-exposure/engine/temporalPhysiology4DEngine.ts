// Pure textbook-grounded 4D temporal physiology (24-hour circadian coupled oscillators,
// 0-100 year developmental & aging lifespan reference curves) and Newtonian inverse-dynamics
// musculoskeletal joint-force solver (elbow flexion, patellofemoral squat, lumbar L4-L5 compression).
// Zero patient-specific biometric fabrication; strictly EDUCATIONAL_REFERENCE_MODEL.

export const TEMPORAL_4D_BOUNDARY = {
  truthClass: 'EDUCATIONAL_REFERENCE_MODEL' as const,
  patientSpecificDiagnosis: false,
  note: 'Textbook population reference curves (Fleming Lancet 2011 pediatric HR, Tanaka JACC 2001 HRmax, cosinor circadian oscillators, and Newtonian static equilibrium). Not an individual clinical measurement or ergonomic clearance.',
} as const

export interface Circadian24hSnapshot {
  readonly hour: number
  readonly melatoninPgMl: number
  readonly cortisolUgDl: number
  readonly coreTempC: number
  readonly restingHrBpm: number
  readonly gfrMlMin: number
  readonly phaseLabel: string
}

export type LifespanStageId = 'infant' | 'child' | 'adolescent' | 'adult' | 'midlife' | 'elder'

export interface LifespanStageSpec {
  readonly id: LifespanStageId
  readonly label: string
  readonly defaultAgeYears: number
  readonly rangeLabel: string
  readonly physiologicalFocus: string
}

export const LIFESPAN_STAGES: readonly LifespanStageSpec[] = [
  { id: 'infant', label: 'Infant', defaultAgeYears: 0.5, rangeLabel: '0–2 y', physiologicalFocus: 'High metabolic rate, rapid renal GFR & alveolar maturation, high baseline HR.' },
  { id: 'child', label: 'Child', defaultAgeYears: 8, rangeLabel: '3–12 y', physiologicalFocus: 'Skeletal growth plates active, neurodevelopmental synaptogenesis & rising lung volumes.' },
  { id: 'adolescent', label: 'Adolescent', defaultAgeYears: 16, rangeLabel: '13–19 y', physiologicalFocus: 'Peak bone accrual acceleration, endocrine maturation & circadian phase delay.' },
  { id: 'adult', label: 'Adult', defaultAgeYears: 30, rangeLabel: '20–45 y', physiologicalFocus: 'Peak cortical bone mass, maximal FEV1/FVC reserve & stable baseline eGFR.' },
  { id: 'midlife', label: 'Midlife', defaultAgeYears: 55, rangeLabel: '46–64 y', physiologicalFocus: 'Gradual arterial stiffness rise, ~0.85 mL/min/yr eGFR drift & sarcopenia prevention window.' },
  { id: 'elder', label: 'Elder', defaultAgeYears: 80, rangeLabel: '65–100 y', physiologicalFocus: 'Reduced baroreflex reserve, lower Tanaka HRmax, bone/muscle preservation & polypharmacy caution.' },
] as const

export interface LifespanPhysiologySnapshot {
  readonly ageYears: number
  readonly stage: LifespanStageSpec
  readonly restingHrBpm: number
  readonly maxHrBpm: number
  readonly gfrMlMin: number
  readonly boneDensityPctPeak: number
  readonly fev1PctPeak: number
}

export interface InverseDynamicsInput {
  readonly bodyMassKg: number
  readonly externalLoadKg: number
  readonly elbowFlexionDeg: number
  readonly kneeFlexionDeg: number
  readonly trunkFlexionDeg: number
}

export interface InverseDynamicsResult {
  readonly elbowTorqueNm: number
  readonly bicepsForceN: number
  readonly patellofemoralBw: number
  readonly patellofemoralN: number
  readonly lumbarMomentNm: number
  readonly erectorSpinaeN: number
  readonly l4l5CompressionN: number
  readonly l4l5LoadBand: 'LOW' | 'MODERATE' | 'ELEVATED_NIOSH_LIMIT'
}

export function evaluateCircadian24h(hour: number): Circadian24hSnapshot {
  const h = ((hour % 24) + 24) % 24
  const rad = (2 * Math.PI) / 24
  const melPhase = Math.cos(rad * (h - 2.5))
  const melatoninPgMl = Math.round(Math.max(2, 2 + 68 * Math.pow(Math.max(0, melPhase), 2.4)) * 10) / 10
  const cortisolUgDl = Math.round((10.2 + 7.4 * Math.cos(rad * (h - 7.5)) + 1.4 * Math.cos(2 * rad * (h - 7.5))) * 10) / 10
  const coreTempC = Math.round((36.85 + 0.40 * Math.cos(rad * (h - 17.5))) * 100) / 100
  const restingHrBpm = Math.round((64 + 5.5 * Math.cos(rad * (h - 15.5))) * 10) / 10
  const gfrMlMin = Math.round((98 + 10 * Math.cos(rad * (h - 14.0))) * 10) / 10
  const phaseLabel =
    h < 5.5 ? 'Nocturnal melatonin peak & vagal recovery'
      : h < 10.5 ? 'Cortisol awakening response (CAR)'
        : h < 17 ? 'Daytime metabolic & renal filtration peak'
          : h < 21.5 ? 'Evening core-temperature & motor peak'
            : 'Dim-light melatonin onset (DLMO)'
  return { hour: Math.round(h * 10) / 10, melatoninPgMl, cortisolUgDl, coreTempC, restingHrBpm, gfrMlMin, phaseLabel }
}

export function sampleCircadianDayCurve(): readonly Circadian24hSnapshot[] {
  return Array.from({ length: 25 }, (_, i) => evaluateCircadian24h(i))
}

export function resolveLifespanStage(ageYears: number): LifespanStageSpec {
  const age = Math.max(0, Math.min(100, ageYears))
  if (age < 3) return LIFESPAN_STAGES[0]!
  if (age < 13) return LIFESPAN_STAGES[1]!
  if (age < 20) return LIFESPAN_STAGES[2]!
  if (age < 46) return LIFESPAN_STAGES[3]!
  if (age < 65) return LIFESPAN_STAGES[4]!
  return LIFESPAN_STAGES[5]!
}

export function evaluateLifespanAge(ageYears: number): LifespanPhysiologySnapshot {
  const age = Math.max(0, Math.min(100, ageYears))
  const restingHrBpm = age < 1
    ? Math.round((135 - age * 15) * 10) / 10
    : age < 18
      ? Math.round((68 + 58 * Math.exp(-age / 5.2)) * 10) / 10
      : Math.round((68 + 0.05 * Math.max(0, age - 40)) * 10) / 10
  const maxHrBpm = Math.round((208 - 0.7 * age) * 10) / 10
  const gfrMlMin = age < 2
    ? Math.round((42 + 68 * (1 - Math.exp(-age * 2.2))) * 10) / 10
    : Math.round(Math.max(45, 112 - Math.max(0, age - 40) * 0.85) * 10) / 10
  const boneDensityPctPeak = age <= 28
    ? Math.round((42 + 58 * Math.pow(age / 28, 0.72)) * 10) / 10
    : Math.round(Math.max(58, 100 - Math.max(0, age - 35) * 0.58) * 10) / 10
  const fev1PctPeak = age <= 25
    ? Math.round((12 + 88 * Math.pow(age / 25, 0.85)) * 10) / 10
    : Math.round(Math.max(52, 100 - (age - 25) * 0.62) * 10) / 10
  return {
    ageYears: Math.round(age * 10) / 10,
    stage: resolveLifespanStage(age),
    restingHrBpm,
    maxHrBpm,
    gfrMlMin,
    boneDensityPctPeak,
    fev1PctPeak,
  }
}

export function solveInverseDynamics(input: InverseDynamicsInput): InverseDynamicsResult {
  const g = 9.80665
  const bodyMassKg = Math.max(25, Math.min(180, input.bodyMassKg))
  const externalLoadKg = Math.max(0, Math.min(80, input.externalLoadKg))
  const elbowDeg = Math.max(0, Math.min(145, input.elbowFlexionDeg))
  const kneeDeg = Math.max(0, Math.min(130, input.kneeFlexionDeg))
  const trunkDeg = Math.max(0, Math.min(90, input.trunkFlexionDeg))

  const forearmMassKg = bodyMassKg * 0.022
  const radElbow = (elbowDeg * Math.PI) / 180
  const elbowTorqueNm = (forearmMassKg * g * 0.16 + externalLoadKg * g * 0.34) * Math.sin(radElbow)
  const bicepsForceN = elbowTorqueNm / 0.045

  const radKnee = (kneeDeg * Math.PI) / 180
  const patellofemoralBw = Math.round((0.5 + 3.4 * Math.pow(Math.sin(radKnee * 0.65), 1.35)) * 100) / 100
  const patellofemoralN = patellofemoralBw * bodyMassKg * g

  const radTrunk = (trunkDeg * Math.PI) / 180
  const upperMassKg = bodyMassKg * 0.52
  const lumbarMomentNm = (upperMassKg * g * 0.28 + externalLoadKg * g * 0.42) * Math.sin(radTrunk)
  const erectorSpinaeN = lumbarMomentNm / 0.055
  const l4l5CompressionN = (upperMassKg + externalLoadKg) * g * Math.cos(radTrunk) + erectorSpinaeN
  const l4l5LoadBand: InverseDynamicsResult['l4l5LoadBand'] =
    l4l5CompressionN >= 3400 ? 'ELEVATED_NIOSH_LIMIT' : l4l5CompressionN >= 1800 ? 'MODERATE' : 'LOW'

  return {
    elbowTorqueNm: Math.round(elbowTorqueNm * 10) / 10,
    bicepsForceN: Math.round(bicepsForceN),
    patellofemoralBw,
    patellofemoralN: Math.round(patellofemoralN),
    lumbarMomentNm: Math.round(lumbarMomentNm * 10) / 10,
    erectorSpinaeN: Math.round(erectorSpinaeN),
    l4l5CompressionN: Math.round(l4l5CompressionN),
    l4l5LoadBand,
  }
}
