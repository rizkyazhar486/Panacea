/**
 * Canonical Record Overlay Engine (BX-8).
 *
 * Connects measured clinical records to 3D Body Exposure anatomical structures
 * with strict fail-closed validation:
 * 1. Canonical multiscale anatomical identity binding (L1 system -> L7 pathway).
 * 2. Dimensional and canonical unit validation (explicit conversion only when authorized).
 * 3. Numeric boundary & physiological plausibility guards (rejects NaN, +-Infinity, inverted ranges).
 * 4. Strict separation of observed patient measurements vs derived/reference/simulated states.
 * 5. Longitudinal time-series ordering, delta computation, and concurrent-conflict detection.
 * 6. Missing or stale records surface as "not available" — never substituted with 0.
 */

export type OverlayTruthClass = 'measured' | 'reference' | 'derived' | 'simulated';

export type MeasurementDimension =
  | 'mass-concentration'
  | 'substance-concentration'
  | 'frequency'
  | 'pressure'
  | 'percentage'
  | 'temperature'
  | 'volume-flow';

export interface UnitConversionRule {
  readonly fromUnit: string;
  readonly fromDimension: MeasurementDimension;
  readonly factorToCanonical: number;
  readonly formula: string;
}

export interface ExpectedMetricUnit {
  readonly canonicalUnit: string;
  readonly dimension: MeasurementDimension;
  readonly allowedAliases: readonly string[];
  readonly minPlausibleStrictlyPositive?: boolean;
  readonly minPhysiologicalValue: number;
  readonly maxPhysiologicalValue: number;
  readonly referenceRange?: readonly [number, number];
  readonly conversions: readonly UnitConversionRule[];
}

export const EXPECTED_METRIC_UNITS: Readonly<Record<string, ExpectedMetricUnit>> = Object.freeze({
  troponin: Object.freeze({
    canonicalUnit: 'ng/mL',
    dimension: 'mass-concentration',
    allowedAliases: Object.freeze(['ng/ml', 'ug/l', 'µg/l']),
    minPhysiologicalValue: 0,
    maxPhysiologicalValue: 500,
    referenceRange: Object.freeze([0, 0.04]) as readonly [number, number],
    conversions: Object.freeze([
      Object.freeze({
        fromUnit: 'ng/l',
        fromDimension: 'mass-concentration',
        factorToCanonical: 0.001,
        formula: 'ng/mL = (ng/L) * 0.001',
      }),
      Object.freeze({
        fromUnit: 'pg/ml',
        fromDimension: 'mass-concentration',
        factorToCanonical: 0.001,
        formula: 'ng/mL = (pg/mL) * 0.001',
      }),
    ]),
  }),
  creatinine: Object.freeze({
    canonicalUnit: 'mg/dL',
    dimension: 'mass-concentration',
    allowedAliases: Object.freeze(['mg/dl']),
    minPlausibleStrictlyPositive: true,
    minPhysiologicalValue: 0.05,
    maxPhysiologicalValue: 40,
    referenceRange: Object.freeze([0.6, 1.2]) as readonly [number, number],
    conversions: Object.freeze([
      Object.freeze({
        fromUnit: 'umol/l',
        fromDimension: 'substance-concentration',
        factorToCanonical: 1 / 88.42,
        formula: 'mg/dL = (umol/L) / 88.42 (MW creatinine = 113.12 g/mol)',
      }),
      Object.freeze({
        fromUnit: 'µmol/l',
        fromDimension: 'substance-concentration',
        factorToCanonical: 1 / 88.42,
        formula: 'mg/dL = (µmol/L) / 88.42 (MW creatinine = 113.12 g/mol)',
      }),
    ]),
  }),
  glucose: Object.freeze({
    canonicalUnit: 'mg/dL',
    dimension: 'mass-concentration',
    allowedAliases: Object.freeze(['mg/dl']),
    minPlausibleStrictlyPositive: true,
    minPhysiologicalValue: 10,
    maxPhysiologicalValue: 1500,
    referenceRange: Object.freeze([70, 99]) as readonly [number, number],
    conversions: Object.freeze([
      Object.freeze({
        fromUnit: 'mmol/l',
        fromDimension: 'substance-concentration',
        factorToCanonical: 18.0182,
        formula: 'mg/dL = (mmol/L) * 18.0182 (MW glucose = 180.16 g/mol)',
      }),
    ]),
  }),
  heart_rate: Object.freeze({
    canonicalUnit: 'bpm',
    dimension: 'frequency',
    allowedAliases: Object.freeze(['beats/min', 'min-1', '/min']),
    minPlausibleStrictlyPositive: true,
    minPhysiologicalValue: 10,
    maxPhysiologicalValue: 320,
    referenceRange: Object.freeze([60, 100]) as readonly [number, number],
    conversions: Object.freeze([]),
  }),
  blood_pressure_systolic: Object.freeze({
    canonicalUnit: 'mmHg',
    dimension: 'pressure',
    allowedAliases: Object.freeze(['mmhg']),
    minPlausibleStrictlyPositive: true,
    minPhysiologicalValue: 20,
    maxPhysiologicalValue: 350,
    referenceRange: Object.freeze([90, 120]) as readonly [number, number],
    conversions: Object.freeze([
      Object.freeze({
        fromUnit: 'kpa',
        fromDimension: 'pressure',
        factorToCanonical: 7.50062,
        formula: 'mmHg = kPa * 7.50062',
      }),
    ]),
  }),
  spo2: Object.freeze({
    canonicalUnit: '%',
    dimension: 'percentage',
    allowedAliases: Object.freeze(['percent', '%spo2']),
    minPlausibleStrictlyPositive: true,
    minPhysiologicalValue: 1,
    maxPhysiologicalValue: 100,
    referenceRange: Object.freeze([95, 100]) as readonly [number, number],
    conversions: Object.freeze([]),
  }),
});

export interface AnatomicalMultiscaleBinding {
  readonly canonicalOrganId: string;
  readonly fmaId: string;
  readonly uberonId: string;
  readonly l1System: string;
  readonly l2Organ: string;
  readonly l3Substructure: string;
  readonly l4Tissue: string;
  readonly l5Cell: string;
  readonly l7Pathway: string;
  readonly atlasDisclaimer: typeof ATLAS_STRUCTURE_DISCLAIMER;
}

export const ATLAS_STRUCTURE_DISCLAIMER =
  'Atlas reference hierarchy — not a 1:1 patient-specific anatomical reconstruction' as const;

export const OVERLAY_LABEL = 'Canonical Record Overlay — Measured Patient Data' as const;

export const CANONICAL_ORGAN_BINDINGS: Readonly<Record<string, AnatomicalMultiscaleBinding>> = Object.freeze({
  heart: Object.freeze({
    canonicalOrganId: 'heart',
    fmaId: 'FMA:7088',
    uberonId: 'UBERON:0000948',
    l1System: 'cardiovascular-system',
    l2Organ: 'heart',
    l3Substructure: 'left-ventricle-myocardium',
    l4Tissue: 'cardiac-muscle-tissue',
    l5Cell: 'ventricular-cardiomyocyte',
    l7Pathway: 'excitation-contraction-calcium-signaling',
    atlasDisclaimer: ATLAS_STRUCTURE_DISCLAIMER,
  }),
  kidney: Object.freeze({
    canonicalOrganId: 'kidney',
    fmaId: 'FMA:7203',
    uberonId: 'UBERON:0002113',
    l1System: 'renal-urinary-system',
    l2Organ: 'kidney',
    l3Substructure: 'renal-cortex-nephron',
    l4Tissue: 'glomerular-basement-membrane',
    l5Cell: 'podocyte-and-proximal-tubular-epithelial-cell',
    l7Pathway: 'glomerular-filtration-solute-transport',
    atlasDisclaimer: ATLAS_STRUCTURE_DISCLAIMER,
  }),
  lung: Object.freeze({
    canonicalOrganId: 'lung',
    fmaId: 'FMA:7195',
    uberonId: 'UBERON:0002048',
    l1System: 'respiratory-system',
    l2Organ: 'lung',
    l3Substructure: 'alveolar-capillary-unit',
    l4Tissue: 'alveolar-epithelium',
    l5Cell: 'type-i-and-type-ii-pneumocyte',
    l7Pathway: 'alveolar-gas-diffusion-and-surfactant-homeostasis',
    atlasDisclaimer: ATLAS_STRUCTURE_DISCLAIMER,
  }),
  liver: Object.freeze({
    canonicalOrganId: 'liver',
    fmaId: 'FMA:7197',
    uberonId: 'UBERON:0002107',
    l1System: 'digestive-hepatobiliary-system',
    l2Organ: 'liver',
    l3Substructure: 'hepatic-lobule',
    l4Tissue: 'hepatic-parenchyma',
    l5Cell: 'hepatocyte',
    l7Pathway: 'gluconeogenesis-and-cytochrome-p450-metabolism',
    atlasDisclaimer: ATLAS_STRUCTURE_DISCLAIMER,
  }),
  pancreas: Object.freeze({
    canonicalOrganId: 'pancreas',
    fmaId: 'FMA:7198',
    uberonId: 'UBERON:0001264',
    l1System: 'endocrine-and-digestive-system',
    l2Organ: 'pancreas',
    l3Substructure: 'islets-of-langerhans',
    l4Tissue: 'endocrine-islet-tissue',
    l5Cell: 'pancreatic-beta-cell',
    l7Pathway: 'glucose-stimulated-insulin-secretion',
    atlasDisclaimer: ATLAS_STRUCTURE_DISCLAIMER,
  }),
  brain: Object.freeze({
    canonicalOrganId: 'brain',
    fmaId: 'FMA:50801',
    uberonId: 'UBERON:0000955',
    l1System: 'nervous-system',
    l2Organ: 'brain',
    l3Substructure: 'cerebral-cortex-and-brainstem',
    l4Tissue: 'neural-parenchyma',
    l5Cell: 'neuron-and-astrocyte',
    l7Pathway: 'synaptic-transmission-and-ion-homeostasis',
    atlasDisclaimer: ATLAS_STRUCTURE_DISCLAIMER,
  }),
  vasculature: Object.freeze({
    canonicalOrganId: 'vasculature',
    fmaId: 'FMA:50720',
    uberonId: 'UBERON:0004537',
    l1System: 'cardiovascular-system',
    l2Organ: 'systemic-arterial-tree',
    l3Substructure: 'conduit-and-resistance-arteries',
    l4Tissue: 'vascular-endothelium-and-smooth-muscle',
    l5Cell: 'endothelial-cell',
    l7Pathway: 'nitric-oxide-vascular-tone-regulation',
    atlasDisclaimer: ATLAS_STRUCTURE_DISCLAIMER,
  }),
});

const ORGAN_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  jantung: 'heart',
  cardiac: 'heart',
  ginjal: 'kidney',
  renal: 'kidney',
  paru: 'lung',
  pulmonary: 'lung',
  hati: 'liver',
  hepar: 'liver',
  otak: 'brain',
  pembuluh_darah: 'vasculature',
  artery: 'vasculature',
});

export type OverlayRejectionReason =
  | 'unit-mismatch'
  | 'dimensional-incompatibility'
  | 'stale-data'
  | 'missing-value'
  | 'invalid-record'
  | 'invalid-numeric-value'
  | 'inverted-reference-range'
  | 'unmapped-organ-identity'
  | 'simulated-in-observed-channel'
  | 'conflicting-concurrent-records';

export interface CanonicalRecordInput {
  readonly targetOrgan?: string;
  readonly testName?: string;
  readonly value?: number | string | null;
  readonly unit?: string | null;
  readonly timestamp?: string | null;
  readonly source?: string | null;
  readonly truthClass?: OverlayTruthClass;
  readonly staleMaxAgeMs?: number;
  readonly referenceRange?: readonly [number, number];
}

export interface ConversionProvenance {
  readonly converted: boolean;
  readonly rawValue: number | string;
  readonly rawUnit: string;
  readonly factorApplied: number;
  readonly formula: string | null;
}

export interface RecordOverlaySuccessItem {
  readonly ok: true;
  readonly organId: string;
  readonly metricName: string;
  readonly value: number | string;
  readonly displayValue: string;
  readonly unit: string;
  readonly timestamp: string;
  readonly source: string;
  readonly truthClass: OverlayTruthClass;
  readonly referenceStatus: 'below-range' | 'within-range' | 'above-range' | 'unclassified';
  readonly anatomicalBinding: AnatomicalMultiscaleBinding | null;
  readonly conversion: ConversionProvenance;
}

export interface RecordOverlayRejectionItem {
  readonly ok: false;
  readonly organId: string;
  readonly metricName: string;
  readonly displayValue: 'not available';
  readonly reason: OverlayRejectionReason;
  readonly detail: string;
}

export type RecordOverlayResultItem = RecordOverlaySuccessItem | RecordOverlayRejectionItem;

export interface ComputeOverlayOptions {
  readonly maxStaleAgeMs?: number;
  readonly referenceTimeIso?: string;
  readonly allowExplicitConversion?: boolean;
  readonly requireMappedOrganIdentity?: boolean;
  readonly rejectSimulatedInObservedMode?: boolean;
}

const KNOWN_UNIT_DIMENSIONS: Readonly<Record<string, MeasurementDimension>> = Object.freeze({
  'ng/ml': 'mass-concentration',
  'ug/l': 'mass-concentration',
  'µg/l': 'mass-concentration',
  'ng/l': 'mass-concentration',
  'pg/ml': 'mass-concentration',
  'mg/dl': 'mass-concentration',
  'g/dl': 'mass-concentration',
  'umol/l': 'substance-concentration',
  'µmol/l': 'substance-concentration',
  'mmol/l': 'substance-concentration',
  bpm: 'frequency',
  'beats/min': 'frequency',
  'min-1': 'frequency',
  '/min': 'frequency',
  mmhg: 'pressure',
  kpa: 'pressure',
  '%': 'percentage',
  percent: 'percentage',
  '%spo2': 'percentage',
  c: 'temperature',
  '°c': 'temperature',
  'l/min': 'volume-flow',
  'ml/min': 'volume-flow',
});

function normalizeUnit(unit: string | null | undefined): string {
  if (!unit || typeof unit !== 'string') return '';
  return unit.trim().toLowerCase();
}

export function resolveAnatomicalOverlayBinding(
  organInput: string | null | undefined,
): AnatomicalMultiscaleBinding | null {
  if (!organInput || typeof organInput !== 'string') return null;
  const cleaned = organInput.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (cleaned.length === 0) return null;
  const canonicalKey = Object.prototype.hasOwnProperty.call(ORGAN_ALIASES, cleaned)
    ? ORGAN_ALIASES[cleaned]
    : cleaned;
  return Object.prototype.hasOwnProperty.call(CANONICAL_ORGAN_BINDINGS, canonicalKey)
    ? CANONICAL_ORGAN_BINDINGS[canonicalKey]
    : null;
}

function classifyReferenceStatus(
  numericVal: number,
  range: readonly [number, number] | undefined,
): 'below-range' | 'within-range' | 'above-range' | 'unclassified' {
  if (!range) return 'unclassified';
  if (numericVal < range[0]) return 'below-range';
  if (numericVal > range[1]) return 'above-range';
  return 'within-range';
}

/**
 * Validates and transforms a list of canonical medical record observations into
 * deterministic 3D organ overlay items.
 */
export function computeCanonicalRecordOverlays(
  records: readonly CanonicalRecordInput[] | null | undefined,
  options?: ComputeOverlayOptions,
): readonly RecordOverlayResultItem[] {
  if (!Array.isArray(records) || records.length === 0) {
    return Object.freeze([]);
  }

  const nowMs = options?.referenceTimeIso ? new Date(options.referenceTimeIso).getTime() : Date.now();
  const defaultMaxAgeMs = options?.maxStaleAgeMs ?? 7 * 24 * 60 * 60 * 1000;
  const allowExplicitConversion = options?.allowExplicitConversion === true;
  const requireMappedOrgan = options?.requireMappedOrganIdentity === true;
  const rejectSimulated = options?.rejectSimulatedInObservedMode === true;

  const results: RecordOverlayResultItem[] = [];

  for (const record of records) {
    if (!record || typeof record !== 'object') {
      continue;
    }

    const rawOrgan =
      typeof record.targetOrgan === 'string' && record.targetOrgan.trim().length > 0
        ? record.targetOrgan.trim()
        : 'unknown';
    const anatomicalBinding = resolveAnatomicalOverlayBinding(rawOrgan);
    const organId = anatomicalBinding ? anatomicalBinding.canonicalOrganId : rawOrgan;

    const metricName =
      typeof record.testName === 'string' && record.testName.trim().length > 0
        ? record.testName.trim().toLowerCase()
        : 'unspecified';

    if (requireMappedOrgan && !anatomicalBinding) {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          displayValue: 'not available',
          reason: 'unmapped-organ-identity',
          detail: `Target organ "${rawOrgan}" does not map to a verified canonical anatomical binding.`,
        }),
      );
      continue;
    }

    const truthClass: OverlayTruthClass = record.truthClass ?? 'measured';
    if (rejectSimulated && truthClass === 'simulated') {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          displayValue: 'not available',
          reason: 'simulated-in-observed-channel',
          detail: `Simulated value for "${metricName}" cannot enter the observed patient clinical overlay channel.`,
        }),
      );
      continue;
    }

    // 1. Missing / null / empty check -> never substituted with 0
    if (record.value === undefined || record.value === null || String(record.value).trim() === '') {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          displayValue: 'not available',
          reason: 'missing-value',
          detail: 'Record value is missing, empty, or null; shown as not available (never substituted with 0).',
        }),
      );
      continue;
    }

    // 2. Numeric finiteness check
    if (typeof record.value === 'number' && !Number.isFinite(record.value)) {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          displayValue: 'not available',
          reason: 'invalid-numeric-value',
          detail: `Record numeric value (${String(record.value)}) must be finite.`,
        }),
      );
      continue;
    }

    // 3. Reference range inversion check
    if (record.referenceRange !== undefined) {
      const [rMin, rMax] = record.referenceRange;
      if (
        typeof rMin !== 'number' ||
        typeof rMax !== 'number' ||
        !Number.isFinite(rMin) ||
        !Number.isFinite(rMax) ||
        rMin > rMax
      ) {
        results.push(
          Object.freeze({
            ok: false,
            organId,
            metricName,
            displayValue: 'not available',
            reason: 'inverted-reference-range',
            detail: `Reference range [${String(rMin)}, ${String(rMax)}] is inverted or non-finite.`,
          }),
        );
        continue;
      }
    }

    // 4. Timestamp & staleness check
    const timestampStr =
      typeof record.timestamp === 'string' && record.timestamp.trim().length > 0
        ? record.timestamp.trim()
        : new Date(nowMs).toISOString();
    const recordTimeMs = new Date(timestampStr).getTime();
    const maxAge = record.staleMaxAgeMs ?? defaultMaxAgeMs;

    if (!Number.isFinite(recordTimeMs)) {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          displayValue: 'not available',
          reason: 'invalid-record',
          detail: `Record timestamp "${timestampStr}" is not a valid ISO-8601 date.`,
        }),
      );
      continue;
    }

    if (Number.isFinite(nowMs) && nowMs - recordTimeMs > maxAge) {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          displayValue: 'not available',
          reason: 'stale-data',
          detail: `Record timestamp ${timestampStr} exceeds maximum allowed age (${maxAge} ms); data is stale.`,
        }),
      );
      continue;
    }

    // 5. Unit & dimensional validation + optional explicit stoichiometric conversion
    const rawUnitStr = (record.unit ?? '').trim();
    const normUnit = normalizeUnit(rawUnitStr);
    const metricKey = metricName.replace(/[^a-z0-9_]/g, '_');
    const metricSpec = Object.prototype.hasOwnProperty.call(EXPECTED_METRIC_UNITS, metricKey)
      ? EXPECTED_METRIC_UNITS[metricKey]
      : undefined;

    let finalValue: number | string = record.value;
    let finalUnit = rawUnitStr;
    let conversion: ConversionProvenance = Object.freeze({
      converted: false,
      rawValue: record.value,
      rawUnit: rawUnitStr,
      factorApplied: 1,
      formula: null,
    });

    if (metricSpec) {
      const isCanonicalMatch =
        normUnit === normalizeUnit(metricSpec.canonicalUnit) ||
        metricSpec.allowedAliases.some(alias => normalizeUnit(alias) === normUnit);

      if (isCanonicalMatch) {
        finalUnit = metricSpec.canonicalUnit;
      } else {
        const conversionRule = metricSpec.conversions.find(
          rule => normalizeUnit(rule.fromUnit) === normUnit,
        );
        const inputDimension = Object.prototype.hasOwnProperty.call(KNOWN_UNIT_DIMENSIONS, normUnit)
          ? KNOWN_UNIT_DIMENSIONS[normUnit]
          : undefined;

        if (
          inputDimension &&
          inputDimension !== metricSpec.dimension &&
          !conversionRule
        ) {
          results.push(
            Object.freeze({
              ok: false,
              organId,
              metricName,
              displayValue: 'not available',
              reason: 'dimensional-incompatibility',
              detail: `Dimensional incompatibility for "${metricName}": unit "${rawUnitStr}" (${inputDimension}) is incompatible with ${metricSpec.dimension} (${metricSpec.canonicalUnit}).`,
            }),
          );
          continue;
        }

        if (conversionRule && allowExplicitConversion && typeof record.value === 'number') {
          finalValue = Number((record.value * conversionRule.factorToCanonical).toFixed(6));
          finalUnit = metricSpec.canonicalUnit;
          conversion = Object.freeze({
            converted: true,
            rawValue: record.value,
            rawUnit: rawUnitStr,
            factorApplied: conversionRule.factorToCanonical,
            formula: conversionRule.formula,
          });
        } else {
          results.push(
            Object.freeze({
              ok: false,
              organId,
              metricName,
              displayValue: 'not available',
              reason: 'unit-mismatch',
              detail: `Unit mismatch for metric "${metricName}": received "${rawUnitStr}", expected canonical unit "${metricSpec.canonicalUnit}".`,
            }),
          );
          continue;
        }
      }

      if (typeof finalValue === 'number') {
        const strictlyPositiveFailed =
          metricSpec.minPlausibleStrictlyPositive === true && finalValue <= 0;
        const outsideBounds =
          finalValue < metricSpec.minPhysiologicalValue ||
          finalValue > metricSpec.maxPhysiologicalValue;

        if (strictlyPositiveFailed || outsideBounds) {
          results.push(
            Object.freeze({
              ok: false,
              organId,
              metricName,
              displayValue: 'not available',
              reason: 'invalid-numeric-value',
              detail: `Value ${finalValue} ${finalUnit} for "${metricName}" is outside physiological bounds [${metricSpec.minPhysiologicalValue}, ${metricSpec.maxPhysiologicalValue}].`,
            }),
          );
          continue;
        }
      }
    }

    const activeRefRange = record.referenceRange ?? metricSpec?.referenceRange;
    const referenceStatus =
      typeof finalValue === 'number'
        ? classifyReferenceStatus(finalValue, activeRefRange)
        : 'unclassified';

    results.push(
      Object.freeze({
        ok: true,
        organId,
        metricName,
        value: finalValue,
        displayValue: `${String(finalValue)}${finalUnit ? ` ${finalUnit}` : ''}`,
        unit: finalUnit,
        timestamp: timestampStr,
        source:
          typeof record.source === 'string' && record.source.trim().length > 0
            ? record.source.trim()
            : 'canonical-record',
        truthClass,
        referenceStatus,
        anatomicalBinding,
        conversion,
      }),
    );
  }

  return Object.freeze(results);
}

export interface LongitudinalMetricSeries {
  readonly ok: true;
  readonly organId: string;
  readonly metricName: string;
  readonly unit: string;
  readonly anatomicalBinding: AnatomicalMultiscaleBinding | null;
  readonly latest: RecordOverlaySuccessItem;
  readonly history: readonly RecordOverlaySuccessItem[];
  readonly pointCount: number;
  readonly deltaFromPrevious: number | null;
  readonly trend: 'rising' | 'falling' | 'stable' | 'single-point';
}

export type LongitudinalSeriesResult = LongitudinalMetricSeries | RecordOverlayRejectionItem;

/**
 * Aggregates multiple canonical measurements for a given (organId, metricName) into a
 * chronologically ordered series, rejecting conflicting concurrent measurements at the
 * exact same timestamp.
 */
export function aggregateLongitudinalOrganOverlay(
  records: readonly CanonicalRecordInput[],
  options?: ComputeOverlayOptions,
): readonly LongitudinalSeriesResult[] {
  const evaluated = computeCanonicalRecordOverlays(records, options);
  const grouped = new Map<string, RecordOverlaySuccessItem[]>();
  const rejections: LongitudinalSeriesResult[] = [];

  for (const item of evaluated) {
    if (!item.ok) {
      rejections.push(item);
      continue;
    }
    const key = `${item.organId}::${item.metricName}`;
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }

  const seriesOut: LongitudinalSeriesResult[] = [...rejections];

  for (const [, items] of grouped.entries()) {
    const sorted = [...items].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    let conflictDetected: RecordOverlayRejectionItem | null = null;
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (
        new Date(prev.timestamp).getTime() === new Date(curr.timestamp).getTime() &&
        prev.value !== curr.value
      ) {
        conflictDetected = Object.freeze({
          ok: false,
          organId: curr.organId,
          metricName: curr.metricName,
          displayValue: 'not available',
          reason: 'conflicting-concurrent-records',
          detail: `Conflicting concurrent values (${String(prev.value)} vs ${String(curr.value)}) at identical timestamp ${curr.timestamp}.`,
        });
        break;
      }
    }

    if (conflictDetected) {
      seriesOut.push(conflictDetected);
      continue;
    }

    const latest = sorted[sorted.length - 1];
    const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
    let deltaFromPrevious: number | null = null;
    let trend: 'rising' | 'falling' | 'stable' | 'single-point' = 'single-point';

    if (previous && typeof latest.value === 'number' && typeof previous.value === 'number') {
      deltaFromPrevious = Number((latest.value - previous.value).toFixed(6));
      if (deltaFromPrevious > 0) trend = 'rising';
      else if (deltaFromPrevious < 0) trend = 'falling';
      else trend = 'stable';
    }

    seriesOut.push(
      Object.freeze({
        ok: true,
        organId: latest.organId,
        metricName: latest.metricName,
        unit: latest.unit,
        anatomicalBinding: latest.anatomicalBinding,
        latest,
        history: Object.freeze(sorted),
        pointCount: sorted.length,
        deltaFromPrevious,
        trend,
      }),
    );
  }

  return Object.freeze(seriesOut);
}
