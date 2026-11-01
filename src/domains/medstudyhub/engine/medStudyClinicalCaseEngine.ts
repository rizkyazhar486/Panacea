/**
 * MedStudyHub Multi-Step Clinical Case Vignette & Bayesian Diagnostic Reasoning Engine (EDU-4).
 *
 * Implements:
 * 1. Deterministic state-machine transitions across the clinical reasoning sequence:
 *    presentation -> history -> physical-exam -> investigations -> differential-diagnosis -> management -> debrief.
 * 2. Sequential Bayesian pre-test to post-test probability updating using positive (LR+)
 *    and negative (LR-) likelihood ratios:
 *      Odds_pre = P_pre / (1 - P_pre)
 *      Odds_post = Odds_pre * prod(LR_i)
 *      P_post = Odds_post / (1 + Odds_post)
 * 3. Contraindication safety gates and strict fail-closed isolation from clinical EMR records.
 *
 * Citations:
 * - Pauker SG, Kassirer JP. The threshold approach to clinical decision making.
 *   N Engl J Med. 1980;302(20):1109-1117. PMID: 7366635.
 * - McGee S. Evidence-Based Physical Diagnosis. 5th ed. Elsevier; 2021.
 */

export type ClinicalCaseStage =
  | 'presentation'
  | 'history'
  | 'physical-exam'
  | 'investigations'
  | 'differential-diagnosis'
  | 'management'
  | 'debrief';

export const CLINICAL_CASE_DISCLAIMER =
  'Synthetic educational clinical vignette — strictly isolated from real patient EMR care decisions' as const;

const STAGE_ORDER: readonly ClinicalCaseStage[] = Object.freeze([
  'presentation',
  'history',
  'physical-exam',
  'investigations',
  'differential-diagnosis',
  'management',
  'debrief',
]);

export interface DiagnosticEvidenceFinding {
  readonly findingId: string;
  readonly label: string;
  readonly present: boolean;
  readonly sensitivity: number; // (0, 1)
  readonly specificity: number; // (0, 1)
}

export interface ClinicalCaseSimulationInput {
  readonly caseId: string;
  readonly isSyntheticEducationalCase: boolean;
  readonly currentStage: ClinicalCaseStage;
  readonly targetNextStage: ClinicalCaseStage;
  readonly preTestProbability: number; // (0, 1)
  readonly observedFindings: readonly DiagnosticEvidenceFinding[];
  readonly selectedManagementIds?: readonly string[];
  readonly contraindicatedManagementIds?: readonly string[];
}

export type ClinicalCaseFailureReason =
  | 'invalid-input'
  | 'patient-record-contamination-blocked'
  | 'invalid-stage-transition'
  | 'invalid-probability-or-test-characteristics'
  | 'contraindicated-management-selected';

export interface ClinicalCaseSimulationSuccess {
  readonly ok: true;
  readonly caseId: string;
  readonly previousStage: ClinicalCaseStage;
  readonly currentStage: ClinicalCaseStage;
  readonly preTestProbability: number;
  readonly combinedLikelihoodRatio: number;
  readonly postTestProbability: number;
  readonly diagnosticActionZone: 'below-testing-threshold' | 'diagnostic-testing-zone' | 'above-treatment-threshold';
  readonly appliedFindingsCount: number;
  readonly formula: string;
  readonly truthClass: 'derived';
  readonly label: typeof CLINICAL_CASE_DISCLAIMER;
}

export interface ClinicalCaseSimulationFailure {
  readonly ok: false;
  readonly reason: ClinicalCaseFailureReason;
  readonly detail: string;
  readonly violatedContraindications: readonly string[];
  readonly truthClass: 'derived';
  readonly label: typeof CLINICAL_CASE_DISCLAIMER;
}

export type ClinicalCaseSimulationResult =
  | ClinicalCaseSimulationSuccess
  | ClinicalCaseSimulationFailure;

export function evaluateClinicalCaseReasoningStep(
  input: ClinicalCaseSimulationInput,
): ClinicalCaseSimulationResult {
  if (!input || typeof input !== 'object' || typeof input.caseId !== 'string' || input.caseId.trim().length === 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid ClinicalCaseSimulationInput with caseId is required.',
      violatedContraindications: Object.freeze([]),
      truthClass: 'derived',
      label: CLINICAL_CASE_DISCLAIMER,
    });
  }

  if (input.isSyntheticEducationalCase !== true) {
    return Object.freeze({
      ok: false,
      reason: 'patient-record-contamination-blocked',
      detail: 'Clinical case educational engine requires isSyntheticEducationalCase=true.',
      violatedContraindications: Object.freeze([]),
      truthClass: 'derived',
      label: CLINICAL_CASE_DISCLAIMER,
    });
  }

  const currentIdx = STAGE_ORDER.indexOf(input.currentStage);
  const nextIdx = STAGE_ORDER.indexOf(input.targetNextStage);
  if (currentIdx === -1 || nextIdx === -1 || nextIdx !== currentIdx + 1) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-stage-transition',
      detail: `Invalid case stage transition "${String(input.currentStage)}" -> "${String(input.targetNextStage)}"; must advance sequentially by 1 step.`,
      violatedContraindications: Object.freeze([]),
      truthClass: 'derived',
      label: CLINICAL_CASE_DISCLAIMER,
    });
  }

  if (
    typeof input.preTestProbability !== 'number' ||
    !Number.isFinite(input.preTestProbability) ||
    input.preTestProbability <= 0 ||
    input.preTestProbability >= 1
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-probability-or-test-characteristics',
      detail: `preTestProbability (${String(input.preTestProbability)}) must be strictly within (0, 1).`,
      violatedContraindications: Object.freeze([]),
      truthClass: 'derived',
      label: CLINICAL_CASE_DISCLAIMER,
    });
  }

  if (!Array.isArray(input.observedFindings)) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'observedFindings array is required.',
      violatedContraindications: Object.freeze([]),
      truthClass: 'derived',
      label: CLINICAL_CASE_DISCLAIMER,
    });
  }

  let combinedLr = 1.0;
  for (const f of input.observedFindings) {
    if (
      !f ||
      typeof f.sensitivity !== 'number' ||
      typeof f.specificity !== 'number' ||
      !Number.isFinite(f.sensitivity) ||
      !Number.isFinite(f.specificity) ||
      f.sensitivity <= 0 ||
      f.sensitivity >= 1 ||
      f.specificity <= 0 ||
      f.specificity >= 1
    ) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-probability-or-test-characteristics',
        detail: `Finding "${String(f?.findingId)}" must have sensitivity and specificity strictly within (0, 1).`,
        violatedContraindications: Object.freeze([]),
        truthClass: 'derived',
        label: CLINICAL_CASE_DISCLAIMER,
      });
    }

    const lr = f.present
      ? f.sensitivity / (1 - f.specificity)
      : (1 - f.sensitivity) / f.specificity;
    combinedLr *= lr;
  }

  const contraindicatedSet = new Set(input.contraindicatedManagementIds ?? []);
  const selectedMgmt = input.selectedManagementIds ?? [];
  const violated = selectedMgmt.filter(id => contraindicatedSet.has(id));
  if (violated.length > 0) {
    return Object.freeze({
      ok: false,
      reason: 'contraindicated-management-selected',
      detail: `Contraindicated management intervention(s) selected: ${violated.join(', ')}.`,
      violatedContraindications: Object.freeze(violated),
      truthClass: 'derived',
      label: CLINICAL_CASE_DISCLAIMER,
    });
  }

  const preOdds = input.preTestProbability / (1 - input.preTestProbability);
  const postOdds = preOdds * combinedLr;
  const postProb = Number((postOdds / (1 + postOdds)).toFixed(6));
  const roundedLr = Number(combinedLr.toFixed(6));

  const diagnosticActionZone =
    postProb < 0.15
      ? 'below-testing-threshold'
      : postProb >= 0.8
        ? 'above-treatment-threshold'
        : 'diagnostic-testing-zone';

  return Object.freeze({
    ok: true,
    caseId: input.caseId.trim(),
    previousStage: input.currentStage,
    currentStage: input.targetNextStage,
    preTestProbability: input.preTestProbability,
    combinedLikelihoodRatio: roundedLr,
    postTestProbability: postProb,
    diagnosticActionZone,
    appliedFindingsCount: input.observedFindings.length,
    formula: 'Odds_post = (P_pre / (1 - P_pre)) * prod(LR_i); P_post = Odds_post / (1 + Odds_post)',
    truthClass: 'derived',
    label: CLINICAL_CASE_DISCLAIMER,
  });
}
