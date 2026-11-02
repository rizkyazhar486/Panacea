/**
 * Panacea Mitochondrial Substrate Flux & Metabolic Flexibility Simulator
 *
 * Couples intracellular biochemistry with whole-body exercise energetics:
 * 1. Randle PJ et al. The glucose fatty-acid cycle. Lancet. 1963;1(7285):785-9 (PMID: 13990765).
 * 2. Brooks GA, Mercier J. Balance of carbohydrate and lipid utilization during exercise:
 *    the "crossover" concept. J Appl Physiol. 1994;76(6):2253-61 (PMID: 8063640).
 * 3. San-Millán I, Brooks GA. Assessment of Metabolic Flexibility by Means of Measuring
 *    Blood Lactate, Fat, and Carbohydrate Oxidation Responses to Exercise in Professional Athletes
 *    and Individuals with Overweight and Type 2 Diabetes. Sports Med. 2018;48(2):467-479 (PMID: 29294246).
 */

export interface MitochondrialFluxInput {
  /** Relative exercise intensity as percentage of VO2max (e.g. 65 for 65%) */
  readonly intensityPercentVo2max: number;
  /** Mitochondrial volume density ratio normalized to healthy baseline (0.6 - 2.0) */
  readonly mitochondrialDensityRatio?: number;
  /** Muscle glycogen availability percentage (0 - 100%) */
  readonly glycogenAvailabilityPercent?: number;
  /** Baseline body weight in kg (used for absolute gram oxidation estimates) */
  readonly bodyWeightKg?: number;
}

export type MetabolicTrainingZone =
  | 'ZONE_1_ACTIVE_RECOVERY'
  | 'ZONE_2_FATMAX_ENDURANCE'
  | 'ZONE_3_AEROBIC_TEMPO'
  | 'ZONE_4_LACTATE_THRESHOLD_OBLA'
  | 'ZONE_5_ANAEROBIC_GLYCOLYTIC';

export interface MitochondrialFluxOutput {
  readonly lipidOxidationGramsPerMin: number;
  readonly carbohydrateOxidationGramsPerMin: number;
  readonly respiratoryExchangeRatioRer: number;
  readonly estimatedLactateMmolL: number;
  readonly atpTurnoverMolesPerMin: number;
  readonly metabolicFlexibilityScore: number;
  readonly zoneClassification: MetabolicTrainingZone;
  readonly substrateEnergyPartition: {
    readonly lipidEnergyFraction: number;
    readonly carbohydrateEnergyFraction: number;
  };
  readonly clinicalPhysiologySummary: string;
}

/**
 * Calculates continuous mitochondrial substrate partitioning, RER, and lactate accumulation
 * based on the Brooks Crossover and San-Millán metabolic flexibility framework.
 */
export function calculateMitochondrialSubstrateFlux(
  input: MitochondrialFluxInput,
): MitochondrialFluxOutput {
  const intensity = Math.max(10, Math.min(100, input.intensityPercentVo2max));
  const mitoDensity = Math.max(0.5, Math.min(2.5, input.mitochondrialDensityRatio ?? 1.0));
  const glycogen = Math.max(5, Math.min(100, input.glycogenAvailabilityPercent ?? 100));
  const weightKg = Math.max(40, Math.min(150, input.bodyWeightKg ?? 70));

  // FatMax typically peaks around 60-65% VO2max in trained athletes (higher with greater mito density)
  const peakFatMaxIntensity = Math.min(75, 55 + (mitoDensity - 1.0) * 15);
  
  // Normalized bell-shaped curve for lipid beta-oxidation (CPT-1 activity)
  const lipidFactor = Math.max(
    0,
    Math.exp(-Math.pow((intensity - peakFatMaxIntensity) / 22, 2)),
  );
  
  // Peak lipid oxidation ~ 0.5 - 1.0 g/min in humans depending on mitochondrial density
  const maxLipidRate = 0.65 * mitoDensity * (weightKg / 70);
  const lipidOxidationGramsPerMin = Math.round(maxLipidRate * lipidFactor * 100) / 100;

  // Carbohydrate oxidation increases monotonically with intensity (PDH activation)
  // Shifted steeper as glycogen is abundant or intensity surpasses crossover point
  const carbFactor = Math.pow(intensity / 100, 2.2) * (glycogen / 100);
  const maxCarbRate = 3.8 * (weightKg / 70);
  const carbohydrateOxidationGramsPerMin = Math.round(maxCarbRate * carbFactor * 100) / 100;

  // Energy release: Lipids ~ 9.3 kcal/g (~39 kJ/g), Carbohydrates ~ 4.1 kcal/g (~17 kJ/g)
  const lipidKcalMin = lipidOxidationGramsPerMin * 9.3;
  const carbKcalMin = carbohydrateOxidationGramsPerMin * 4.1;
  const totalKcalMin = Math.max(0.1, lipidKcalMin + carbKcalMin);

  const lipidFraction = Math.round((lipidKcalMin / totalKcalMin) * 100) / 100;
  const carbFraction = Math.round((1.0 - lipidFraction) * 100) / 100;

  // RER: Pure lipid = 0.707, Pure carbohydrate = 1.00
  // RER = 0.707 + (0.293 * carbFraction)
  // At supramaximal intensities (>85% VO2max), hyperventilation drives RER > 1.00
  let rer = 0.707 + 0.293 * carbFraction;
  if (intensity > 85) {
    rer += ((intensity - 85) / 15) * 0.15;
  }
  const respiratoryExchangeRatioRer = Math.round(Math.min(1.25, Math.max(0.70, rer)) * 1000) / 1000;

  // Lactate estimation based on San-Millán 2018:
  // Baseline ~ 0.8 - 1.2 mmol/L
  // LT1 (Aerobic Threshold): ~ 2.0 mmol/L (around 65-70% VO2max)
  // LT2 / OBLA (Anaerobic Threshold): ~ 4.0 mmol/L (around 80-85% VO2max)
  let estimatedLactate = 1.0;
  if (intensity > 60) {
    const aboveLt1 = (intensity - 60) / 25; // 60 to 85%
    estimatedLactate = 1.0 + Math.pow(aboveLt1, 1.8) * (3.0 / mitoDensity);
  }
  if (intensity > 85) {
    const aboveLt2 = (intensity - 85) / 15;
    estimatedLactate += Math.pow(aboveLt2, 2.2) * 6.0;
  }
  const estimatedLactateMmolL = Math.round(Math.min(18.0, Math.max(0.8, estimatedLactate)) * 10) / 10;

  // ATP turnover estimation: ~ 0.08 - 0.50 moles ATP per minute
  const atpTurnoverMolesPerMin = Math.round((totalKcalMin / 18.0) * 1000) / 1000;

  // Metabolic flexibility score (0 - 100):
  // High score indicates high peak fat oxidation rate combined with rapid lactate clearance capacity
  const flexibility = Math.min(100, Math.round(
    (lipidOxidationGramsPerMin / (0.8 * (weightKg / 70))) * 60 +
    (mitoDensity / 1.5) * 40,
  ));

  let zoneClassification: MetabolicTrainingZone;
  if (intensity < 55) zoneClassification = 'ZONE_1_ACTIVE_RECOVERY';
  else if (intensity <= 70) zoneClassification = 'ZONE_2_FATMAX_ENDURANCE';
  else if (intensity <= 80) zoneClassification = 'ZONE_3_AEROBIC_TEMPO';
  else if (intensity <= 88) zoneClassification = 'ZONE_4_LACTATE_THRESHOLD_OBLA';
  else zoneClassification = 'ZONE_5_ANAEROBIC_GLYCOLYTIC';

  let summary: string;
  if (zoneClassification === 'ZONE_2_FATMAX_ENDURANCE') {
    summary = `Optimal mitochondrial beta-oxidation active (${lipidOxidationGramsPerMin} g/min fat). CPT-1 transporter uninhibited; high mitochondrial efficiency with minimal lactate accumulation (${estimatedLactateMmolL} mmol/L).`;
  } else if (zoneClassification === 'ZONE_4_LACTATE_THRESHOLD_OBLA' || zoneClassification === 'ZONE_5_ANAEROBIC_GLYCOLYTIC') {
    summary = `Substrate crossover complete (RER ${respiratoryExchangeRatioRer.toFixed(2)}). Intracellular pyruvate production exceeds mitochondrial oxidation capacity; lactate clearance saturated (${estimatedLactateMmolL} mmol/L).`;
  } else {
    summary = `Mixed substrate combustion (${(lipidFraction * 100).toFixed(0)}% lipid, ${(carbFraction * 100).toFixed(0)}% carbohydrate). Steady-state mitochondrial aerobic flux maintained.`;
  }

  return {
    lipidOxidationGramsPerMin,
    carbohydrateOxidationGramsPerMin,
    respiratoryExchangeRatioRer,
    estimatedLactateMmolL,
    atpTurnoverMolesPerMin,
    metabolicFlexibilityScore: flexibility,
    zoneClassification,
    substrateEnergyPartition: {
      lipidEnergyFraction: lipidFraction,
      carbohydrateEnergyFraction: carbFraction,
    },
    clinicalPhysiologySummary: summary,
  };
}
