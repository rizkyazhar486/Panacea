import assert from 'node:assert/strict'
import test from 'node:test'
import * as P from '../../src/domains/prometheus-learning/index.ts'

const C = P.CARDIOVASCULAR_CATALOG
const unlockedAll = () => {
  let p = P.newProgress('u1')
  p = P.startLesson(p, C, 'u1', 'les:cardiac_output').progress
  p = P.startLesson(p, C, 'u1', 'les:cardiomyocyte_structure').progress
  p = P.submitAnswer(p, C, { userId: 'u1', questionId: 'q:sarcomere_unit', optionId: 'a', attemptId: 's1', day: 0 }).progress
  p = P.submitAnswer(p, C, { userId: 'u1', questionId: 'q:sr_role', optionId: 'b', attemptId: 's2', day: 0 }).progress
  return P.startLesson(p, C, 'u1', 'les:ec_coupling').progress
}
const P0 = unlockedAll()
const QS = P.pickArenaQuestions(P.eligibleArenaQuestions(P0, C), 5, 42)
const mk = (o = {}) => P.createMatch({ matchId: 'm1', userId: 'u1', seed: 42, timeLimitMs: 20000, questionIds: QS, ...o }, C, P0)
const keyOf = (qid) => C.questions.find((q) => q.id === qid).correctOptionId
const wrongOf = (qid) => C.questions.find((q) => q.id === qid).options.find((o) => o.id !== keyOf(qid)).id
function play(m, strategy) { for (;;) { const q = P.currentQuestionId(m); if (!q) return m; const [opt, ms] = strategy(q); m = P.answerRound(m, C, { userId: 'u1', questionId: q, optionId: opt, responseMs: ms }).match } }

test('mulberry32 is deterministic and in [0,1)', () => {
  const a = P.mulberry32(7), b = P.mulberry32(7), xs = Array.from({ length: 1000 }, a)
  assert.deepEqual(xs.slice(0, 5), Array.from({ length: 5 }, b)); assert.ok(xs.every((x) => x >= 0 && x < 1))
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length; assert.ok(Math.abs(mean - 0.5) < 0.05)
})
test('three simulated bots with increasing accuracy and rating', () => {
  assert.equal(P.ARENA_BOTS.length, 3); assert.ok(P.ARENA_BOTS.every((b) => b.simulated === true))
  const [a, k, m] = P.ARENA_BOTS; assert.ok(a.accuracy[1] < k.accuracy[1] && k.accuracy[1] < m.accuracy[1] && a.rating < k.rating && k.rating < m.rating)
  assert.ok(a.meanResponseMs < k.meanResponseMs && k.meanResponseMs < m.meanResponseMs)
})
test('arena respects prerequisite gating: locked lesson questions are ineligible and rejected', () => {
  const p = P.startLesson(P.newProgress('u1'), C, 'u1', 'les:cardiac_output').progress
  assert.deepEqual(P.eligibleArenaQuestions(p, C), ['q:co_calc', 'q:co_single_value'])
  assert.equal(P.createMatch({ matchId: 'm', userId: 'u1', seed: 1, timeLimitMs: 20000, questionIds: ['q:cicr_trigger'] }, C, p).reason, 'question_locked')
  assert.equal(P.createMatch({ matchId: 'm', userId: 'u1', seed: 1, timeLimitMs: 20000, questionIds: ['q:co_calc'] }, C, P.newProgress('u1')).reason, 'no_eligible_questions')
})
test('question picking is seeded, distinct and bounded', () => {
  const e = P.eligibleArenaQuestions(P0, C)
  assert.deepEqual(P.pickArenaQuestions(e, 5, 42), P.pickArenaQuestions(e, 5, 42)); assert.equal(new Set(QS).size, 5)
  assert.notDeepEqual(P.pickArenaQuestions(e, 7, 1), P.pickArenaQuestions(e, 7, 2)); assert.equal(P.pickArenaQuestions(e, 99, 3).length, e.length)
})
test('NEG createMatch validation', () => {
  assert.equal(mk({ matchId: ' ' }).reason, 'empty_match_id'); assert.equal(mk({ userId: 'u2' }).reason, 'wrong_user')
  assert.equal(mk({ seed: 1.5 }).reason, 'bad_seed'); assert.equal(mk({ timeLimitMs: 1000 }).reason, 'bad_time_limit')
  assert.equal(mk({ questionIds: [] }).reason, 'too_few_questions'); assert.equal(mk({ questionIds: [QS[0], QS[0]] }).reason, 'duplicate_question')
  assert.equal(mk({ questionIds: ['q:ghost'] }).reason, 'unknown_question')
  assert.equal(mk({ bots: [{ ...P.ARENA_BOTS[0], accuracy: { 1: 1.5, 2: 0.5, 3: 0.5 } }] }).reason, 'bad_bot')
  assert.equal(mk({ bots: [P.ARENA_BOTS[0], P.ARENA_BOTS[0]] }).reason, 'bad_bot')
  assert.equal(mk({ bots: [{ ...P.ARENA_BOTS[0], simulated: false }] }).reason, 'bad_bot')
})
test('bot answers are pre-drawn from the seed and independent of learner behaviour', () => {
  const a = play(mk().match, (q) => [keyOf(q), 1000]), b = play(mk().match, (q) => [wrongOf(q), 15000])
  assert.deepEqual(a.rounds.map((r) => r.answers.slice(1)), b.rounds.map((r) => r.answers.slice(1)))
  assert.notDeepEqual(mk().match.botPlan, mk({ seed: 43 }).match.botPlan)
})
test('bot picks only real catalog options and honours accuracy statistically', () => {
  let hits = { 'bot:aria': 0, 'bot:mira': 0 }, n = 0
  for (let s = 0; s < 300; s++) {
    const m = P.createMatch({ matchId: 'x', userId: 'u1', seed: s, timeLimitMs: 60000, questionIds: ['q:co_calc'] }, C, P0).match
    for (const a of m.botPlan[0]) { assert.ok(a.optionId === null || C.questions[5].options.some((o) => o.id === a.optionId)); if (a.correct && a.competitorId in hits) hits[a.competitorId]++ }
    n++
  }
  assert.ok(Math.abs(hits['bot:aria'] / n - 0.62) < 0.08, `aria ${hits['bot:aria'] / n}`); assert.ok(Math.abs(hits['bot:mira'] / n - 0.9) < 0.06, `mira ${hits['bot:mira'] / n}`)
})
test('scoring: base + speed bonus + capped streak; wrong scores zero', () => {
  assert.equal(P.pointsFor(true, 0, 20000, 0), 150); assert.equal(P.pointsFor(true, 10000, 20000, 0), 125); assert.equal(P.pointsFor(true, 20000, 20000, 0), 100)
  assert.equal(P.pointsFor(true, 20000, 20000, 2), 120); assert.equal(P.pointsFor(true, 20000, 20000, 9), 130); assert.equal(P.pointsFor(false, 0, 20000, 5), 0)
})
test('a perfect fast learner beats every bot; standings ranked with deterministic tie-breaks', () => {
  const m = play(mk().match, (q) => [keyOf(q), 500]); assert.equal(m.status, 'finished')
  const st = P.standings(m); assert.equal(st[0].competitorId, 'learner'); assert.deepEqual(st.map((s) => s.rank), [1, 2, 3, 4])
  assert.equal(st[0].correct, 5)
  const r = P.updateRating(m, 1200); assert.ok(r.delta > 0)
})
test('timeouts and late answers score zero and are not recorded as answers', () => {
  let m = mk().match; const q = P.currentQuestionId(m)
  const r1 = P.answerRound(m, C, { userId: 'u1', questionId: q, optionId: keyOf(q), responseMs: 25000 })
  assert.equal(r1.round.answers[0].timedOut, true); assert.equal(r1.round.answers[0].points, 0); assert.equal(r1.round.answers[0].optionId, null)
})
test('NEG answerRound: stale/duplicate round, wrong user, unknown option, bad time, finished match', () => {
  const m0 = mk().match; const q = P.currentQuestionId(m0)
  const m1 = P.answerRound(m0, C, { userId: 'u1', questionId: q, optionId: keyOf(q), responseMs: 1000 }).match
  assert.equal(P.answerRound(m1, C, { userId: 'u1', questionId: q, optionId: keyOf(q), responseMs: 1000 }).reason, 'stale_round')
  const q2 = P.currentQuestionId(m1)
  assert.equal(P.answerRound(m1, C, { userId: 'u2', questionId: q2, optionId: 'a', responseMs: 1 }).reason, 'wrong_user')
  assert.equal(P.answerRound(m1, C, { userId: 'u1', questionId: q2, optionId: 'zz', responseMs: 1 }).reason, 'unknown_option')
  assert.equal(P.answerRound(m1, C, { userId: 'u1', questionId: q2, optionId: 'a', responseMs: -1 }).reason, 'bad_response_time')
  assert.equal(P.answerRound(m1, C, { userId: 'u1', questionId: q2, optionId: 'a', responseMs: NaN }).reason, 'bad_response_time')
  const done = play(m1, (x) => [keyOf(x), 1]); assert.equal(P.answerRound(done, C, { userId: 'u1', questionId: QS[0], optionId: 'a', responseMs: 1 }).reason, 'match_finished')
  assert.equal(P.updateRating(m1, 1200).reason, 'match_not_finished'); assert.equal(P.updateRating(done, NaN).reason, 'bad_rating')
})
test('match answers feed canonical progress once (idempotent) and timeouts are skipped', () => {
  let m = mk().match; let first = true
  m = play(m, (q) => { const r = first ? [null, 20000] : [keyOf(q), 2000]; first = false; return r })
  const a = P.applyMatchToProgress(P0, C, m, 5); assert.equal(a.applied, 4); assert.equal(a.skipped.length, 1)
  const b = P.applyMatchToProgress(a.progress, C, m, 6); assert.equal(b.applied, 0); assert.equal(b.progress, a.progress)
  assert.ok(QS.slice(1).every((q) => a.progress.review[q]))
})
test('terminal log is deterministic, includes disclaimer, answer key and final standings', () => {
  const m = play(mk().match, (q) => [keyOf(q), 3000]); const log = P.matchLog(m, C)
  assert.deepEqual(log, P.matchLog(m, C)); assert.match(log[0], /prometheus arena --match m1 --seed 42/); assert.match(log[1], /not a measure of clinical competence/)
  assert.ok(log.some((l) => l.includes('== final standings =='))); assert.ok(log.filter((l) => l.startsWith('[round')).length === 5)
})
test('interrupted match restores exactly; tampering, foreign user, corruption fail closed', () => {
  let m = mk().match; const q = P.currentQuestionId(m); m = P.answerRound(m, C, { userId: 'u1', questionId: q, optionId: keyOf(q), responseMs: 2000 }).match
  const raw = P.serializeMatch(m); assert.deepEqual(P.restoreMatch(raw, C, P0).match, m)
  assert.equal(P.restoreMatch('{bad', C, P0).reason, 'corrupt'); assert.equal(P.restoreMatch(raw, C, P.newProgress('u2')).reason, 'wrong_user')
  const t = (f) => { const x = JSON.parse(raw); f(x); return P.restoreMatch(JSON.stringify(x), C, P0).reason }
  assert.equal(t((x) => { x.botPlan[0][0].correct = !x.botPlan[0][0].correct }), 'tampered')
  assert.equal(t((x) => { x.rounds[0].answers[0].points = 9999 }), 'tampered')
  assert.equal(t((x) => { x.rounds[0].answers[1].optionId = 'z' }), 'tampered')
  assert.equal(t((x) => { x.schemaVersion = '2.0.0' }), 'incompatible_version')
})
