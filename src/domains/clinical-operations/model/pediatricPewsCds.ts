/** T-CLIN-192: Pediatric Early Warning Score (PEWS) Automated Calculator */
export interface PewsAssessment { behaviorScore: number; cardiovascularScore: number; respiratoryScore: number; totalPewsScore: number; clinicalEscalationRequired: boolean; }
export function calculatePewsScore(behavior: number, cardiovascular: number, respiratory: number): PewsAssessment {
  const totalPewsScore = behavior + cardiovascular + respiratory;
  const clinicalEscalationRequired = totalPewsScore >= 4;
  return { behaviorScore: behavior, cardiovascularScore: cardiovascular, respiratoryScore: respiratory, totalPewsScore, clinicalEscalationRequired };
}
