/** T-CLIN-191: KRAS G12C Inhibitor Resistance & GTPase Cycling Simulator */
export interface KrasResistanceState { switchIiPocketOccupancy: number; gtpGdpCyclingRate: number; bypassPathwayActivation: boolean; resistanceScore: number; }
export function simulateKrasG12cResistance(treatmentWeeks: number, hasSecondaryMutation: boolean): KrasResistanceState {
  const switchIiPocketOccupancy = Math.max(10, 100.0 - (treatmentWeeks * 2.0));
  const gtpGdpCyclingRate = hasSecondaryMutation ? 85.0 : 30.0 + (treatmentWeeks * 1.5);
  const bypassPathwayActivation = treatmentWeeks > 24 || hasSecondaryMutation;
  const resistanceScore = Math.min(100, (treatmentWeeks * 2.5) + (hasSecondaryMutation ? 40 : 0));
  return { switchIiPocketOccupancy, gtpGdpCyclingRate, bypassPathwayActivation, resistanceScore };
}
