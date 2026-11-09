import {
  DEFAULT_OXYGEN_CONTENT_CONVENTION,
  oxygenContentMlDl,
  type OxygenContentConventionId
} from "../../../lib/physiology/oxygenContentConventions.ts";

export interface CardiopulmonaryCouplingInput {
  readonly heartRateBpm: number;
  readonly endDiastolicVolumeMl: number;
  readonly endSystolicVolumeMl: number;
  readonly endSystolicElastanceMmHgPerMl: number;
  readonly unstressedVolumeV0Ml: number;
  readonly respiratoryRateBpm: number;
  readonly tidalVolumeMl: number;
  readonly deadSpaceMl: number;
  readonly inspiredFiO2Fraction: number;
  readonly barometricPressureMmHg?: number;
  readonly waterVaporPressureMmHg?: number;
  readonly respiratoryQuotientR?: number;
  readonly paCO2MmHg?: number;
  readonly alveolarArterialGradientMmHg?: number;
  readonly hemoglobinGPerDl: number;
  readonly estimatedSao2Pct: number;
  readonly conventionId?: OxygenContentConventionId;
}

export function evaluateCardiopulmonaryCouplingDeck(input: CardiopulmonaryCouplingInput) {
  if (input.endDiastolicVolumeMl <= input.endSystolicVolumeMl) {
    throw new RangeError("endDiastolicVolumeMl must exceed endSystolicVolumeMl for positive stroke volume.");
  }
  if (input.endSystolicElastanceMmHgPerMl <= 0) {
    throw new RangeError("endSystolicElastanceMmHgPerMl (E_es) must be positive.");
  }
  if (input.endSystolicVolumeMl <= input.unstressedVolumeV0Ml) {
    throw new RangeError("endSystolicVolumeMl must exceed unstressedVolumeV0Ml (V0).");
  }
  if (input.tidalVolumeMl <= input.deadSpaceMl) {
    throw new RangeError("tidalVolumeMl must exceed deadSpaceMl for positive alveolar ventilation.");
  }
  if (input.estimatedSao2Pct < 0 || input.estimatedSao2Pct > 100) {
    throw new RangeError("estimatedSao2Pct must be within [0, 100].");
  }

  // 1. Ventricular Mechanics & Ventricular-Arterial Coupling (VAC)
  const strokeVolumeMl = Number((input.endDiastolicVolumeMl - input.endSystolicVolumeMl).toFixed(2));
  const ejectionFractionPct = Number(((strokeVolumeMl / input.endDiastolicVolumeMl) * 100).toFixed(2));
  const cardiacOutputLPerMin = Number(((input.heartRateBpm * strokeVolumeMl) / 1000).toFixed(3));
  const endSystolicPressureMmHg = Number((input.endSystolicElastanceMmHgPerMl * (input.endSystolicVolumeMl - input.unstressedVolumeV0Ml)).toFixed(2));
  const arterialElastanceMmHgPerMl = Number((endSystolicPressureMmHg / strokeVolumeMl).toFixed(3));
  const ventricularArterialCouplingRatio = Number((arterialElastanceMmHgPerMl / input.endSystolicElastanceMmHgPerMl).toFixed(3));

  // 2. Alveolar Ventilation & Oxygenation
  const alveolarVentilationLPerMin = Number(((input.respiratoryRateBpm * (input.tidalVolumeMl - input.deadSpaceMl)) / 1000).toFixed(3));
  const patm = input.barometricPressureMmHg ?? 760;
  const ph2o = input.waterVaporPressureMmHg ?? 47;
  const rq = input.respiratoryQuotientR ?? 0.8;
  const paco2 = input.paCO2MmHg ?? 40;
  const aaGrad = input.alveolarArterialGradientMmHg ?? 8;
  const alveolarPo2MmHg = Number((input.inspiredFiO2Fraction * (patm - ph2o) - paco2 / rq).toFixed(2));
  const pao2Est = Number(Math.max(25, alveolarPo2MmHg - aaGrad).toFixed(2));

  // 3. Canonical Registry Oxygen Content (CaO2 in mL O2/dL) & Delivery (DO2 in mL O2/min)
  const conventionId = input.conventionId ?? DEFAULT_OXYGEN_CONTENT_CONVENTION;
  const saturationFraction = input.estimatedSao2Pct / 100;
  const cao2MlPerDl = Number(oxygenContentMlDl(conventionId, input.hemoglobinGPerDl, saturationFraction, pao2Est).toFixed(2));
  const oxygenDeliveryMlPerMin = Number((cardiacOutputLPerMin * 10 * cao2MlPerDl).toFixed(1));

  return {
    conventionId,
    strokeVolumeMl,
    ejectionFractionPct,
    cardiacOutputLPerMin,
    endSystolicPressureMmHg,
    arterialElastanceMmHgPerMl,
    ventricularArterialCouplingRatio,
    alveolarVentilationLPerMin,
    alveolarPo2MmHg,
    estimatedPaO2MmHg: pao2Est,
    arterialOxygenContentMlPerDl: cao2MlPerDl,
    oxygenDeliveryMlPerMin,
    units: {
      hemoglobin: "g/dL",
      saturation: "fraction (0..1 from %)",
      paO2: "mmHg",
      caO2: "mL O2/dL",
      do2: "mL O2/min",
      cardiacOutput: "L/min"
    },
    truthClass: "SIMULATED_EDUCATIONAL" as const,
    clinicallyReviewed: false as const
  };
}