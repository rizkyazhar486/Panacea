// E-05: Deterministic FSRS (Free Spaced Repetition Scheduler, Jarrett Ye 2023) Memory State
export type FsrsRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface FsrsMemoryCardState {
  readonly constructId: string;
  readonly stabilityDays: number;
  readonly difficulty1to10: number;
  readonly repsCount: number;
}

export function computeFsrsNextSchedule(
  prev: FsrsMemoryCardState | null,
  constructId: string,
  rating: FsrsRating,
  elapsedDays: number
): FsrsMemoryCardState & { readonly retrievability0to1: number; readonly nextIntervalDays: number } {
  if (![1, 2, 3, 4].includes(rating)) throw new RangeError("FSRS rating must be 1, 2, 3, or 4.");
  if (elapsedDays < 0) throw new RangeError("elapsedDays must be non-negative.");

  if (!prev) {
    const initStability = [0.4, 1.2, 3.1, 7.5][rating - 1];
    const initDifficulty = Number(Math.min(10, Math.max(1, 6.5 - (rating - 3) * 1.2)).toFixed(2));
    return {
      constructId,
      stabilityDays: initStability,
      difficulty1to10: initDifficulty,
      repsCount: 1,
      retrievability0to1: 1.0,
      nextIntervalDays: Math.max(1, Math.round(initStability))
    };
  }

  // Power-law forgetting curve: R(t, S) = (1 + (19/81) * (t / S))^(-0.5)
  const retrievability0to1 = Number(Math.pow(1 + (19 / 81) * (elapsedDays / Math.max(0.1, prev.stabilityDays)), -0.5).toFixed(4));
  const nextDifficulty = Number(Math.min(10, Math.max(1, prev.difficulty1to10 - 0.65 * (rating - 3))).toFixed(2));
  const growthFactor = rating === 1 ? 0.35 : 1 + (11 - nextDifficulty) * 0.18 * (1.15 - retrievability0to1 * 0.5) * (rating === 4 ? 1.3 : rating === 2 ? 0.8 : 1.0);
  const nextStability = Number(Math.max(0.4, prev.stabilityDays * growthFactor).toFixed(2));

  return {
    constructId,
    stabilityDays: nextStability,
    difficulty1to10: nextDifficulty,
    repsCount: prev.repsCount + 1,
    retrievability0to1,
    nextIntervalDays: Math.max(1, Math.round(nextStability))
  };
}

// E-04: Prometheus Interactive Lesson #2 — Respiratory Mechanics, Compliance & V/Q Mismatch
// Equation: P_peak = (V_T / C_rs) + (R_aw * Flow) + PEEP
export function evaluatePrometheusRespiratoryVqAndComplianceLesson(params: {
  readonly tidalVolumeMl: number;
  readonly respiratoryComplianceMlPerCmH2O: number;
  readonly airwayResistanceCmH2OPerLSec: number;
  readonly inspiratoryFlowLPerSec: number;
  readonly peepCmH2O: number;
  readonly alveolarVentilationLPerMin: number;
  readonly pulmonaryCapillaryPerfusionLPerMin: number;
  readonly learnerPredictedVqPhenotype: "SHUNT_LOW_VQ" | "NORMAL_MATCHED_VQ" | "DEAD_SPACE_HIGH_VQ";
}) {
  if (params.respiratoryComplianceMlPerCmH2O <= 0 || params.pulmonaryCapillaryPerfusionLPerMin <= 0) {
    throw new RangeError("Compliance and perfusion must be positive.");
  }
  const plateauPressureCmH2O = Number((params.tidalVolumeMl / params.respiratoryComplianceMlPerCmH2O + params.peepCmH2O).toFixed(2));
  const peakInspiratoryPressureCmH2O = Number((plateauPressureCmH2O + params.airwayResistanceCmH2OPerLSec * params.inspiratoryFlowLPerSec).toFixed(2));
  const drivingPressureCmH2O = Number((plateauPressureCmH2O - params.peepCmH2O).toFixed(2));
  const vqRatio = Number((params.alveolarVentilationLPerMin / params.pulmonaryCapillaryPerfusionLPerMin).toFixed(2));

  const actualPhenotype =
    vqRatio < 0.6 ? "SHUNT_LOW_VQ" :
    vqRatio > 1.2 ? "DEAD_SPACE_HIGH_VQ" : "NORMAL_MATCHED_VQ";

  return {
    truthClass: "SIMULATED" as const,
    plateauPressureCmH2O,
    peakInspiratoryPressureCmH2O,
    drivingPressureCmH2O,
    vqRatio,
    actualPhenotype,
    predictionCorrect: params.learnerPredictedVqPhenotype === actualPhenotype,
    lungProtectiveDrivingPressureSafe: drivingPressureCmH2O <= 15.0
  };
}