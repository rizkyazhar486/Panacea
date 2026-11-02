/**
 * Workout Tracker & "Train Hard, Rest Smart" Biomechanical Load Engine (ASC-1B).
 *
 * Citations:
 * - Gabbett TJ. Br J Sports Med. 2016;50(5):273-280 (PMID: 26758673).
 * - Morton RW et al. Br J Sports Med. 2018;52(6):376-384 (PMID: 28698222).
 */

export type WorkoutSplitCategory = 'push' | 'pull' | 'legs' | 'calisthenics' | 'full-body' | 'cardio-run';

export const WORKOUT_TRACKER_DISCLAIMER =
  'Biomechanical training load & nutritional reference calculator — not a clinical prescription' as const;

export const WORKOUT_SCIENCE_SOURCE = Object.freeze({
  citation:
    'Gabbett TJ. The training-injury prevention paradox: should athletes be training smarter and harder? Br J Sports Med. 2016;50(5):273-280 (PMID: 26758673); Morton RW et al. Br J Sports Med. 2018;52(6):376-384 (PMID: 28698222).',
  pmids: Object.freeze(['26758673', '28698222']),
  verifiedFrom: 'abstract' as const,
});

export interface WorkoutMoveEntry {
  readonly moveId: string;
  readonly name: string;
  readonly sets: number;
  readonly reps: number;
  readonly loadKg: number;
}

export interface WorkoutSessionInput {
  readonly sessionId: string;
  readonly title: string;
  readonly split: WorkoutSplitCategory;
  readonly durationMinutes: number;
  readonly moves: readonly WorkoutMoveEntry[];
  readonly bodyMassKg: number;
  readonly sleepHoursLastNight: number;
  readonly acute7DayLoadAu: number;
  readonly chronic28DayWeeklyAvgLoadAu: number;
  readonly sessionRpe1To10: number;
}

export type WorkoutFailureReason =
  | 'invalid-input'
  | 'empty-workout-moves'
  | 'invalid-rpe-or-sleep';

export interface MovePerformanceSummary {
  readonly moveId: string;
  readonly name: string;
  readonly sets: number;
  readonly reps: number;
  readonly loadKg: number;
  readonly moveVolumeKg: number;
  readonly estimatedOneRepMaxKg: number;
}

export type RecoveryReadinessZone =
  | 'under-stimulated'
  | 'optimal-progressive-loading'
  | 'caution-high-fatigue'
  | 'rest-smart-deload-required';

export interface WorkoutSessionEvaluationSuccess {
  readonly ok: true;
  readonly sessionId: string;
  readonly title: string;
  readonly split: WorkoutSplitCategory;
  readonly durationMinutes: number;
  readonly totalSets: number;
  readonly totalMoves: number;
  readonly totalVolumeKg: number;
  readonly sessionLoadAu: number;
  readonly updatedAcuteToChronicRatio: number;
  readonly recoveryReadinessZone: RecoveryReadinessZone;
  readonly recommendedDailyProteinGrams: number;
  readonly muscleLoadOverBasePercent: number;
  readonly moveSummaries: readonly MovePerformanceSummary[];
  readonly truthClass: 'derived';
  readonly label: typeof WORKOUT_TRACKER_DISCLAIMER;
  readonly source: typeof WORKOUT_SCIENCE_SOURCE;
}

export interface WorkoutSessionEvaluationFailure {
  readonly ok: false;
  readonly reason: WorkoutFailureReason;
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof WORKOUT_TRACKER_DISCLAIMER;
}

export type WorkoutSessionEvaluationResult =
  | WorkoutSessionEvaluationSuccess
  | WorkoutSessionEvaluationFailure;

export function evaluateWorkoutSessionAndRecovery(
  input: WorkoutSessionInput,
): WorkoutSessionEvaluationResult {
  if (!input || typeof input !== 'object' || typeof input.sessionId !== 'string' || input.sessionId.trim().length === 0) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Valid WorkoutSessionInput with sessionId is required.',
      truthClass: 'derived',
      label: WORKOUT_TRACKER_DISCLAIMER,
    });
  }

  if (
    typeof input.durationMinutes !== 'number' ||
    !Number.isFinite(input.durationMinutes) ||
    input.durationMinutes <= 0 ||
    typeof input.bodyMassKg !== 'number' ||
    !Number.isFinite(input.bodyMassKg) ||
    input.bodyMassKg < 25 ||
    input.bodyMassKg > 250 ||
    typeof input.acute7DayLoadAu !== 'number' ||
    !Number.isFinite(input.acute7DayLoadAu) ||
    input.acute7DayLoadAu < 0 ||
    typeof input.chronic28DayWeeklyAvgLoadAu !== 'number' ||
    !Number.isFinite(input.chronic28DayWeeklyAvgLoadAu) ||
    input.chronic28DayWeeklyAvgLoadAu <= 0
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'durationMinutes (>0), bodyMassKg [25, 250], acute7DayLoadAu (>=0), and chronic28DayWeeklyAvgLoadAu (>0) must be finite.',
      truthClass: 'derived',
      label: WORKOUT_TRACKER_DISCLAIMER,
    });
  }

  if (
    typeof input.sessionRpe1To10 !== 'number' ||
    !Number.isFinite(input.sessionRpe1To10) ||
    input.sessionRpe1To10 < 1 ||
    input.sessionRpe1To10 > 10 ||
    typeof input.sleepHoursLastNight !== 'number' ||
    !Number.isFinite(input.sleepHoursLastNight) ||
    input.sleepHoursLastNight < 0 ||
    input.sleepHoursLastNight > 24
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-rpe-or-sleep',
      detail: 'sessionRpe1To10 must be in [1, 10] and sleepHoursLastNight in [0, 24].',
      truthClass: 'derived',
      label: WORKOUT_TRACKER_DISCLAIMER,
    });
  }

  if (!Array.isArray(input.moves) || input.moves.length === 0) {
    return Object.freeze({
      ok: false,
      reason: 'empty-workout-moves',
      detail: 'At least one workout move is required.',
      truthClass: 'derived',
      label: WORKOUT_TRACKER_DISCLAIMER,
    });
  }

  let totalSets = 0;
  let totalVolumeKg = 0;
  const moveSummaries: MovePerformanceSummary[] = [];

  for (const m of input.moves) {
    if (
      !m ||
      typeof m.sets !== 'number' ||
      !Number.isInteger(m.sets) ||
      m.sets <= 0 ||
      typeof m.reps !== 'number' ||
      !Number.isInteger(m.reps) ||
      m.reps <= 0 ||
      typeof m.loadKg !== 'number' ||
      !Number.isFinite(m.loadKg) ||
      m.loadKg <= 0
    ) {
      return Object.freeze({
        ok: false,
        reason: 'invalid-input',
        detail: `Move "${String(m?.name)}" requires positive integer sets/reps and finite loadKg > 0.`,
        truthClass: 'derived',
        label: WORKOUT_TRACKER_DISCLAIMER,
      });
    }

    const moveVol = Number((m.sets * m.reps * m.loadKg).toFixed(2));
    const effectiveReps = Math.min(15, m.reps);
    const epley1Rm = Number((m.loadKg * (1 + effectiveReps / 30)).toFixed(2));

    totalSets += m.sets;
    totalVolumeKg += moveVol;
    moveSummaries.push(
      Object.freeze({
        moveId: m.moveId,
        name: m.name,
        sets: m.sets,
        reps: m.reps,
        loadKg: m.loadKg,
        moveVolumeKg: moveVol,
        estimatedOneRepMaxKg: epley1Rm,
      }),
    );
  }

  const sessionLoadAu = Number((input.durationMinutes * input.sessionRpe1To10).toFixed(2));
  const newAcuteLoad = input.acute7DayLoadAu + sessionLoadAu;
  const acwr = Number((newAcuteLoad / input.chronic28DayWeeklyAvgLoadAu).toFixed(4));
  const muscleLoadOverBasePercent = Number(((acwr - 1.0) * 100).toFixed(1));

  let readinessZone: RecoveryReadinessZone = 'optimal-progressive-loading';
  if (acwr > 1.5 || input.sleepHoursLastNight < 5.0) {
    readinessZone = 'rest-smart-deload-required';
  } else if (acwr > 1.3 || input.sleepHoursLastNight < 6.5) {
    readinessZone = 'caution-high-fatigue';
  } else if (acwr < 0.8) {
    readinessZone = 'under-stimulated';
  }

  const proteinMultiplier = acwr >= 1.1 ? 2.0 : 1.8;
  const recommendedDailyProteinGrams = Math.round(input.bodyMassKg * proteinMultiplier);

  return Object.freeze({
    ok: true,
    sessionId: input.sessionId.trim(),
    title: input.title.trim(),
    split: input.split,
    durationMinutes: input.durationMinutes,
    totalSets,
    totalMoves: input.moves.length,
    totalVolumeKg: Number(totalVolumeKg.toFixed(2)),
    sessionLoadAu,
    updatedAcuteToChronicRatio: acwr,
    recoveryReadinessZone: readinessZone,
    recommendedDailyProteinGrams,
    muscleLoadOverBasePercent,
    moveSummaries: Object.freeze(moveSummaries),
    truthClass: 'derived',
    label: WORKOUT_TRACKER_DISCLAIMER,
    source: WORKOUT_SCIENCE_SOURCE,
  });
}

export { evaluateWorkoutSessionAndRecovery as evaluateWorkoutSession };

