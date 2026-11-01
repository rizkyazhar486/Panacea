/**
 * MedStudyHub Psychometric 3-Parameter Logistic (3PL) Item Response Theory (IRT),
 * Fisher Information & Computerized Adaptive Testing (CAT) Engine (EDU-5).
 *
 * Implements Birnbaum's 3PL model:
 *   P_i(theta) = c_i + (1 - c_i) / (1 + exp(-D * a_i * (theta - b_i)))
 * and exact item Fisher information:
 *   I_i(theta) = (D * a_i)^2 * ((P_i(theta) - c_i)^2 / (1 - c_i)^2) * ((1 - P_i(theta)) / P_i(theta))
 * where D = 1.702 is the normal-ogive scaling constant.
 *
 * Citations:
 * - Birnbaum A. Some latent trait models and their use in inferring an examinee's
 *   ability. In: Lord FM, Novick MR, eds. Statistical Theories of Mental Test Scores.
 *   Addison-Wesley; 1968:397-479.
 * - van der Linden WJ, Glas CAW, eds. Elements of Adaptive Testing. Springer; 2010.
 */

export const PSYCHOMETRICS_DISCLAIMER =
  'Formative psychometric item-response model — not an official UKMPPD national licensing score' as const;

const IRT_SCALING_D = 1.702;

export interface IrtAssessmentItem {
  readonly itemId: string;
  readonly conceptId: string;
  readonly discriminationA: number; // (0.1, 4.0]
  readonly difficultyB: number; // [-4.0, 4.0]
  readonly guessingC: number; // [0, 0.35]
  readonly angoffCutProbability: number; // [0.4, 0.9]
}

export interface EvaluateCatStepInput {
  readonly learnerTheta: number; // [-4.0, 4.0]
  readonly administeredResponses: readonly {
    readonly item: IrtAssessmentItem;
    readonly correct: boolean;
  }[];
  readonly candidatePool: readonly IrtAssessmentItem[];
}

export type PsychometricsFailureReason =
  | 'invalid-input'
  | 'theta-out-of-bounds'
  | 'invalid-item-parameters';

export interface CatEvaluationSuccess {
  readonly ok: true;
  readonly priorTheta: number;
  readonly updatedTheta: number;
  readonly testFisherInformation: number;
  readonly standardErrorOfMeasurement: number | null;
  readonly expectedTrueScoreFraction: number;
  readonly angoffCutScoreFraction: number;
  readonly meetsAngoffStandard: boolean;
  readonly nextOptimalItemId: string | null;
  readonly nextOptimalItemInformation: number;
  readonly formula: string;
  readonly truthClass: 'derived';
  readonly label: typeof PSYCHOMETRICS_DISCLAIMER;
}

export interface PsychometricsFailure {
  readonly ok: false;
  readonly reason: PsychometricsFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof PSYCHOMETRICS_DISCLAIMER;
}

export type CatEvaluationResult = CatEvaluationSuccess | PsychometricsFailure;

function validateItem(item: IrtAssessmentItem): string | null {
  if (!item || typeof item.itemId !== 'string' || item.itemId.trim().length === 0) {
    return 'Item must have a non-empty itemId.';
  }
  if (
    typeof item.discriminationA !== 'number' ||
    !Number.isFinite(item.discriminationA) ||
    item.discriminationA < 0.1 ||
    item.discriminationA > 4.0
  ) {
    return `Item "${item.itemId}" discriminationA (${String(item.discriminationA)}) must be in [0.1, 4.0].`;
  }
  if (
    typeof item.difficultyB !== 'number' ||
    !Number.isFinite(item.difficultyB) ||
    item.difficultyB < -4.0 ||
    item.difficultyB > 4.0
  ) {
    return `Item "${item.itemId}" difficultyB (${String(item.difficultyB)}) must be in [-4.0, 4.0].`;
  }
  if (
    typeof item.guessingC !== 'number' ||
    !Number.isFinite(item.guessingC) ||
    item.guessingC < 0 ||
    item.guessingC > 0.35
  ) {
    return `Item "${item.itemId}" guessingC (${String(item.guessingC)}) must be in [0, 0.35].`;
  }
  if (
    typeof item.angoffCutProbability !== 'number' ||
    !Number.isFinite(item.angoffCutProbability) ||
    item.angoffCutProbability < 0.4 ||
    item.angoffCutProbability > 0.9
  ) {
    return `Item "${item.itemId}" angoffCutProbability (${String(item.angoffCutProbability)}) must be in [0.4, 0.9].`;
  }
  return null;
}

export function compute3PlProbability(theta: number, item: IrtAssessmentItem): number {
  const z = IRT_SCALING_D * item.discriminationA * (theta - item.difficultyB);
  const logistic = 1 / (1 + Math.exp(-z));
  return item.guessingC + (1 - item.guessingC) * logistic;
}

export function compute3PlFisherInformation(theta: number, item: IrtAssessmentItem): number {
  const p = compute3PlProbability(theta, item);
  const q = 1 - p;
  const da = IRT_SCALING_D * item.discriminationA;
  const ratio = (p - item.guessingC) / (1 - item.guessingC);
  return da * da * ratio * ratio * (q / p);
}

export function evaluateAdaptiveAssessmentStep(
  input: EvaluateCatStepInput,
): CatEvaluationResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'EvaluateCatStepInput object is required.',
      truthClass: 'derived',
      label: PSYCHOMETRICS_DISCLAIMER,
    });
  }

  if (
    typeof input.learnerTheta !== 'number' ||
    !Number.isFinite(input.learnerTheta) ||
    input.learnerTheta < -4.0 ||
    input.learnerTheta > 4.0
  ) {
    return Object.freeze({
      ok: false,
      reason: 'theta-out-of-bounds',
      detail: `learnerTheta (${String(input.learnerTheta)}) must be finite within [-4.0, 4.0].`,
      truthClass: 'derived',
      label: PSYCHOMETRICS_DISCLAIMER,
    });
  }

  if (!Array.isArray(input.administeredResponses) || !Array.isArray(input.candidatePool)) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'administeredResponses and candidatePool arrays are required.',
      truthClass: 'derived',
      label: PSYCHOMETRICS_DISCLAIMER,
    });
  }

  for (const r of input.administeredResponses) {
    const err = validateItem(r?.item);
    if (err) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-item-parameters',
        detail: err,
        truthClass: 'derived',
        label: PSYCHOMETRICS_DISCLAIMER,
      });
    }
  }

  for (const cand of input.candidatePool) {
    const err = validateItem(cand);
    if (err) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-item-parameters',
        detail: err,
        truthClass: 'derived',
        label: PSYCHOMETRICS_DISCLAIMER,
      });
    }
  }

  // Bounded MAP/Newton single-step ability update
  let scoreGradient = 0;
  let totalInfo = 1.0; // standard normal prior precision = 1.0
  let expectedScoreSum = 0;
  let angoffSum = 0;
  const administeredIds = new Set<string>();

  for (const { item, correct } of input.administeredResponses) {
    administeredIds.add(item.itemId);
    const p = compute3PlProbability(input.learnerTheta, item);
    const info = compute3PlFisherInformation(input.learnerTheta, item);
    const u = correct ? 1 : 0;
    const weight = IRT_SCALING_D * item.discriminationA * ((p - item.guessingC) / (1 - item.guessingC)) * (1 / p);
    scoreGradient += (u - p) * weight;
    totalInfo += info;
    expectedScoreSum += p;
    angoffSum += item.angoffCutProbability;
  }

  const rawUpdatedTheta =
    input.administeredResponses.length > 0
      ? input.learnerTheta + (scoreGradient - input.learnerTheta) / totalInfo
      : input.learnerTheta;
  const updatedTheta = Number(Math.min(4.0, Math.max(-4.0, rawUpdatedTheta)).toFixed(4));

  // Compute Fisher information at updatedTheta across administered items
  let testInfoAtUpdated = 0;
  for (const { item } of input.administeredResponses) {
    testInfoAtUpdated += compute3PlFisherInformation(updatedTheta, item);
  }
  const roundedInfo = Number(testInfoAtUpdated.toFixed(6));
  const sem = testInfoAtUpdated > 0 ? Number((1 / Math.sqrt(testInfoAtUpdated)).toFixed(4)) : null;

  const nAdmin = input.administeredResponses.length;
  const expectedTrueScoreFraction = nAdmin > 0 ? Number((expectedScoreSum / nAdmin).toFixed(4)) : 0;
  const angoffCutScoreFraction = nAdmin > 0 ? Number((angoffSum / nAdmin).toFixed(4)) : 0;

  // Select next unadministered item maximizing Fisher information at updatedTheta
  let nextOptimalItemId: string | null = null;
  let nextOptimalItemInformation = 0;

  for (const cand of input.candidatePool) {
    if (administeredIds.has(cand.itemId)) continue;
    const candInfo = compute3PlFisherInformation(updatedTheta, cand);
    if (candInfo > nextOptimalItemInformation) {
      nextOptimalItemInformation = candInfo;
      nextOptimalItemId = cand.itemId;
    }
  }

  return Object.freeze({
    ok: true,
    priorTheta: input.learnerTheta,
    updatedTheta,
    testFisherInformation: roundedInfo,
    standardErrorOfMeasurement: sem,
    expectedTrueScoreFraction,
    angoffCutScoreFraction,
    meetsAngoffStandard: nAdmin > 0 && expectedTrueScoreFraction >= angoffCutScoreFraction,
    nextOptimalItemId,
    nextOptimalItemInformation: Number(nextOptimalItemInformation.toFixed(6)),
    formula: 'P(theta) = c + (1-c)/(1 + exp(-1.702*a*(theta - b))); I(theta) = (1.702*a)^2 * ((P-c)/(1-c))^2 * (1-P)/P',
    truthClass: 'derived',
    label: PSYCHOMETRICS_DISCLAIMER,
  });
}
