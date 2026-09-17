export type MentalHealthCareState =
  | 'supportive_check_in'
  | 'structured_assessment'
  | 'human_handoff_pending'
  | 'emergency_escalation'

export type HardEscalationReason =
  | 'current_intent'
  | 'plan_and_access_to_means'
  | 'recent_attempt'
  | 'unable_to_stay_safe'

export type MentalHealthSafetyAction =
  | 'supportive_check_in'
  | 'structured_assessment'
  | 'offer_safety_plan'
  | 'offer_human_support'
  | 'stay_with_person'
  | 'reduce_access_to_means'
  | 'contact_emergency_support'
  | 'contact_trusted_person'
  | 'prepare_clinician_handoff'
  | 'confirm_handoff'
  | 'schedule_follow_up'

export type BlockedAgentAction =
  | 'self_help_only'
  | 'close_episode'
  | 'close_episode_without_follow_up'
  | 'deescalate_without_human_confirmation'

/**
 * Explicit safety signals only.
 *
 * These fields are intended to represent direct user report or clinician-entered
 * information. Model-, wearable-, or behavior-inferred signals must not be mapped
 * into these fields without an explicit confirmation step. This module is an
 * orchestration guardrail, not a validated suicide-risk prediction instrument.
 */
export interface ExplicitMentalHealthSafetySignals {
  suicidalThoughts?: boolean
  currentIntent?: boolean
  currentPlan?: boolean
  accessToMeans?: boolean
  recentAttempt?: boolean
  unableToStaySafe?: boolean
  severeDistress?: boolean
}

export interface MentalHealthSafetyDisposition {
  readonly state: MentalHealthCareState
  readonly immediateHumanEscalationRequired: boolean
  readonly humanReviewRequired: boolean
  readonly followUpRequired: boolean
  readonly hardEscalationReasons: readonly HardEscalationReason[]
  readonly actions: readonly MentalHealthSafetyAction[]
  readonly blockedAgentActions: readonly BlockedAgentAction[]
  readonly decisionBasis: 'explicit_safety_signals_only'
}

const freezeList = <T extends string>(values: readonly T[]): readonly T[] =>
  Object.freeze([...values])

const freezeDecision = (decision: MentalHealthSafetyDisposition): MentalHealthSafetyDisposition =>
  Object.freeze({
    ...decision,
    hardEscalationReasons: freezeList(decision.hardEscalationReasons),
    actions: freezeList(decision.actions),
    blockedAgentActions: freezeList(decision.blockedAgentActions),
  })

const hardEscalationReasons = (
  signals: ExplicitMentalHealthSafetySignals,
): readonly HardEscalationReason[] => {
  const reasons: HardEscalationReason[] = []

  if (signals.currentIntent === true) reasons.push('current_intent')
  if (signals.currentPlan === true && signals.accessToMeans === true) {
    reasons.push('plan_and_access_to_means')
  }
  if (signals.recentAttempt === true) reasons.push('recent_attempt')
  if (signals.unableToStaySafe === true) reasons.push('unable_to_stay_safe')

  return reasons
}

const hasSelfHarmSignal = (signals: ExplicitMentalHealthSafetySignals): boolean =>
  signals.suicidalThoughts === true ||
  signals.currentIntent === true ||
  signals.currentPlan === true ||
  signals.recentAttempt === true ||
  signals.unableToStaySafe === true

/**
 * Derive the minimum safe orchestration disposition from explicit signals.
 *
 * Safety invariants:
 * - Hard escalation signals always win. There is intentionally no model override.
 * - Emergency dispositions cannot resolve to self-help-only behavior.
 * - Explicit self-harm signals require a human handoff path and follow-up.
 * - Severe distress alone prompts assessment/human review without fabricating an
 *   emergency classification.
 *
 * This function does not diagnose, predict, or score suicide risk. Clinical
 * assessment and disposition remain human responsibilities.
 */
export function deriveMentalHealthSafetyDisposition(
  signals: ExplicitMentalHealthSafetySignals,
): MentalHealthSafetyDisposition {
  const reasons = hardEscalationReasons(signals)

  if (reasons.length > 0) {
    return freezeDecision({
      state: 'emergency_escalation',
      immediateHumanEscalationRequired: true,
      humanReviewRequired: true,
      followUpRequired: true,
      hardEscalationReasons: reasons,
      actions: [
        'stay_with_person',
        'reduce_access_to_means',
        'contact_emergency_support',
        'contact_trusted_person',
        'prepare_clinician_handoff',
        'confirm_handoff',
        'schedule_follow_up',
      ],
      blockedAgentActions: [
        'self_help_only',
        'close_episode',
        'deescalate_without_human_confirmation',
      ],
      decisionBasis: 'explicit_safety_signals_only',
    })
  }

  if (hasSelfHarmSignal(signals)) {
    return freezeDecision({
      state: 'human_handoff_pending',
      immediateHumanEscalationRequired: false,
      humanReviewRequired: true,
      followUpRequired: true,
      hardEscalationReasons: [],
      actions: [
        'structured_assessment',
        'offer_safety_plan',
        'offer_human_support',
        'prepare_clinician_handoff',
        'confirm_handoff',
        'schedule_follow_up',
      ],
      blockedAgentActions: ['close_episode_without_follow_up'],
      decisionBasis: 'explicit_safety_signals_only',
    })
  }

  if (signals.severeDistress === true) {
    return freezeDecision({
      state: 'structured_assessment',
      immediateHumanEscalationRequired: false,
      humanReviewRequired: true,
      followUpRequired: true,
      hardEscalationReasons: [],
      actions: [
        'structured_assessment',
        'offer_safety_plan',
        'offer_human_support',
        'prepare_clinician_handoff',
        'schedule_follow_up',
      ],
      blockedAgentActions: ['close_episode_without_follow_up'],
      decisionBasis: 'explicit_safety_signals_only',
    })
  }

  return freezeDecision({
    state: 'supportive_check_in',
    immediateHumanEscalationRequired: false,
    humanReviewRequired: false,
    followUpRequired: false,
    hardEscalationReasons: [],
    actions: ['supportive_check_in'],
    blockedAgentActions: [],
    decisionBasis: 'explicit_safety_signals_only',
  })
}
