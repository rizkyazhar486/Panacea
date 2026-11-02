/**
 * Body Exposure × Prometheus × MedStudyHub Golden Journey Orchestrator Engine (EDU-6).
 *
 * Implements the 15-step Golden Educational Journey across Body Exposure (3D anatomy
 * camera, isolation, cross-section, and L0..L8 hierarchy state) and MedStudyHub
 * (physiology sandbox, structured lesson, synthetic clinical case vignette,
 * adaptive assessment, and spaced-retrieval review), preserving full navigation
 * context so learners return to the exact 3D anatomical view after completing
 * an educational activity.
 */

export type GoldenJourneyStepIndex =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export const GOLDEN_JOURNEY_DISCLAIMER =
  'Integrated Body Exposure x MedStudyHub educational journey — synthetic learning state only' as const;

export interface BodyExposureViewportBookmark {
  readonly fmaId: string;
  readonly uberonId: string;
  readonly isolatedStructureId: string;
  readonly scaleLevel: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8';
  readonly cameraTargetLpsMm: readonly [number, number, number];
  readonly crossSectionNormalLps: readonly [number, number, number] | null;
}

export interface GoldenJourneyStepContract {
  readonly stepNumber: GoldenJourneyStepIndex;
  readonly phase: 'body-exposure-anatomy' | 'physiology-simulation' | 'prometheus-education' | 'assessment-and-retention';
  readonly title: string;
  readonly requiredScaleLevel: BodyExposureViewportBookmark['scaleLevel'];
}

export const CARDIAC_GOLDEN_JOURNEY_STEPS: readonly GoldenJourneyStepContract[] = Object.freeze([
  Object.freeze({ stepNumber: 1, phase: 'body-exposure-anatomy', title: 'Open Whole Human Body (L0)', requiredScaleLevel: 'L0' }),
  Object.freeze({ stepNumber: 2, phase: 'body-exposure-anatomy', title: 'Select Cardiovascular System (L1)', requiredScaleLevel: 'L1' }),
  Object.freeze({ stepNumber: 3, phase: 'body-exposure-anatomy', title: 'Isolate Heart Organ Anatomy (L2)', requiredScaleLevel: 'L2' }),
  Object.freeze({ stepNumber: 4, phase: 'body-exposure-anatomy', title: 'Explore Four Cardiac Chambers (L3)', requiredScaleLevel: 'L3' }),
  Object.freeze({ stepNumber: 5, phase: 'body-exposure-anatomy', title: 'Focus Left Ventricular Wall & Outflow Tract (L3)', requiredScaleLevel: 'L3' }),
  Object.freeze({ stepNumber: 6, phase: 'body-exposure-anatomy', title: 'Inspect Working Ventricular Myocardium Tissue (L4)', requiredScaleLevel: 'L4' }),
  Object.freeze({ stepNumber: 7, phase: 'body-exposure-anatomy', title: 'Inspect Ventricular Cardiomyocyte & Sarcomere (L5/L6)', requiredScaleLevel: 'L5' }),
  Object.freeze({ stepNumber: 8, phase: 'body-exposure-anatomy', title: 'Trace Cav1.2-RyR2 Excitation-Contraction Coupling (L7/L8)', requiredScaleLevel: 'L7' }),
  Object.freeze({ stepNumber: 9, phase: 'physiology-simulation', title: 'Perturb Frank-Starling & Hemodynamic Sandbox', requiredScaleLevel: 'L2' }),
  Object.freeze({ stepNumber: 10, phase: 'prometheus-education', title: 'Open Linked Prometheus Multiscale Lesson', requiredScaleLevel: 'L2' }),
  Object.freeze({ stepNumber: 11, phase: 'prometheus-education', title: 'Complete Synthetic Acute HFrEF Clinical Vignette', requiredScaleLevel: 'L1' }),
  Object.freeze({ stepNumber: 12, phase: 'assessment-and-retention', title: 'Complete Adaptive 3PL IRT Mastery Assessment', requiredScaleLevel: 'L2' }),
  Object.freeze({ stepNumber: 13, phase: 'assessment-and-retention', title: 'Review Source-Grounded Distractor Explanations', requiredScaleLevel: 'L2' }),
  Object.freeze({ stepNumber: 14, phase: 'assessment-and-retention', title: 'Persist FSRS-v4.5 Spaced-Retrieval Schedule', requiredScaleLevel: 'L2' }),
  Object.freeze({ stepNumber: 15, phase: 'body-exposure-anatomy', title: 'Restore Exact 3D Left-Ventricular Anatomical Context', requiredScaleLevel: 'L3' }),
]);

export interface GoldenJourneyExecutionInput {
  readonly journeyId: string;
  readonly isSyntheticEducationalJourney: boolean;
  readonly completedSteps: readonly GoldenJourneyStepIndex[];
  readonly savedViewportBookmark: BodyExposureViewportBookmark;
  readonly restoredViewportBookmark: BodyExposureViewportBookmark;
  readonly conceptFmaId: string;
}

export type GoldenJourneyFailureReason =
  | 'invalid-input'
  | 'patient-record-contamination-blocked'
  | 'non-sequential-or-incomplete-steps'
  | 'ontology-binding-mismatch'
  | 'viewport-restoration-drift';

export interface GoldenJourneyEvaluationSuccess {
  readonly ok: true;
  readonly journeyId: string;
  readonly stepsCompletedCount: 15;
  readonly ontologyVerifiedFmaId: string;
  readonly viewportRestoredExactly: true;
  readonly completionFraction: 1;
  readonly truthClass: 'reference';
  readonly label: typeof GOLDEN_JOURNEY_DISCLAIMER;
}

export interface GoldenJourneyEvaluationFailure {
  readonly ok: false;
  readonly reason: GoldenJourneyFailureReason;
  readonly detail: string;
  readonly truthClass: 'reference';
  readonly label: typeof GOLDEN_JOURNEY_DISCLAIMER;
}

export type GoldenJourneyEvaluationResult =
  | GoldenJourneyEvaluationSuccess
  | GoldenJourneyEvaluationFailure;

function vectorsEqual(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): boolean {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === 3 &&
    b.length === 3 &&
    Math.abs(a[0] - b[0]) < 1e-6 &&
    Math.abs(a[1] - b[1]) < 1e-6 &&
    Math.abs(a[2] - b[2]) < 1e-6
  );
}

export function verifyGoldenEducationalJourney(
  input: GoldenJourneyExecutionInput,
): GoldenJourneyEvaluationResult {
  if (!input || typeof input !== 'object' || typeof input.journeyId !== 'string' || input.journeyId.trim().length === 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid GoldenJourneyExecutionInput with journeyId is required.',
      truthClass: 'reference',
      label: GOLDEN_JOURNEY_DISCLAIMER,
    });
  }

  if (input.isSyntheticEducationalJourney !== true) {
    return Object.freeze({
      ok: false,
      reason: 'patient-record-contamination-blocked',
      detail: 'Golden educational journey requires isSyntheticEducationalJourney=true.',
      truthClass: 'reference',
      label: GOLDEN_JOURNEY_DISCLAIMER,
    });
  }

  if (!Array.isArray(input.completedSteps) || input.completedSteps.length !== 15) {
    return Object.freeze({
      ok: false,
      reason: 'non-sequential-or-incomplete-steps',
      detail: `Golden journey requires all 15 steps in exact sequence 1..15 (received ${Array.isArray(input.completedSteps) ? input.completedSteps.length : 0} steps).`,
      truthClass: 'reference',
      label: GOLDEN_JOURNEY_DISCLAIMER,
    });
  }

  for (let i = 0; i < 15; i += 1) {
    if (input.completedSteps[i] !== i + 1) {
      return Object.freeze({
        ok: false,
        reason: 'non-sequential-or-incomplete-steps',
        detail: `Step at index ${i} must be ${i + 1} (received ${String(input.completedSteps[i])}).`,
        truthClass: 'reference',
        label: GOLDEN_JOURNEY_DISCLAIMER,
      });
    }
  }

  const saved = input.savedViewportBookmark;
  const restored = input.restoredViewportBookmark;
  if (!saved || !restored) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'savedViewportBookmark and restoredViewportBookmark are required.',
      truthClass: 'reference',
      label: GOLDEN_JOURNEY_DISCLAIMER,
    });
  }

  if (saved.fmaId !== input.conceptFmaId || restored.fmaId !== input.conceptFmaId) {
    return Object.freeze({
      ok: false,
      reason: 'ontology-binding-mismatch',
      detail: `Concept FMA ID (${input.conceptFmaId}) does not match viewport FMA ID (${saved.fmaId} / ${restored.fmaId}).`,
      truthClass: 'reference',
      label: GOLDEN_JOURNEY_DISCLAIMER,
    });
  }

  if (
    saved.isolatedStructureId !== restored.isolatedStructureId ||
    saved.scaleLevel !== restored.scaleLevel ||
    !vectorsEqual(saved.cameraTargetLpsMm, restored.cameraTargetLpsMm)
  ) {
    return Object.freeze({
      ok: false,
      reason: 'viewport-restoration-drift',
      detail: 'Restored 3D viewport bookmark drifted from saved anatomical camera/isolation context.',
      truthClass: 'reference',
      label: GOLDEN_JOURNEY_DISCLAIMER,
    });
  }

  return Object.freeze({
    ok: true,
    journeyId: input.journeyId.trim(),
    stepsCompletedCount: 15,
    ontologyVerifiedFmaId: input.conceptFmaId,
    viewportRestoredExactly: true,
    completionFraction: 1,
    truthClass: 'reference',
    label: GOLDEN_JOURNEY_DISCLAIMER,
  });
}
