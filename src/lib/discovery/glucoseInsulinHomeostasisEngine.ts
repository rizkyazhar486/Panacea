/** T-CLIN-142: Blood Glucose & Insulin-Glucagon Homeostasis Simulator */
export interface GlucoseHomeostasisState { bloodGlucoseMgDl: number; plasmaInsulinUuMl: number; insulinSensitivityIndex: number; glycemicRisk: 'normal' | 'hypoglycemia' | 'hyperglycemia' | 'insulin_resistance'; }
export function simulateGlucoseHomeostasis(carbohydrateIntakeGrams: number, fastingInsulin: number, insulinResistanceHoma: number): GlucoseHomeostasisState {
  const bg = 90.0 + (carbohydrateIntakeGrams * 0.35) * (insulinResistanceHoma * 0.8);
  const insulin = fastingInsulin + (carbohydrateIntakeGrams * 0.2);
  const sensitivity = 1.0 / Math.max(0.2, insulinResistanceHoma);
  let risk: GlucoseHomeostasisState['glycemicRisk'] = 'normal';
  if (bg < 70) risk = 'hypoglycemia';
  else if (bg >= 140) risk = 'hyperglycemia';
  else if (insulinResistanceHoma > 2.5) risk = 'insulin_resistance';
  return { bloodGlucoseMgDl: bg, plasmaInsulinUuMl: insulin, insulinSensitivityIndex: sensitivity, glycemicRisk: risk };
}
