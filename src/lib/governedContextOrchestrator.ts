import { minimizeAiContext, type AiContextPolicy } from './aiContextPolicy.ts'
import {
  buildClinicalReviewQueue,
  materializeReviewedState,
  type ClinicalReviewLedger,
} from './clinicalReviewWorkflow.ts'
import {
  buildContextPacket,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'
import {
  filterStateByPurposeConsent,
  purposeConsentStatus,
  type PurposeConsentLedger,
} from './purposeConsentLedger.ts'

export interface GovernedContextRequest {
  state: LongitudinalPatientState
  purposeConsentLedger: PurposeConsentLedger
  clinicalReviewLedger: ClinicalReviewLedger
  aiPolicy: AiContextPolicy
  at: string
}

export function buildGovernedContextBundle(request: GovernedContextRequest) {
  const reviewedState = materializeReviewedState(request.state, request.clinicalReviewLedger)
  const aiAuthorizedState = filterStateByPurposeConsent(
    reviewedState,
    request.purposeConsentLedger,
    'ai-context',
    request.at,
  )
  const clinicalAuthorizedState = filterStateByPurposeConsent(
    reviewedState,
    request.purposeConsentLedger,
    'clinical-support',
    request.at,
  )

  const aiChatbot = minimizeAiContext(aiAuthorizedState, request.aiPolicy, request.at)
  const aiEmr = buildContextPacket(clinicalAuthorizedState, 'ai-emr', request.at)
  const pendingReview = buildClinicalReviewQueue(request.state, request.clinicalReviewLedger)

  return {
    subjectId: request.state.subjectId,
    generatedAt: request.at,
    aiChatbot,
    aiEmr,
    pendingReview,
    consent: {
      aiContext: purposeConsentStatus(request.purposeConsentLedger, request.state.subjectId, 'ai-context', request.at),
      clinicalSupport: purposeConsentStatus(request.purposeConsentLedger, request.state.subjectId, 'clinical-support', request.at),
    },
    governance: {
      clinicianReviewOverlayApplied: true,
      purposeSpecificConsentApplied: true,
      minimumNecessaryAiContextApplied: true,
      autonomousEmrSigningAllowed: false as const,
      autonomousMedicationCommitAllowed: false as const,
      autonomousOrderCommitAllowed: false as const,
    },
  }
}
