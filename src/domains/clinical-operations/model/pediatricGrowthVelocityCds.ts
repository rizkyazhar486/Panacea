/** T-CLIN-157: Pediatric Growth Velocity & Z-Score Standards Evaluation CDS */
export interface PediatricGrowthAssessment { ageMonths: number; weightKg: number; heightCm: number; weightForAgeZScore: number; heightForAgeZScore: number; growthStatus: 'normal' | 'stunted' | 'wasted' | 'failure_to_thrive'; }
export function evaluatePediatricGrowth(ageMonths: number, weightKg: number, heightCm: number, medianWeight: number, sdWeight: number, medianHeight: number, sdHeight: number): PediatricGrowthAssessment {
  const weightForAgeZScore = (weightKg - medianWeight) / Math.max(0.1, sdWeight);
  const heightForAgeZScore = (heightCm - medianHeight) / Math.max(0.1, sdHeight);
  let growthStatus: PediatricGrowthAssessment['growthStatus'] = 'normal';
  if (weightForAgeZScore < -2.0 && heightForAgeZScore < -2.0) growthStatus = 'failure_to_thrive';
  else if (heightForAgeZScore < -2.0) growthStatus = 'stunted';
  else if (weightForAgeZScore < -2.0) growthStatus = 'wasted';
  return { ageMonths, weightKg, heightCm, weightForAgeZScore, heightForAgeZScore, growthStatus };
}
