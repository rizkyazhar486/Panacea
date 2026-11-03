/** T-CLIN-137: Cardiac Myocyte Action Potential Phase 0-4 Electrophysiology */
export interface ActionPotentialState {
  restingPotentialMv: number;
  peakOvershootMv: number;
  actionPotentialDurationMs: number;
  conductionVelocityMs: number;
}
export function simulateCardiacActionPotential(extracellularKmM: number, sodiumChannelBlock: boolean): ActionPotentialState {
  const restingPotentialMv = -85.0 + (extracellularKmM > 5.5 ? (extracellularKmM - 4.0) * 8.0 : 0);
  const peakOvershootMv = sodiumChannelBlock ? +10.0 : +35.0;
  const actionPotentialDurationMs = 300.0 + (extracellularKmM > 6.0 ? -40.0 : 0);
  const conductionVelocityMs = sodiumChannelBlock ? 0.4 : 0.7;
  return { restingPotentialMv, peakOvershootMv, actionPotentialDurationMs, conductionVelocityMs };
}
