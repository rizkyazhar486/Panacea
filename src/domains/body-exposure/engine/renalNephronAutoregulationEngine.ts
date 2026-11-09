export interface RenalNephronSimulationInput {
  readonly meanArterialPressureMmHg: number;
  readonly afferentResistanceMultiplier?: number;
  readonly efferentResistanceMultiplier?: number;
  readonly bowmanCapsulePressureMmHg?: number;
  readonly glomerularOncoticPressureMmHg?: number;
  readonly ultrafiltrationCoefficientKfMlMinMmHg?: number;
  readonly adhVasopressinActivity0to1?: number;
  readonly loopDiureticFurosemideActive?: boolean;
  readonly urineSodiumMmolL?: number | null;
  readonly plasmaSodiumMmolL?: number | null;
  readonly urineCreatinineMgDl?: number | null;
  readonly plasmaCreatinineMgDl?: number | null;
}

export function simulateRenalAutoregulationAndCountercurrent(input: RenalNephronSimulationInput) {
  if (!Number.isFinite(input.meanArterialPressureMmHg) || input.meanArterialPressureMmHg <= 0) {
    throw new RangeError("meanArterialPressureMmHg must be a positive finite number.");
  }
  const map = input.meanArterialPressureMmHg;
  const pBowman = input.bowmanCapsulePressureMmHg ?? 18;
  const piGlom = input.glomerularOncoticPressureMmHg ?? 32;
  const kf = input.ultrafiltrationCoefficientKfMlMinMmHg ?? 12.5;
  const adh = Math.max(0, Math.min(1, input.adhVasopressinActivity0to1 ?? 0.65));

  // Myogenic + Tubuloglomerular Feedback (TGF) autoregulatory window: MAP 80-170 mmHg
  let autoregulatedBasePgc = 60;
  if (map < 80) {
    autoregulatedBasePgc = 60 - (80 - map) * 0.55;
  } else if (map > 170) {
    autoregulatedBasePgc = 60 + (map - 170) * 0.35;
  } else {
    autoregulatedBasePgc = 58 + ((map - 80) / 90) * 4;
  }

  const rAff = Math.max(0.3, Math.min(3.0, input.afferentResistanceMultiplier ?? 1.0));
  const rEff = Math.max(0.3, Math.min(3.0, input.efferentResistanceMultiplier ?? 1.0));
  const glomerularHydrostaticPressureMmHg = Number(Math.max(25, autoregulatedBasePgc * (rEff / (0.5 * rAff + 0.5 * rEff))).toFixed(2));

  // Starling Glomerular Filtration: NFP = P_GC - P_BS - pi_GC
  const netFiltrationPressureMmHg = Number((glomerularHydrostaticPressureMmHg - pBowman - piGlom).toFixed(2));
  const estimatedGfrMlMin = Number(Math.max(0, kf * netFiltrationPressureMmHg).toFixed(2));

  // Loop of Henle Countercurrent Multiplication (NKCC2 single-effect 200 mOsm/kg; max medullary gradient 1200 mOsm/kg)
  const nkcc2Efficiency = input.loopDiureticFurosemideActive ? 0.25 : 1.0;
  const peakMedullaryInterstitialOsmolalityMosmKg = Math.round(300 + 900 * nkcc2Efficiency * (0.5 + 0.5 * adh));
  const finalUrineOsmolalityMosmKg = Math.round(50 + (peakMedullaryInterstitialOsmolalityMosmKg - 50) * adh);

  // Fractional Excretion of Sodium (FE_Na %) if laboratory values are observed
  let fractionalExcretionSodiumPercent: number | "MISSING_OBSERVATION" = "MISSING_OBSERVATION";
  if (
    input.urineSodiumMmolL !== null && input.urineSodiumMmolL !== undefined &&
    input.plasmaSodiumMmolL !== null && input.plasmaSodiumMmolL !== undefined &&
    input.urineCreatinineMgDl !== null && input.urineCreatinineMgDl !== undefined &&
    input.plasmaCreatinineMgDl !== null && input.plasmaCreatinineMgDl !== undefined &&
    input.plasmaSodiumMmolL > 0 && input.urineCreatinineMgDl > 0
  ) {
    fractionalExcretionSodiumPercent = Number(
      (((input.urineSodiumMmolL * input.plasmaCreatinineMgDl) / (input.plasmaSodiumMmolL * input.urineCreatinineMgDl)) * 100).toFixed(2)
    );
  }

  return {
    uberonKidneyId: "UBERON:0002113" as const,
    uberonNephronId: "UBERON:0001285" as const,
    cellOntologyPodocyteId: "CL:0000653" as const,
    inputUnits: {
      pressure: "mmHg",
      filtrationRate: "mL/min",
      osmolality: "mOsm/kg H2O"
    },
    glomerularHydrostaticPressureMmHg,
    netFiltrationPressureMmHg,
    estimatedGfrMlMin,
    tubuloglomerularFeedbackState: map >= 80 && map <= 170 ? ("AUTOREGULATED_PLATEAU" as const) : map < 80 ? ("MAXIMAL_MACULA_DENSA_VASODILATION" as const) : ("AUTOREGULATORY_BREAKTHROUGH" as const),
    peakMedullaryInterstitialOsmolalityMosmKg,
    finalUrineOsmolalityMosmKg,
    fractionalExcretionSodiumPercent,
    modelAssumptions: "Steady-state Starling glomerular filtration coupled with myogenic/macula densa TGF and NKCC2 countercurrent multiplication.",
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}