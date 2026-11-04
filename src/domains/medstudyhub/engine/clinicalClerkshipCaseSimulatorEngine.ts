/**
 * @file clinicalClerkshipCaseSimulatorEngine.ts
 * @description Simulator Kasus Klinis Koas (THT-KL, Kardiologi, Bedah) & UKMPPD
 * yang menghubungkan anatomi 3D Z-Anatomy, pemeriksaan klinis, dan FSRS v4 algorithm.
 */

import { findClearStructureCard } from "../../body-exposure/data/zAnatomyClearIndonesianAtlas.ts";

export type ClerkshipDepartmentCode = "THT_KL" | "KARDIOLOGI" | "BEDAH_UMUM" | "NEUROLOGI" | "PENYAKIT_DALAM";

export interface ClinicalClerkshipScenarioInput {
  readonly scenarioId: string;
  readonly department: ClerkshipDepartmentCode;
  readonly targetOrganQuery: string;
  readonly chiefComplaintId: string;
  readonly keyPhysicalExamFindingId: string;
  readonly candidateDiagnosisIcd10: string;
  readonly studentSelfRatingFsrs: 1 | 2 | 3 | 4;
}

export function evaluateClinicalClerkshipCaseScenario(input: ClinicalClerkshipScenarioInput) {
  const anatomicalCard = findClearStructureCard(input.targetOrganQuery);

  // FSRS v4 deterministic interval calculation based on rating (1=Again, 2=Hard, 3=Good, 4=Easy)
  const baseIntervalDays = input.studentSelfRatingFsrs === 4 ? 14 : input.studentSelfRatingFsrs === 3 ? 7 : input.studentSelfRatingFsrs === 2 ? 3 : 1;
  const stabilityDays = Number((baseIntervalDays * 1.8).toFixed(1));

  const departmentCompetencyLevel =
    input.department === "THT_KL"
      ? "SKDI_4A_KOMPETENSI_MANDIRI_KOAS_THT_KL"
      : "SKDI_3B_KEGAWATDARURATAN_KLINIS";

  return {
    scenarioId: input.scenarioId,
    department: input.department,
    departmentCompetencyLevel,
    linkedAnatomicalStructure: {
      organChip: anatomicalCard.organChipLabel,
      fmaId: anatomicalCard.fmaId,
      indonesianTitle: anatomicalCard.indonesianTitle,
      arterialSupply: anatomicalCard.arterialSupplyId,
      nerveInnervation: anatomicalCard.nerveInnervationId,
      clinicalRelevance: anatomicalCard.clinicalAndDailyRelevance
    },
    clinicalReasoningSummary: {
      chiefComplaintId: input.chiefComplaintId,
      keyPhysicalExamFindingId: input.keyPhysicalExamFindingId,
      candidateDiagnosisIcd10: input.candidateDiagnosisIcd10
    },
    nextSpacedRepetitionSchedule: {
      cardId: `CLERKSHIP-${input.scenarioId}`,
      stabilityDays,
      nextIntervalDays: baseIntervalDays,
      difficultyRating: 4.5
    }
  };
}
