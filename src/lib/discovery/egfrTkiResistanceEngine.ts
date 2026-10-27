/** T-CLIN-161: EGFR Exon 19 Deletion & Tyrosine Kinase Inhibitor Resistance Simulator */
export interface EgfrResistanceState { primarySensitizationScore: number; t790mMutationProbability: number; effectiveDrugBindingEfficacy: number; progressionRisk: 'low' | 'moderate' | 'high' | 'resistant'; }
export function simulateEgfrResistance(monthsOnTki: number, hasT790mMutation: boolean, hasC797sMutation: boolean): EgfrResistanceState {
  const primarySensitizationScore = Math.max(0, 100.0 - (monthsOnTki * 3.5));
  const t790mProbability = hasT790mMutation ? 0.95 : Math.min(0.8, monthsOnTki * 0.05);
  let efficacy = hasC797sMutation ? 0.1 : (hasT790mMutation ? 0.3 : (primarySensitizationScore / 100.0));
  let risk: EgfrResistanceState['progressionRisk'] = 'low';
  if (hasC797sMutation || (monthsOnTki > 12 && hasT790mMutation)) risk = 'resistant';
  else if (monthsOnTki > 9) risk = 'high';
  else if (monthsOnTki > 4) risk = 'moderate';
  return { primarySensitizationScore, t790mMutationProbability: t790mProbability, effectiveDrugBindingEfficacy: efficacy, progressionRisk: risk };
}
