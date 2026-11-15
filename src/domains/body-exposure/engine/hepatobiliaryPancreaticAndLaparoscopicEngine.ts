export interface HepatobiliaryPancreaticMealInput {
  readonly fastingPlasmaGlucoseMgDl: number;
  readonly fastingInsulinUiuMl: number;
  readonly ingestedCarbohydrateGrams: number;
  readonly ingestedProteinGrams: number;
  readonly ingestedFatGrams: number;
  readonly minutesPostprandial: number;
  readonly hepaticInsulinSensitivityIndex0to1?: number;
}

export interface LaparoscopicCalotTriangleInput {
  readonly sessionId: string;
  readonly hepatocysticTriangleCleared: boolean;
  readonly lowerThirdGallbladderMobilizedFromCysticPlate: boolean;
  readonly exactlyTwoStructuresEnteringGallbladderConfirmed: boolean;
  readonly distanceFromCommonBileDuctMm: number;
  readonly commonBileDuctDiameterMm?: number;
}

export function simulateHepatobiliaryPancreaticPostprandialDynamics(input: HepatobiliaryPancreaticMealInput) {
  if (!Number.isFinite(input.fastingPlasmaGlucoseMgDl) || input.fastingPlasmaGlucoseMgDl <= 0) {
    throw new RangeError("fastingPlasmaGlucoseMgDl must be a positive finite number.");
  }
  const t = Math.max(0, Math.min(360, input.minutesPostprandial));
  const sens = Math.max(0.2, Math.min(1.2, input.hepaticInsulinSensitivityIndex0to1 ?? 0.9));

  // Gut glucose absorption wave peaking around 45-60 mins postprandial
  const glycemicSurge = (input.ingestedCarbohydrateGrams * 0.85) * (t / 45) * Math.exp(1 - t / 45) * (1 / sens);
  const plasmaGlucoseMgDl = Number(Math.max(65, input.fastingPlasmaGlucoseMgDl + glycemicSurge * 0.55).toFixed(1));
  const portalVeinInsulinUiuMl = Number((input.fastingInsulinUiuMl + glycemicSurge * 0.92 + input.ingestedProteinGrams * 0.18).toFixed(1));
  const glucagonPgMl = Number(Math.max(25, 75 - glycemicSurge * 0.4 + input.ingestedProteinGrams * 0.35).toFixed(1));
  const cholecystokininBileEjectionFractionPercent = Number(Math.min(85, Math.max(10, 15 + input.ingestedFatGrams * 1.45)).toFixed(1));

  return {
    uberonLiverId: "UBERON:0002107" as const,
    uberonPancreasId: "UBERON:0001264" as const,
    uberonGallbladderId: "UBERON:0002110" as const,
    minutesPostprandial: t,
    plasmaGlucoseMgDl,
    portalVeinInsulinUiuMl,
    glucagonPgMl,
    insulinToGlucagonMolarRatio: Number((portalVeinInsulinUiuMl / Math.max(10, glucagonPgMl * 0.4)).toFixed(2)),
    cholecystokininBileEjectionFractionPercent,
    hepaticGlycogenSynthaseActive: plasmaGlucoseMgDl > 95 && portalVeinInsulinUiuMl > 15,
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}

export function evaluateLaparoscopicCholecystectomyCriticalViewOfSafety(input: LaparoscopicCalotTriangleInput) {
  const strasbergCriteriaCount =
    (input.hepatocysticTriangleCleared ? 1 : 0) +
    (input.lowerThirdGallbladderMobilizedFromCysticPlate ? 1 : 0) +
    (input.exactlyTwoStructuresEnteringGallbladderConfirmed ? 1 : 0);
  const criticalViewOfSafetyAchieved = strasbergCriteriaCount === 3 && input.distanceFromCommonBileDuctMm >= 5.0;

  return {
    sessionId: input.sessionId,
    procedureCode: "EDUCATIONAL_LAPAROSCOPIC_CHOLECYSTECTOMY_CVS" as const,
    operationMode: "LAPAROSCOPIC_SURGERY" as const,
    anatomicalStructures: {
      cysticDuctFmaId: "FMA:14668",
      cysticArteryFmaId: "FMA:14779",
      commonHepaticDuctFmaId: "FMA:14667",
      commonBileDuctFmaId: "FMA:9706"
    },
    strasbergCriteriaCount0to3: strasbergCriteriaCount,
    criticalViewOfSafetyAchieved,
    clipAndDividePermittedInSimulation: criticalViewOfSafetyAchieved,
    biliarySafetyAlert: criticalViewOfSafetyAchieved
      ? ("CRITICAL_VIEW_VERIFIED: Cystic duct (FMA:14668) and cystic artery (FMA:14779) isolated safely away from Common Bile Duct (FMA:9706)." as const)
      : ("BILIARY_INJURY_GUARD_HALT: Do NOT clip or divide until all 3 Strasberg Critical View of Safety criteria are achieved and CBD clearance >= 5mm." as const),
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}