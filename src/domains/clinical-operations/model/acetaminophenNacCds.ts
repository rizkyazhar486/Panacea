/** T-CLIN-174: Acetaminophen (Paracetamol) Hepatotoxicity & N-Acetylcysteine Nomogram CDS */
export interface AcetaminophenAssessment { hoursPostIngestion: number; plasmaLevelMcgMl: number; toxicLineThresholdMcgMl: number; nacTreatmentIndicated: boolean; hepatotoxicityRisk: 'none' | 'possible' | 'probable'; }
export function evaluateAcetaminophenToxicity(hours: number, levelMcgMl: number): AcetaminophenAssessment {
  // Rumack-Matthew nomogram 4-hour line threshold = 150 mcg/mL, 12-hour = 37.5 mcg/mL
  let threshold = 150.0 * Math.exp(-0.116 * Math.max(0, hours - 4));
  if (hours < 4) threshold = 200.0; // Early estimation
  const nacTreatmentIndicated = levelMcgMl >= threshold;
  let risk: AcetaminophenAssessment['hepatotoxicityRisk'] = 'none';
  if (nacTreatmentIndicated) risk = 'probable';
  else if (levelMcgMl >= threshold * 0.75) risk = 'possible';
  return { hoursPostIngestion: hours, plasmaLevelMcgMl: levelMcgMl, toxicLineThresholdMcgMl: threshold, nacTreatmentIndicated, hepatotoxicityRisk: risk };
}
