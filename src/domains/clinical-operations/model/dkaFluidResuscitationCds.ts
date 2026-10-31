/** T-CLIN-165: Diabetic Ketoacidosis (DKA) Anion Gap & Fluid Resuscitation CDS */
export interface DkaAssessment { anionGap: number; correctedSodium: number; fluidDeficitMl: number; potassiumReplacementRecommended: boolean; insulinInfusionReady: boolean; }
export function evaluateDkaProtocol(sodium: number, chloride: number, bicarbonate: number, glucose: number, potassium: number, weightKg: number): DkaAssessment {
  const anionGap = sodium - (chloride + bicarbonate);
  const correctedSodium = sodium + 0.016 * (glucose - 100);
  const fluidDeficitMl = weightKg * 100.0; // Estimated 100 mL/kg deficit in severe DKA
  const potassiumReplacementRecommended = potassium < 5.0;
  const insulinInfusionReady = potassium >= 3.3;
  return { anionGap, correctedSodium, fluidDeficitMl, potassiumReplacementRecommended, insulinInfusionReady };
}
