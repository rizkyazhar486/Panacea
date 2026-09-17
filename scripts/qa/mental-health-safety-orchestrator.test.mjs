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

test('baseline distress-free input stays in supportive check-in without inventing risk', () => {
  const decision = deriveMentalHealthSafetyDisposition({})

  assert.equal(decision.state, 'supportive_check_in')
  assert.equal(decision.immediateHumanEscalationRequired, false)
  assert.equal(decision.humanReviewRequired, false)
  assert.equal(decision.followUpRequired, false)
  assert.deepEqual(decision.hardEscalationReasons, [])
})

test('reported suicidal thoughts require human handoff and follow-up without automatically declaring an emergency', () => {
  const decision = deriveMentalHealthSafetyDisposition({ suicidalThoughts: true })

  assert.equal(decision.state, 'human_handoff_pending')
  assert.equal(decision.immediateHumanEscalationRequired, false)
  assert.equal(decision.humanReviewRequired, true)
  assert.equal(decision.followUpRequired, true)
  assert.ok(decision.actions.includes('structured_assessment'))
  assert.ok(decision.actions.includes('offer_safety_plan'))
  assert.ok(decision.actions.includes('prepare_clinician_handoff'))
})

test('current suicidal intent is a hard emergency escalation trigger', () => {
  const decision = deriveMentalHealthSafetyDisposition({ suicidalThoughts: true, currentIntent: true })

  assert.equal(decision.state, 'emergency_escalation')
  assert.equal(decision.immediateHumanEscalationRequired, true)
  assert.ok(decision.hardEscalationReasons.includes('current_intent'))
})

test('a current plan plus access to means is a hard emergency escalation trigger', () => {
  const decision = deriveMentalHealthSafetyDisposition({ currentPlan: true, accessToMeans: true })

  assert.equal(decision.state, 'emergency_escalation')
  assert.ok(decision.hardEscalationReasons.includes('plan_and_access_to_means'))
})

test('recent attempt and inability to stay safe each fail closed to emergency escalation', () => {
  for (const [signal, reason] of [
    ['recentAttempt', 'recent_attempt'],
    ['unableToStaySafe', 'unable_to_stay_safe'],
  ]) {
    const decision = deriveMentalHealthSafetyDisposition({ [signal]: true })
    assert.equal(decision.state, 'emergency_escalation')
    assert.ok(decision.hardEscalationReasons.includes(reason))
  }
})

test('plan without stated access does not get upgraded by guesswork, but still requires human handoff', () => {
  const decision = deriveMentalHealthSafetyDisposition({ currentPlan: true, accessToMeans: false })

  assert.equal(decision.state, 'human_handoff_pending')
  assert.equal(decision.immediateHumanEscalationRequired, false)
  assert.equal(decision.humanReviewRequired, true)
  assert.equal(decision.followUpRequired, true)
})

test('severe distress alone prompts structured assessment and human review rather than a fabricated emergency label', () => {
  const decision = deriveMentalHealthSafetyDisposition({ severeDistress: true })

  assert.equal(decision.state, 'structured_assessment')
  assert.equal(decision.immediateHumanEscalationRequired, false)
  assert.equal(decision.humanReviewRequired, true)
  assert.equal(decision.followUpRequired, true)
})

test('every emergency disposition contains the complete handoff chain and blocks self-help-only closure', () => {
  const decision = deriveMentalHealthSafetyDisposition({ unableToStaySafe: true })

  for (const action of emergencyActions) assert.ok(decision.actions.includes(action), `missing ${action}`)
  assert.ok(decision.blockedAgentActions.includes('self_help_only'))
  assert.ok(decision.blockedAgentActions.includes('close_episode'))
  assert.ok(decision.blockedAgentActions.includes('deescalate_without_human_confirmation'))
  assert.equal(decision.followUpRequired, true)
})

test('an LLM-suggested lower disposition cannot override a hard trigger', () => {
  const decision = deriveMentalHealthSafetyDisposition({
    currentIntent: true,
    modelSuggestedDisposition: 'supportive_check_in',
  })

  assert.equal(decision.state, 'emergency_escalation')
  assert.equal(decision.immediateHumanEscalationRequired, true)
})

test('returned safety decisions are immutable at the orchestration boundary', () => {
  const decision = deriveMentalHealthSafetyDisposition({ currentIntent: true })

  assert.equal(Object.isFrozen(decision), true)
  assert.equal(Object.isFrozen(decision.actions), true)
  assert.equal(Object.isFrozen(decision.hardEscalationReasons), true)
  assert.equal(Object.isFrozen(decision.blockedAgentActions), true)
})
