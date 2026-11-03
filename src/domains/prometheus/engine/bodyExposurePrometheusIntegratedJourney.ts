import { computeWiggersCardiacCyclePressure } from "../../body-exposure/engine/wiggersAndKroghPhysiologyEngine.ts";
import { simulateRenalAutoregulationAndCountercurrent } from "../../body-exposure/engine/renalNephronAutoregulationEngine.ts";
import { scheduleFsrsRetrievalReview } from "../argon-edu-complete-suite.ts";

export interface SavedLearnerJourneyState {
  readonly learnerId: string;
  readonly activeAnatomicalStructureId: string;
  readonly uberonId: string;
  readonly cameraCoordinatesXYZ: readonly [number, number, number];
  readonly physiologicalParameterSnapshot: Record<string, number>;
  readonly simulationReadout: Record<string, unknown>;
  readonly completedCaseId: string;
  readonly assessmentScore0to100: number;
  readonly fsrsNextIntervalDays: number;
  readonly returnedToAnatomicalContext: boolean;
}

const persistentLearnerJourneyVault = new Map<string, SavedLearnerJourneyState>();

export function executeAndPersistBodyExposurePrometheusJourney(params: {
  readonly learnerId: string;
  readonly domain: "CARDIOVASCULAR_WIGGERS" | "RENAL_NEPHRON_TGF";
  readonly cameraCoordinatesXYZ: readonly [number, number, number];
  readonly manipulatedMapMmHg: number;
  readonly assessmentGrade1to4: 1 | 2 | 3 | 4;
}): SavedLearnerJourneyState {
  const fsrs = scheduleFsrsRetrievalReview(4.5, 5.2, params.assessmentGrade1to4);
  const sim = params.domain === "CARDIOVASCULAR_WIGGERS"
    ? computeWiggersCardiacCyclePressure(220, 76)
    : simulateRenalAutoregulationAndCountercurrent({ meanArterialPressureMmHg: params.manipulatedMapMmHg });

  const state: SavedLearnerJourneyState = {
    learnerId: params.learnerId,
    activeAnatomicalStructureId: params.domain === "CARDIOVASCULAR_WIGGERS" ? "FMA:7101" : "FMA:7203",
    uberonId: params.domain === "CARDIOVASCULAR_WIGGERS" ? "UBERON:0000948" : "UBERON:0002113",
    cameraCoordinatesXYZ: params.cameraCoordinatesXYZ,
    physiologicalParameterSnapshot: { meanArterialPressureMmHg: params.manipulatedMapMmHg },
    simulationReadout: sim as Record<string, unknown>,
    completedCaseId: params.domain === "CARDIOVASCULAR_WIGGERS" ? "CASE_ACUTE_LV_AFTERLOAD_01" : "CASE_RENAL_AUTOREGULATION_TGF_02",
    assessmentScore0to100: params.assessmentGrade1to4 >= 3 ? 95 : 70,
    fsrsNextIntervalDays: fsrs.nextIntervalDays,
    returnedToAnatomicalContext: true
  };

  persistentLearnerJourneyVault.set(params.learnerId + "::" + params.domain, state);
  return state;
}

export function restorePersistedLearnerJourney(learnerId: string, domain: "CARDIOVASCULAR_WIGGERS" | "RENAL_NEPHRON_TGF"): SavedLearnerJourneyState | null {
  return persistentLearnerJourneyVault.get(learnerId + "::" + domain) ?? null;
}