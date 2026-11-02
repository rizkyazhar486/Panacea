// src/domains/clinical-operations/model/sepsisOneHourBundleCds.ts
// T-CLIN-SEPSIS: Surviving Sepsis Campaign (SSC 2021) 1-Hour Bundle & Sepsis-3 Clinical Decision Support
// Aligned with SCCM / ESICM Surviving Sepsis Campaign 2021 Guidelines (Crit Care Med 2021; 49:e1063–e1143)
// and Sepsis-3 Consensus Definitions (Singer et al., JAMA 2016; 315(8):801–810).

import { isValidIsoTimestamp } from '../../../shared/kernel/isoTimestamp.ts'

export type SepsisBundleElementType =
  | 'LACTATE_MEASUREMENT'
  | 'BLOOD_CULTURES_PRIOR_ANTIBIOTICS'
  | 'BROAD_SPECTRUM_ANTIBIOTICS'
  | 'CRYSTALLOID_FLUID_30ML_KG'
  | 'VASOPRESSORS_FOR_HYPOTENSION'

export type BundleElementStatus =
  | 'COMPLETED_ON_TIME'
  | 'PENDING_WITHIN_WINDOW'
  | 'OVERDUE_BREACH'
  | 'CONTRAINDICATED_OR_EXCLUDED'
  | 'NOT_INDICATED'

export interface SepsisActionRecord {
  element: SepsisBundleElementType
  performedAtIso: string
  notes?: string
}

export interface PatientSepsisAssessmentInput {
  patientId: string
  triageTimeZeroIso: string
  evaluationTimeIso: string
  weightKg: number
  meanArterialPressure_mmHg: number
  systolicBp_mmHg: number
  initialLactate_mmolL: number | null
  repeatLactate_mmolL?: number | null
  repeatLactateTimeIso?: string | null
  suspectedInfectionSource: string
  sofaScore: number | null
  qSofaScore: number | null
  hasPersistentHypotensionAfterFluids: boolean
  actionRecords: readonly SepsisActionRecord[]
}

export interface BundleElementEvaluation {
  element: SepsisBundleElementType
  status: BundleElementStatus
  targetDeadlineMinutes: number
  elapsedMinutesSinceTimeZero: number
  completedAtIso: string | null
  delayMinutes: number | null
  detail: string
}

export interface SepsisOneHourBundleEvaluation {
  patientId: string
  timeZeroIso: string
  evaluatedAtIso: string
  isSepsisSuspected: boolean
  isSepticShockPresent: boolean
  targetCrystalloidVolumeMl: number
  complianceRatePercent: number
  bundleMetOnTime: boolean
  elementEvaluations: Record<SepsisBundleElementType, BundleElementEvaluation>
  sequenceBreachWarnings: string[]
  clinicalRecommendations: string[]
  guidelineCitations: string[]
  truthClass: 'clinical_decision_support_guideline_proxy'
  clinically_reviewed: false
  neverManufacturesBiomarkers: true
}

function invalidSepsisInput(field: string): never {
  // Never expose patient data, measurements or clinical text in error messages
  throw new TypeError(`Invalid sepsis CDS input: ${field}`)
}

function requirePositiveFinite(val: unknown, field: string, min = 0.1, max = 500): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < min || val > max) {
    invalidSepsisInput(field)
  }
  return val
}

/**
 * Evaluates patient bundle adherence against the Surviving Sepsis Campaign 1-Hour Care Bundle.
 * Time zero is defined as the earliest time of triage or sepsis recognition.
 */
export function evaluateSepsisOneHourBundle(
  input: PatientSepsisAssessmentInput
): SepsisOneHourBundleEvaluation {
  if (!input || typeof input !== 'object') invalidSepsisInput('input')
  if (typeof input.patientId !== 'string' || !input.patientId.trim()) invalidSepsisInput('patientId')
  if (!isValidIsoTimestamp(input.triageTimeZeroIso)) invalidSepsisInput('triageTimeZeroIso')
  if (!isValidIsoTimestamp(input.evaluationTimeIso)) invalidSepsisInput('evaluationTimeIso')

  const timeZeroMs = Date.parse(input.triageTimeZeroIso)
  const evalMs = Date.parse(input.evaluationTimeIso)
  if (evalMs < timeZeroMs) invalidSepsisInput('evaluationTimeIso cannot precede triageTimeZeroIso')

  const weightKg = requirePositiveFinite(input.weightKg, 'weightKg', 20, 300)
  const mapMmHg = requirePositiveFinite(input.meanArterialPressure_mmHg, 'meanArterialPressure_mmHg', 20, 250)
  const sbpMmHg = requirePositiveFinite(input.systolicBp_mmHg, 'systolicBp_mmHg', 30, 300)

  if (input.initialLactate_mmolL !== null) {
    requirePositiveFinite(input.initialLactate_mmolL, 'initialLactate_mmolL', 0.1, 35)
  }

  const elapsedTotalMins = Math.max(0, Math.floor((evalMs - timeZeroMs) / 60000))
  const targetCrystalloidVolumeMl = Math.round(weightKg * 30)

  // Sepsis suspicion: qSOFA >= 2 or SOFA >= 2 or clinical suspicion
  const qSofa = input.qSofaScore ?? 0
  const sofa = input.sofaScore ?? 0
  const isSepsisSuspected = qSofa >= 2 || sofa >= 2 || input.initialLactate_mmolL !== null

  // Septic shock: vasopressor requirement to maintain MAP >= 65 AND lactate > 2 mmol/L despite fluid resuscitation
  const isSepticShockPresent =
    (input.hasPersistentHypotensionAfterFluids || mapMmHg < 65) &&
    (input.initialLactate_mmolL !== null && input.initialLactate_mmolL > 2.0)

  const actions = input.actionRecords || []
  for (const act of actions) {
    if (!act || !act.element || !isValidIsoTimestamp(act.performedAtIso)) {
      invalidSepsisInput('actionRecords entry malformed')
    }
  }

  // Find actions by element
  const findAction = (elem: SepsisBundleElementType) =>
    actions.find((a) => a.element === elem)

  const lactateAction = findAction('LACTATE_MEASUREMENT')
  const bcAction = findAction('BLOOD_CULTURES_PRIOR_ANTIBIOTICS')
  const abxAction = findAction('BROAD_SPECTRUM_ANTIBIOTICS')
  const fluidAction = findAction('CRYSTALLOID_FLUID_30ML_KG')
  const vasoAction = findAction('VASOPRESSORS_FOR_HYPOTENSION')

  const sequenceBreaches: string[] = []
  if (abxAction && bcAction) {
    const abxMs = Date.parse(abxAction.performedAtIso)
    const bcMs = Date.parse(bcAction.performedAtIso)
    if (abxMs < bcMs) {
      sequenceBreaches.push(
        'Sequence warning: Broad-spectrum antibiotics were administered prior to obtaining blood cultures.'
      )
    }
  }

  const assessElement = (
    elem: SepsisBundleElementType,
    action: SepsisActionRecord | undefined,
    deadlineMins: number,
    isIndicated: boolean,
    detailDesc: string
  ): BundleElementEvaluation => {
    if (!isIndicated) {
      return {
        element: elem,
        status: 'NOT_INDICATED',
        targetDeadlineMinutes: deadlineMins,
        elapsedMinutesSinceTimeZero: elapsedTotalMins,
        completedAtIso: null,
        delayMinutes: null,
        detail: 'Not clinically indicated based on current hemodynamic and lactate criteria.',
      }
    }

    if (action) {
      const actionMs = Date.parse(action.performedAtIso)
      const actionElapsedMins = Math.floor((actionMs - timeZeroMs) / 60000)
      const delay = Math.max(0, actionElapsedMins - deadlineMins)
      const onTime = actionElapsedMins <= deadlineMins

      return {
        element: elem,
        status: onTime ? 'COMPLETED_ON_TIME' : 'OVERDUE_BREACH',
        targetDeadlineMinutes: deadlineMins,
        elapsedMinutesSinceTimeZero: actionElapsedMins,
        completedAtIso: action.performedAtIso,
        delayMinutes: onTime ? 0 : delay,
        detail: onTime
          ? `${detailDesc} completed within target (${actionElapsedMins}m from time zero).`
          : `${detailDesc} completed with ${delay}m delay beyond ${deadlineMins}m window.`,
      }
    }

    // Not yet completed
    const overdue = elapsedTotalMins > deadlineMins
    return {
      element: elem,
      status: overdue ? 'OVERDUE_BREACH' : 'PENDING_WITHIN_WINDOW',
      targetDeadlineMinutes: deadlineMins,
      elapsedMinutesSinceTimeZero: elapsedTotalMins,
      completedAtIso: null,
      delayMinutes: overdue ? elapsedTotalMins - deadlineMins : 0,
      detail: overdue
        ? `${detailDesc} is overdue by ${elapsedTotalMins - deadlineMins}m beyond standard 1-hour bundle.`
        : `${detailDesc} is pending within the ${deadlineMins}m window (${deadlineMins - elapsedTotalMins}m remaining).`,
    }
  }

  // Fluid indication: Hypotension (MAP < 65 or SBP < 90) OR initial lactate >= 4.0 mmol/L
  const fluidIndicated = mapMmHg < 65 || sbpMmHg < 90 || (input.initialLactate_mmolL !== null && input.initialLactate_mmolL >= 4.0)

  // Vasopressor indication: Persistent hypotension (MAP < 65) during or following fluid resuscitation
  const vasoIndicated = mapMmHg < 65 || input.hasPersistentHypotensionAfterFluids

  const elemEvals: Record<SepsisBundleElementType, BundleElementEvaluation> = {
    LACTATE_MEASUREMENT: assessElement('LACTATE_MEASUREMENT', lactateAction, 60, true, 'Lactate measurement'),
    BLOOD_CULTURES_PRIOR_ANTIBIOTICS: assessElement('BLOOD_CULTURES_PRIOR_ANTIBIOTICS', bcAction, 60, true, 'Blood cultures prior to antimicrobials'),
    BROAD_SPECTRUM_ANTIBIOTICS: assessElement('BROAD_SPECTRUM_ANTIBIOTICS', abxAction, 60, true, 'Empiric broad-spectrum antibiotics'),
    CRYSTALLOID_FLUID_30ML_KG: assessElement('CRYSTALLOID_FLUID_30ML_KG', fluidAction, 180, fluidIndicated, `30 mL/kg fluid bolus (${targetCrystalloidVolumeMl} mL)`),
    VASOPRESSORS_FOR_HYPOTENSION: assessElement('VASOPRESSORS_FOR_HYPOTENSION', vasoAction, 60, vasoIndicated, 'Vasopressor initiation (norepinephrine target MAP >= 65 mmHg)'),
  }

  const indicatedElements = Object.values(elemEvals).filter((e) => e.status !== 'NOT_INDICATED')
  const completedOnTimeCount = indicatedElements.filter((e) => e.status === 'COMPLETED_ON_TIME').length
  const complianceRatePercent = indicatedElements.length > 0
    ? Math.round((completedOnTimeCount / indicatedElements.length) * 100)
    : 100

  const allElementsOnTime = indicatedElements.every((e) => e.status === 'COMPLETED_ON_TIME')

  const recommendations: string[] = []
  if (elemEvals.LACTATE_MEASUREMENT.status === 'OVERDUE_BREACH' || elemEvals.LACTATE_MEASUREMENT.status === 'PENDING_WITHIN_WINDOW') {
    recommendations.push('Obtain STAT serum/point-of-care lactate to quantify tissue hypoperfusion.')
  }
  if (input.initialLactate_mmolL !== null && input.initialLactate_mmolL > 2.0 && !input.repeatLactate_mmolL) {
    recommendations.push('Surviving Sepsis Campaign: Re-measure lactate within 2 to 4 hours to guide resuscitation adequacy.')
  }
  if (fluidIndicated && elemEvals.CRYSTALLOID_FLUID_30ML_KG.status !== 'COMPLETED_ON_TIME') {
    recommendations.push(`Initiate rapid balanced crystalloid infusion of 30 mL/kg (${targetCrystalloidVolumeMl} mL total) within 3 hours.`)
  }
  if (vasoIndicated && elemEvals.VASOPRESSORS_FOR_HYPOTENSION.status !== 'COMPLETED_ON_TIME') {
    recommendations.push('Initiate norepinephrine as first-choice vasopressor to target MAP >= 65 mmHg.')
  }

  return {
    patientId: input.patientId,
    timeZeroIso: input.triageTimeZeroIso,
    evaluatedAtIso: input.evaluationTimeIso,
    isSepsisSuspected,
    isSepticShockPresent,
    targetCrystalloidVolumeMl,
    complianceRatePercent,
    bundleMetOnTime: allElementsOnTime,
    elementEvaluations: elemEvals,
    sequenceBreachWarnings: sequenceBreaches,
    clinicalRecommendations: recommendations,
    guidelineCitations: [
      'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021 (Crit Care Med 2021; 49:e1063-e1143)',
      'The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3) (JAMA 2016; 315(8):801-810)',
    ],
    truthClass: 'clinical_decision_support_guideline_proxy',
    clinically_reviewed: false,
    neverManufacturesBiomarkers: true,
  }
}
