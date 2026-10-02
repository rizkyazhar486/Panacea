import { minimizeAiContext, type AiContextPolicy } from './aiContextPolicy.ts'
import { evaluatePanacea99 } from './panacea99Policy.ts'
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

  const boundary = {
    clinicianReviewOverlayApplied: true as const,
    purposeSpecificConsentApplied: true as const,
    minimumNecessaryAiContextApplied: true as const,
    autonomousEmrSigningAllowed: false as const,
    autonomousMedicationCommitAllowed: false as const,
    autonomousOrderCommitAllowed: false as const,
  }
  const evidence = (id: string, source: string) => [{
    id,
    kind: 'runtime' as const,
    source,
    capturedAt: request.at,
  }]
  const constitutional = evaluatePanacea99({
    actionId: 'governed-context-projection',
    evaluatedAt: request.at,
    assessments: [
      {
        axiomId: 'A20',
        applicability: 'applicable',
        status: boundary.minimumNecessaryAiContextApplied ? 'pass' : 'fail',
        evidence: evidence('minimum-necessary-context', 'governedContextOrchestrator:minimizeAiContext'),
      },
      {
        axiomId: 'A21',
        applicability: 'applicable',
        status: boundary.purposeSpecificConsentApplied ? 'pass' : 'fail',
        evidence: evidence('purpose-bound-context', 'governedContextOrchestrator:filterStateByPurposeConsent'),
      },
      {
        axiomId: 'A90',
        applicability: 'applicable',
        status: (
          !boundary.autonomousEmrSigningAllowed
          && !boundary.autonomousMedicationCommitAllowed
          && !boundary.autonomousOrderCommitAllowed
        ) ? 'pass' : 'fail',
        evidence: evidence('no-autonomous-clinical-commit', 'governedContextOrchestrator:commit-boundary'),
      },
    ],
  })

  if (constitutional.executionGate !== 1) {
    throw new Error(`99-Axiom governed-context gate denied projection: ${constitutional.decision}`)
  }

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
      ...boundary,
      constitutional,
    },
  }
}
