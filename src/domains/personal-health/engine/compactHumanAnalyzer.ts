/**
 * @file compactHumanAnalyzer.ts
 * Pure, deterministic multi-domain synthesis engine combining existing validated
 * PanaceaMed calculation engines and reference citations into one compact projection.
 *
 * Truth & Clinical Boundary:
 *  - Zero DOM, wall-clock, or PRNG calls (100% pure).
 *  - Missing/out-of-range measurements ALWAYS stay `available: false` (`'—'`). Never invented.
 *  - All reference calculations remain `clinicallyReviewed: false` (requires clinician sign-off).
 */

import { computeBmi, type AnthroResult } from '../../../lib/anthro.ts'
import { hrMaksTanaka, vo2maxUth } from '../../../lib/longevity.ts'
import {
  dailyCalories,
  hydrationTarget,
  idealBodyWeight,
  meanArterialPressure,
  news2,
  sleepDebt,
  waistToHeight,
  zone2HeartRate,
  type ActivityLevel,
  type IbwSex,
} from '../../clinical-calculators/index.ts'

export type VenueLensId = 'daily' | 'gym_sport' | 'spa_recovery' | 'clinic_hospital'
export type PerformanceStyleId = 'endurance_z2' | 'vo2_threshold' | 'strength_power' | 'active_recovery'

export interface CompactAnalyzerInput {
  readonly age?: number | null
  readonly sex?: IbwSex | null
  readonly heightCm?: number | null
  readonly weightKg?: number | null
  readonly bodyFatPct?: number | null
  readonly skeletalMuscleKg?: number | null
  readonly waistCm?: number | null
  readonly hipCm?: number | null
  readonly neckCm?: number | null
  readonly chestCm?: number | null
  readonly thighCm?: number | null
  readonly forwardHeadDeg?: number | null
  readonly pelvicTiltDeg?: number | null
  readonly systolic?: number | null
  readonly diastolic?: number | null
  readonly restingHr?: number | null
  readonly hrvMs?: number | null
  readonly spo2Pct?: number | null
  readonly respRate?: number | null
  readonly bodyTempC?: number | null
  readonly fev1L?: number | null
  readonly fvcL?: number | null
  readonly vo2maxRecorded?: number | null
  readonly sleepH?: number | null
  readonly steps?: number | null
  readonly exerciseMinToday?: number | null
  readonly hotClimate?: boolean
  readonly activityLevel?: ActivityLevel
  readonly onOxygen?: boolean
  readonly alert?: boolean
  readonly latestWorkoutName?: string | null
  readonly latestWorkoutMinutes?: number | null
}

export interface CompactMetricSlot {
  readonly id: string
  readonly label: string
  readonly valueDisplay: string
  readonly unit?: string
  readonly tag?: string
  readonly available: boolean
  readonly truthClass: 'recorded' | 'derived_reference' | 'heuristic' | 'missing'
}

export interface PerformanceStyleZone {
  readonly id: PerformanceStyleId
  readonly title: string
  readonly hrRangeDisplay: string
  readonly focusSummary: string
  readonly readinessHint: string
}

export interface SourceCitationItem {
  readonly id: string
  readonly label: string
  readonly citation: string
  readonly formula: string
  readonly clinicallyReviewed: false
}

export interface VenueLensSpec {
  readonly id: VenueLensId
  readonly label: string
  readonly audience: string
  readonly priorityDomains: readonly string[]
  readonly guidanceNote: string
}

export interface CompactHumanAnalysis {
  readonly signalCoverage: {
    readonly populated: number
    readonly total: number
  }
  readonly bodyDomain: {
    readonly bmi: AnthroResult
    readonly ibwKg: number | null
    readonly whtr: { readonly ratio: number; readonly label: string } | null
    readonly waistToHip: number | null
    readonly leanMassKg: number | null
    readonly bsaM2: number | null
    readonly slots: readonly CompactMetricSlot[]
  }
  readonly cardioPulmDomain: {
    readonly mapMmHg: { readonly map: number; readonly label: string } | null
    readonly pulsePressureMmHg: number | null
    readonly fev1FvcRatio: { readonly ratioPct: number; readonly note: string } | null
    readonly news2Total: number | null
    readonly news2Label: string | null
    readonly slots: readonly CompactMetricSlot[]
  }
  readonly energySleepDomain: {
    readonly dailyKcal: number | null
    readonly hydrationL: number | null
    readonly sleepDebtH: number | null
    readonly energyReserveHeuristic: number | null
    readonly slots: readonly CompactMetricSlot[]
  }
  readonly longevityDomain: {
    readonly hrMaxTanaka: number | null
    readonly vo2maxBest: { readonly value: number; readonly source: 'recorded' | 'uth_estimate' } | null
    readonly idfCentralWaistCutOffCm: number | null
    readonly idfCentralExceeded: boolean | null
    readonly slots: readonly CompactMetricSlot[]
  }
  readonly performanceStyles: readonly PerformanceStyleZone[]
  readonly citations: readonly SourceCitationItem[]
  readonly clinicallyReviewed: false
}

export const VENUE_LENSES: readonly VenueLensSpec[] = Object.freeze([
  {
    id: 'daily',
    label: 'Daily OS',
    audience: 'Everyday Personal Baseline',
    priorityDomains: ['Body Composition', 'Vitals & SpO₂', 'Energy & Sleep', 'Longevity'],
    guidanceNote: 'Balances daily activity, waist-to-height screening, sleep recovery, and cardiometabolic stability.',
  },
  {
    id: 'gym_sport',
    label: 'Gym & Sport',
    audience: 'Athletes, Coaches & Venues',
    priorityDomains: ['Performance Zones', 'Vital Capacity', 'Hydration & Kcal', 'Body Comp'],
    guidanceNote: 'Highlights Zone-2 vs VO₂max HR zones, sweat-adjusted fluid intake, lean mass, and training load.',
  },
  {
    id: 'spa_recovery',
    label: 'Spa & Leisure',
    audience: 'Thermal, Cryo & Wellness Guests',
    priorityDomains: ['Autonomic HRV', 'Sleep & Energy', 'Hydration', 'Posture'],
    guidanceNote: 'Surfaces vagal HRV, sleep shortfall, fluid balance, and postural strain without clinical overclaiming.',
  },
  {
    id: 'clinic_hospital',
    label: 'Clinic / Hospital',
    audience: 'Clinicians & Polyclinic Intake',
    priorityDomains: ['Cardiopulmonary & BP', 'Vital Capacity', 'NEWS2 Intake', 'Body Comp'],
    guidanceNote: 'Elevates BP/MAP, SpO₂, NEWS2 7-signal completeness, FEV1/FVC ratio, and lazy FHIR R4 export.',
  },
])

const isPos = (v: unknown, min = 0, max = Infinity): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > min && v <= max

const isFiniteIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max

function missingSlot(id: string, label: string, unit?: string): CompactMetricSlot {
  return { id, label, valueDisplay: '—', unit, available: false, truthClass: 'missing' }
}

export function buildCompactHumanAnalysis(raw: CompactAnalyzerInput): CompactHumanAnalysis {
  const height = isPos(raw.heightCm, 50, 260) ? raw.heightCm : null
  const weight = isPos(raw.weightKg, 20, 350) ? raw.weightKg : null
  const age = isPos(raw.age, 10, 120) ? raw.age : null
  const sex: IbwSex = raw.sex === 'F' ? 'F' : 'M'
  const activity: ActivityLevel = raw.activityLevel ?? 'sedang'

  const trackedSignals = [
    weight,
    height,
    isPos(raw.waistCm, 35, 220) ? raw.waistCm : null,
    isPos(raw.bodyFatPct, 2, 75) ? raw.bodyFatPct : null,
    isPos(raw.systolic, 40, 300) ? raw.systolic : null,
    isPos(raw.diastolic, 20, 200) ? raw.diastolic : null,
    isPos(raw.restingHr, 25, 240) ? raw.restingHr : null,
    isPos(raw.hrvMs, 3, 300) ? raw.hrvMs : null,
    isPos(raw.spo2Pct, 30, 100) ? raw.spo2Pct : null,
    isPos(raw.respRate, 4, 70) ? raw.respRate : null,
    isPos(raw.sleepH, 0.5, 20) ? raw.sleepH : null,
    isPos(raw.steps, 0, 150000) ? raw.steps : null,
    isPos(raw.fvcL, 0.4, 10) ? raw.fvcL : null,
    isPos(raw.vo2maxRecorded, 10, 110) ? raw.vo2maxRecorded : null,
  ]
  const populated = trackedSignals.filter((x) => x !== null).length

  // 1. Body Composition, Circumferences & Posture
  const bmi = weight && height ? computeBmi(weight, height) : computeBmi(Number.NaN, Number.NaN)
  const ibwRes = height ? idealBodyWeight(height, sex, 'broca') : { ok: false as const, reason: 'missing height' }
  const ibwKg = ibwRes.ok ? Number(ibwRes.data.ibwKg.toFixed(1)) : null
  const waist = isPos(raw.waistCm, 35, 220) ? raw.waistCm : null
  const hip = isPos(raw.hipCm, 40, 220) ? raw.hipCm : null
  const whtrRes = waist && height ? waistToHeight(waist, height) : null
  const whtr = whtrRes?.ok ? { ratio: Number(whtrRes.data.ratio.toFixed(2)), label: whtrRes.data.label } : null
  const waistToHip = waist && hip ? Number((waist / hip).toFixed(2)) : null
  const leanMassKg =
    isPos(raw.skeletalMuscleKg, 5, 120)
      ? Number(raw.skeletalMuscleKg.toFixed(1))
      : weight && isPos(raw.bodyFatPct, 2, 70)
      ? Number((weight * (1 - raw.bodyFatPct / 100)).toFixed(1))
      : null
  const bsaM2 = weight && height ? Number(Math.sqrt((height * weight) / 3600).toFixed(2)) : null

  const bodySlots: CompactMetricSlot[] = [
    bmi.valid
      ? { id: 'bmi', label: 'BMI (Asia-Pacific)', valueDisplay: String(bmi.bmi), unit: 'kg/m²', tag: bmi.kesan, available: true, truthClass: 'derived_reference' }
      : missingSlot('bmi', 'BMI (Asia-Pacific)', 'kg/m²'),
    isPos(raw.bodyFatPct, 2, 75)
      ? { id: 'bf', label: 'Body Fat', valueDisplay: raw.bodyFatPct.toFixed(1), unit: '%', available: true, truthClass: 'recorded' }
      : missingSlot('bf', 'Body Fat', '%'),
    leanMassKg !== null
      ? { id: 'lean', label: 'Fat-Free / Muscle', valueDisplay: leanMassKg.toFixed(1), unit: 'kg', available: true, truthClass: isPos(raw.skeletalMuscleKg, 5, 120) ? 'recorded' : 'derived_reference' }
      : missingSlot('lean', 'Fat-Free / Muscle', 'kg'),
    whtr
      ? { id: 'whtr', label: 'Waist-to-Height', valueDisplay: whtr.ratio.toFixed(2), tag: whtr.label, available: true, truthClass: 'derived_reference' }
      : missingSlot('whtr', 'Waist-to-Height'),
    waistToHip !== null
      ? { id: 'whr', label: 'Waist / Hip', valueDisplay: waistToHip.toFixed(2), available: true, truthClass: 'derived_reference' }
      : missingSlot('whr', 'Waist / Hip'),
    isFiniteIn(raw.forwardHeadDeg, -20, 75)
      ? {
          id: 'posture',
          label: 'Posture Forward Head',
          valueDisplay: `${raw.forwardHeadDeg.toFixed(0)}°`,
          tag: raw.forwardHeadDeg > 15 ? 'Forward tilt cue' : 'Neutral alignment',
          available: true,
          truthClass: 'recorded',
        }
      : missingSlot('posture', 'Posture Forward Head', '°'),
  ]

  // 2. Cardiopulmonary, BP, SpO2, NEWS2 & Vital Capacity
  const sbp = isPos(raw.systolic, 40, 300) ? raw.systolic : null
  const dbp = isPos(raw.diastolic, 20, 200) ? raw.diastolic : null
  const mapRes = sbp && dbp ? meanArterialPressure(sbp, dbp) : null
  const mapMmHg = mapRes?.ok ? { map: Math.round(mapRes.data.map), label: mapRes.data.label } : null
  const pulsePressureMmHg = sbp && dbp && sbp > dbp ? Math.round(sbp - dbp) : null

  const fvcL = isPos(raw.fvcL, 0.4, 10) ? raw.fvcL : null
  const fev1L = isPos(raw.fev1L, 0.2, 9) ? raw.fev1L : null
  const validSpirometry = fvcL !== null && fev1L !== null && fev1L <= fvcL
  const fev1FvcRatio = validSpirometry
    ? (() => {
        const pct = Math.round((fev1L / fvcL) * 100)
        return { ratioPct: pct, note: pct < 70 ? 'Below 70% reference (<0.70)' : '≥70% reference ratio' }
      })()
    : null

  const newsRes =
    sbp &&
    isPos(raw.restingHr, 10, 300) &&
    isPos(raw.spo2Pct, 30, 100) &&
    isPos(raw.respRate, 1, 80) &&
    isPos(raw.bodyTempC, 20, 45)
      ? news2({
          rr: raw.respRate,
          spo2: raw.spo2Pct,
          sbp,
          hr: raw.restingHr,
          temp: raw.bodyTempC,
          onOxygen: Boolean(raw.onOxygen),
          alert: raw.alert !== false,
        })
      : null

  const cardioSlots: CompactMetricSlot[] = [
    sbp && dbp
      ? { id: 'bp', label: 'Blood Pressure', valueDisplay: `${Math.round(sbp)}/${Math.round(dbp)}`, unit: 'mmHg', tag: mapMmHg ? `MAP ${mapMmHg.map} (${mapMmHg.label})` : undefined, available: true, truthClass: 'recorded' }
      : missingSlot('bp', 'Blood Pressure', 'mmHg'),
    isPos(raw.spo2Pct, 30, 100)
      ? { id: 'spo2', label: 'SpO₂ Oxygenation', valueDisplay: `${Math.round(raw.spo2Pct)}`, unit: '%', available: true, truthClass: 'recorded' }
      : missingSlot('spo2', 'SpO₂ Oxygenation', '%'),
    isPos(raw.restingHr, 25, 240)
      ? { id: 'rhr', label: 'Resting HR', valueDisplay: `${Math.round(raw.restingHr)}`, unit: 'bpm', available: true, truthClass: 'recorded' }
      : missingSlot('rhr', 'Resting HR', 'bpm'),
    isPos(raw.hrvMs, 3, 300)
      ? { id: 'hrv', label: 'HRV (rMSSD)', valueDisplay: `${Math.round(raw.hrvMs)}`, unit: 'ms', available: true, truthClass: 'recorded' }
      : missingSlot('hrv', 'HRV (rMSSD)', 'ms'),
    fev1FvcRatio
      ? { id: 'vc', label: 'Vital Cap. FEV₁/FVC', valueDisplay: `${fev1FvcRatio.ratioPct}%`, tag: `${fev1L?.toFixed(2)}/${fvcL?.toFixed(2)} L · ${fev1FvcRatio.note}`, available: true, truthClass: 'derived_reference' }
      : fvcL !== null
      ? { id: 'vc', label: 'Vital Capacity (FVC)', valueDisplay: fvcL.toFixed(2), unit: 'L', tag: 'Enter FEV₁ for ratio', available: true, truthClass: 'recorded' }
      : missingSlot('vc', 'Vital Capacity (FVC)', 'L'),
    newsRes && newsRes.total !== null
      ? { id: 'news2', label: 'NEWS2 Score', valueDisplay: `${newsRes.total}`, unit: 'pts', tag: newsRes.band?.label, available: true, truthClass: 'derived_reference' }
      : missingSlot('news2', 'NEWS2 (needs 5 vitals)', 'pts'),
  ]

  // 3. Calories, Hydration, Sleep & Energy Reserve
  const calRes = height ? dailyCalories(height, sex, 'broca', activity) : null
  const dailyKcal = calRes?.ok ? Math.round(calRes.data.kcalPerDay) : null

  const exerciseMin = isFiniteIn(raw.exerciseMinToday, 0, 600) ? raw.exerciseMinToday : isPos(raw.latestWorkoutMinutes, 0, 600) ? raw.latestWorkoutMinutes : 0
  const hydRes = weight
    ? hydrationTarget({
        weightKg: weight,
        exerciseMin,
        intensity: exerciseMin >= 45 ? 'intense' : exerciseMin > 0 ? 'moderate' : 'none',
        hotClimate: Boolean(raw.hotClimate),
        pregnant: false,
        breastfeeding: false,
      })
    : null
  const hydrationL = hydRes?.ok ? Number(hydRes.data.totalL.toFixed(2)) : null

  const sleepRes = isFiniteIn(raw.sleepH, 0, 16) ? sleepDebt(8, [{ date: '2026-11-16', hours: raw.sleepH }]) : null
  const sleepDebtH = sleepRes?.ok ? Number(Math.max(0, sleepRes.data.debt).toFixed(1)) : null

  const energyReserveHeuristic =
    isFiniteIn(raw.sleepH, 0, 16) && isPos(raw.hrvMs, 3, 300)
      ? Math.max(10, Math.min(100, Math.round((Math.min(raw.sleepH, 8.5) / 8) * 55 + Math.min(45, (raw.hrvMs / 75) * 45))))
      : null

  const energySlots: CompactMetricSlot[] = [
    dailyKcal !== null
      ? { id: 'kcal', label: 'Daily Energy Est.', valueDisplay: dailyKcal.toLocaleString(), unit: 'kcal', tag: `Broca IBW × ${activity}`, available: true, truthClass: 'derived_reference' }
      : missingSlot('kcal', 'Daily Energy Est.', 'kcal'),
    hydrationL !== null
      ? { id: 'hyd', label: 'Hydration Baseline', valueDisplay: hydrationL.toFixed(2), unit: 'L/day', tag: exerciseMin > 0 ? `+${Math.round(exerciseMin)}m active` : '33 mL/kg', available: true, truthClass: 'derived_reference' }
      : missingSlot('hyd', 'Hydration Baseline', 'L/day'),
    isFiniteIn(raw.sleepH, 0, 16)
      ? { id: 'sleep', label: 'Sleep Recorded', valueDisplay: raw.sleepH.toFixed(1), unit: 'h', tag: sleepDebtH !== null && sleepDebtH > 0 ? `${sleepDebtH}h below 8h ref` : 'Matches 8h ref', available: true, truthClass: 'recorded' }
      : missingSlot('sleep', 'Sleep Recorded', 'h'),
    energyReserveHeuristic !== null
      ? { id: 'energy', label: 'Reserve Heuristic', valueDisplay: `${energyReserveHeuristic}`, unit: '/100', tag: 'Non-clinical estimate', available: true, truthClass: 'heuristic' }
      : missingSlot('energy', 'Reserve Heuristic', '/100'),
  ]

  // 4. Longevity & Healthy Aging Context
  const hrMaxRes = age ? hrMaksTanaka(age) : null
  const hrMaxTanaka = hrMaxRes?.ok ? hrMaxRes.data.nilai : null
  const vo2Rec = isPos(raw.vo2maxRecorded, 10, 110) ? Number(raw.vo2maxRecorded.toFixed(1)) : null
  const vo2UthRes = !vo2Rec && age && isPos(raw.restingHr, 25, 140) ? vo2maxUth(raw.restingHr, age) : null
  const vo2maxBest: CompactHumanAnalysis['longevityDomain']['vo2maxBest'] =
    vo2Rec !== null
      ? { value: vo2Rec, source: 'recorded' }
      : vo2UthRes?.ok
      ? { value: vo2UthRes.data.nilai, source: 'uth_estimate' }
      : null

  const idfCentralWaistCutOffCm = sex === 'F' ? 80 : 90
  const idfCentralExceeded = waist !== null ? waist >= idfCentralWaistCutOffCm : null

  const longevitySlots: CompactMetricSlot[] = [
    vo2maxBest
      ? {
          id: 'vo2',
          label: vo2maxBest.source === 'recorded' ? 'VO₂max (Wearable)' : 'VO₂max (Uth Est.)',
          valueDisplay: String(vo2maxBest.value),
          unit: 'mL/kg/min',
          tag: vo2maxBest.source === 'recorded' ? 'Recorded' : 'Uth 2004 ratio',
          available: true,
          truthClass: vo2maxBest.source === 'recorded' ? 'recorded' : 'derived_reference',
        }
      : missingSlot('vo2', 'VO₂max', 'mL/kg/min'),
    hrMaxTanaka !== null
      ? { id: 'hrmax', label: 'HRmax (Tanaka)', valueDisplay: `${hrMaxTanaka}`, unit: 'bpm', tag: '208 - 0.7 × age', available: true, truthClass: 'derived_reference' }
      : missingSlot('hrmax', 'HRmax (Tanaka)', 'bpm'),
    waist !== null
      ? {
          id: 'idf',
          label: `IDF Waist (${sex === 'F' ? '≥80' : '≥90'} cm SE Asia)`,
          valueDisplay: `${waist.toFixed(1)}`,
          unit: 'cm',
          tag: idfCentralExceeded ? 'Above SE Asia cut-off' : 'Below SE Asia cut-off',
          available: true,
          truthClass: 'derived_reference',
        }
      : missingSlot('idf', 'IDF SE Asia Waist', 'cm'),
    bsaM2 !== null
      ? { id: 'bsa', label: 'Body Surface (Mosteller)', valueDisplay: bsaM2.toFixed(2), unit: 'm²', available: true, truthClass: 'derived_reference' }
      : missingSlot('bsa', 'Body Surface Area', 'm²'),
  ]

  // 5. Multiple Styles of Maximum Performance
  const z2Res = age ? zone2HeartRate(age) : null
  const rhrVal = isPos(raw.restingHr, 25, 140) ? raw.restingHr : null
  const karvonenRange = (loPct: number, hiPct: number): string => {
    if (!hrMaxTanaka) return 'Enter age for BPM zone'
    if (rhrVal !== null && hrMaxTanaka > rhrVal) {
      const hrr = hrMaxTanaka - rhrVal
      return `${Math.round(rhrVal + hrr * loPct)}–${Math.round(rhrVal + hrr * hiPct)} bpm (Karvonen)`
    }
    return `${Math.round(hrMaxTanaka * loPct)}–${Math.round(hrMaxTanaka * hiPct)} bpm (%HRmax)`
  }

  const recoveryOkForHighIntensity =
    (isPos(raw.hrvMs, 3, 300) ? raw.hrvMs >= 35 : true) && (sleepDebtH !== null ? sleepDebtH <= 2 : true)

  const performanceStyles: PerformanceStyleZone[] = [
    {
      id: 'endurance_z2',
      title: 'Aerobic Base (Zone 2)',
      hrRangeDisplay: z2Res?.ok ? `${z2Res.lower}–${z2Res.upper} bpm` : 'Enter age (10–100 y)',
      focusSummary: 'Mitochondrial density, fat oxidation, stroke-volume adaptation without high sympathetic cost.',
      readinessHint: 'Sustainable daily base regardless of moderate training fatigue.',
    },
    {
      id: 'vo2_threshold',
      title: 'VO₂max & Lactate Threshold',
      hrRangeDisplay: karvonenRange(0.75, 0.9),
      focusSummary: 'Peak cardiac output intervals (4×4 min or tempo blocks) linked to cardiorespiratory fitness.',
      readinessHint: recoveryOkForHighIntensity
        ? 'Autonomic & sleep inputs within favorable window for threshold intervals.'
        : 'Recorded HRV/sleep suggests capping peak intervals or prioritizing Zone 2 today.',
    },
    {
      id: 'strength_power',
      title: 'Strength, Speed & Neuromuscular',
      hrRangeDisplay: karvonenRange(0.85, 0.95) + ' peak / 2–3m rest',
      focusSummary: `Heavy compound force, sprint mechanics, and neuromuscular recruitment${leanMassKg ? ` · FFM ${leanMassKg} kg` : ''}.`,
      readinessHint: raw.latestWorkoutName
        ? `Recent log: ${raw.latestWorkoutName} (${Math.round(raw.latestWorkoutMinutes ?? 0)} min) — balance progressive overload.`
        : 'Log strength or track sessions in Training to track progression vs recovery.',
    },
    {
      id: 'active_recovery',
      title: 'Spa / Thermal & Parasympathetic Flush',
      hrRangeDisplay: karvonenRange(0.45, 0.58),
      focusSummary: 'Mobility, zone-1 walk, nasal breathing, and hydration restoration between hard blocks.',
      readinessHint: hydrationL ? `Target ~${hydrationL.toFixed(2)} L fluids + thermal/cool replenishment.` : 'Add body weight to calculate fluid target.',
    },
  ]

  const citations: SourceCitationItem[] = [
    {
      id: 'bmi_apac',
      label: 'Adult BMI (Asia-Pacific)',
      citation: 'WHO / IASO Asia-Pacific Adult Classification (<18.5, 18.5–22.9, 23–24.9, ≥25)',
      formula: 'weightKg / (heightM)^2',
      clinicallyReviewed: false,
    },
    {
      id: 'whtr',
      label: 'Waist-to-Height Ratio (WHtR)',
      citation: 'Ashwell M, Gibson S. BMJ Open 2016;6(3):e010159 (PMID 26975935)',
      formula: 'waistCm / heightCm (<0.5 lower, ≥0.6 higher)',
      clinicallyReviewed: false,
    },
    {
      id: 'map_news2',
      label: 'MAP & NEWS2 Vital Synthesis',
      citation: 'Royal College of Physicians (2017) NEWS2 SpO₂ Scale 1; standard MAP = (SBP + 2×DBP)/3',
      formula: '(SBP + 2*DBP)/3 · NEWS2 sum across 7 recorded parameters',
      clinicallyReviewed: false,
    },
    {
      id: 'tanaka_uth',
      label: 'HRmax & VO₂max Ratio',
      citation: 'Tanaka et al. J Am Coll Cardiol 2001;37:153-6 · Uth et al. Eur J Appl Physiol 2004;91:111-15',
      formula: 'HRmax = 208 - 0.7×age · VO2max ≈ 15.3 × (HRmax / HRrest)',
      clinicallyReviewed: false,
    },
    {
      id: 'idf_energy',
      label: 'IDF SE Asia Waist & Fluid/Energy',
      citation: 'IDF 2006 (≥90 cm M / ≥80 cm F) · Broca IBW & 33 mL/kg baseline hydration convention',
      formula: 'IBW×kcal/kg · 33 mL/kg + activity adjustment',
      clinicallyReviewed: false,
    },
    {
      id: 'spirometry_vc',
      label: 'Vital Capacity / FEV₁:FVC Reference',
      citation: 'GOLD Obstruction Screening Reference Threshold (FEV₁/FVC < 0.70 post-bronchodilator context)',
      formula: 'FEV1 (L) / FVC (L)',
      clinicallyReviewed: false,
    },
  ]

  return Object.freeze({
    signalCoverage: { populated, total: trackedSignals.length },
    bodyDomain: {
      bmi,
      ibwKg,
      whtr,
      waistToHip,
      leanMassKg,
      bsaM2,
      slots: bodySlots,
    },
    cardioPulmDomain: {
      mapMmHg,
      pulsePressureMmHg,
      fev1FvcRatio,
      news2Total: newsRes?.total ?? null,
      news2Label: newsRes?.band?.label ?? null,
      slots: cardioSlots,
    },
    energySleepDomain: {
      dailyKcal,
      hydrationL,
      sleepDebtH,
      energyReserveHeuristic,
      slots: energySlots,
    },
    longevityDomain: {
      hrMaxTanaka,
      vo2maxBest,
      idfCentralWaistCutOffCm,
      idfCentralExceeded,
      slots: longevitySlots,
    },
    performanceStyles,
    citations,
    clinicallyReviewed: false,
  })
}
