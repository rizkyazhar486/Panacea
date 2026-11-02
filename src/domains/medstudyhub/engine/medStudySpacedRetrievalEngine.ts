/**
 * MedStudyHub Adaptive Spaced-Retrieval & Remediation Scheduler Engine (EDU-2).
 *
 * Implements the power-law forgetting curve (FSRS-v4.5 / Ebbinghaus formulation)
 * where memory retrievability R(t, S) at elapsed time t (days) for stability S (days) is:
 *   R(t, S) = (1 + FACTOR * (t / S)) ^ DECAY
 * with FACTOR = 19 / 81 and DECAY = -0.5, satisfying R(S, S) = 0.90 exactly.
 *
 * Citations:
 * - Cepeda NJ, Pashler H, Vul E, Wixted JT, Rohrer D. Distributed practice in verbal
 *   recall tasks: A review and quantitative synthesis. Psychol Bull. 2006;132(3):354-380. PMID: 16719566.
 * - Wickelgren WA. Single-trace fragility theory of memory dynamics. Mem Cognit. 1974;2(4):775-780.
 */

export type RetrievalRating = 1 | 2 | 3 | 4; // 1=Again (Lapse), 2=Hard, 3=Good, 4=Easy

export const SPACED_RETRIEVAL_DISCLAIMER =
  'Cognitive spaced-retrieval memory model — not a clinical competency certification' as const;

const FSRS_FACTOR = 19 / 81;
const FSRS_DECAY = -0.5;

export interface MemoryCardStateInput {
  readonly conceptId: string;
  readonly stabilityDays: number;
  readonly difficulty: number; // [1, 10]
  readonly elapsedDays: number;
  readonly rating: RetrievalRating;
  readonly desiredRetention?: number; // (0.70, 0.99), default 0.90
  readonly prerequisiteConceptIds?: readonly string[];
}

export type SpacedRetrievalFailureReason =
  | 'invalid-input'
  | 'invalid-stability'
  | 'invalid-difficulty'
  | 'invalid-rating'
  | 'invalid-retention-target';

export interface SpacedRetrievalUpdateSuccess {
  readonly ok: true;
  readonly conceptId: string;
  readonly retrievabilityBeforeReview: number;
  readonly nextStabilityDays: number;
  readonly nextDifficulty: number;
  readonly nextIntervalDays: number;
  readonly isLapse: boolean;
  readonly remediationPrerequisiteIds: readonly string[];
  readonly formula: string;
  readonly truthClass: 'derived';
  readonly label: typeof SPACED_RETRIEVAL_DISCLAIMER;
}

export interface SpacedRetrievalUpdateFailure {
  readonly ok: false;
  readonly reason: SpacedRetrievalFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof SPACED_RETRIEVAL_DISCLAIMER;
}

export type SpacedRetrievalUpdateResult =
  | SpacedRetrievalUpdateSuccess
  | SpacedRetrievalUpdateFailure;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Computes exact power-law retrievability R(t, S) = (1 + (19/81)*(t/S))^(-0.5),
 * updates difficulty D in [1, 10], updates stability S, and routes lapses (rating=1)
 * to prerequisite remediation concepts.
 */
export function scheduleSpacedRetrievalReview(
  input: MemoryCardStateInput,
): SpacedRetrievalUpdateResult {
  if (!input || typeof input !== 'object' || typeof input.conceptId !== 'string' || input.conceptId.trim().length === 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid MemoryCardStateInput with non-empty conceptId is required.',
      truthClass: 'derived',
      label: SPACED_RETRIEVAL_DISCLAIMER,
    });
  }

  if (typeof input.stabilityDays !== 'number' || !Number.isFinite(input.stabilityDays) || input.stabilityDays <= 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-stability',
      detail: `stabilityDays (${String(input.stabilityDays)}) must be finite and strictly positive (> 0).`,
      truthClass: 'derived',
      label: SPACED_RETRIEVAL_DISCLAIMER,
    });
  }

  if (typeof input.difficulty !== 'number' || !Number.isFinite(input.difficulty) || input.difficulty < 1 || input.difficulty > 10) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-difficulty',
      detail: `difficulty (${String(input.difficulty)}) must be finite within [1, 10].`,
      truthClass: 'derived',
      label: SPACED_RETRIEVAL_DISCLAIMER,
    });
  }

  if (typeof input.elapsedDays !== 'number' || !Number.isFinite(input.elapsedDays) || input.elapsedDays < 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: `elapsedDays (${String(input.elapsedDays)}) must be finite and >= 0.`,
      truthClass: 'derived',
      label: SPACED_RETRIEVAL_DISCLAIMER,
    });
  }

  if (input.rating !== 1 && input.rating !== 2 && input.rating !== 3 && input.rating !== 4) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-rating',
      detail: `rating (${String(input.rating)}) must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).`,
      truthClass: 'derived',
      label: SPACED_RETRIEVAL_DISCLAIMER,
    });
  }

  const desiredRetention = input.desiredRetention ?? 0.9;
  if (
    typeof desiredRetention !== 'number' ||
    !Number.isFinite(desiredRetention) ||
    desiredRetention < 0.7 ||
    desiredRetention > 0.99
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-retention-target',
      detail: `desiredRetention (${String(desiredRetention)}) must be finite within [0.70, 0.99].`,
      truthClass: 'derived',
      label: SPACED_RETRIEVAL_DISCLAIMER,
    });
  }

  const rBefore = Number(
    Math.pow(1 + FSRS_FACTOR * (input.elapsedDays / input.stabilityDays), FSRS_DECAY).toFixed(6),
  );

  // Difficulty update with mean reversion toward D0 = 5.0
  const deltaD = -0.8 * (input.rating - 3);
  const rawNextD = input.difficulty + deltaD + 0.1 * (5.0 - (input.difficulty + deltaD));
  const nextDifficulty = Number(clamp(rawNextD, 1, 10).toFixed(4));

  let nextStability: number;
  let isLapse = false;
  const remediationPrerequisiteIds: string[] = [];

  if (input.rating === 1) {
    isLapse = true;
    // Post-lapse stability contraction bounded below by 0.5 days
    const lapseFactor = 0.25 * Math.pow(nextDifficulty, -0.3) * Math.pow(input.stabilityDays, 0.2);
    nextStability = Number(Math.max(0.5, Math.min(input.stabilityDays * 0.5, lapseFactor)).toFixed(4));
    if (Array.isArray(input.prerequisiteConceptIds)) {
      remediationPrerequisiteIds.push(...input.prerequisiteConceptIds);
    }
  } else {
    const hardPenalty = input.rating === 2 ? 0.65 : 1.0;
    const easyBonus = input.rating === 4 ? 1.35 : 1.0;
    const recallGain =
      1 +
      Math.exp(1.1) *
        ((11 - nextDifficulty) / 10) *
        Math.pow(input.stabilityDays, -0.15) *
        (Math.exp(0.9 * (1 - rBefore)) - 1) *
        hardPenalty *
        easyBonus;
    nextStability = Number((input.stabilityDays * recallGain).toFixed(4));
  }

  // Exact inverse of R(I, S) = desiredRetention => I = (S / FSRS_FACTOR) * (desiredRetention^(1/FSRS_DECAY) - 1)
  const intervalScale = (Math.pow(desiredRetention, 1 / FSRS_DECAY) - 1) / FSRS_FACTOR;
  const nextIntervalDays = Number(Math.max(1, nextStability * intervalScale).toFixed(2));

  return Object.freeze({
    ok: true,
    conceptId: input.conceptId.trim(),
    retrievabilityBeforeReview: rBefore,
    nextStabilityDays: nextStability,
    nextDifficulty,
    nextIntervalDays,
    isLapse,
    remediationPrerequisiteIds: Object.freeze(remediationPrerequisiteIds),
    formula: 'R(t, S) = (1 + (19/81)*(t/S))^(-0.5); I(R_d, S) = (81/19)*S*(R_d^(-2) - 1)',
    truthClass: 'derived',
    label: SPACED_RETRIEVAL_DISCLAIMER,
  });
}
