import assert from 'node:assert/strict'
import test from 'node:test'
import { CARDIOVASCULAR_SPEC, buildConceptGraph } from '../../src/domains/biological-concept-graph/index.ts'
import * as M from '../../src/domains/prometheus-learning/index.ts'

const G = buildConceptGraph(CARDIOVASCULAR_SPEC).graph
const C = M.HEART_FAILURE_CASE
const ok = (r) => { assert.equal(r.ok, true, JSON.stringify(r)); return r.state }
const adv = (s) => ok(M.advance(C, s))
function full(opts = {}) {
  let s = M.startCase(C); s = adv(s)
  for (const h of opts.hist ?? ['h_orthopnoea', 'h_ankle']) s = ok(M.ask(C, s, h)); s = adv(s)
  for (const e of opts.exam ?? ['e_jvp', 'e_chest', 'e_heart']) s = ok(M.examine(C, s, e)); s = adv(s)
  s = ok(M.submitDifferential(C, s, opts.diff ?? ['d_hf', 'd_copd'])); s = adv(s)
  for (const i of opts.inv ?? ['i_ecg', 'i_natriuretic', 'i_echo']) s = ok(M.order(C, s, i)); s = adv(s)
  s = ok(M.interpret(C, s, opts.lead ?? 'd_hf')); s = adv(s)
  s = ok(M.selectManagement(C, s, opts.mgmt ?? ['m_clinician_plan', 'm_congestion', 'm_followup'])); s = adv(s)
  return s
}

test('seed case validates against the concept graph', () => assert.deepEqual(M.validateCase(C, G), []))
test('NEG case validation: non-synthetic, bad true dx, unknown concept/reference, duplicate ids, empty result', () => {
  const bad = (f) => { const c = structuredClone(C); f(c); return M.validateCase(c, G).length > 0 }
  assert.ok(bad((c) => { c.synthetic = false })); assert.ok(bad((c) => { c.trueDiagnosisId = 'x' })); assert.ok(bad((c) => { c.conceptIds = ['pcg:ghost'] }))
  assert.ok(bad((c) => { c.referenceIds = ['ref:fake'] })); assert.ok(bad((c) => { c.history[1].id = c.history[0].id })); assert.ok(bad((c) => { c.examination[0].result = ' ' }))
  assert.ok(bad((c) => { c.management.forEach((m) => { m.appropriate = true }) }))
})
test('golden path reaches feedback with full educational score and the answer was hidden until then', () => {
  const s = full(); assert.equal(s.phase, 'feedback')
  const f = M.computeFeedback(C, s).feedback
  assert.equal(f.leadingCorrect, true); assert.deepEqual(f.missedHighValueInvestigations, []); assert.equal(f.educationalScore, 1); assert.match(f.disclaimer, /Not proof of clinical competence/)
  const r = ok(M.reflect(ok(M.advance(C, s)), '  Check orthopnoea early.  ')); assert.equal(r.phase, 'complete'); assert.equal(r.reflection, 'Check orthopnoea early.')
})
test('feedback is withheld before the feedback phase', () => {
  let s = M.startCase(C); assert.equal(M.computeFeedback(C, s).reason, 'wrong_phase')
  s = adv(adv(adv(s))); assert.equal(M.computeFeedback(C, s).reason, 'wrong_phase')
})
test('findings appear only after the action; repeated action is idempotent in state', () => {
  let s = adv(adv(M.startCase(C))); assert.equal(s.phase, 'examination')
  s = adv(M.startCase(C)); const a = M.ask(C, s, 'h_fever'); assert.match(a.answer, /No fever/)
  const b = M.ask(C, a.state, 'h_fever'); assert.equal(b.state, a.state); assert.equal(a.state.asked.length, 1)
})
test('missing information stays not_available and is logged, never fabricated', () => {
  const s = adv(M.startCase(C)); const r = M.requestUnlisted(s, ' Family history of lupus? ')
  assert.equal(r.answer, 'not_available'); assert.deepEqual(r.state.unavailableRequests, ['family history of lupus?'])
  assert.equal(M.requestUnlisted(r.state, 'family history of lupus?').state, r.state)
  assert.equal(M.requestUnlisted(s, '  ').reason, 'empty_text'); assert.equal(M.requestUnlisted(M.startCase(C), 'x').reason, 'wrong_phase')
})
test('NEG invalid transitions: wrong phase actions, unknown items, skipping gates', () => {
  const s0 = M.startCase(C)
  assert.equal(M.ask(C, s0, 'h_fever').reason, 'wrong_phase'); assert.equal(M.order(C, s0, 'i_echo').reason, 'wrong_phase'); assert.equal(M.reflect(s0, 'x').reason, 'wrong_phase')
  const h = adv(s0); assert.equal(M.ask(C, h, 'h_nope').reason, 'unknown_item')
  let d = adv(adv(h)); assert.equal(d.phase, 'differential'); assert.equal(M.advance(C, d).reason, 'incomplete')
  d = ok(M.submitDifferential(C, d, ['d_hf'])); let i = adv(d); i = adv(i); assert.equal(i.phase, 'interpretation'); assert.equal(M.advance(C, i).reason, 'incomplete')
  assert.equal(M.order(C, i, 'i_echo').reason, 'wrong_phase')
  assert.equal(M.advance(C, { ...s0, phase: 'complete' }).reason, 'wrong_phase')
})
test('NEG differential rules: empty, too many, duplicate, unknown; leading dx must be in differential', () => {
  let s = adv(adv(adv(M.startCase(C))))
  assert.equal(M.submitDifferential(C, s, []).reason, 'empty_selection'); assert.equal(M.submitDifferential(C, s, ['d_hf', 'd_copd', 'd_pneumonia', 'd_anaemia']).reason, 'too_many')
  assert.equal(M.submitDifferential(C, s, ['d_hf', 'd_hf']).reason, 'duplicate_selection'); assert.equal(M.submitDifferential(C, s, ['d_x']).reason, 'unknown_diagnosis')
  s = adv(adv(ok(M.submitDifferential(C, s, ['d_copd']))))
  assert.equal(s.phase, 'interpretation'); assert.equal(M.interpret(C, s, 'd_hf').reason, 'not_in_differential'); assert.equal(M.interpret(C, s, 'zz').reason, 'unknown_diagnosis')
})
test('feedback flags gaps: wrong lead dx, missed key history/exam/investigations, low-value tests, unsafe management', () => {
  const s = full({ hist: ['h_fever'], exam: ['e_oedema'], diff: ['d_pneumonia', 'd_copd'], inv: ['i_spirometry', 'i_cxr'], lead: 'd_pneumonia', mgmt: ['m_antibiotics_only', 'm_followup'] })
  const f = M.computeFeedback(C, s).feedback
  assert.equal(f.leadingCorrect, false); assert.equal(f.differentialIncludesTrue, false)
  assert.deepEqual(f.missedKeyHistory, ['h_orthopnoea', 'h_ankle']); assert.deepEqual(f.missedKeyExamination, ['e_jvp', 'e_chest', 'e_heart'])
  assert.deepEqual(f.missedHighValueInvestigations, ['i_ecg', 'i_natriuretic', 'i_echo']); assert.deepEqual(f.lowValueInvestigationsOrdered, ['i_cxr', 'i_spirometry'])
  assert.deepEqual(f.managementInappropriateChosen.map((m) => m.id), ['m_antibiotics_only']); assert.ok(f.educationalScore < 0.2)
})
test('determinism: identical action sequences give identical states and feedback', () => {
  assert.deepEqual(full(), full()); assert.deepEqual(M.computeFeedback(C, full()), M.computeFeedback(C, full()))
})
test('interrupted session restores exactly; corrupt, stale, foreign or unreachable states fail closed', () => {
  const s = full(); assert.deepEqual(M.restoreCase(M.serializeCase(s), C).state, s)
  const mid = adv(adv(M.startCase(C))); assert.deepEqual(M.restoreCase(M.serializeCase(mid), C).state, mid)
  assert.equal(M.restoreCase('{oops', C).reason, 'invalid_state'); assert.equal(M.restoreCase('null', C).reason, 'invalid_state')
  const mut = (f) => { const x = structuredClone(s); f(x); return M.restoreCase(JSON.stringify(x), C).reason }
  assert.equal(mut((x) => { x.caseVersion = '9.9.9' }), 'schema_mismatch'); assert.equal(mut((x) => { x.caseId = 'case:other' }), 'schema_mismatch')
  assert.equal(mut((x) => { x.asked = ['h_ghost'] }), 'invalid_state'); assert.equal(mut((x) => { x.ordered = ['i_echo', 'i_echo'] }), 'invalid_state')
  assert.equal(mut((x) => { x.phase = 'history' }), 'invalid_state') // later-phase data in earlier phase
  assert.equal(mut((x) => { x.phase = 'bogus' }), 'invalid_state'); assert.equal(mut((x) => { x.leadingDiagnosis = 'd_anaemia' }), 'invalid_state')
})
test('reflection must be non-empty and happens once', () => {
  const r = ok(M.advance(C, full())); assert.equal(M.reflect(r, '   ').reason, 'empty_text')
  const done = ok(M.reflect(r, 'ok')); assert.equal(M.reflect(done, 'again').reason, 'wrong_phase')
})
