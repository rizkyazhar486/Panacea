/** T-CLIN-183: Serum Sodium Correction & Osmotic Demyelination Risk CDS */
export interface SodiumCorrectionAssessment { currentSodium: number; targetSodium24h: number; maxSafeCorrectionRate24h: number; correctionVelocitySafe: boolean; osmoticDemyelinationRisk: 'low' | 'moderate' | 'high'; }
export function evaluateSodiumCorrection(currentSodium: number, targetSodium24h: number, isChronicHyponatremia: boolean): SodiumCorrectionAssessment {
  const maxSafeCorrectionRate24h = isChronicHyponatremia ? 8.0 : 12.0; // max 8-10 mEq/L per 24h for chronic to avoid CPM
  const proposedDelta = targetSodium24h - currentSodium;
  const correctionVelocitySafe = proposedDelta <= maxSafeCorrectionRate24h;
  let risk: SodiumCorrectionAssessment['osmoticDemyelinationRisk'] = 'low';
  if (proposedDelta > 12.0) risk = 'high';
  else if (proposedDelta > 8.0 && isChronicHyponatremia) risk = 'moderate';
  return { currentSodium, targetSodium24h, maxSafeCorrectionRate24h, correctionVelocitySafe, osmoticDemyelinationRisk: risk };
}
