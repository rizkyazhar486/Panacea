/** T-CLIN-147: Acute Respiratory Distress Syndrome (ARDS) Ventilation & PEEP Optimization CDS */
export interface ArdsVentilationGuidance { predictedBodyWeightKg: number; targetTidalVolumeMl: number; drivingPressureCmH2O: number; recommendedPeepCmH2O: number; paO2FiO2Ratio: number; severity: 'mild' | 'moderate' | 'severe'; }
export function calculateArdsVentilation(heightCm: number, isMale: boolean, plateauPressure: number, peep: number, paO2: number, fio2: number): ArdsVentilationGuidance {
  const pbw = isMale ? 50.0 + 0.91 * (heightCm - 152.4) : 45.5 + 0.91 * (heightCm - 152.4);
  const targetTidalVolumeMl = pbw * 6.0; // 6 mL/kg PBW protective ventilation
  const drivingPressureCmH2O = Math.max(0, plateauPressure - peep);
  const paO2FiO2Ratio = paO2 / Math.max(0.21, fio2);
  let severity: ArdsVentilationGuidance['severity'] = 'mild';
  if (paO2FiO2Ratio <= 100) severity = 'severe';
  else if (paO2FiO2Ratio <= 200) severity = 'moderate';
  let recommendedPeepCmH2O = peep;
  if (paO2FiO2Ratio < 150 && peep < 14) recommendedPeepCmH2O = 14;
  else if (paO2FiO2Ratio < 200 && peep < 10) recommendedPeepCmH2O = 10;
  return { predictedBodyWeightKg: pbw, targetTidalVolumeMl, drivingPressureCmH2O, recommendedPeepCmH2O, paO2FiO2Ratio, severity };
}
