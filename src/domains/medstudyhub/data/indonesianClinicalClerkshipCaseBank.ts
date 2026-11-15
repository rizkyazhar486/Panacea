/**
 * @file indonesianClinicalClerkshipCaseBank.ts
 * @description Bank Kasus Klinis Lintas Stase Koas (THT-KL, Kardiologi, Bedah, Neurologi, IPD)
 * berbasis Standar Kompetensi Dokter Indonesia (SKDI 4A/3B/3A) dan terhubung ke Z-Anatomy.
 */

import {
  evaluateClinicalClerkshipCaseScenario,
  type ClerkshipDepartmentCode
} from "../engine/clinicalClerkshipCaseSimulatorEngine.ts";

export interface ClerkshipCaseTemplate {
  readonly scenarioId: string;
  readonly department: ClerkshipDepartmentCode;
  readonly targetOrganQuery: string;
  readonly chiefComplaintId: string;
  readonly keyPhysicalExamFindingId: string;
  readonly candidateDiagnosisIcd10: string;
  readonly skdiCompetencyTarget: "4A" | "3B" | "3A";
}

export const INDONESIAN_CLERKSHIP_CASE_BANK: readonly ClerkshipCaseTemplate[] = [
  {
    scenarioId: "CASE-THT-OMA-001",
    department: "THT_KL",
    targetOrganQuery: "Ear",
    chiefComplaintId: "Otalgia akut telinga kanan disertai demam dan penurunan pendengaran konduktif",
    keyPhysicalExamFindingId: "Otoskopi: membran timpani hiperemis dan bulging di kuadran posterosuperior; Rinne negatif",
    candidateDiagnosisIcd10: "H66.0",
    skdiCompetencyTarget: "4A"
  },
  {
    scenarioId: "CASE-CARDIO-STEMI-002",
    department: "KARDIOLOGI",
    targetOrganQuery: "Heart",
    chiefComplaintId: "Nyeri dada substernal tipikal > 20 menit menjalar ke lengan kiri dan rahang",
    keyPhysicalExamFindingId: "EKG 12-lead: elevasi segmen ST konkaf di sadapan V1-V4 ( oklusi LAD )",
    candidateDiagnosisIcd10: "I21.0",
    skdiCompetencyTarget: "3B"
  },
  {
    scenarioId: "CASE-SURG-HERNIA-003",
    department: "BEDAH_UMUM",
    targetOrganQuery: "External abdominal oblique",
    chiefComplaintId: "Benjolan di lipat paha kanan yang keluar saat mengedan/batuk dan masuk kembali saat berbaring",
    keyPhysicalExamFindingId: "Finger test positif pada impuls di atas Ligamentum Inguinale melalui Kanalis Inguinalis",
    candidateDiagnosisIcd10: "K40.9",
    skdiCompetencyTarget: "4A"
  },
  {
    scenarioId: "CASE-NEURO-STROKE-004",
    department: "NEUROLOGI",
    targetOrganQuery: "Brain",
    chiefComplaintId: "Hemiparesis dekstra mendadak disertai afasia motorik Broca sejak 2 jam SMRS",
    keyPhysicalExamFindingId: "Defisit saraf kranial CN VII & XII dekstra tipe sentral; teritori Arteria Cerebri Media (MCA) sinistra",
    candidateDiagnosisIcd10: "I63.5",
    skdiCompetencyTarget: "3B"
  },
  {
    scenarioId: "CASE-IPD-HEPATOBILIARY-005",
    department: "PENYAKIT_DALAM",
    targetOrganQuery: "Liver",
    chiefComplaintId: "Nyeri kolik kuadran kanan atas (RUQ) pasca-makan berlemak disertai demam dan ikterus",
    keyPhysicalExamFindingId: "Murphy sign positif pada palpasi inspirasi dalam di titik kandung empedu",
    candidateDiagnosisIcd10: "K81.0",
    skdiCompetencyTarget: "3B"
  }
];

export function runAllClerkshipCaseBankSimulations(defaultFsrsRating: 1 | 2 | 3 | 4 = 4) {
  return INDONESIAN_CLERKSHIP_CASE_BANK.map((c) =>
    evaluateClinicalClerkshipCaseScenario({
      scenarioId: c.scenarioId,
      department: c.department,
      targetOrganQuery: c.targetOrganQuery,
      chiefComplaintId: c.chiefComplaintId,
      keyPhysicalExamFindingId: c.keyPhysicalExamFindingId,
      candidateDiagnosisIcd10: c.candidateDiagnosisIcd10,
      studentSelfRatingFsrs: defaultFsrsRating
    })
  );
}
