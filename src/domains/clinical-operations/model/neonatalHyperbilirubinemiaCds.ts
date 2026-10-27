/** T-CLIN-135: Neonatal Hyperbilirubinemia & Phototherapy Nomogram CDS */
export interface BilirubinAssessment {
  totalSerumBilirubin: number; // mg/dL
  infantAgeHours: number;
  riskZone: 'low' | 'intermediate' | 'high' | 'critical';
  phototherapyIndicated: boolean;
  exchangeTransfusionIndicated: boolean;
}
export function evaluateNeonatalBilirubin(tsb: number, hours: number, gestationalAgeWeeks: number, hasRiskFactors: boolean): BilirubinAssessment {
  let riskZone: BilirubinAssessment['riskZone'] = 'low';
  let photoThreshold = 15.0;
  if (hours < 24) { photoThreshold = 8.0; }
  else if (hours < 48) { photoThreshold = 12.0; }
  else if (hours < 72) { photoThreshold = 15.0; }
  else { photoThreshold = 18.0; }
  if (gestationalAgeWeeks < 38 || hasRiskFactors) { photoThreshold -= 3.0; }
  const phototherapyIndicated = tsb >= photoThreshold;
  const exchangeTransfusionIndicated = tsb >= (photoThreshold + 7.0);
  if (tsb >= photoThreshold) { riskZone = 'high'; }
  else if (tsb >= photoThreshold - 3.0) { riskZone = 'intermediate'; }
  else { riskZone = 'low'; }
  if (exchangeTransfusionIndicated) { riskZone = 'critical'; }
  return { totalSerumBilirubin: tsb, infantAgeHours: hours, riskZone, phototherapyIndicated, exchangeTransfusionIndicated };
}
