export type RespiratoryPhaseId =
  | 'end-expiration'
  | 'inspiration'
  | 'end-inspiration'
  | 'passive-expiration';

export interface RespiratoryTeachingInputs {
  respiratoryRatePerMin: number;
  tidalVolumeMl: number;
  deadSpaceMl: number;
}

export interface RespiratoryTeachingMetrics {
  respiratoryRatePerMin: number;
  tidalVolumeMl: number;
  deadSpaceMl: number;
  minuteVentilationLMin: number;
  alveolarVentilationLMin: number;
  deadSpaceVentilationLMin: number;
  alveolarFractionPct: number;
}

export interface RespiratoryTeachingPhase {
  id: RespiratoryPhaseId;
  label: string;
  cyclePosition: number;
  schematic: {
    thoracicExpansionSignal: number;
    diaphragmDescentSignal: number;
    airflowDirection: -1 | 0 | 1;
  };
  disclosure: string;
}

export const RESPIRATORY_EVIDENCE_REFERENCES = [
  {
    id: 'pmid:25428856',
    title: 'Hypoventilation syndromes',
    locator: 'https://pubmed.ncbi.nlm.nih.gov/25428856/',
    evidenceUse: 'Dead-space ventilation and effective alveolar-ventilation physiology context.',
  },
  {
    id: 'pmid:34289982',
    title: 'Impact of ageing and pregnancy on the minute ventilation/carbon dioxide production response to exercise',
    locator: 'https://pubmed.ncbi.nlm.nih.gov/34289982/',
    evidenceUse: 'Minute ventilation, dead-space volume and alveolar-ventilation equation context.',
  },
] as const;

export const RESPIRATORY_ILLUSTRATIVE_INPUTS: RespiratoryTeachingInputs = {
  respiratoryRatePerMin: 12,
  tidalVolumeMl: 500,
  deadSpaceMl: 150,
};

export const RESPIRATORY_ENGINEERING_INPUT_BOUNDS = {
  respiratoryRatePerMin: { min: 4, max: 40 },
  tidalVolumeMl: { min: 150, max: 1200 },
  deadSpaceMl: { min: 0, max: 500 },
} as const;

export const RESPIRATORY_MODEL_BOUNDARY =
  'Deterministic educational model only. Defaults and slider bounds are illustrative engineering values, not normal ranges or patient measurements. Schematic signals are dimensionless and must not be interpreted as pressure, compliance, resistance, force, work of breathing, disease severity or patient-specific ventilation. Evidence-bearing source anatomy must remain geometrically unchanged.';

export const RESPIRATORY_PHASES: readonly RespiratoryTeachingPhase[] = [
  {
    id: 'end-expiration',
    label: 'End expiration',
    cyclePosition: 0,
    schematic: {
      thoracicExpansionSignal: 0,
      diaphragmDescentSignal: 0,
      airflowDirection: 0,
    },
    disclosure: 'Cycle marker only; no absolute lung volume or pressure is inferred.',
  },
  {
    id: 'inspiration',
    label: 'Inspiration',
    cyclePosition: 0.25,
    schematic: {
      thoracicExpansionSignal: 0.7,
      diaphragmDescentSignal: 0.8,
      airflowDirection: 1,
    },
    disclosure: 'Direction-of-change teaching signal only; source anatomy is not deformed.',
  },
  {
    id: 'end-inspiration',
    label: 'End inspiration',
    cyclePosition: 0.5,
    schematic: {
      thoracicExpansionSignal: 1,
      diaphragmDescentSignal: 1,
      airflowDirection: 0,
    },
    disclosure: 'Turning-point marker only; no patient-specific pressure or volume is inferred.',
  },
  {
    id: 'passive-expiration',
    label: 'Passive expiration',
    cyclePosition: 0.75,
    schematic: {
      thoracicExpansionSignal: 0.35,
      diaphragmDescentSignal: 0.3,
      airflowDirection: -1,
    },
    disclosure: 'Direction-of-change teaching signal only; forced expiration is outside this schematic.',
  },
] as const;

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeRespiratoryTeachingInputs(
  input: RespiratoryTeachingInputs,
): RespiratoryTeachingInputs {
  const respiratoryRatePerMin = Math.round(clamp(
    finiteOr(input.respiratoryRatePerMin, RESPIRATORY_ILLUSTRATIVE_INPUTS.respiratoryRatePerMin),
    RESPIRATORY_ENGINEERING_INPUT_BOUNDS.respiratoryRatePerMin.min,
    RESPIRATORY_ENGINEERING_INPUT_BOUNDS.respiratoryRatePerMin.max,
  ));
  const tidalVolumeMl = Math.round(clamp(
    finiteOr(input.tidalVolumeMl, RESPIRATORY_ILLUSTRATIVE_INPUTS.tidalVolumeMl),
    RESPIRATORY_ENGINEERING_INPUT_BOUNDS.tidalVolumeMl.min,
    RESPIRATORY_ENGINEERING_INPUT_BOUNDS.tidalVolumeMl.max,
  ));
  const requestedDeadSpaceMl = Math.round(clamp(
    finiteOr(input.deadSpaceMl, RESPIRATORY_ILLUSTRATIVE_INPUTS.deadSpaceMl),
    RESPIRATORY_ENGINEERING_INPUT_BOUNDS.deadSpaceMl.min,
    RESPIRATORY_ENGINEERING_INPUT_BOUNDS.deadSpaceMl.max,
  ));

  return {
    respiratoryRatePerMin,
    tidalVolumeMl,
    deadSpaceMl: Math.min(requestedDeadSpaceMl, tidalVolumeMl),
  };
}

/**
 * Educational ventilation identities:
 * minute ventilation = respiratory rate × tidal volume
 * alveolar ventilation = respiratory rate × max(tidal volume - dead space, 0)
 * dead-space ventilation = respiratory rate × dead space
 *
 * These outputs are deterministic consequences of user-supplied teaching inputs;
 * they are not measurements, predictions, diagnoses or ventilator settings.
 */
export function calculateRespiratoryTeachingMetrics(
  input: RespiratoryTeachingInputs,
): RespiratoryTeachingMetrics {
  const normalized = normalizeRespiratoryTeachingInputs(input);
  const minuteVentilationLMin =
    (normalized.respiratoryRatePerMin * normalized.tidalVolumeMl) / 1000;
  const deadSpaceVentilationLMin =
    (normalized.respiratoryRatePerMin * normalized.deadSpaceMl) / 1000;
  const alveolarVentilationLMin = Math.max(
    0,
    (normalized.respiratoryRatePerMin *
      (normalized.tidalVolumeMl - normalized.deadSpaceMl)) / 1000,
  );
  const alveolarFractionPct = normalized.tidalVolumeMl > 0
    ? ((normalized.tidalVolumeMl - normalized.deadSpaceMl) / normalized.tidalVolumeMl) * 100
    : 0;

  return {
    ...normalized,
    minuteVentilationLMin: round(minuteVentilationLMin),
    alveolarVentilationLMin: round(alveolarVentilationLMin),
    deadSpaceVentilationLMin: round(deadSpaceVentilationLMin),
    alveolarFractionPct: round(clamp(alveolarFractionPct, 0, 100), 1),
  };
}

export function respiratoryPhaseById(id: RespiratoryPhaseId): RespiratoryTeachingPhase {
  return RESPIRATORY_PHASES.find((phase) => phase.id === id) ?? RESPIRATORY_PHASES[0];
}
