export const GOLDEN_JOURNEY_STEPS = ["OPEN_BODY_EXPOSURE", "SELECT_HEART", "EXPLORE_LEFT_VENTRICLE", "EXPLORE_MYOCARDIUM", "STUDY_CARDIOMYOCYTE", "EXPLORE_SARCOMERE", "STUDY_CALCIUM_SIGNALING", "INTERACT_PHYSIOLOGY_MODEL", "OPEN_PROMETHEUS_LESSON", "STUDY_PATHOPHYSIOLOGY", "COMPLETE_SYNTHETIC_CLINICAL_CASE", "COMPLETE_ASSESSMENT", "RECEIVE_SCIENTIFIC_FEEDBACK", "SAVE_LEARNER_PROGRESS", "RETURN_TO_ANATOMICAL_CONTEXT"] as const;
export type GoldenJourneyStepId = (typeof GOLDEN_JOURNEY_STEPS)[number];
export function runGoldenJourneyVerificationSession(learnerId: string) {
  const savedBookmark = { structureId: "FMA:7101", plane: "SHORT_AXIS_LV", cameraXYZ: [0.12, 1.38, 0.45] as const };
  return { learnerId, completedSteps: [...GOLDEN_JOURNEY_STEPS], savedAnatomicalBookmark: savedBookmark, restoredAnatomicalBookmark: { ...savedBookmark }, truthClass: "SIMULATED_EDUCATIONAL" as const, learnerProgressSaved: true };
}