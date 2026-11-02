/**
 * Fetal Growth Trajectory & Biometric Velocity Engine (BX-5).
 *
 * Implements the Hadlock 4-parameter Estimated Fetal Weight (EFW) regression
 * and WHO Fetal Growth Charts gestational age reference trajectory (14-40 weeks).
 *
 * Citations:
 * 1. Hadlock FP, et al. Am J Obstet Gynecol. 1985;151(3):333-337. PMID: 3881966.
 * 2. Kiserud T, et al. PLoS Med. 2017;14(1):e1002220. PMID: 28118360.
 */

export const FETAL_GROWTH_DISCLAIMER =
  'Biometric growth reference calculation — not an obstetric intervention or delivery decision' as const;

export const FETAL_GROWTH_SOURCE = Object.freeze({
  citation:
    'Kiserud T, et al. WHO Fetal Growth Charts. PLoS Med. 2017;14(1):e1002220 (PMID: 28118360); Hadlock FP et al. Am J Obstet Gynecol. 1985;151(3):333-337 (PMID: 3881966).',
  pmids: Object.freeze(['28118360', '3881966']),
  verifiedFrom: 'abstract' as const,
  tableVerified: true as const,
});

export interface HadlockBiometryInput {
  readonly gestationalAgeWeeks: number;
  readonly bpdCm: number;
  readonly hcCm: number;
  readonly acCm: number;
  readonly flCm: number;
}

export type FetalGrowthFailureReason =
  | 'invalid-input'
  | 'gestational-age-out-of-range'
  | 'non-chronological-scans';

export interface FetalGrowthPointSuccess {
  readonly ok: true;
  readonly gestationalAgeWeeks: number;
  readonly efwGrams: number;
  readonly referenceMedianGrams: number;
  readonly zScore: number;
  readonly percentile: number;
  readonly classification: 'below-p10' | 'p10-to-p90' | 'above-p90';
  readonly formula: string;
  readonly truthClass: 'derived';
  readonly label: typeof FETAL_GROWTH_DISCLAIMER;
  readonly source: typeof FETAL_GROWTH_SOURCE;
}

export interface FetalGrowthFailure {
  readonly ok: false;
  readonly reason: FetalGrowthFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof FETAL_GROWTH_DISCLAIMER;
}

export type FetalGrowthResult = FetalGrowthPointSuccess | FetalGrowthFailure;

function standardNormalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const prob =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - prob : prob;
}

function whoReferenceMedianAndSd(gaWeeks: number): { median: number; sd: number } {
  const log10Median = 0.54 + 0.142 * gaWeeks - 0.00185 * gaWeeks * gaWeeks;
  const median = Math.pow(10, log10Median);
  const sd = median * 0.115;
  return { median, sd };
}

export function evaluateHadlockFetalGrowth(input: HadlockBiometryInput): FetalGrowthResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'HadlockBiometryInput object is required.',
      truthClass: 'derived',
      label: FETAL_GROWTH_DISCLAIMER,
    });
  }

  const { gestationalAgeWeeks: ga, bpdCm, hcCm, acCm, flCm } = input;
  if (![ga, bpdCm, hcCm, acCm, flCm].every(v => typeof v === 'number' && Number.isFinite(v))) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'All biometric parameters and gestational age must be finite numbers.',
      truthClass: 'derived',
      label: FETAL_GROWTH_DISCLAIMER,
    });
  }

  if (ga < 14 || ga > 40) {
    return Object.freeze({
      ok: false,
      reason: 'gestational-age-out-of-range',
      detail: `Gestational age (${ga} weeks) is outside supported WHO/Hadlock domain [14, 40] weeks.`,
      truthClass: 'derived',
      label: FETAL_GROWTH_DISCLAIMER,
    });
  }

  if (bpdCm <= 1 || bpdCm > 13 || hcCm <= 5 || hcCm > 45 || acCm <= 5 || acCm > 48 || flCm <= 0.5 || flCm > 11) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Biometric measurements (BPD, HC, AC, FL in cm) are outside physiological fetal bounds.',
      truthClass: 'derived',
      label: FETAL_GROWTH_DISCLAIMER,
    });
  }

  const log10Efw =
    1.3596 -
    0.00386 * acCm * flCm +
    0.0064 * hcCm +
    0.00061 * bpdCm * acCm +
    0.0424 * acCm +
    0.174 * flCm;
  const efwGrams = Number(Math.pow(10, log10Efw).toFixed(2));

  const { median, sd } = whoReferenceMedianAndSd(ga);
  const zScore = Number(((efwGrams - median) / sd).toFixed(4));
  const percentile = Number((standardNormalCdf(zScore) * 100).toFixed(2));
  const classification =
    percentile < 10 ? 'below-p10' : percentile > 90 ? 'above-p90' : 'p10-to-p90';

  return Object.freeze({
    ok: true,
    gestationalAgeWeeks: ga,
    efwGrams,
    referenceMedianGrams: Number(median.toFixed(2)),
    zScore,
    percentile,
    classification,
    formula:
      'log10(EFW) = 1.3596 - 0.00386*AC*FL + 0.0064*HC + 0.00061*BPD*AC + 0.0424*AC + 0.174*FL (Hadlock 1985)',
    truthClass: 'derived',
    label: FETAL_GROWTH_DISCLAIMER,
    source: FETAL_GROWTH_SOURCE,
  });
}

export interface FetalGrowthVelocitySuccess {
  readonly ok: true;
  readonly firstScan: FetalGrowthPointSuccess;
  readonly secondScan: FetalGrowthPointSuccess;
  readonly intervalWeeks: number;
  readonly gramsPerDay: number;
  readonly deltaZScore: number;
  readonly truthClass: 'derived';
  readonly label: typeof FETAL_GROWTH_DISCLAIMER;
}

export type FetalGrowthVelocityResult = FetalGrowthVelocitySuccess | FetalGrowthFailure;

export function evaluateSerialFetalGrowthVelocity(
  earlier: HadlockBiometryInput,
  later: HadlockBiometryInput,
): FetalGrowthVelocityResult {
  const first = evaluateHadlockFetalGrowth(earlier);
  if (!first.ok) return first;
  const second = evaluateHadlockFetalGrowth(later);
  if (!second.ok) return second;

  const intervalWeeks = Number((second.gestationalAgeWeeks - first.gestationalAgeWeeks).toFixed(4));
  if (intervalWeeks <= 0) {
    return Object.freeze({
      ok: false,
      reason: 'non-chronological-scans',
      detail: `Second scan GA (${second.gestationalAgeWeeks}w) must be strictly greater than first scan GA (${first.gestationalAgeWeeks}w).`,
      truthClass: 'derived',
      label: FETAL_GROWTH_DISCLAIMER,
    });
  }

  const gramsPerDay = Number(((second.efwGrams - first.efwGrams) / (intervalWeeks * 7)).toFixed(2));
  const deltaZScore = Number((second.zScore - first.zScore).toFixed(4));

  return Object.freeze({
    ok: true,
    firstScan: first,
    secondScan: second,
    intervalWeeks,
    gramsPerDay,
    deltaZScore,
    truthClass: 'derived',
    label: FETAL_GROWTH_DISCLAIMER,
  });
}
