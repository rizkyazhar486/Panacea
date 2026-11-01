export type CoronaryDominance = "RIGHT_DOMINANT" | "LEFT_DOMINANT" | "CODOMINANT";

// BX-2 (PR #2963): AHA-17 Coronary Vascular Territory Mapping
export function resolveAha17CoronaryTerritory(segmentNumber: number, dominance: CoronaryDominance) {
  if (!Number.isInteger(segmentNumber) || segmentNumber < 1 || segmentNumber > 17) {
    throw new RangeError("BX-2 Guard: AHA myocardial segment must be an integer in [1, 17].");
  }
  const ladSegments = [1, 2, 7, 8, 13, 14, 17];
  const lcxSegments = [5, 6, 11, 12, 16];
  if (ladSegments.includes(segmentNumber)) {
    return { segmentNumber, primaryArtery: "LAD", isWatershedVariant: segmentNumber === 17, truthClass: "SIMULATED_EDUCATIONAL" as const };
  }
  if (lcxSegments.includes(segmentNumber)) {
    return { segmentNumber, primaryArtery: "LCX", isWatershedVariant: false, truthClass: "SIMULATED_EDUCATIONAL" as const };
  }
  const primaryArtery = dominance === "LEFT_DOMINANT" ? "LCX_PDA" : dominance === "CODOMINANT" ? "CODOMINANT_RCA_LCX" : "RCA";
  return { segmentNumber, primaryArtery, isWatershedVariant: segmentNumber === 4 || segmentNumber === 10 || segmentNumber === 15, truthClass: "SIMULATED_EDUCATIONAL" as const };
}

// BX-3 (PR #2959): Pathological Gait Biomechanics
export function analyzeGaitBiomechanics(stepsPerMin: number, strideLengthMeters: number, leftStepSec: number, rightStepSec: number) {
  if (stepsPerMin <= 0 || strideLengthMeters <= 0 || leftStepSec <= 0 || rightStepSec <= 0) {
    throw new RangeError("BX-3 Guard: Gait parameters must be positive.");
  }
  const velocityMetersPerSec = Number(((stepsPerMin / 120) * strideLengthMeters).toFixed(3));
  const asymmetryPercent = Number(((Math.abs(leftStepSec - rightStepSec) / ((leftStepSec + rightStepSec) / 2)) * 100).toFixed(2));
  return { cadenceStepsMin: stepsPerMin, strideLengthMeters, velocityMetersPerSec, asymmetryPercent, truthClass: "SIMULATED_EDUCATIONAL" as const };
}

// BX-5 (PR #2958): Hadlock Fetal Growth Trajectory (EFW)
export function computeHadlockEstimatedFetalWeightGrams(hcCm: number | null, acCm: number | null, flCm: number | null, gestationalWeeks: number) {
  if (hcCm === null || acCm === null || flCm === null || hcCm <= 0 || acCm <= 0 || flCm <= 0 || gestationalWeeks < 14 || gestationalWeeks > 42) {
    throw new RangeError("BX-5 Guard: Missing biometric measurement or gestational age outside [14, 42] weeks.");
  }
  const log10Efw = 1.326 - 0.00326 * acCm * flCm + 0.0107 * hcCm + 0.0438 * acCm + 0.158 * flCm;
  return { estimatedFetalWeightGrams: Math.round(Math.pow(10, log10Efw)), gestationalWeeks, truthClass: "SIMULATED_EDUCATIONAL" as const };
}

// BX-6 (PR #2962): DICOM LPS Imaging-Plane Geometry & Orthogonality Verification
export function verifyDicomSliceNormalLps(rowCosines: readonly [number, number, number], colCosines: readonly [number, number, number]) {
  const dot = rowCosines[0] * colCosines[0] + rowCosines[1] * colCosines[1] + rowCosines[2] * colCosines[2];
  if (Math.abs(dot) > 1e-4) throw new RangeError("BX-6 Guard: Non-orthogonal DICOM orientation vectors.");
  const normalLps: [number, number, number] = [
    Number((rowCosines[1] * colCosines[2] - rowCosines[2] * colCosines[1]).toFixed(6)),
    Number((rowCosines[2] * colCosines[0] - rowCosines[0] * colCosines[2]).toFixed(6)),
    Number((rowCosines[0] * colCosines[1] - rowCosines[1] * colCosines[0]).toFixed(6))
  ];
  return { normalLps, orthogonalVerified: true as const };
}

// BX-7 (PR #2955): Viscerosomatic Referred Pain & Dermatomal Convergence
export function resolveViscerosomaticReferredPain(organKey: "HEART_MYOCARDIUM" | "DIAPHRAGM_CENTRAL" | "GALLBLADDER" | "APPENDIX_EARLY") {
  const map = {
    HEART_MYOCARDIUM: { dermatomes: ["T1", "T2", "T3", "T4"], pathway: "Sympathetic visceral afferents converging on upper thoracic dorsal horn" },
    DIAPHRAGM_CENTRAL: { dermatomes: ["C3", "C4", "C5"], pathway: "Phrenic nerve somatosensory convergence (Kehr sign shoulder tip)" },
    GALLBLADDER: { dermatomes: ["T7", "T8", "T9", "C3_C5_RIGHT"], pathway: "Celiac plexus & right phrenic peritoneal irritation" },
    APPENDIX_EARLY: { dermatomes: ["T10"], pathway: "Lesser splanchnic periumbilical visceral afferent convergence" }
  } as const;
  return { organKey, ...map[organKey], educationalAssociationOnly: true as const };
}

// BX-10 (PR #2961): Fail-Closed Anatomical Asset Review & SHA-256 Provenance
export function verifyAnatomicalAssetApproval(sha256: string, license: string, reviewerId: string | null) {
  if (!/^[a-f0-9]{64}$/i.test(sha256) || !license || !reviewerId) {
    return { approvedForCanonicalRender: false as const, state: "FAIL_CLOSED_UNVERIFIED" as const };
  }
  return { approvedForCanonicalRender: true as const, state: "ANATOMIST_REVIEWED" as const, reviewerId };
}