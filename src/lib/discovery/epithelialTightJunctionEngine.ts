/** T-CLIN-136: Epithelial Tight Junction Barrier & Claudin Selectivity Simulator */
export interface TightJunctionState {
  claudinSelectivityIndex: number; // 0 to 1
  paracellularNaPermeability: number; // cm/s
  barrierIntegrityScore: number; // %
}
export function simulateTightJunction(zonulaOccludensIntegrity: number, inflammationFactor: number): TightJunctionState {
  const integrity = Math.max(0, Math.min(1, zonulaOccludensIntegrity));
  const inflammation = Math.max(0, Math.min(1, inflammationFactor));
  const barrierIntegrityScore = Math.max(0, (integrity * 100) - (inflammation * 40));
  const paracellularNaPermeability = 1e-6 + ((1.0 - (barrierIntegrityScore / 100)) * 5e-6);
  const claudinSelectivityIndex = Math.max(0.1, integrity * (1.0 - (inflammation * 0.5)));
  return { claudinSelectivityIndex, paracellularNaPermeability, barrierIntegrityScore };
}
