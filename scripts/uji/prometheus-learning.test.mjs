import assert from 'node:assert/strict'
import test from 'node:test'
import { CARDIOVASCULAR_SPEC, buildConceptGraph, resolveLessonLinks, buildDeepLink, parseDeepLink } from '../../src/domains/biological-concept-graph/index.ts'
import { CARDIOVASCULAR_CATALOG as CAT, validateCatalog, newProgress, startLesson, submitAnswer, dueReviews, isLessonMastered, serializeProgress, restoreProgress, lessonLinksOf } from '../../src/domains/prometheus-learning/index.ts'

const G = buildConceptGraph(CARDIOVASCULAR_SPEC).graph
const clone = () => structuredClone(CAT)
const codes = (c) => validateCatalog(c, G).map((i) => i.code)
const sub = (p, q, o, a, d = 0, u = 'u1') => submitAnswer(p, CAT, { userId: u, questionId: q, optionId: o, attemptId: a, day: d })
const start = (p, l) => startLesson(p, CAT, 'u1', l)

test('seed catalog validates against the concept graph and physiology model', () => assert.deepEqual(validateCatalog(CAT, G), []))
test('every concept link resolves; the golden-journey concept has a lesson', () => {
  const r = resolveLessonLinks(G, lessonLinksOf(CAT), new Set(CAT.lessons.map((l) => l.id)))
  assert.equal(r.broken.length, 0)
  assert.ok(r.resolved.some((l) => l.conceptId === 'pcg:excitation_contraction_coupling' && l.lessonId === 'les:ec_coupling'))
})
test('lesson deep link round-trips and returns to the originating anatomy', () => {
  const u = buildDeepLink(G, '/learn', { surface: 'lesson', conceptId: 'pcg:excitation_contraction_coupling', returnConceptId: 'pcg:left_ventricle' }).url
  assert.equal(parseDeepLink(G, u).ctx.returnConceptId, 'pcg:left_ventricle')
})

test('NEG catalog: unknown concept/reference, missing rationale, bad key, few options, unassessed objective, bad objective index, prereq cycle/unknown', () => {
  let c = clone(); c.lessons[0].conceptIds = ['pcg:ghost']; assert.ok(codes(c).includes('unknown_concept'))
  c = clone(); c.questions[0].referenceIds = ['ref:fake']; assert.ok(codes(c).includes('unknown_reference'))
  c = clone(); c.questions[0].referenceIds = []; assert.ok(codes(c).includes('no_reference'))
  c = clone(); c.questions[0].options[1].rationale = ' '; assert.ok(codes(c).includes('missing_rationale'))
  c = clone(); c.questions[0].correctOptionId = 'z'; assert.ok(codes(c).includes('missing_correct_option'))
  c = clone(); c.questions[0].options = c.questions[0].options.slice(0, 2); assert.ok(codes(c).includes('too_few_options'))
  c = clone(); c.questions[0].options[1].id = 'a'; assert.ok(codes(c).includes('duplicate_option_id'))
  c = clone(); c.lessons[0].objectives.push('extra'); assert.ok(codes(c).includes('objective_without_question'))
  c = clone(); c.questions[0].objectiveIndex = 9; assert.ok(codes(c).includes('objective_index_out_of_range'))
  c = clone(); c.lessons[1].prerequisites = ['les:ec_coupling']; assert.ok(codes(c).includes('prerequisite_cycle'))
  c = clone(); c.lessons[0].prerequisites = ['les:nope']; assert.ok(codes(c).includes('unknown_prerequisite'))
  c = clone(); c.questions[0].lessonId = 'les:nope'; assert.ok(codes(c).includes('question_lesson_mismatch'))
})
test('NEG catalog: answer key that disagrees with the physiology model is rejected', () => {
  let c = clone(); c.questions.find((q) => q.id === 'q:co_calc').modelCheck.expectedCoLMin = 4800; assert.ok(codes(c).includes('model_check_mismatch'))
  c = clone(); c.questions.find((q) => q.id === 'q:co_calc').modelCheck.hrBpm = 5; assert.ok(codes(c).includes('model_check_invalid'))
})

test('prerequisite gating: EC lesson locked until structure lesson is mastered', () => {
  let p = newProgress('u1')
  const locked = start(p, 'les:ec_coupling'); assert.equal(locked.reason, 'prerequisites_unmet'); assert.deepEqual(locked.missing, ['les:cardiomyocyte_structure'])
  p = start(p, 'les:cardiomyocyte_structure').progress
  p = sub(p, 'q:sarcomere_unit', 'a', 't1').progress
  assert.equal(start(p, 'les:ec_coupling').ok, false) // one of two answered
  p = sub(p, 'q:sr_role', 'b', 't2').progress
  assert.equal(isLessonMastered(p, CAT, 'les:cardiomyocyte_structure'), true)
  assert.equal(start(p, 'les:ec_coupling').ok, true)
})
test('feedback explains the chosen distractor and cites references', () => {
  const p = start(newProgress('u1'), 'les:ec_coupling')
  assert.equal(p.ok, false)
  const q = start(newProgress('u1'), 'les:cardiac_output').progress
  const r = sub(q, 'q:co_calc', 'b', 'x1')
  assert.equal(r.feedback.correct, false); assert.match(r.feedback.selectedRationale, /Unit error/); assert.match(r.feedback.rationale, /4\.8 L\/min/); assert.deepEqual(r.feedback.referenceIds, ['ref:openstax-ap2e'])
})
test('NEG duplicate submission is idempotent (no double count, no box advance)', () => {
  const p0 = start(newProgress('u1'), 'les:cardiac_output').progress
  const a = sub(p0, 'q:co_calc', 'a', 'dup', 3); const b = sub(a.progress, 'q:co_calc', 'a', 'dup', 9)
  assert.equal(b.feedback.duplicate, true); assert.equal(b.progress, a.progress); assert.equal(b.progress.attempts['q:co_calc'].length, 1)
})
test('NEG submissions rejected: wrong user, unknown question/option, lesson not started, bad day, empty attempt id', () => {
  const p = start(newProgress('u1'), 'les:cardiac_output').progress
  assert.equal(sub(p, 'q:co_calc', 'a', 'a1', 0, 'u2').reason, 'wrong_user')
  assert.equal(sub(p, 'q:ghost', 'a', 'a1').reason, 'unknown_question')
  assert.equal(sub(p, 'q:co_calc', 'zz', 'a1').reason, 'unknown_option')
  assert.equal(sub(newProgress('u1'), 'q:co_calc', 'a', 'a1').reason, 'lesson_not_started')
  assert.equal(sub(p, 'q:co_calc', 'a', 'a1', -1).reason, 'bad_day'); assert.equal(sub(p, 'q:co_calc', 'a', 'a1', 1.5).reason, 'bad_day')
  assert.equal(sub(p, 'q:co_calc', 'a', ' ').reason, 'empty_attempt_id')
  assert.equal(startLesson(p, CAT, 'u2', 'les:cardiac_output').reason, 'wrong_user')
})
test('Leitner schedule is deterministic: boxes advance on success, reset on failure, due ordering', () => {
  let p = start(newProgress('u1'), 'les:cardiac_output').progress
  p = sub(p, 'q:co_calc', 'a', 'a1', 0).progress; assert.deepEqual(p.review['q:co_calc'], { box: 0, dueDay: 1 })
  p = sub(p, 'q:co_calc', 'a', 'a2', 1).progress; assert.deepEqual(p.review['q:co_calc'], { box: 1, dueDay: 3 })
  p = sub(p, 'q:co_calc', 'a', 'a3', 3).progress; assert.deepEqual(p.review['q:co_calc'], { box: 2, dueDay: 7 })
  p = sub(p, 'q:co_calc', 'b', 'a4', 7).progress; assert.deepEqual(p.review['q:co_calc'], { box: 0, dueDay: 8 })
  p = sub(p, 'q:co_single_value', 'c', 'b1', 0).progress
  assert.deepEqual(dueReviews(p, 0), []); assert.deepEqual(dueReviews(p, 8), ['q:co_single_value', 'q:co_calc'])
  for (let i = 0; i < 10; i++) p = sub(p, 'q:co_calc', 'a', `m${i}`, 20 + i).progress
  assert.equal(p.review['q:co_calc'].box, 4) // capped
})
test('mastery uses the most recent attempt (a later failure un-masters)', () => {
  let p = start(newProgress('u1'), 'les:cardiac_output').progress
  p = sub(p, 'q:co_calc', 'a', '1').progress; p = sub(p, 'q:co_single_value', 'c', '2').progress
  assert.equal(isLessonMastered(p, CAT, 'les:cardiac_output'), true)
  p = sub(p, 'q:co_calc', 'b', '3').progress; assert.equal(isLessonMastered(p, CAT, 'les:cardiac_output'), false)
})
test('persistence round-trip and fail-closed restore (corrupt, cross-user, version, stale ids)', () => {
  let p = start(newProgress('u1'), 'les:cardiac_output').progress; p = sub(p, 'q:co_calc', 'a', '1', 2).progress
  const raw = serializeProgress(p)
  assert.deepEqual(restoreProgress(raw, 'u1', CAT).progress, p)
  assert.equal(restoreProgress(raw, 'u2', CAT).reason, 'wrong_user')
  assert.equal(restoreProgress('{not json', 'u1', CAT).reason, 'corrupt')
  assert.equal(restoreProgress('{"userId":"u1"}', 'u1', CAT).reason, 'corrupt')
  assert.equal(restoreProgress(raw.replace('1.0.0', '2.0.0'), 'u1', CAT).reason, 'incompatible_version')
  assert.equal(restoreProgress(raw.replace('q:co_calc', 'q:deleted'), 'u1', CAT).reason, 'unknown_reference_in_state')
  const bad = JSON.parse(raw); bad.review['q:co_calc'].box = 99; assert.equal(restoreProgress(JSON.stringify(bad), 'u1', CAT).reason, 'corrupt')
})
test('users do not share state (immutable reducer)', () => {
  const a = start(newProgress('u1'), 'les:cardiac_output').progress, b = newProgress('u2')
  sub(a, 'q:co_calc', 'a', '1')
  assert.deepEqual(b.attempts, {}); assert.deepEqual(a.attempts, {})
})
