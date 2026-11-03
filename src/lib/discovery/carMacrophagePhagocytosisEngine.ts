/** T-CLIN-181: Chimeric Antigen Receptor (CAR) Macrophage Phagocytosis Kinetics Engine */
export interface CarMacrophageState { surfaceTargetDensity: number; phagocyticEfficiencyPct: number; tumorCellClearanceRate: number; inflammatoryCytokineRelease: 'low' | 'moderate' | 'high' | 'surge'; }
export function simulateCarMacrophage(targetAntigenExpression: number, macrophageEffectorRatio: number, immunosuppressiveTmeFactor: number): CarMacrophageState {
  const antigen = Math.max(0, Math.min(1, targetAntigenExpression));
  const ratio = Math.max(0.1, macrophageEffectorRatio);
  const tmeInhibition = Math.max(0, Math.min(1, immunosuppressiveTmeFactor));
  const efficiency = Math.min(100, (antigen * ratio * 80.0) * (1.0 - (tmeInhibition * 0.7)));
  const clearanceRate = efficiency * 0.05;
  let cytokine: CarMacrophageState['inflammatoryCytokineRelease'] = 'moderate';
  if (efficiency > 75) cytokine = 'surge';
  else if (efficiency > 50) cytokine = 'high';
  else if (efficiency < 20) cytokine = 'low';
  return { surfaceTargetDensity: antigen * 1000, phagocyticEfficiencyPct: efficiency, tumorCellClearanceRate: clearanceRate, inflammatoryCytokineRelease: cytokine };
}
