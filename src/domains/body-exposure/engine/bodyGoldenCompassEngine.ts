import type { BodySystemId } from '../data/bodySystems.ts'

// Golden Compass: satu grafik radar enam sumbu untuk BODY. Dua besaran saja, keduanya jujur:
// 1) cakupan data tercatat per sumbu (berapa sinyal yang benar-benar ada), dan
// 2) rencana kebiasaan pengguna dibanding target pedoman yang bersumber.
// Sengaja TIDAK ada skor kesehatan, komposit, atau proyeksi "+5 tahun": tanpa model tervalidasi
// angka seperti itu adalah karangan (CLAUDE.md §8).

export type CompassPipelineStageId =
  | 'collect'
  | 'process'
  | 'interpret'
  | 'specialize'
  | 'coupling'
  | 'visualize'
  | 'simulate'

export type CompassAxisId =
  | 'cardiovascular'
  | 'metabolic'
  | 'neuro-recovery'
  | 'respiratory-vo2'
  | 'biomechanics-strength'
  | 'cellular-longevity'

export type Sim4DProjectionMode = 'live' | 'exercise' | 'future-optimal' | 'future-sedentary'

export type CompassSignalId =
  | 'restingHr'
  | 'systolic'
  | 'diastolic'
  | 'spo2'
  | 'sleep'
  | 'water'
  | 'weight'
  | 'height'
  | 'vo2max'
  | 'labs'

export type GuidelineTargetId = 'aerobic' | 'strength' | 'sleep'

export interface CanonicalBodyInputs {
  restingHrBpm?: number | null
  systolicMmHg?: number | null
  diastolicMmHg?: number | null
  spo2Pct?: number | null
  sleepHours?: number | null
  waterMl?: number | null
  weightKg?: number | null
  heightCm?: number | null
  vo2Max?: number | null
  labRecordCount?: number | null
}

/** Rencana kebiasaan mingguan yang diuji pengguna (bukan data terukur). */
export interface WhatIfActivityProfile {
  sleepHoursPerNight: number
  aerobicMinPerWeek: number
  strengthDaysPerWeek: number
}

export interface GuidelineTarget {
  id: GuidelineTargetId
  label: string
  unit: string
  minimum: number
  source: string
}

export interface CompassPipelineStageSpec {
  id: CompassPipelineStageId
  index: string
  shortLabel: string
  title: string
  summary: string
}

export interface CompassAxisResult {
  id: CompassAxisId
  label: string
  shortLabel: string
  systemId: BodySystemId
  expectedSignals: readonly CompassSignalId[]
  observedSignals: number
  coveragePct: number
  targets: readonly GuidelineTargetId[]
  planAttainmentPct: number
}

export interface CompassTargetResult {
  id: GuidelineTargetId
  label: string
  planValue: number
  minimum: number
  unit: string
  met: boolean
  attainmentPct: number
  source: string
  targetSystemIds: readonly BodySystemId[]
}

export interface CompassProcessedTelemetry {
  observedCount: number
  totalSignals: number
  completenessPct: number
  bmi: number | null
  mapMmHg: number | null
  pulsePressureMmHg: number | null
}

export interface BodyGoldenCompassEvaluation {
  axes: readonly CompassAxisResult[]
  targets: readonly CompassTargetResult[]
  processed: CompassProcessedTelemetry
  targetsMet: number
  recommendedSim4DMode: Sim4DProjectionMode
  truthClass: 'recorded-coverage-and-plan-comparison'
  clinicallyReviewed: false
  epistemicNotice: string
}

// Target diverifikasi dari halaman sumber primer pada 2026-11-27.
export const GUIDELINE_TARGETS: Readonly<Record<GuidelineTargetId, GuidelineTarget>> = Object.freeze({
  aerobic: Object.freeze({
    id: 'aerobic',
    label: 'Moderate aerobic activity',
    unit: 'min/week',
    minimum: 150,
    source: 'Physical Activity Guidelines for Americans (adults), via CDC',
  }),
  strength: Object.freeze({
    id: 'strength',
    label: 'Muscle-strengthening',
    unit: 'days/week',
    minimum: 2,
    source: 'Physical Activity Guidelines for Americans (adults), via CDC',
  }),
  sleep: Object.freeze({
    id: 'sleep',
    label: 'Sleep',
    unit: 'h/night',
    minimum: 7,
    source: 'Watson et al., AASM/SRS consensus, Sleep 2015;38(6):843-844 (adults 18-60)',
  }),
})

const TARGET_SYSTEMS: Readonly<Record<GuidelineTargetId, readonly BodySystemId[]>> = Object.freeze({
  aerobic: Object.freeze(['cardiovascular', 'respiratory'] as BodySystemId[]),
  strength: Object.freeze(['musculoskeletal'] as BodySystemId[]),
  sleep: Object.freeze(['nervous'] as BodySystemId[]),
})

export const COMPASS_PIPELINE_STAGES: readonly CompassPipelineStageSpec[] = Object.freeze([
  Object.freeze({
    id: 'collect',
    index: '01',
    shortLabel: 'Collect',
    title: 'Recorded vitals & body data',
    summary: 'Gathers what you have recorded. Missing signals stay empty; nothing is guessed.',
  }),
  Object.freeze({
    id: 'process',
    index: '02',
    shortLabel: 'Process',
    title: 'Derived indices',
    summary: 'BMI, mean arterial pressure and pulse pressure, computed only when both inputs exist.',
  }),
  Object.freeze({
    id: 'interpret',
    index: '03',
    shortLabel: 'Coverage',
    title: 'Coverage per body system',
    summary: 'Shows which signals each system has. Coverage is how much is known, not how healthy you are.',
  }),
  Object.freeze({
    id: 'specialize',
    index: '04',
    shortLabel: 'Specialize',
    title: 'Selected structure',
    summary: 'Ties the 3D structure you tapped to its reference education.',
  }),
  Object.freeze({
    id: 'coupling',
    index: '05',
    shortLabel: 'Targets',
    title: 'Habits linked to body systems',
    summary: 'Each habit target, its source, and the system it is linked to in reference physiology.',
  }),
  Object.freeze({
    id: 'visualize',
    index: '06',
    shortLabel: 'Chart',
    title: 'One compass, paired with the 3D body',
    summary: 'One radar chart: recorded coverage and your plan against guideline targets.',
  }),
  Object.freeze({
    id: 'simulate',
    index: '07',
    shortLabel: 'What-If',
    title: 'Plan vs guideline',
    summary: 'Try a weekly plan and see which published minimums it meets. Not a prediction of outcomes.',
  }),
])

export const DEFAULT_WHAT_IF_PROFILE: WhatIfActivityProfile = Object.freeze({
  sleepHoursPerNight: GUIDELINE_TARGETS.sleep.minimum,
  aerobicMinPerWeek: GUIDELINE_TARGETS.aerobic.minimum,
  strengthDaysPerWeek: GUIDELINE_TARGETS.strength.minimum,
})

export const WHAT_IF_PRESETS: Readonly<Record<'guideline' | 'below', WhatIfActivityProfile>> = Object.freeze({
  guideline: DEFAULT_WHAT_IF_PROFILE,
  below: Object.freeze({ sleepHoursPerNight: 6, aerobicMinPerWeek: 60, strengthDaysPerWeek: 0 }),
})

const AXIS_SPECS: ReadonlyArray<{
  id: CompassAxisId
  label: string
  shortLabel: string
  systemId: BodySystemId
  expectedSignals: readonly CompassSignalId[]
  targets: readonly GuidelineTargetId[]
}> = Object.freeze([
  { id: 'cardiovascular', label: 'Cardiovascular', shortLabel: 'Cardio', systemId: 'cardiovascular', expectedSignals: ['restingHr', 'systolic', 'diastolic'], targets: ['aerobic'] },
  { id: 'metabolic', label: 'Metabolic & body composition', shortLabel: 'Metabolic', systemId: 'endocrine', expectedSignals: ['weight', 'height', 'water'], targets: ['aerobic', 'strength'] },
  { id: 'neuro-recovery', label: 'Sleep & recovery', shortLabel: 'Neuro', systemId: 'nervous', expectedSignals: ['sleep', 'restingHr'], targets: ['sleep'] },
  { id: 'respiratory-vo2', label: 'Respiratory & VO2', shortLabel: 'Lung/VO2', systemId: 'respiratory', expectedSignals: ['spo2', 'vo2max'], targets: ['aerobic'] },
  { id: 'biomechanics-strength', label: 'Musculoskeletal', shortLabel: 'Biomech', systemId: 'musculoskeletal', expectedSignals: ['weight', 'height'], targets: ['strength'] },
  { id: 'cellular-longevity', label: 'Labs & long-term', shortLabel: 'Labs', systemId: 'lymphatic-immune', expectedSignals: ['labs', 'sleep', 'vo2max'], targets: ['sleep', 'aerobic'] },
])

function finitePos(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Nilai rencana yang tidak berhingga/negatif dianggap 0, bukan tebakan. */
function planValue(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function evaluateBodyGoldenCompass(
  inputs: CanonicalBodyInputs,
  plan: WhatIfActivityProfile = DEFAULT_WHAT_IF_PROFILE,
): BodyGoldenCompassEvaluation {
  const signals: Record<CompassSignalId, number | null> = {
    restingHr: finitePos(inputs.restingHrBpm),
    systolic: finitePos(inputs.systolicMmHg),
    diastolic: finitePos(inputs.diastolicMmHg),
    spo2: finitePos(inputs.spo2Pct),
    sleep: finitePos(inputs.sleepHours),
    water: finitePos(inputs.waterMl),
    weight: finitePos(inputs.weightKg),
    height: finitePos(inputs.heightCm),
    vo2max: finitePos(inputs.vo2Max),
    labs: finitePos(inputs.labRecordCount),
  }
  const allSignals = Object.values(signals)
  const observedCount = allSignals.filter((v) => v !== null).length
  const totalSignals = allSignals.length

  const { weight, height, systolic, diastolic } = signals
  const heightM = height !== null ? height / 100 : null
  const bmi = weight !== null && heightM !== null ? round1(weight / (heightM * heightM)) : null
  // MAP ≈ DBP + (SBP − DBP)/3, aproksimasi standar untuk denyut istirahat.
  const bpPair = systolic !== null && diastolic !== null && systolic > diastolic
  const mapMmHg = bpPair ? Math.round((systolic + 2 * diastolic) / 3) : null
  const pulsePressureMmHg = bpPair ? Math.round(systolic - diastolic) : null

  const planValues: Record<GuidelineTargetId, number> = {
    aerobic: planValue(plan.aerobicMinPerWeek),
    strength: planValue(plan.strengthDaysPerWeek),
    sleep: planValue(plan.sleepHoursPerNight),
  }
  const targets: CompassTargetResult[] = (Object.keys(GUIDELINE_TARGETS) as GuidelineTargetId[]).map((id) => {
    const target = GUIDELINE_TARGETS[id]
    const value = planValues[id]
    return Object.freeze({
      id,
      label: target.label,
      planValue: value,
      minimum: target.minimum,
      unit: target.unit,
      met: value >= target.minimum,
      attainmentPct: Math.round(Math.min(1, value / target.minimum) * 100),
      source: target.source,
      targetSystemIds: TARGET_SYSTEMS[id],
    })
  })
  const attainmentById = Object.fromEntries(targets.map((t) => [t.id, t.attainmentPct])) as Record<GuidelineTargetId, number>

  const axes: CompassAxisResult[] = AXIS_SPECS.map((spec) => {
    const observed = spec.expectedSignals.filter((s) => signals[s] !== null).length
    const attainment = spec.targets.reduce((sum, t) => sum + attainmentById[t], 0) / spec.targets.length
    return Object.freeze({
      ...spec,
      observedSignals: observed,
      coveragePct: Math.round((observed / spec.expectedSignals.length) * 100),
      planAttainmentPct: Math.round(attainment),
    })
  })

  const targetsMet = targets.filter((t) => t.met).length
  // Mode 3D hanya ilustrasi gerak: rencana yang memenuhi target aktivitas menampilkan tubuh bergerak.
  const activityMet = targets.every((t) => t.id === 'sleep' || t.met)

  return Object.freeze({
    axes: Object.freeze(axes),
    targets: Object.freeze(targets),
    processed: Object.freeze({
      observedCount,
      totalSignals,
      completenessPct: Math.round((observedCount / totalSignals) * 100),
      bmi,
      mapMmHg,
      pulsePressureMmHg,
    }),
    targetsMet,
    recommendedSim4DMode: activityMet ? 'exercise' : 'live',
    truthClass: 'recorded-coverage-and-plan-comparison',
    clinicallyReviewed: false,
    epistemicNotice:
      'Coverage shows which of your signals are recorded. The plan is compared with published adult minimums. This is not a health score, diagnosis or outcome prediction.',
  })
}
