import {
  DEFAULT_OXYGEN_CONTENT_CONVENTION,
  oxygenContentMlDl,
  type OxygenContentConventionId
} from "../../../lib/physiology/oxygenContentConventions.ts";
import { kandunganOksigen } from "../../../lib/hemodinamik.ts";

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

export const CARDIOPULMONARY_DISCLAIMER =
  'Derived mechanistic cardiopulmonary simulation proxy — educational model, not an automated diagnostic or therapeutic calculator' as const;

export const CARDIOPULMONARY_PROVENANCE = Object.freeze({
  primaryCitation:
    'Sunagawa K, Maughan WL, Burkhoff D, Sagawa K. Left ventricular interaction with arterial load studied in isolated canine ventricle. Am J Physiol. 1983;245(5 Pt 1):H773-H780.',
  pmid: '6638199',
  physiologicalBasis: 'Frank-Starling law, Suga-Sagawa elastance, Laplace tension, West lung zones, Fick principle',
  formVerified: true as const,
});

export type CardiopulmonaryScenario =
  | 'normative_rest'
  | 'aerobic_exercise'
  | 'hfref_systolic_failure'
  | 'acute_pulmonary_embolism'
  | 'copd_exacerbation';

export interface CardiopulmonaryInput {
  /** Left ventricular inotropic elastance (Ees, mmHg/mL), default ~ 2.2 */
  readonly eesMmHgPerMl: number;
  /** Volume intercept at zero pressure (V0, mL), default ~ 10 */
  readonly v0Ml?: number;
  /** End-diastolic volume (Ved, mL), default ~ 120 */
  readonly vedMl: number;
  /** End-systolic volume (Ves, mL), default ~ 50 */
  readonly vesMl: number;
  /** Heart rate in beats per minute, default ~ 72 */
  readonly hrBpm: number;
  /** Mean Arterial Pressure (MAP, mmHg), default ~ 93 */
  readonly mapMmHg: number;
  /** Left ventricular wall thickness (h, mm), default ~ 10 */
  readonly lvWallThicknessMm?: number;
  /** Respiratory rate (breaths/min), default ~ 14 */
  readonly rrBpm: number;
  /** Tidal volume (VT, mL), default ~ 500 */
  readonly tidalVolumeMl: number;
  /** Anatomical dead space (VD, mL), default ~ 150 */
  readonly deadSpaceMl?: number;
  /** Fraction of inspired oxygen (FiO2, 0.21 - 1.0), default 0.21 */
  readonly fio2?: number;
  /** Hemoglobin concentration (g/dL), default ~ 14.5 */
  readonly hemoglobinGPerDl?: number;
}

export interface PvLoopPoint {
  readonly id: string;
  readonly label: string;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
}

export interface CardiopulmonarySuccess {
  readonly ok: true;
  /** Stroke Volume (SV, mL) = Ved - Ves */
  readonly strokeVolumeMl: number;
  /** Ejection Fraction (EF, %) */
  readonly ejectionFractionPct: number;
  /** Cardiac Output (Q, L/min) = (HR * SV) / 1000 */
  readonly cardiacOutputLMin: number;
  /** End-systolic Pressure (Pes, mmHg) = Ees * (Ves - V0) */
  readonly endSystolicPressureMmHg: number;
  /** End-diastolic Pressure (Ped, mmHg) via exponential EDPVR approximation */
  readonly endDiastolicPressureMmHg: number;
  /** Arterial Elastance (Ea, mmHg/mL) = Pes / SV */
  readonly arterialElastanceMmHgPerMl: number;
  /** Ventricular-Arterial Coupling ratio (VAC = Ea / Ees) */
  readonly vacRatio: number;
  /** VAC clinical status: 'optimal_efficiency' (0.6 - 1.2), 'excess_afterload_uncoupled' (> 1.2), 'hyperdynamic_vasoplegic' (< 0.6) */
  readonly vacStatus: 'optimal_efficiency' | 'excess_afterload_uncoupled' | 'hyperdynamic_vasoplegic';
  /** Laplace Peak Wall Stress (kPa) */
  readonly peakWallStressKPa: number;
  /** Stroke Work (g*m) ~ SV * MAP * 0.0136 */
  readonly strokeWorkGramMeters: number;
  /** Alveolar Ventilation (VA, L/min) = RR * (VT - VD) / 1000 */
  readonly alveolarVentilationLMin: number;
  /** Global VA/Q ratio */
  readonly vqRatio: number;
  /** V/Q classification status */
  readonly vqStatus: 'matched' | 'low_shunt_admixture' | 'high_dead_space';
  /** Oxygen Delivery (DO2, mL/min) */
  readonly do2MlMin: number;
  /** Synthetic PV loop coordinates for 2D visual projection */
  readonly pvCoordinates: readonly PvLoopPoint[];
  /** Active scenario match or 'custom' */
  readonly scenario: CardiopulmonaryScenario | 'custom';
  readonly truthClass: 'mechanistic_simulation_proxy';
  readonly disclaimer: typeof CARDIOPULMONARY_DISCLAIMER;
  readonly provenance: typeof CARDIOPULMONARY_PROVENANCE;
}

export interface CardiopulmonaryFailure {
  readonly ok: false;
  readonly error: string;
  readonly truthClass: 'mechanistic_simulation_proxy';
  readonly disclaimer: typeof CARDIOPULMONARY_DISCLAIMER;
}

export type CardiopulmonaryResult = CardiopulmonarySuccess | CardiopulmonaryFailure;

export const CARDIOPULMONARY_SCENARIO_PRESETS: Readonly<Record<CardiopulmonaryScenario, CardiopulmonaryInput>> = Object.freeze({
  normative_rest: {
    eesMmHgPerMl: 2.2,
    v0Ml: 10,
    vedMl: 120,
    vesMl: 50,
    hrBpm: 72,
    mapMmHg: 93,
    lvWallThicknessMm: 10,
    rrBpm: 14,
    tidalVolumeMl: 500,
    deadSpaceMl: 150,
    fio2: 0.21,
    hemoglobinGPerDl: 14.5,
  },
  aerobic_exercise: {
    eesMmHgPerMl: 3.8,
    v0Ml: 10,
    vedMl: 145,
    vesMl: 45,
    hrBpm: 148,
    mapMmHg: 112,
    lvWallThicknessMm: 10.5,
    rrBpm: 32,
    tidalVolumeMl: 1400,
    deadSpaceMl: 220,
    fio2: 0.21,
    hemoglobinGPerDl: 15.0,
  },
  hfref_systolic_failure: {
    eesMmHgPerMl: 0.85,
    v0Ml: 15,
    vedMl: 195,
    vesMl: 150,
    hrBpm: 92,
    mapMmHg: 80,
    lvWallThicknessMm: 8.5,
    rrBpm: 24,
    tidalVolumeMl: 380,
    deadSpaceMl: 160,
    fio2: 0.28,
    hemoglobinGPerDl: 12.0,
  },
  acute_pulmonary_embolism: {
    eesMmHgPerMl: 1.8,
    v0Ml: 10,
    vedMl: 85,
    vesMl: 52,
    hrBpm: 118,
    mapMmHg: 75,
    lvWallThicknessMm: 10,
    rrBpm: 30,
    tidalVolumeMl: 420,
    deadSpaceMl: 260,
    fio2: 0.4,
    hemoglobinGPerDl: 13.8,
  },
  copd_exacerbation: {
    eesMmHgPerMl: 1.9,
    v0Ml: 12,
    vedMl: 110,
    vesMl: 55,
    hrBpm: 102,
    mapMmHg: 88,
    lvWallThicknessMm: 11.2,
    rrBpm: 26,
    tidalVolumeMl: 410,
    deadSpaceMl: 230,
    fio2: 0.32,
    hemoglobinGPerDl: 16.5,
  },
});

const isFinitePositive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/**
 * Evaluates coupled cardiopulmonary mechanics using Suga-Sagawa elastance and West lung zones.
 * Pure function: deterministic, zero DOM dependencies, fail-closed.
 */
export function evaluateCardiopulmonaryCoupling(
  input: CardiopulmonaryInput,
  scenario: CardiopulmonaryScenario | 'custom' = 'custom',
): CardiopulmonaryResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      error: 'CardiopulmonaryInput object is required',
      truthClass: 'mechanistic_simulation_proxy',
      disclaimer: CARDIOPULMONARY_DISCLAIMER,
    });
  }

  const {
    eesMmHgPerMl,
    v0Ml = 10,
    vedMl,
    vesMl,
    hrBpm,
    mapMmHg,
    lvWallThicknessMm = 10,
    rrBpm,
    tidalVolumeMl,
    deadSpaceMl = 150,
    fio2 = 0.21,
    hemoglobinGPerDl = 14.5,
  } = input;

  if (
    !isFinitePositive(eesMmHgPerMl) ||
    !Number.isFinite(v0Ml) ||
    !isFinitePositive(vedMl) ||
    !isFinitePositive(vesMl) ||
    !isFinitePositive(hrBpm) ||
    !isFinitePositive(mapMmHg) ||
    !isFinitePositive(lvWallThicknessMm) ||
    !isFinitePositive(rrBpm) ||
    !isFinitePositive(tidalVolumeMl) ||
    !isFinitePositive(deadSpaceMl) ||
    !isFinitePositive(fio2) ||
    !isFinitePositive(hemoglobinGPerDl)
  ) {
    return Object.freeze({
      ok: false,
      error: 'All physiological inputs must be valid finite positive numbers',
      truthClass: 'mechanistic_simulation_proxy',
      disclaimer: CARDIOPULMONARY_DISCLAIMER,
    });
  }

  if (vesMl >= vedMl) {
    return Object.freeze({
      ok: false,
      error: `End-systolic volume (${vesMl} mL) must be strictly lower than end-diastolic volume (${vedMl} mL)`,
      truthClass: 'mechanistic_simulation_proxy',
      disclaimer: CARDIOPULMONARY_DISCLAIMER,
    });
  }

  if (vesMl <= v0Ml) {
    return Object.freeze({
      ok: false,
      error: `End-systolic volume (${vesMl} mL) must exceed zero-pressure volume intercept V0 (${v0Ml} mL)`,
      truthClass: 'mechanistic_simulation_proxy',
      disclaimer: CARDIOPULMONARY_DISCLAIMER,
    });
  }

  if (tidalVolumeMl <= deadSpaceMl) {
    return Object.freeze({
      ok: false,
      error: `Tidal volume (${tidalVolumeMl} mL) must exceed anatomical dead space (${deadSpaceMl} mL)`,
      truthClass: 'mechanistic_simulation_proxy',
      disclaimer: CARDIOPULMONARY_DISCLAIMER,
    });
  }

  // 1. Left Ventricular Hemodynamics
  const sv = vedMl - vesMl;
  const efPct = Number(((sv / vedMl) * 100).toFixed(2));
  const cardiacOutputLMin = Number(((hrBpm * sv) / 1000).toFixed(3));

  // End-systolic pressure via Suga-Sagawa: Pes = Ees * (Ves - V0). Suga H, Sagawa K. Instantaneous pressure-volume
  // relationships and their ratio in the excised, supported canine left ventricle. Circ Res. 1974;35(1):117-126. PMID: 4841253.
  const pes = Number((eesMmHgPerMl * (vesMl - v0Ml)).toFixed(2));

  // End-diastolic pressure via exponential EDPVR curve: Ped = P0 * (exp(beta * Ved) - 1)
  // P0 ~ 1.2 mmHg, beta ~ 0.016 / mL
  const ped = Number((1.2 * (Math.exp(0.016 * Math.min(vedMl, 250)) - 1)).toFixed(2));

  // Arterial Elastance: Ea = Pes / SV
  const ea = Number((pes / sv).toFixed(3));

  // Ventricular-Arterial Coupling: VAC = Ea / Ees
  const vacRatio = Number((ea / eesMmHgPerMl).toFixed(3));
  let vacStatus: CardiopulmonarySuccess['vacStatus'] = 'optimal_efficiency';
  if (vacRatio > 1.2) {
    vacStatus = 'excess_afterload_uncoupled';
  } else if (vacRatio < 0.6) {
    vacStatus = 'hyperdynamic_vasoplegic';
  }

  // 2. Laplace Peak Wall Stress: sigma = (P * r) / (2 * h)
  // Approximate spherical internal radius: r = (3 * V / (4 * pi))^(1/3) in cm
  const volCm3 = vesMl; // 1 mL = 1 cm3
  const radiusCm = Math.cbrt((3 * volCm3) / (4 * Math.PI));
  const wallCm = lvWallThicknessMm / 10;
  // Wall stress in mmHg: sigma = (Pes * radiusCm) / (2 * wallCm)
  // Convert to kPa: 1 mmHg = 0.133322 kPa
  const wallStressMmHg = (pes * radiusCm) / (2 * wallCm);
  const peakWallStressKPa = Number((wallStressMmHg * 0.133322).toFixed(2));

  // Stroke Work: SW = SV * MAP * 0.0136 (gram-meters)
  const strokeWorkGramMeters = Number((sv * mapMmHg * 0.0136).toFixed(2));

  // 3. Pulmonary Mechanics & VA/Q Coupling
  const vaLMin = Number(((rrBpm * (tidalVolumeMl - deadSpaceMl)) / 1000).toFixed(3));
  const vqRatio = Number((vaLMin / cardiacOutputLMin).toFixed(3));
  const deadSpaceFraction = deadSpaceMl / tidalVolumeMl;

  let vqStatus: CardiopulmonarySuccess['vqStatus'] = 'matched';
  if (vqRatio < 0.65) {
    vqStatus = 'low_shunt_admixture';
  } else if (vqRatio > 1.25 || deadSpaceFraction >= 0.45) {
    vqStatus = 'high_dead_space';
  }

  // 4. Oxygen Delivery (DO2) via Fick Principle
  // SaO2 estimated conservatively based on alveolar ventilation and V/Q match
  let estimatedSao2Pct = 98;
  if (vqStatus === 'low_shunt_admixture') {
    estimatedSao2Pct = Math.max(82, 98 - (0.65 - vqRatio) * 40);
  } else if (vqStatus === 'high_dead_space') {
    estimatedSao2Pct = Math.max(88, 98 - (vqRatio - 1.35) * 15);
  }
  // DO2 = Q * (1.34 * Hb * (SaO2 / 100) + 0.0031 * PaO2) * 10 (mL/min)
  // PaO2 estimated ~ 90 mmHg baseline
  const pao2Est = Math.max(50, 95 * (estimatedSao2Pct / 100));
  const cao2 = kandunganOksigen(hemoglobinGPerDl, estimatedSao2Pct / 100, pao2Est);
  const do2MlMin = Number((cardiacOutputLMin * cao2 * 10).toFixed(1));

  // 5. PV Loop Vertices (Isovolumic Contraction -> Ejection -> Isovolumic Relaxation -> Filling)
  const pvCoordinates: readonly PvLoopPoint[] = Object.freeze([
    {
      id: 'end_diastole',
      label: 'End Diastole (Mitral Close)',
      volumeMl: vedMl,
      pressureMmHg: ped,
    },
    {
      id: 'aortic_opening',
      label: 'Aortic Valve Opens',
      volumeMl: vedMl,
      pressureMmHg: Math.max(ped + 10, mapMmHg * 0.75),
    },
    {
      id: 'peak_systole',
      label: 'Peak Systolic Pressure',
      volumeMl: vedMl - sv * 0.65,
      pressureMmHg: pes * 1.08,
    },
    {
      id: 'end_systole',
      label: 'End Systole (Aortic Close)',
      volumeMl: vesMl,
      pressureMmHg: pes,
    },
    {
      id: 'mitral_opening',
      label: 'Mitral Valve Opens',
      volumeMl: vesMl,
      pressureMmHg: Math.max(4, ped * 0.4),
    },
    {
      id: 'diastasis',
      label: 'Diastasis / Rapid Filling',
      volumeMl: vesMl + sv * 0.7,
      pressureMmHg: ped * 0.7,
    },
  ]);

  return Object.freeze({
    ok: true,
    strokeVolumeMl: sv,
    ejectionFractionPct: efPct,
    cardiacOutputLMin,
    endSystolicPressureMmHg: pes,
    endDiastolicPressureMmHg: ped,
    arterialElastanceMmHgPerMl: ea,
    vacRatio,
    vacStatus,
    peakWallStressKPa,
    strokeWorkGramMeters,
    alveolarVentilationLMin: vaLMin,
    vqRatio,
    vqStatus,
    do2MlMin,
    pvCoordinates,
    scenario,
    truthClass: 'mechanistic_simulation_proxy',
    disclaimer: CARDIOPULMONARY_DISCLAIMER,
    provenance: CARDIOPULMONARY_PROVENANCE,
  });
}
