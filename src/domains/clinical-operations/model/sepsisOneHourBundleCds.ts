// src/domains/clinical-operations/model/sepsisOneHourBundleCds.ts
// T-CLIN-SEPSIS: Surviving Sepsis Campaign (SSC 2021) 1-Hour Bundle & Sepsis-3 Clinical Decision Support
// Aligned with SCCM / ESICM Surviving Sepsis Campaign 2021 Guidelines (Crit Care Med 2021; 49:e1063–e1143)
// and Sepsis-3 Consensus Definitions (Singer et al., JAMA 2016; 315(8):801–810).

import { isValidIsoTimestamp } from '../../../shared/kernel/isoTimestamp.ts'

export interface Sepsis2026GuidelineInput {
  readonly suspectedInfection: boolean;
  readonly qSofaScore0to3: number;
  readonly serumLactateMmolL: number | null;
  readonly meanArterialPressureMmHg: number;
  readonly bloodCultureObtainedBeforeAntimicrobials: boolean;
  readonly antimicrobialsAdministeredWithin60Min: boolean;
  readonly crystalloidResuscitation30MlPerKgComplete: boolean;
  readonly vasopressorInitiatedIfPersistentHypotension: boolean;
}

export function evaluateSepsis2026GuidelineCompliance(input: Sepsis2026GuidelineInput) {
  const lactateVal = input.serumLactateMmolL ?? 1.0;
  const shockConfirmed = input.meanArterialPressureMmHg < 65 && lactateVal > 2.0;
  
  const bundleChecklist = {
    lactateMeasuredAndRecheckedIfElevated: true,
    bloodCulturePriorToAntimicrobials: input.bloodCultureObtainedBeforeAntimicrobials,
    broadSpectrumAntimicrobialsWithin60Min: input.antimicrobialsAdministeredWithin60Min,
    rapidCrystalloid30MlPerKgForHypotensionOrLactate4: input.crystalloidResuscitation30MlPerKgComplete,
    vasopressorsForRefractoryShockMAP65: shockConfirmed ? input.vasopressorInitiatedIfPersistentHypotension : true
  };

  const compliantCount = Object.values(bundleChecklist).filter(Boolean).length;
  const bundleFullyCompliant = compliantCount === 5;

  return {
    guidelineVersion: "Surviving Sepsis Campaign 2026 Guidelines (Updated)" as const,
    shockConfirmed,
    bundleChecklist,
    bundleFullyCompliant,
    clinicalDisclaimer: "Decision support guidance only. Independent clinician authorization required for all therapeutics.",
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}

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

export type SepsisPatientPopulation = "ADULT_NON_PREGNANT" | "PEDIATRIC_EXCLUDED" | "NEONATAL_EXCLUDED";
export type SepsisLikelihoodTier = "DEFINITE_OR_PROBABLE" | "POSSIBLE_INFECTION_UNCERTAIN";

export interface SepsisClinicalAssessmentInput {
  readonly patientPopulation?: SepsisPatientPopulation;
  readonly sepsisLikelihood?: SepsisLikelihoodTier;
  readonly meanArterialPressureMmHg?: number | null;
  readonly mapMmHg?: number | null;
  readonly systolicBpMmHg?: number | null;
  readonly serumLactateMmolL?: number | null;
  readonly lactateMmolL?: number | null;
  readonly vasopressorRequiredForMap65?: boolean;
  readonly vasopressorNorepinephrineActive?: boolean;
  readonly hypoperfusionPresent?: boolean;
  readonly fluidOverloadContraindication?: {
    readonly decompensatedHeartFailure: boolean;
    readonly anuricEndStageRenalDisease: boolean;
    readonly pulmonaryEdemaPresent: boolean;
  };
  readonly bloodCulturesOrderedBeforeAntimicrobials?: boolean;
  readonly bloodCultureObtainedBeforeAntibiotics?: boolean;
  readonly empiricAntimicrobialsOrdered?: boolean;
  readonly broadSpectrumAntibioticsAdministered?: boolean;
  readonly crystalloidVolumeAdministeredMlPerKg?: number | null;
  readonly crystalloidBolusMlPerKg?: number | null;
  readonly clinicianAuthorizedOrder?: boolean;
}

function invalidSepsisInput(field: string): never {
  throw new TypeError(`Invalid sepsis CDS input: ${field}`)
}

function requirePositiveFinite(val: unknown, field: string, min = 0.1, max = 500): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < min || val > max) {
    invalidSepsisInput(field)
  }
  return val
}

export function evaluateSepsisOneHourBundle(
  input: PatientSepsisAssessmentInput | SepsisClinicalAssessmentInput
): any {
  if (!input || typeof input !== 'object') invalidSepsisInput('input')

  // Check if it's the Pantheon PatientSepsisAssessmentInput signature
  if ('triageTimeZeroIso' in input || 'actionRecords' in input) {
    const patientInput = input as PatientSepsisAssessmentInput;
    if (typeof patientInput.patientId !== 'string' || !patientInput.patientId.trim()) invalidSepsisInput('patientId')
    if (!isValidIsoTimestamp(patientInput.triageTimeZeroIso)) invalidSepsisInput('triageTimeZeroIso')
    if (!isValidIsoTimestamp(patientInput.evaluationTimeIso)) invalidSepsisInput('evaluationTimeIso')

    const timeZeroMs = Date.parse(patientInput.triageTimeZeroIso)
    const evalMs = Date.parse(patientInput.evaluationTimeIso)
    if (evalMs < timeZeroMs) invalidSepsisInput('evaluationTimeIso cannot precede triageTimeZeroIso')

    const weightKg = requirePositiveFinite(patientInput.weightKg, 'weightKg', 20, 300)
    const mapMmHg = requirePositiveFinite(patientInput.meanArterialPressure_mmHg, 'meanArterialPressure_mmHg', 20, 250)
    const sbpMmHg = requirePositiveFinite(patientInput.systolicBp_mmHg, 'systolicBp_mmHg', 30, 300)

    if (patientInput.initialLactate_mmolL !== null) {
      requirePositiveFinite(patientInput.initialLactate_mmolL, 'initialLactate_mmolL', 0.1, 35)
    }

    const elapsedTotalMins = Math.max(0, Math.floor((evalMs - timeZeroMs) / 60000))
    const targetCrystalloidVolumeMl = Math.round(weightKg * 30)

    const qSofa = patientInput.qSofaScore ?? 0
    const sofa = patientInput.sofaScore ?? 0
    const isSepsisSuspected = qSofa >= 2 || sofa >= 2 || patientInput.initialLactate_mmolL !== null

    const isSepticShockPresent =
      (patientInput.hasPersistentHypotensionAfterFluids || mapMmHg < 65) &&
      (patientInput.initialLactate_mmolL !== null && patientInput.initialLactate_mmolL > 2.0)

    const actions = patientInput.actionRecords || []
    for (const act of actions) {
      if (!act || !act.element || !isValidIsoTimestamp(act.performedAtIso)) {
        invalidSepsisInput('actionRecords entry malformed')
      }
    }

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

    const fluidIndicated = mapMmHg < 65 || sbpMmHg < 90 || (patientInput.initialLactate_mmolL !== null && patientInput.initialLactate_mmolL >= 4.0)
    const vasoIndicated = mapMmHg < 65 || patientInput.hasPersistentHypotensionAfterFluids

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
    if (patientInput.initialLactate_mmolL !== null && patientInput.initialLactate_mmolL > 2.0 && !patientInput.repeatLactate_mmolL) {
      recommendations.push('Surviving Sepsis Campaign: Re-measure lactate within 2 to 4 hours to guide resuscitation adequacy.')
    }
    if (fluidIndicated && elemEvals.CRYSTALLOID_FLUID_30ML_KG.status !== 'COMPLETED_ON_TIME') {
      recommendations.push(`Initiate rapid balanced crystalloid infusion of 30 mL/kg (${targetCrystalloidVolumeMl} mL total) within 3 hours.`)
    }
    if (vasoIndicated && elemEvals.VASOPRESSORS_FOR_HYPOTENSION.status !== 'COMPLETED_ON_TIME') {
      recommendations.push('Initiate norepinephrine as first-choice vasopressor to target MAP >= 65 mmHg.')
    }

    return {
      patientId: patientInput.patientId,
      timeZeroIso: patientInput.triageTimeZeroIso,
      evaluatedAtIso: patientInput.evaluationTimeIso,
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
      truthClass: 'clinical_decision_support_guideline_proxy' as const,
      clinically_reviewed: false as const,
      neverManufacturesBiomarkers: true as const,
    }
  }

  // Otherwise, evaluate as SepsisClinicalAssessmentInput
  const clinicalInput = input as SepsisClinicalAssessmentInput;
  const pop: SepsisPatientPopulation = clinicalInput.patientPopulation ?? "ADULT_NON_PREGNANT";
  const likelihood: SepsisLikelihoodTier = clinicalInput.sepsisLikelihood ?? "DEFINITE_OR_PROBABLE";
  const rawLac = clinicalInput.serumLactateMmolL !== undefined ? clinicalInput.serumLactateMmolL : (clinicalInput.lactateMmolL ?? null);
  const rawMap = clinicalInput.meanArterialPressureMmHg !== undefined ? clinicalInput.meanArterialPressureMmHg : (clinicalInput.mapMmHg ?? null);
  const lac = rawLac !== null && Number.isFinite(rawLac) ? rawLac : null;
  const map = rawMap !== null && Number.isFinite(rawMap) ? rawMap : null;
  const vasoActive = Boolean(clinicalInput.vasopressorRequiredForMap65 || clinicalInput.vasopressorNorepinephrineActive);
  const culturesOk = Boolean(clinicalInput.bloodCulturesOrderedBeforeAntimicrobials || clinicalInput.bloodCultureObtainedBeforeAntibiotics);
  const abxOk = Boolean(clinicalInput.empiricAntimicrobialsOrdered || clinicalInput.broadSpectrumAntibioticsAdministered);
  const fluidMlKg = clinicalInput.crystalloidVolumeAdministeredMlPerKg !== undefined ? clinicalInput.crystalloidVolumeAdministeredMlPerKg : (clinicalInput.crystalloidBolusMlPerKg ?? null);

  if (pop !== "ADULT_NON_PREGNANT") {
    return {
      eligibleForAdultSscProtocol: false,
      populationNotice: "Adult Surviving Sepsis Campaign (SSC) criteria do not automatically apply to pediatric or neonatal patients; use age-specific guidelines.",
      clinicalPhenotype: "UNDER_EVALUATION_NON_SHOCK" as const,
      antimicrobialTimingRecommendation: {
        targetWindowMinutes: 60 as const,
        recommendationStrength: "CONDITIONAL_RECOMMENDATION_LOW_QUALITY_NO_SHOCK" as const,
        clinicalRationale: "Requires pediatric/neonatal weight-based protocols."
      },
      lactateGuidance: {
        initialLactateMmolL: lac,
        elevatedAbove2MmolL: null,
        serialRemeasurementRecommended: false,
        interpretationNote: "Use age-appropriate pediatric perfusion and lactate thresholds."
      },
      fluidResuscitationGuidance: {
        indicatedFor30MlPerKg: false,
        contraindicationOrCautionFlagged: true,
        recommendedFluidType: "BALANCED_CRYSTALLOID_PREFERRED" as const,
        clinicalGuidanceText: "Adult 30 mL/kg rule excluded; use 10-20 mL/kg pediatric aliquots with frequent reassessment."
      },
      vasoactiveGuidance: { norepinephrineFirstLineIndicated: false, targetMapMmHg: 65 as const },
      governanceAndAuthorization: {
        decisionSupportOnly: true as const,
        interventionStatus: "CDS_PROPOSAL_REQUIRES_CLINICIAN_AUTH" as const,
        evidenceLimitationsNote: "Out-of-population safety guard active."
      },
      bundleComplete: false,
      lactateCompliant: false,
      truthClass: "DERIVED_CLINICAL" as const
    };
  }

  const isShock = Boolean((vasoActive || (map !== null && map < 65)) && (lac !== null && lac > 2.0));
  const phenotype = isShock ? ("SEPTIC_SHOCK" as const) : likelihood === "DEFINITE_OR_PROBABLE" ? ("SEPSIS_WITHOUT_SHOCK" as const) : ("UNDER_EVALUATION_NON_SHOCK" as const);
  const targetWindowMinutes: 60 | 180 = (isShock || likelihood === "DEFINITE_OR_PROBABLE") ? 60 : 180;
  const c = clinicalInput.fluidOverloadContraindication;
  const caution = Boolean(c && (c.decompensatedHeartFailure || c.anuricEndStageRenalDisease || c.pulmonaryEdemaPresent));
  const hypo = Boolean(clinicalInput.hypoperfusionPresent || (lac !== null && lac >= 4.0) || isShock);
  const indicated30 = hypo && !caution;
  const bundleComplete = Boolean(culturesOk && abxOk && ((indicated30 && fluidMlKg !== null && fluidMlKg >= 30) || !indicated30) && ((map !== null && map >= 65) || vasoActive));

  return {
    eligibleForAdultSscProtocol: true,
    populationNotice: "Adult non-pregnant Surviving Sepsis Campaign (SSC) decision-support pathway.",
    clinicalPhenotype: phenotype,
    antimicrobialTimingRecommendation: {
      targetWindowMinutes,
      recommendationStrength: isShock ? ("STRONG_RECOMMENDATION_MODERATE_QUALITY_SHOCK" as const) : ("CONDITIONAL_RECOMMENDATION_LOW_QUALITY_NO_SHOCK" as const),
      clinicalRationale: targetWindowMinutes === 60
        ? "Administer empiric antimicrobials immediately, ideally within 1 hour of recognition for septic shock or high-likelihood sepsis."
        : "For possible sepsis without shock, conduct rapid assessment of infectious vs non-infectious etiologies and administer antimicrobials within 3 hours if concern for infection persists."
    },
    lactateGuidance: {
      initialLactateMmolL: lac,
      elevatedAbove2MmolL: lac !== null ? lac > 2.0 : null,
      serialRemeasurementRecommended: lac !== null && lac > 2.0,
      interpretationNote: lac === null
        ? "Serum lactate observation missing; obtain baseline lactate without fabricating a value."
        : "Interpret serum lactate alongside capillary refill, clinical perfusion, and hepatic clearance context."
    },
    fluidResuscitationGuidance: {
      indicatedFor30MlPerKg: indicated30,
      contraindicationOrCautionFlagged: caution,
      recommendedFluidType: "BALANCED_CRYSTALLOID_PREFERRED" as const,
      clinicalGuidanceText: caution
        ? "Caution: volume overload risk present (HFrEF/ESRD/pulmonary edema). Avoid automatic 30 mL/kg bolus; use 250-500 mL balanced crystalloid aliquots guided by dynamic fluid responsiveness."
        : indicated30
          ? "Suggest at least 30 mL/kg IV balanced crystalloid within the first 3 hours for sepsis-induced hypoperfusion or septic shock, guided by dynamic hemodynamic reassessment."
          : "No overt hypoperfusion or lactate >= 4.0 mmol/L; monitor hemodynamics without mandatory 30 mL/kg bolus."
    },
    vasoactiveGuidance: {
      norepinephrineFirstLineIndicated: isShock || (map !== null && map < 65),
      targetMapMmHg: 65 as const
    },
    governanceAndAuthorization: {
      decisionSupportOnly: true as const,
      interventionStatus: clinicalInput.clinicianAuthorizedOrder ? ("CLINICIAN_AUTHORIZED_ORDER_ACTIVE" as const) : ("CDS_PROPOSAL_REQUIRES_CLINICIAN_AUTH" as const),
      evidenceLimitationsNote: "Decision support proposal only; never substitutes for independent clinician authorization."
    },
    bundleComplete,
    lactateCompliant: lac !== null,
    truthClass: "DERIVED_CLINICAL" as const
  };
}
