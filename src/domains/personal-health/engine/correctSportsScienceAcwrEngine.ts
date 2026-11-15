export interface AcwrWorkloadInput {
  readonly acuteTrainingLoadTrimp: number;
  readonly chronicTrainingLoadTrimp: number;
  readonly athleteId: string;
}

export function calculateSafeAcuteChronicWorkloadRatio(input: AcwrWorkloadInput) {
  if (input.acuteTrainingLoadTrimp < 0 || input.chronicTrainingLoadTrimp < 0) {
    throw new RangeError("Workload TRIMP values cannot be negative.");
  }
  if (!Number.isFinite(input.acuteTrainingLoadTrimp) || !Number.isFinite(input.chronicTrainingLoadTrimp)) {
    throw new TypeError("Workload values must be finite numbers.");
  }
  if (input.chronicTrainingLoadTrimp === 0) {
    return {
      acwr: null,
      workloadStatus: "CHRONIC_DENOMINATOR_ZERO_UNDEFINED" as const,
      evidenceBasedGuideline: "ACWR cannot be computed without a valid 28-day chronic training denominator (Blanchfield et al., 2016).",
      truthClass: "DERIVED_CLINICAL" as const
    };
  }

  const acwr = Number((input.acuteTrainingLoadTrimp / input.chronicTrainingLoadTrimp).toFixed(2));
  
  let workloadStatus: "SWEET_SPOT_08_TO_13" | "MODERATE_SPIKE_13_TO_15" | "HIGH_SPIKE_EXCEEDING_15" | "DELOAD_UNDER_08";
  if (acwr < 0.8) workloadStatus = "DELOAD_UNDER_08";
  else if (acwr <= 1.3) workloadStatus = "SWEET_SPOT_08_TO_13";
  else if (acwr <= 1.5) workloadStatus = "MODERATE_SPIKE_13_TO_15";
  else workloadStatus = "HIGH_SPIKE_EXCEEDING_15";

  return {
    acwr,
    workloadStatus,
    evidenceBasedGuideline: "ACWR is a statistical workload monitoring construct, not an absolute individual injury predictor. Interpret in conjunction with autonomic recovery metrics.",
    truthClass: "DERIVED_CLINICAL" as const
  };
}