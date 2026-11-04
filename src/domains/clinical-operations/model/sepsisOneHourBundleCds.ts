export interface Sepsis2026GuidelineInput {
  readonly suspectedInfection: boolean;
  readonly qSofaScore0to3: number;
  readonly serumLactateMmolL: number | null;
  readonly meanArterialPressureMmHg: number;
  readonly bloodCultureObtainedBeforeAntimicrobials: boolean;
  readonly antimicrobialsAdministeredWithin60Min: boolean;
  readonly crystalloidResuscitation30MlPerKgComplete: boolean;
  readonly vasopressorInitiatedIfPersistentHypotension: boolean;
}

export function evaluateSepsis2026GuidelineCompliance(input: Sepsis2026GuidelineInput) {
  const lactateVal = input.serumLactateMmolL ?? 1.0;
  const shockConfirmed = input.meanArterialPressureMmHg < 65 && lactateVal > 2.0;
  
  const bundleChecklist = {
    lactateMeasuredAndRecheckedIfElevated: true,
    bloodCulturePriorToAntimicrobials: input.bloodCultureObtainedBeforeAntimicrobials,
    broadSpectrumAntimicrobialsWithin60Min: input.antimicrobialsAdministeredWithin60Min,
    rapidCrystalloid30MlPerKgForHypotensionOrLactate4: input.crystalloidResuscitation30MlPerKgComplete,
    vasopressorsForRefractoryShockMAP65: shockConfirmed ? input.vasopressorInitiatedIfPersistentHypotension : true
  };

  const compliantCount = Object.values(bundleChecklist).filter(Boolean).length;
  const bundleFullyCompliant = compliantCount === 5;

  return {
    guidelineVersion: "Surviving Sepsis Campaign 2026 Guidelines (Updated)" as const,
    shockConfirmed,
    bundleChecklist,
    bundleFullyCompliant,
    clinicalDisclaimer: "Decision support guidance only. Independent clinician authorization required for all therapeutics.",
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}