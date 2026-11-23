/** T-CLIN-ADV-02: Spatiotemporal Entropic Cellular Aging & Longevity Engine */
export interface SpatiotemporalAgingState {
  chronologicalYears: number;
  biologicalEntropicAge: number;
  spatialStructuralIntegrityPct: number;
  telomereAttritionRateKbPerYear: number;
  cellularResilienceIndex: number;
  longevityTrajectoryStatus: 'optimal_equilibrium' | 'accelerated_entropy' | 'compensatory_homeostasis';
}

export function simulateSpatiotemporalAging(
  chronologicalYears: number, 
  mitochondrialOxidativeLoad: number, 
  microenvironmentalStress: number
): SpatiotemporalAgingState {
  const load = Math.max(0, Math.min(1, mitochondrialOxidativeLoad));
  const stress = Math.max(0, Math.min(1, microenvironmentalStress));
  
  const entropicFactor = 1.0 + (load * 0.35) + (stress * 0.25);
  const biologicalEntropicAge = chronologicalYears * entropicFactor;
  
  const spatialStructuralIntegrityPct = Math.max(0, Math.min(100, 100.0 - ((biologicalEntropicAge - chronologicalYears) * 1.8)));
  const telomereAttritionRateKbPerYear = 0.045 * entropicFactor;
  const cellularResilienceIndex = Math.max(0.0, Math.min(1.0, 1.0 - (load * stress * 0.8)));
  
  let trajectory: SpatiotemporalAgingState['longevityTrajectoryStatus'] = 'optimal_equilibrium';
  if (entropicFactor > 1.3) {
    trajectory = 'accelerated_entropy';
  } else if (entropicFactor > 1.15) {
    trajectory = 'compensatory_homeostasis';
  }

  return {
    chronologicalYears,
    biologicalEntropicAge: Number(biologicalEntropicAge.toFixed(2)),
    spatialStructuralIntegrityPct: Number(spatialStructuralIntegrityPct.toFixed(2)),
    telomereAttritionRateKbPerYear: Number(telomereAttritionRateKbPerYear.toFixed(4)),
    cellularResilienceIndex: Number(cellularResilienceIndex.toFixed(4)),
    longevityTrajectoryStatus: trajectory
  };
}
