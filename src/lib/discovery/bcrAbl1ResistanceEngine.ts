/** T-CLIN-171: BCR-ABL1 Kinase Domain Mutation & Tyrosine Kinase Resistance Engine */
export interface BcrAblResistanceState { t315iMutationDetected: boolean; panKinaseSensitivityScore: number; alternativePonatinibEfficacy: number; resistanceTier: 'sensitive' | 'moderate' | 'high_resistance' | 'pan_resistant'; }
export function simulateBcrAblResistance(exposureMonths: number, hasT315i: boolean, hasY250f: boolean): BcrAblResistanceState {
  let sensitivity = Math.max(0, 100.0 - (exposureMonths * 2.5));
  if (hasT315i) sensitivity = 5.0;
  else if (hasY250f) sensitivity = 40.0;
  const altEfficacy = hasT315i ? 90.0 : 95.0;
  let tier: BcrAblResistanceState['resistanceTier'] = 'sensitive';
  if (hasT315i) tier = 'pan_resistant';
  else if (exposureMonths > 24 || hasY250f) tier = 'high_resistance';
  else if (exposureMonths > 12) tier = 'moderate';
  return { t315iMutationDetected: hasT315i, panKinaseSensitivityScore: sensitivity, alternativePonatinibEfficacy: altEfficacy, resistanceTier: tier };
}
