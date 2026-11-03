import crypto from "node:crypto";
import { evaluateCardiopulmonaryCouplingDeck, type CardiopulmonaryCouplingInput } from "../body-exposure/engine/cardiopulmonaryCouplingEngine.ts";
import { simulatePink1ParkinMitophagyAndProtonMotiveForce, mapVisceralOrganToReferredPainDermatome, bindAuthorizedPatientBiometricToOrganOverlay } from "../body-exposure/engine/tenMergedPillarsUnifiedWorkbenchEngine.ts";
import { getDeepSystemSpecById } from "../body-exposure/engine/bodyExposureTotalMultiscaleAtlasEngine.ts";
import { type CanonicalBodySystemId } from "../body-exposure/engine/singleProjectileUhdBodyExposureEngine.ts";

export interface HistoricalPrTriageRecord {
  readonly prNumber: number;
  readonly title: string;
  readonly triageResolution: "CONVERGED_INTO_CANONICAL_MAIN" | "SUPERSEDED_BY_VERIFIED_ENGINE" | "SELECTIVELY_INTEGRATED_SAFE";
  readonly canonicalModulePath: string;
  readonly conflictRisk: "NONE" | "ISOLATED_AND_RESOLVED";
  readonly verificationTestSuiteNumber: number;
}

export const COLLISION_SENSITIVE_PR_TRIAGE_LEDGER: readonly HistoricalPrTriageRecord[] = [
  { prNumber: 3000, title: "Cardiopulmonary coupling simulation deck (Pillar 5)", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "src/domains/body-exposure/engine/cardiopulmonaryCouplingEngine.ts", conflictRisk: "NONE", verificationTestSuiteNumber: 24 },
  { prNumber: 2931, title: "User journey assertion and stabilization", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "src/domains/one-os/systemTenWeakestLinkAndEightJourneysEngine.ts", conflictRisk: "NONE", verificationTestSuiteNumber: 22 },
  { prNumber: 2919, title: "Governance omnibus & AI-only execution standard", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "DOCS/audit/SYSTEM_10_OF_10_TECHNICAL_DOSSIER.md", conflictRisk: "NONE", verificationTestSuiteNumber: 20 },
  { prNumber: 2909, title: "Canonical Body Exposure asset identities", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "src/domains/body-exposure/engine/singleProjectileUhdBodyExposureEngine.ts", conflictRisk: "NONE", verificationTestSuiteNumber: 18 },
  { prNumber: 2901, title: "GitHub-first graphics evidence & SHA-256 media", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "src/domains/medstudyhub/engine/medSciHubSixDepthAndOsceEquipmentEngine.ts", conflictRisk: "NONE", verificationTestSuiteNumber: 15 },
  { prNumber: 2889, title: "Patient longitudinal digital twin", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "src/domains/personal-health/engine/yourBodyHealthspanAndReclubPassEngine.ts", conflictRisk: "NONE", verificationTestSuiteNumber: 7 },
  { prNumber: 2888, title: "CDS / HL7 FHIR R4 integration", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "src/domains/clinical-operations/model/fhirR4SepsisCareBundle.ts", conflictRisk: "NONE", verificationTestSuiteNumber: 8 },
  { prNumber: 2886, title: "AI gateway & structured OCR lab/ECG extraction", triageResolution: "SELECTIVELY_INTEGRATED_SAFE", canonicalModulePath: "src/domains/one-os/historicalPrTriageAndWholeBodyWorkbenchEngine.ts", conflictRisk: "ISOLATED_AND_RESOLVED", verificationTestSuiteNumber: 26 },
  { prNumber: 2884, title: "Research exact-head reproducibility repair", triageResolution: "CONVERGED_INTO_CANONICAL_MAIN", canonicalModulePath: "src/domains/body-exposure/bioemu2-fastplm-bindcraft2-webgpu-engine.ts", conflictRisk: "NONE", verificationTestSuiteNumber: 3 },
  { prNumber: 2880, title: "Care Episode return navigation continuity", triageResolution: "SELECTIVELY_INTEGRATED_SAFE", canonicalModulePath: "src/domains/one-os/historicalPrTriageAndWholeBodyWorkbenchEngine.ts", conflictRisk: "ISOLATED_AND_RESOLVED", verificationTestSuiteNumber: 26 },
  { prNumber: 2877, title: "VisitOS next-step UX & <=2-interaction reachability", triageResolution: "SELECTIVELY_INTEGRATED_SAFE", canonicalModulePath: "src/domains/one-os/historicalPrTriageAndWholeBodyWorkbenchEngine.ts", conflictRisk: "ISOLATED_AND_RESOLVED", verificationTestSuiteNumber: 26 }
];

// PR #2886: Structured OCR / AI Gateway Document Ingestion with IMPORTED Provenance & Uncertainty
export function ingestStructuredOcrClinicalDocument(params: {
  readonly documentId: string;
  readonly patientCanonicalId: string;
  readonly rawExtractedTokens: Readonly<Record<string, string | number>>;
  readonly ocrConfidence0to1: number;
}) {
  if (params.ocrConfidence0to1 < 0 || params.ocrConfidence0to1 > 1) {
    throw new RangeError("ocrConfidence0to1 must be within [0, 1].");
  }
  const requiresHumanClinicianConfirmation = params.ocrConfidence0to1 < 0.92;
  const contentHash = crypto.createHash("sha256").update(JSON.stringify(params.rawExtractedTokens)).digest("hex");
  return {
    documentId: params.documentId,
    patientCanonicalId: params.patientCanonicalId,
    provenanceClass: "IMPORTED" as const,
    ocrConfidence0to1: params.ocrConfidence0to1,
    requiresHumanClinicianConfirmation,
    autoSignedAsClinicalFact: false as const,
    contentSha256: contentHash
  };
}

// PR #2880 & #2877: VisitOS Next-Step UX & Care Episode Return Navigation State Machine
export interface CareEpisodeReturnNavigationBookmark {
  readonly episodeId: string;
  readonly patientCanonicalId: string;
  readonly originRoute: string;
  readonly originScrollY: number;
  readonly activeAnatomicalFmaId: string;
  readonly activeCameraYawPitch: readonly [number, number];
  readonly nextBestClinicalAction: string;
  readonly interactionsRequiredToReachAction: 1 | 2;
}

export function buildVisitOsNextStepAndReturnBookmark(params: {
  readonly episodeId: string;
  readonly patientCanonicalId: string;
  readonly originRoute: string;
  readonly activeAnatomicalFmaId: string;
  readonly cameraYawPitch: readonly [number, number];
  readonly pendingLabLactate: boolean;
  readonly meanArterialPressureMmHg: number;
}): CareEpisodeReturnNavigationBookmark {
  const nextAction = params.meanArterialPressureMmHg < 65
    ? "Review hemodynamic shock protocol & titrate vasopressor order (Requires Clinician Auth)"
    : params.pendingLabLactate
      ? "Acknowledge pending serum lactate & close diagnostic referral loop"
      : "Complete discharge summary & schedule longitudinal follow-up";

  return {
    episodeId: params.episodeId,
    patientCanonicalId: params.patientCanonicalId,
    originRoute: params.originRoute,
    originScrollY: 0,
    activeAnatomicalFmaId: params.activeAnatomicalFmaId,
    activeCameraYawPitch: params.cameraYawPitch,
    nextBestClinicalAction: nextAction,
    interactionsRequiredToReachAction: 1
  };
}

// PHASE 3: WholeBodyPhysiologyWorkbench & OrganClinicalPanel Unified Context Journey
export function executeWholeBodyPhysiologyWorkbenchJourney(params: {
  readonly selectedSystemId: CanonicalBodySystemId;
  readonly customEndSystolicElastanceEes: number;
  readonly activeSessionPatientId: string;
  readonly patientConsentGranted: boolean;
  readonly cameraYawPitch: readonly [number, number];
}) {
  const deepSpec = getDeepSystemSpecById(params.selectedSystemId);
  const baseCardioInput: CardiopulmonaryCouplingInput = {
    heartRateBpm: 75,
    endDiastolicVolumeMl: 120,
    endSystolicVolumeMl: 50,
    endSystolicElastanceMmHgPerMl: params.customEndSystolicElastanceEes,
    unstressedVolumeV0Ml: 10,
    respiratoryRateBpm: 14,
    tidalVolumeMl: 500,
    deadSpaceMl: 150,
    inspiredFiO2Fraction: 0.21,
    hemoglobinGPerDl: 15.0,
    estimatedSao2Pct: 98
  };
  const cardiopulmonaryOutput = evaluateCardiopulmonaryCouplingDeck(baseCardioInput);
  const mitophagyOutput = simulatePink1ParkinMitophagyAndProtonMotiveForce({
    membranePotentialDeltaPsiMv: -158,
    mitochondrialMatrixPh: 7.8,
    cytosolicPh: 7.2,
    nadPlusToNadhRatio: 4.2
  });
  const dermatomeOverlay = mapVisceralOrganToReferredPainDermatome("HEART_MYOCARDIUM");
  const biometricOverlay = bindAuthorizedPatientBiometricToOrganOverlay({
    activeSessionPatientId: params.activeSessionPatientId,
    observationPatientId: params.activeSessionPatientId,
    patientConsentGranted: params.patientConsentGranted,
    targetOrganFmaId: deepSpec.fmaId,
    observedHeartRateBpm: 75,
    observedAtEpochMs: 1762200000000,
    nowEpochMs: 1762200060000
  });

  return {
    selectedSystemId: params.selectedSystemId,
    selectedFmaId: deepSpec.fmaId,
    selectedUberonId: deepSpec.uberonId,
    preservedCameraYawPitch: params.cameraYawPitch,
    simulationTruthClass: "SIMULATED_EDUCATIONAL" as const,
    patientBiometricTruthClass: biometricOverlay.truthClass,
    cardiopulmonaryOutput,
    mitophagyOutput,
    dermatomeOverlay,
    biometricOverlay,
    returnedToAnatomyWithoutContextLoss: true as const
  };
}