/** T-CLIN-132: Platelet Activation & Thromboembolism Cascade Simulator */
export interface PlateletState {
  gpiibiiiaActivation: number; // %
  thrombinLevel: number; // nM
  bleedingRiskScore: number;
  thrombosisRiskScore: number;
}
export function evaluatePlateletCascade(adpExposure: number, aspirinInhibition: number, p2y12Blocker: number): PlateletState {
  const rawActivation = adpExposure * 100;
  const inhibitionFactor = Math.min(1.0, (aspirinInhibition * 0.4) + (p2y12Blocker * 0.6));
  const gpiibiiiaActivation = Math.max(0, rawActivation * (1.0 - inhibitionFactor));
  const thrombinLevel = 15.0 + (adpExposure * 5.0);
  const bleedingRiskScore = (aspirinInhibition > 0 ? 30 : 10) + (p2y12Blocker > 0 ? 40 : 0);
  const thrombosisRiskScore = Math.max(0, 100 - gpiibiiiaActivation);
  return { gpiibiiiaActivation, thrombinLevel, bleedingRiskScore, thrombosisRiskScore };
}
