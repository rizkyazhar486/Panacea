// Prometheus Arena — competitive retrieval practice against three SIMULATED rival bots.
// Pure & deterministic: randomness comes only from the injected integer seed (mulberry32), time only from caller-supplied ms values.
// The bots do NOT generate or interpret medical content and are not AI advisors: each one only picks an option from an already validated
// catalog question, correct with a fixed per-difficulty probability. Questions come only from lessons the learner has unlocked
// (prerequisite gating is preserved). Points and rating are game feedback, never evidence of knowledge or clinical competence.
import type { LearningCatalog, LearningProgress, Question } from '../model/types.ts'
import { submitAnswer } from './progress.ts'

export const ARENA_SCHEMA_VERSION = '1.0.0' as const
export const ARENA_DISCLAIMER = 'Rivals are simulated bots with fixed accuracy profiles; they do not generate medical content. Points and rating are game feedback, not a measure of clinical competence.' as const

export interface BotProfile {
  id: string; name: string; persona: string
  /** Probability of choosing the keyed answer at lesson difficulty 1/2/3. */
  accuracy: Readonly<Record<1 | 2 | 3, number>>
  meanResponseMs: number; jitterMs: number
  /** Fixed game rating used for the learner's Elo update. */
  rating: number
  simulated: true
}

export const ARENA_BOTS: readonly BotProfile[] = Object.freeze([
  { id: 'bot:aria', name: 'Aria', persona: 'Speedster — answers first, sometimes too fast.', accuracy: { 1: 0.62, 2: 0.5, 3: 0.4 }, meanResponseMs: 4200, jitterMs: 1800, rating: 1100, simulated: true },
  { id: 'bot:kenji', name: 'Kenji', persona: 'Steady — methodical and consistent.', accuracy: { 1: 0.76, 2: 0.66, 3: 0.55 }, meanResponseMs: 7600, jitterMs: 2200, rating: 1250, simulated: true },
  { id: 'bot:mira', name: 'Mira', persona: 'Scholar — slow, careful and rarely wrong.', accuracy: { 1: 0.9, 2: 0.82, 3: 0.72 }, meanResponseMs: 10800, jitterMs: 2600, rating: 1400, simulated: true },
])

export const SCORING = Object.freeze({ base: 100, maxSpeedBonus: 50, streakStep: 10, streakCap: 30, eloK: 24, minResponseMs: 300 })

/** mulberry32 — small public-domain PRNG; deterministic for a given 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Competitor = 'learner' | string
export interface RoundAnswer { competitorId: Competitor; optionId: string | null; responseMs: number; correct: boolean; points: number; timedOut: boolean }
export interface Round { questionId: string; answers: readonly RoundAnswer[] }
export interface ArenaMatch {
  schemaVersion: string
  matchId: string; userId: string; seed: number; timeLimitMs: number
  questionIds: readonly string[]
  bots: readonly BotProfile[]
  /** Pre-drawn bot answers per round (determinism: independent of learner behaviour). */
  botPlan: readonly (readonly RoundAnswer[])[]
  rounds: readonly Round[]
  status: 'in_progress' | 'finished'
}

export type ArenaError = 'no_eligible_questions' | 'too_few_questions' | 'unknown_question' | 'duplicate_question' | 'question_locked' | 'bad_time_limit' | 'bad_seed' | 'bad_bot' | 'wrong_user' | 'match_finished' | 'unknown_option' | 'bad_response_time' | 'empty_match_id'

/** Questions the learner may face: only from lessons they have already started (so arena never bypasses prerequisites). */
export function eligibleArenaQuestions(p: LearningProgress, c: LearningCatalog): readonly string[] {
  const started = new Set(p.startedLessons)
  return c.questions.filter((q) => started.has(q.lessonId)).map((q) => q.id).sort()
}

/** Deterministic seeded selection of `n` distinct eligible questions (Fisher–Yates on a sorted copy). */
export function pickArenaQuestions(eligible: readonly string[], n: number, seed: number): readonly string[] {
  const arr = [...eligible].sort(); const rnd = mulberry32(seed ^ 0x9e3779b9)
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j]!, arr[i]!] }
  return arr.slice(0, Math.min(n, arr.length))
}

const difficultyOf = (c: LearningCatalog, q: Question): 1 | 2 | 3 => c.lessons.find((l) => l.id === q.lessonId)?.difficulty ?? 2

export function pointsFor(correct: boolean, responseMs: number, timeLimitMs: number, streakBefore: number): number {
  if (!correct) return 0
  const speed = Math.floor(SCORING.maxSpeedBonus * Math.max(0, 1 - responseMs / timeLimitMs))
  return SCORING.base + speed + Math.min(streakBefore * SCORING.streakStep, SCORING.streakCap)
}

function validBot(b: BotProfile): boolean {
  const accs = [b.accuracy[1], b.accuracy[2], b.accuracy[3]]
  return b.simulated === true && !!b.id && accs.every((a) => Number.isFinite(a) && a >= 0 && a <= 1) && b.meanResponseMs > 0 && b.jitterMs >= 0 && Number.isFinite(b.rating)
}

function streakOf(rounds: readonly Round[], id: Competitor): number {
  let s = 0
  for (let i = rounds.length - 1; i >= 0; i--) { const a = rounds[i]!.answers.find((x) => x.competitorId === id); if (a?.correct) s++; else break }
  return s
}

export function createMatch(input: { matchId: string; userId: string; seed: number; timeLimitMs: number; questionIds: readonly string[]; bots?: readonly BotProfile[] }, c: LearningCatalog, p: LearningProgress): { ok: true; match: ArenaMatch } | { ok: false; reason: ArenaError } {
  const bots = input.bots ?? ARENA_BOTS
  if (!input.matchId.trim()) return { ok: false, reason: 'empty_match_id' }
  if (input.userId !== p.userId) return { ok: false, reason: 'wrong_user' }
  if (!Number.isInteger(input.seed)) return { ok: false, reason: 'bad_seed' }
  if (!Number.isInteger(input.timeLimitMs) || input.timeLimitMs < 5000 || input.timeLimitMs > 120000) return { ok: false, reason: 'bad_time_limit' }
  if (!bots.length || !bots.every(validBot) || new Set(bots.map((b) => b.id)).size !== bots.length) return { ok: false, reason: 'bad_bot' }
  const eligible = new Set(eligibleArenaQuestions(p, c))
  if (!eligible.size) return { ok: false, reason: 'no_eligible_questions' }
  if (input.questionIds.length < 1) return { ok: false, reason: 'too_few_questions' }
  if (new Set(input.questionIds).size !== input.questionIds.length) return { ok: false, reason: 'duplicate_question' }
  for (const qid of input.questionIds) {
    if (!c.questions.some((q) => q.id === qid)) return { ok: false, reason: 'unknown_question' }
    if (!eligible.has(qid)) return { ok: false, reason: 'question_locked' }
  }
  // Pre-draw every bot answer from one seeded stream, in fixed (round, bot) order.
  const rnd = mulberry32(input.seed)
  const streaks = new Map<string, number>(bots.map((b) => [b.id, 0]))
  const botPlan = input.questionIds.map((qid) => {
    const q = c.questions.find((x) => x.id === qid)!
    const diff = difficultyOf(c, q)
    return bots.map((b): RoundAnswer => {
      const uCorrect = rnd(), uPick = rnd(), uTime = rnd()
      const responseMs = Math.max(SCORING.minResponseMs, Math.round(b.meanResponseMs + (uTime * 2 - 1) * b.jitterMs))
      const timedOut = responseMs > input.timeLimitMs
      const wrong = q.options.filter((o) => o.id !== q.correctOptionId)
      const optionId = timedOut ? null : uCorrect < b.accuracy[diff] ? q.correctOptionId : wrong[Math.floor(uPick * wrong.length)]!.id
      const correct = optionId === q.correctOptionId
      const pts = pointsFor(correct, responseMs, input.timeLimitMs, streaks.get(b.id)!)
      streaks.set(b.id, correct ? streaks.get(b.id)! + 1 : 0)
      return { competitorId: b.id, optionId, responseMs: timedOut ? input.timeLimitMs : responseMs, correct, points: pts, timedOut }
    })
  })
  return { ok: true, match: { schemaVersion: ARENA_SCHEMA_VERSION, matchId: input.matchId, userId: input.userId, seed: input.seed, timeLimitMs: input.timeLimitMs, questionIds: [...input.questionIds], bots, botPlan, rounds: [], status: 'in_progress' } }
}

export const currentQuestionId = (m: ArenaMatch): string | null => (m.status === 'finished' ? null : m.questionIds[m.rounds.length] ?? null)

/** Learner answers the current round (optionId null = timed out). Reveals bot answers for that round only. */
export function answerRound(m: ArenaMatch, c: LearningCatalog, input: { userId: string; questionId: string; optionId: string | null; responseMs: number }): { ok: true; match: ArenaMatch; round: Round } | { ok: false; reason: ArenaError | 'stale_round' } {
  if (input.userId !== m.userId) return { ok: false, reason: 'wrong_user' }
  if (m.status === 'finished') return { ok: false, reason: 'match_finished' }
  const qid = currentQuestionId(m)!
  if (input.questionId !== qid) return { ok: false, reason: 'stale_round' } // duplicate/late submit for a past round: no state change
  if (!Number.isFinite(input.responseMs) || input.responseMs < 0) return { ok: false, reason: 'bad_response_time' }
  const q = c.questions.find((x) => x.id === qid)!
  if (input.optionId !== null && !q.options.some((o) => o.id === input.optionId)) return { ok: false, reason: 'unknown_option' }
  const timedOut = input.optionId === null || input.responseMs > m.timeLimitMs
  const optionId = timedOut ? null : input.optionId
  const correct = optionId === q.correctOptionId
  const rms = Math.min(input.responseMs, m.timeLimitMs)
  const learner: RoundAnswer = { competitorId: 'learner', optionId, responseMs: rms, correct, timedOut, points: pointsFor(correct, rms, m.timeLimitMs, streakOf(m.rounds, 'learner')) }
  const round: Round = { questionId: qid, answers: [learner, ...m.botPlan[m.rounds.length]!] }
  const rounds = [...m.rounds, round]
  return { ok: true, round, match: { ...m, rounds, status: rounds.length === m.questionIds.length ? 'finished' : 'in_progress' } }
}

export interface Standing { competitorId: Competitor; name: string; points: number; correct: number; totalMs: number; rank: number }
export function standings(m: ArenaMatch): readonly Standing[] {
  const names = new Map<string, string>([['learner', 'You'], ...m.bots.map((b) => [b.id, b.name] as [string, string])])
  const rows = [...names.keys()].map((id) => {
    const as = m.rounds.map((r) => r.answers.find((a) => a.competitorId === id)!)
    return { competitorId: id, name: names.get(id)!, points: as.reduce((s, a) => s + a.points, 0), correct: as.filter((a) => a.correct).length, totalMs: as.reduce((s, a) => s + a.responseMs, 0), rank: 0 }
  })
  rows.sort((a, b) => b.points - a.points || b.correct - a.correct || a.totalMs - b.totalMs || a.competitorId.localeCompare(b.competitorId))
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

/** Learner game rating: pairwise Elo vs each bot's fixed rating, outcome by match points (tie = 0.5). Game metric only. */
export function updateRating(m: ArenaMatch, learnerRating: number): { ok: true; rating: number; delta: number } | { ok: false; reason: 'match_not_finished' | 'bad_rating' } {
  if (m.status !== 'finished') return { ok: false, reason: 'match_not_finished' }
  if (!Number.isFinite(learnerRating)) return { ok: false, reason: 'bad_rating' }
  const st = standings(m); const me = st.find((s) => s.competitorId === 'learner')!
  let delta = 0
  for (const b of m.bots) {
    const them = st.find((s) => s.competitorId === b.id)!
    const outcome = me.points > them.points ? 1 : me.points === them.points ? 0.5 : 0
    const expected = 1 / (1 + 10 ** ((b.rating - learnerRating) / 400))
    delta += SCORING.eloK * (outcome - expected)
  }
  const d = Math.round(delta)
  return { ok: true, rating: learnerRating + d, delta: d }
}

/** Feed learner arena answers into canonical learning progress (retrieval practice). Timed-out rounds are not recorded as answers. */
export function applyMatchToProgress(p: LearningProgress, c: LearningCatalog, m: ArenaMatch, day: number): { progress: LearningProgress; applied: number; skipped: readonly string[] } {
  let progress = p; let applied = 0; const skipped: string[] = []
  for (const r of m.rounds) {
    const a = r.answers.find((x) => x.competitorId === 'learner')!
    if (a.optionId === null) { skipped.push(r.questionId); continue }
    const res = submitAnswer(progress, c, { userId: m.userId, questionId: r.questionId, optionId: a.optionId, attemptId: `${m.matchId}:${r.questionId}`, day })
    if (res.ok && !res.feedback.duplicate) { progress = res.progress; applied++ } else skipped.push(r.questionId)
  }
  return { progress, applied, skipped }
}

/** Terminal-style transcript lines for the match log panel (pure; rendering is the UI's job). */
export function matchLog(m: ArenaMatch, c: LearningCatalog): readonly string[] {
  const names = new Map<string, string>([['learner', 'YOU'], ...m.bots.map((b) => [b.id, b.name.toUpperCase()] as [string, string])])
  const lines = [`$ prometheus arena --match ${m.matchId} --seed ${m.seed} --rounds ${m.questionIds.length}`, `# ${ARENA_DISCLAIMER}`]
  m.rounds.forEach((r, i) => {
    const q = c.questions.find((x) => x.id === r.questionId)!
    lines.push(`[round ${i + 1}/${m.questionIds.length}] ${q.id}`)
    for (const a of [...r.answers].sort((x, y) => x.responseMs - y.responseMs)) {
      const verdict = a.timedOut ? 'TIMEOUT' : a.correct ? 'CORRECT' : `WRONG(${a.optionId})`
      lines.push(`  ${(names.get(a.competitorId) ?? a.competitorId).padEnd(6)} ${(a.responseMs / 1000).toFixed(1).padStart(5)}s  ${verdict.padEnd(10)} +${a.points}`)
    }
    lines.push(`  key=${q.correctOptionId}  refs=${q.referenceIds.join(',')}`)
  })
  if (m.status === 'finished') { lines.push('== final standings =='); for (const s of standings(m)) lines.push(`  #${s.rank} ${s.name.padEnd(6)} ${String(s.points).padStart(5)} pts  ${s.correct}/${m.questionIds.length} correct`) }
  return lines
}

export function serializeMatch(m: ArenaMatch): string { return JSON.stringify(m) }
/** Restore an interrupted match. Re-derives the bot plan from the seed and rejects anything that does not match (tamper/corruption guard). */
export function restoreMatch(raw: string, c: LearningCatalog, p: LearningProgress): { ok: true; match: ArenaMatch } | { ok: false; reason: 'corrupt' | 'wrong_user' | 'incompatible_version' | 'tampered' } {
  let v: Partial<ArenaMatch> | null
  try { v = JSON.parse(raw) } catch { return { ok: false, reason: 'corrupt' } }
  if (!v || typeof v !== 'object' || !Array.isArray(v.questionIds) || !Array.isArray(v.rounds) || !Array.isArray(v.bots) || typeof v.matchId !== 'string') return { ok: false, reason: 'corrupt' }
  if (v.schemaVersion?.split('.')[0] !== ARENA_SCHEMA_VERSION.split('.')[0]) return { ok: false, reason: 'incompatible_version' }
  if (v.userId !== p.userId) return { ok: false, reason: 'wrong_user' }
  const re = createMatch({ matchId: v.matchId, userId: v.userId, seed: v.seed as number, timeLimitMs: v.timeLimitMs as number, questionIds: v.questionIds, bots: v.bots }, c, p)
  if (!re.ok) return { ok: false, reason: 'tampered' }
  if (JSON.stringify(re.match.botPlan) !== JSON.stringify(v.botPlan)) return { ok: false, reason: 'tampered' }
  if (v.rounds.length > v.questionIds.length) return { ok: false, reason: 'tampered' }
  let m = re.match
  for (const r of v.rounds) {
    const a = r?.answers?.[0]
    if (!a || a.competitorId !== 'learner') return { ok: false, reason: 'tampered' }
    const step = answerRound(m, c, { userId: m.userId, questionId: r.questionId, optionId: a.optionId, responseMs: a.responseMs })
    if (!step.ok || JSON.stringify(step.round) !== JSON.stringify(r)) return { ok: false, reason: 'tampered' }
    m = step.match
  }
  return { ok: true, match: m }
}
