export type BiologicalScale =
  | "WHOLE_HUMAN"
  | "ORGAN_SYSTEM"
  | "ORGAN"
  | "ANATOMICAL_SUBSTRUCTURE"
  | "TISSUE"
  | "CELL"
  | "ORGANELLE"
  | "MOLECULAR_STRUCTURE"
  | "SIGNALING_PATHWAY"
  | "RNA_DNA"
  | "GENOMIC_REGULATION";

export type ObservationTruthClass =
  | "OBSERVED_CLINICAL"
  | "DERIVED_CLINICAL"
  | "SIMULATED_EDUCATIONAL"
  | "INFERRED_HYPOTHESIS";

export interface CanonicalOverlayObservation {
  readonly observationId: string;
  readonly anatomicalStructureId: string;
  readonly metricCode: string;
  readonly value: number | null;
  readonly unit: string;
  readonly truthClass: ObservationTruthClass;
}

export function mergeOverlayObservationsSafely(
  clinical: CanonicalOverlayObservation | null,
  simulated: CanonicalOverlayObservation | null
) {
  if (clinical && clinical.truthClass !== "OBSERVED_CLINICAL" && clinical.truthClass !== "DERIVED_CLINICAL") {
    throw new Error("BX-8 SAFETY VIOLATION: Simulated data cannot masquerade as clinical truth.");
  }
  return {
    authoritativeClinicalValue: clinical === null || clinical.value === null ? ("MISSING_OBSERVATION" as const) : clinical.value,
    educationalSandboxValue: simulated ? simulated.value : null,
    separationIntegrityVerified: true as const
  };
}

export function computeHemodynamics(hr: number, edv: number, esv: number, sbp: number, dbp: number, rap: number) {
  if (hr <= 0 || edv <= esv || esv < 0 || sbp <= dbp) {
    throw new RangeError("Invalid hemodynamic parameters");
  }
  const sv = Number((edv - esv).toFixed(2));
  const ef = Number(((sv / edv) * 100).toFixed(2));
  const co = Number(((hr * sv) / 1000).toFixed(3));
  const map = Number((dbp + (sbp - dbp) / 3).toFixed(2));
  const svr = Number((((map - rap) / co) * 80).toFixed(1));
  return {
    strokeVolumeMl: sv,
    ejectionFractionPercent: ef,
    cardiacOutputLMin: co,
    meanArterialPressureMmHg: map,
    svrDynSecCm5: svr,
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

export function computeAlveolarPO2(fiO2: number, pb: number, ph2o: number, paCO2: number, rq: number) {
  if (fiO2 < 0.1 || fiO2 > 1.0 || rq <= 0 || pb <= ph2o) {
    throw new RangeError("Invalid alveolar gas inputs");
  }
  return Number((fiO2 * (pb - ph2o) - paCO2 / rq).toFixed(2));
}

export function computeAlveolarGasAndAaGradient(params: {
  readonly fiO2Fraction: number;
  readonly barometricPressureMmHg?: number;
  readonly waterVaporPressureMmHg?: number;
  readonly paCO2MmHg: number;
  readonly respiratoryQuotient?: number;
  readonly measuredPaO2MmHg: number;
  readonly patientAgeYears?: number;
}) {
  const pb = params.barometricPressureMmHg ?? 760;
  const ph2o = params.waterVaporPressureMmHg ?? 47;
  const rq = params.respiratoryQuotient ?? 0.8;
  const alveolarPO2MmHg = computeAlveolarPO2(params.fiO2Fraction, pb, ph2o, params.paCO2MmHg, rq);
  const alveolarArterialGradientMmHg = Number((alveolarPO2MmHg - params.measuredPaO2MmHg).toFixed(2));
  const expectedUpperNormalAaGradientMmHg =
    typeof params.patientAgeYears === "number" ? Number((params.patientAgeYears / 4 + 4).toFixed(1)) : null;
  return {
    value: {
      alveolarPO2MmHg,
      alveolarArterialGradientMmHg,
      expectedUpperNormalAaGradientMmHg
    },
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}

export function computeHillOccupancy(ligandConcentration: number, kd: number, hillN: number) {
  if (ligandConcentration < 0 || kd <= 0 || hillN <= 0) {
    throw new RangeError("Invalid Hill pharmacology inputs");
  }
  if (ligandConcentration === 0) return 0;
  const logRatio = hillN * Math.log(ligandConcentration / kd);
  return Number((1 / (1 + Math.exp(-logRatio))).toFixed(6));
}