// Deterministic learning-progress reducer: scoring, idempotent submission, prerequisite gating and spaced review.
// Spaced review = classic Leitner boxes (public-domain technique; Leitner 1972): correct → next box, wrong → box 0;
// interval days per box = [1,2,4,8,16]. This is a simple scheduler, NOT an optimised/validated algorithm. Day numbers are injected integers.
import { LEARNING_SCHEMA_VERSION, type LearningCatalog, type LearningProgress, type Question } from '../model/types.ts'

export const LEITNER_INTERVAL_DAYS = [1, 2, 4, 8, 16] as const

export const newProgress = (userId: string): LearningProgress => ({ schemaVersion: LEARNING_SCHEMA_VERSION, userId, attempts: {}, review: {}, startedLessons: [] })

const lastAttempt = (p: LearningProgress, qid: string) => ((a) => a[a.length - 1])(p.attempts[qid] ?? [])
export const isLessonMastered = (p: LearningProgress, c: LearningCatalog, lessonId: string): boolean => {
  const l = c.lessons.find((x) => x.id === lessonId)
  return !!l && l.questionIds.length > 0 && l.questionIds.every((q) => lastAttempt(p, q)?.correct === true)
}

export type StartResult = { ok: true; progress: LearningProgress } | { ok: false; reason: 'unknown_lesson' | 'wrong_user' | 'prerequisites_unmet'; missing?: readonly string[] }
export function startLesson(p: LearningProgress, c: LearningCatalog, userId: string, lessonId: string): StartResult {
  if (userId !== p.userId) return { ok: false, reason: 'wrong_user' }
  const l = c.lessons.find((x) => x.id === lessonId)
  if (!l) return { ok: false, reason: 'unknown_lesson' }
  const missing = l.prerequisites.filter((r) => !isLessonMastered(p, c, r))
  if (missing.length) return { ok: false, reason: 'prerequisites_unmet', missing }
  return { ok: true, progress: p.startedLessons.includes(lessonId) ? p : { ...p, startedLessons: [...p.startedLessons, lessonId] } }
}

export interface Feedback { correct: boolean; correctOptionId: string; rationale: string; selectedRationale: string; referenceIds: readonly string[]; duplicate: boolean }
export type SubmitResult = { ok: true; progress: LearningProgress; feedback: Feedback } | { ok: false; reason: 'wrong_user' | 'unknown_question' | 'unknown_option' | 'lesson_not_started' | 'bad_day' | 'empty_attempt_id' }

export function submitAnswer(p: LearningProgress, c: LearningCatalog, input: { userId: string; questionId: string; optionId: string; attemptId: string; day: number }): SubmitResult {
  if (input.userId !== p.userId) return { ok: false, reason: 'wrong_user' }
  if (!input.attemptId.trim()) return { ok: false, reason: 'empty_attempt_id' }
  if (!Number.isInteger(input.day) || input.day < 0) return { ok: false, reason: 'bad_day' }
  const q: Question | undefined = c.questions.find((x) => x.id === input.questionId)
  if (!q) return { ok: false, reason: 'unknown_question' }
  const opt = q.options.find((o) => o.id === input.optionId)
  if (!opt) return { ok: false, reason: 'unknown_option' }
  if (!p.startedLessons.includes(q.lessonId)) return { ok: false, reason: 'lesson_not_started' }
  const correctOpt = q.options.find((o) => o.id === q.correctOptionId)!
  const mk = (duplicate: boolean, correct: boolean): Feedback => ({ correct, correctOptionId: q.correctOptionId, rationale: correctOpt.rationale, selectedRationale: opt.rationale, referenceIds: q.referenceIds, duplicate })

  const prior = (p.attempts[q.id] ?? []).find((a) => a.attemptId === input.attemptId)
  if (prior) return { ok: true, progress: p, feedback: mk(true, prior.correct) } // duplicate submission: state unchanged

  const correct = opt.id === q.correctOptionId
  const prev = p.review[q.id]
  const box = correct ? Math.min((prev?.box ?? -1) + 1, LEITNER_INTERVAL_DAYS.length - 1) : 0
  return {
    ok: true, feedback: mk(false, correct),
    progress: {
      ...p,
      attempts: { ...p.attempts, [q.id]: [...(p.attempts[q.id] ?? []), { attemptId: input.attemptId, optionId: opt.id, correct, day: input.day }] },
      review: { ...p.review, [q.id]: { box, dueDay: input.day + LEITNER_INTERVAL_DAYS[box]! } },
    },
  }
}

/** Questions due for retrieval practice on `day`, most overdue first, ties by id. */
export function dueReviews(p: LearningProgress, day: number): readonly string[] {
  return Object.entries(p.review).filter(([, r]) => r.dueDay <= day).sort((a, b) => a[1].dueDay - b[1].dueDay || a[0].localeCompare(b[0])).map(([id]) => id)
}

export function serializeProgress(p: LearningProgress): string { return JSON.stringify(p) }

/** Restore persisted progress; corrupted, foreign-user or incompatible state fails closed (caller starts fresh, never guesses). */
export function restoreProgress(raw: string, expectedUserId: string, c: LearningCatalog): { ok: true; progress: LearningProgress } | { ok: false; reason: 'corrupt' | 'wrong_user' | 'incompatible_version' | 'unknown_reference_in_state' } {
  let v: unknown
  try { v = JSON.parse(raw) } catch { return { ok: false, reason: 'corrupt' } }
  const o = v as Partial<LearningProgress> | null
  if (!o || typeof o !== 'object' || typeof o.userId !== 'string' || typeof o.schemaVersion !== 'string' || !o.attempts || !o.review || !Array.isArray(o.startedLessons)) return { ok: false, reason: 'corrupt' }
  if (o.userId !== expectedUserId) return { ok: false, reason: 'wrong_user' }
  if (o.schemaVersion.split('.')[0] !== LEARNING_SCHEMA_VERSION.split('.')[0]) return { ok: false, reason: 'incompatible_version' }
  const qids = new Set(c.questions.map((q) => q.id)), lids = new Set(c.lessons.map((l) => l.id))
  for (const [qid, list] of Object.entries(o.attempts)) {
    if (!qids.has(qid) || !Array.isArray(list) || list.some((a) => typeof a?.attemptId !== 'string' || typeof a.correct !== 'boolean' || !Number.isInteger(a.day))) return { ok: false, reason: qids.has(qid) ? 'corrupt' : 'unknown_reference_in_state' }
  }
  for (const [qid, r] of Object.entries(o.review)) if (!qids.has(qid) || !Number.isInteger(r?.box) || r.box < 0 || r.box >= LEITNER_INTERVAL_DAYS.length || !Number.isInteger(r.dueDay)) return { ok: false, reason: 'corrupt' }
  if (o.startedLessons.some((l) => !lids.has(l))) return { ok: false, reason: 'unknown_reference_in_state' }
  return { ok: true, progress: o as LearningProgress }
}
