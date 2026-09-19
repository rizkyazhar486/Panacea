import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveMentalHealthSafetyDisposition } from '../../src/lib/mentalHealthSafety.ts'

const emergencyActions = [
  'stay_with_person',
  'reduce_access_to_means',
  'contact_emergency_support',
  'contact_trusted_person',
  'prepare_clinician_handoff',
  'confirm_handoff',
  'schedule_follow_up',
]

test('empty explicit-signal input does not invent risk', () => {
  const decision = deriveMentalHealthSafetyDisposition({})
  assert.equal(decision.state, 'supportive_check_in')
  assert.equal(decision.immediateHumanEscalationRequired, false)
  assert.equal(decision.humanReviewRequired, false)
  assert.equal(decision.followUpRequired, false)
  assert.deepEqual(decision.hardEscalationReasons, [])
})

test('non-current suicidal thoughts require human assessment without inventing imminent risk', () => {
  const decision = deriveMentalHealthSafetyDisposition({ suicidalThoughts: true })
  assert.equal(decision.state, 'human_handoff_pending')
  assert.equal(decision.immediateHumanEscalationRequired, false)
  assert.equal(decision.humanReviewRequired, true)
  assert.equal(decision.followUpRequired, true)
  assert.ok(decision.actions.includes('structured_assessment'))
  assert.ok(decision.actions.includes('prepare_clinician_handoff'))
})

test('current suicidal thoughts fail closed to emergency escalation', () => {
  const decision = deriveMentalHealthSafetyDisposition({ currentSuicidalThoughts: true })
  assert.equal(decision.state, 'emergency_escalation')
  assert.equal(decision.immediateHumanEscalationRequired, true)
  assert.ok(decision.hardEscalationReasons.includes('current_suicidal_thoughts'))
})

test('current suicidal intent is a hard emergency escalation trigger', () => {
  const decision = deriveMentalHealthSafetyDisposition({ suicidalThoughts: true, currentIntent: true })
  assert.equal(decision.state, 'emergency_escalation')
  assert.ok(decision.hardEscalationReasons.includes('current_intent'))
})

test('current plan plus access to means is a hard emergency escalation trigger', () => {
  const decision = deriveMentalHealthSafetyDisposition({ currentPlan: true, accessToMeans: true })
  assert.equal(decision.state, 'emergency_escalation')
  assert.ok(decision.hardEscalationReasons.includes('plan_and_access_to_means'))
})

test('recent attempt and inability to stay safe each fail closed', () => {
  for (const [signal, reason] of [
    ['recentAttempt', 'recent_attempt'],
    ['unableToStaySafe', 'unable_to_stay_safe'],
  ]) {
    const decision = deriveMentalHealthSafetyDisposition({ [signal]: true })
    assert.equal(decision.state, 'emergency_escalation')
    assert.ok(decision.hardEscalationReasons.includes(reason))
  }
})

test('plan without stated access remains human-handoff pending rather than guessed imminent', () => {
  const decision = deriveMentalHealthSafetyDisposition({ currentPlan: true, accessToMeans: false })
  assert.equal(decision.state, 'human_handoff_pending')
  assert.equal(decision.humanReviewRequired, true)
  assert.equal(decision.followUpRequired, true)
})

test('severe distress alone triggers structured assessment and human review', () => {
  const decision = deriveMentalHealthSafetyDisposition({ severeDistress: true })
  assert.equal(decision.state, 'structured_assessment')
  assert.equal(decision.immediateHumanEscalationRequired, false)
  assert.equal(decision.humanReviewRequired, true)
  assert.equal(decision.followUpRequired, true)
})

test('every emergency disposition contains the complete human handoff chain', () => {
  const decision = deriveMentalHealthSafetyDisposition({ unableToStaySafe: true })
  for (const action of emergencyActions) assert.ok(decision.actions.includes(action), `missing ${action}`)
  assert.ok(decision.blockedAgentActions.includes('self_help_only'))
  assert.ok(decision.blockedAgentActions.includes('close_episode'))
  assert.ok(decision.blockedAgentActions.includes('deescalate_without_human_confirmation'))
})

test('hard escalation cannot be downgraded by caller intent', () => {
  const hard = deriveMentalHealthSafetyDisposition({ currentIntent: true })
  assert.equal(hard.state, 'emergency_escalation')
  assert.equal(hard.immediateHumanEscalationRequired, true)
})

test('returned decisions are immutable at the orchestration boundary', () => {
  const decision = deriveMentalHealthSafetyDisposition({ currentIntent: true })
  assert.equal(Object.isFrozen(decision), true)
  assert.equal(Object.isFrozen(decision.actions), true)
  assert.equal(Object.isFrozen(decision.hardEscalationReasons), true)
  assert.equal(Object.isFrozen(decision.blockedAgentActions), true)
})
