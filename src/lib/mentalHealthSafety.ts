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
 * Hanya menerima sinyal keselamatan yang eksplisit.
 *
 * Field ini dimaksudkan untuk laporan langsung pengguna atau data yang dimasukkan
 * klinisi. Sinyal hasil inferensi model, wearable, atau perilaku tidak boleh
 * dipetakan ke field ini tanpa langkah konfirmasi eksplisit. Modul ini adalah
 * guardrail orkestrasi, bukan instrumen prediksi risiko bunuh diri yang tervalidasi.
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
 * Menentukan disposisi orkestrasi minimum yang aman dari sinyal eksplisit.
 *
 * Invarian keselamatan:
 * - Sinyal hard-escalation selalu menang; model tidak memiliki jalur override.
 * - Disposisi emergensi tidak boleh berakhir sebagai self-help saja.
 * - Sinyal self-harm eksplisit wajib memiliki jalur handoff manusia dan follow-up.
 * - Distress berat saja memicu asesmen/review manusia tanpa mengarang klasifikasi
 *   emergensi.
 *
 * Daftar `actions` adalah rencana orkestrasi murni dan tidak melakukan side effect.
 * Kontak eksternal tetap membutuhkan alur otorisasi/consent dan kebijakan emergensi
 * yang berlaku pada lapisan eksekusi.
 *
 * Fungsi ini tidak mendiagnosis, memprediksi, atau memberi skor risiko bunuh diri.
 * Asesmen klinis dan keputusan disposisi tetap menjadi tanggung jawab manusia.
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
