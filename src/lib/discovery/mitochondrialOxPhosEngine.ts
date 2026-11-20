/** T-CLIN-141: Mitochondrial Oxidative Phosphorylation & ATP Synthase Kinetic Engine */
export interface OxPhosState { protonGradientMv: number; atpProductionRateMmolMin: number; rosGenerationRate: number; efficiencyPct: number; }
export function simulateOxPhos(substrateSupply: number, adpLevel: number, oxygenTension: number): OxPhosState {
  const supply = Math.max(0, Math.min(1, substrateSupply));
  const adp = Math.max(0, Math.min(1, adpLevel));
  const o2 = Math.max(0, Math.min(1, oxygenTension));
  const protonGradientMv = 150.0 * supply * o2;
  const atpProductionRateMmolMin = protonGradientMv * adp * 2.4;
  const rosGenerationRate = (1.0 - o2) * 15.0 + (supply > 0.8 ? 5.0 : 1.0);
  const efficiencyPct = Math.min(100, (atpProductionRateMmolMin / (atpProductionRateMmolMin + rosGenerationRate)) * 100);
  return { protonGradientMv, atpProductionRateMmolMin, rosGenerationRate, efficiencyPct };
}
