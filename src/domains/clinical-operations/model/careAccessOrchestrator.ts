export type CoverageState = 'unknown' | 'self-pay' | 'active' | 'inactive'
export type PreauthorizationState = 'unknown' | 'not-required' | 'required' | 'requested' | 'approved' | 'denied'
export type PaymentState = 'not-submitted' | 'submitted' | 'adjudicating' | 'approved' | 'partially-approved' | 'paid' | 'denied'
export type DiagnosticRouteState = 'local' | 'referral-required' | 'in-transit' | 'processing-remote' | 'result-returned'
export type FinancialWorkflowState = 'blocked' | 'attention' | 'ready'
export type DiagnosticContinuityState = 'gap' | 'intact'

export interface ClaimEvidenceState {
  patientIdentityResolved: boolean
  coverageIdentityResolved: boolean
  encounterLinked: boolean
  clinicalRecordSigned: boolean
  diagnosisCoded: boolean
  serviceItemsCoded: boolean
  supportingEvidenceLinked: boolean
  provenanceComplete: boolean
}

export interface PayerOrchestrationState {
  coverage: CoverageState
  payerAdapterConfigured: boolean
  preauthorization: PreauthorizationState
  payment: PaymentState
  evidence: ClaimEvidenceState
}

export interface DiagnosticReferralState {
  id: string
  orderRecorded: boolean
  localCapabilityAvailable: boolean
  destinationConfigured: boolean
  specimenOrStudyIdentityResolved: boolean
  chainOfCustodyComplete: boolean
  resultLinkedToPatientState: boolean
  state: DiagnosticRouteState
}

export interface CareAccessOrchestrationInput {
  payer: PayerOrchestrationState
  diagnostics: readonly DiagnosticReferralState[]
}

export interface ClinicalCareBoundary {
  authority: 'outside-orchestrator'
  financialStateMayDenyCare: false
  diagnosticStateMayAuthorizeTreatment: false
}

export interface DiagnosticContinuityResult {
  state: DiagnosticContinuityState
  blockedDiagnosticIds: string[]
}

export interface FinancialWorkflowResult {
  state: FinancialWorkflowState
  nextAdministrativeAction: string
  claimEvidenceReady: boolean
  claimSubmissionReady: boolean
  preauthorizationReady: boolean
  missingClaimEvidence: string[]
}

export interface CareAccessOrchestrationResult {
  clinicalCare: ClinicalCareBoundary
  diagnosticContinuity: DiagnosticContinuityResult
  financialWorkflow: FinancialWorkflowResult
  warnings: string[]
}

const CLAIM_EVIDENCE_LABELS: ReadonlyArray<[keyof ClaimEvidenceState, string]> = [
  ['patientIdentityResolved', 'patient identity'],
  ['coverageIdentityResolved', 'coverage identity'],
  ['encounterLinked', 'encounter link'],
  ['clinicalRecordSigned', 'signed clinical record'],
  ['diagnosisCoded', 'coded diagnosis'],
  ['serviceItemsCoded', 'coded service items'],
  ['supportingEvidenceLinked', 'supporting evidence'],
  ['provenanceComplete', 'provenance'],
]

function diagnosticRouteContinuityIntact(route: DiagnosticReferralState): boolean {
  if (!route.orderRecorded || !route.specimenOrStudyIdentityResolved) return false
  if (route.localCapabilityAvailable) return route.resultLinkedToPatientState || route.state === 'local'
  return (
    route.destinationConfigured &&
    route.chainOfCustodyComplete &&
    (
      route.state === 'in-transit' ||
      route.state === 'processing-remote' ||
      (route.state === 'result-returned' && route.resultLinkedToPatientState)
    )
  )
}

function financialResult(
  state: FinancialWorkflowState,
  nextAdministrativeAction: string,
  claimEvidenceReady: boolean,
  claimSubmissionReady: boolean,
  preauthorizationReady: boolean,
  missingClaimEvidence: string[],
): FinancialWorkflowResult {
  return {
    state,
    nextAdministrativeAction,
    claimEvidenceReady,
    claimSubmissionReady,
    preauthorizationReady,
    missingClaimEvidence,
  }
}

/**
 * Administrative/logistics orchestrator for one care episode.
 *
 * Safety boundary:
 * - financial workflow state never authorizes or denies clinically indicated care;
 * - diagnostic continuity state never determines treatment;
 * - payer denial, missing adapter, or missing claim evidence blocks only the
 *   corresponding administrative workflow;
 * - this function never invents payer approval or clinical documentation.
 */
export function evaluateCareAccessOrchestration(
  input: CareAccessOrchestrationInput,
): CareAccessOrchestrationResult {
  const missingClaimEvidence = CLAIM_EVIDENCE_LABELS
    .filter(([key]) => !input.payer.evidence[key])
    .map(([, label]) => label)

  const blockedDiagnosticIds = input.diagnostics
    .filter((route) => !diagnosticRouteContinuityIntact(route))
    .map((route) => route.id)

  const diagnosticContinuity: DiagnosticContinuityResult = {
    state: blockedDiagnosticIds.length === 0 ? 'intact' : 'gap',
    blockedDiagnosticIds,
  }

  const claimEvidenceReady = missingClaimEvidence.length === 0
  const coverageAllowsClaim = input.payer.coverage === 'active'
  const preauthorizationReady =
    input.payer.preauthorization === 'not-required' ||
    input.payer.preauthorization === 'approved'
  const baseClaimSubmissionReady =
    coverageAllowsClaim &&
    input.payer.payerAdapterConfigured &&
    preauthorizationReady &&
    claimEvidenceReady
  const claimSubmissionReady =
    baseClaimSubmissionReady &&
    input.payer.payment === 'not-submitted'

  const warnings: string[] = []
  if (input.payer.coverage === 'unknown') warnings.push('Coverage status is unknown')
  if (input.payer.coverage === 'inactive') warnings.push('Coverage is inactive')
  if (coverageAllowsClaim && !input.payer.payerAdapterConfigured) warnings.push('Payer adapter is not configured')
  if (input.payer.preauthorization === 'denied') warnings.push('Preauthorization was denied')
  if (input.payer.payment === 'denied') warnings.push('Submitted claim/payment was denied')
  if (blockedDiagnosticIds.length) warnings.push('One or more diagnostic routes have continuity gaps')

  let financialWorkflow: FinancialWorkflowResult

  if (input.payer.coverage === 'self-pay') {
    financialWorkflow = financialResult(
      'ready',
      'Proceed with transparent self-pay estimate and settlement workflow',
      claimEvidenceReady,
      false,
      false,
      missingClaimEvidence,
    )
  } else if (input.payer.coverage !== 'active') {
    financialWorkflow = financialResult(
      'blocked',
      'Resolve coverage or payment responsibility before claim submission',
      claimEvidenceReady,
      false,
      false,
      missingClaimEvidence,
    )
  } else if (!input.payer.payerAdapterConfigured) {
    financialWorkflow = financialResult(
      'blocked',
      'Configure the jurisdiction/payer reimbursement adapter',
      claimEvidenceReady,
      false,
      preauthorizationReady,
      missingClaimEvidence,
    )
  } else if (input.payer.preauthorization === 'denied') {
    financialWorkflow = financialResult(
      'blocked',
      'Review payer denial and authorized administrative alternatives with responsible staff',
      claimEvidenceReady,
      false,
      false,
      missingClaimEvidence,
    )
  } else if (
    input.payer.preauthorization === 'required' ||
    input.payer.preauthorization === 'requested' ||
    input.payer.preauthorization === 'unknown'
  ) {
    financialWorkflow = financialResult(
      'attention',
      'Resolve coverage eligibility and preauthorization state',
      claimEvidenceReady,
      false,
      false,
      missingClaimEvidence,
    )
  } else if (input.payer.payment === 'denied') {
    financialWorkflow = financialResult(
      'attention',
      'Review claim denial, adjudication evidence and authorized resubmission or appeal path',
      claimEvidenceReady,
      false,
      true,
      missingClaimEvidence,
    )
  } else if (!claimEvidenceReady) {
    financialWorkflow = financialResult(
      'attention',
      'Complete claim evidence without fabricating missing clinical documentation',
      false,
      false,
      true,
      missingClaimEvidence,
    )
  } else {
    financialWorkflow = financialResult(
      'ready',
      input.payer.payment === 'not-submitted'
        ? 'Claim packet is ready for authorized submission'
        : 'Track adjudication, reconciliation and settlement',
      true,
      claimSubmissionReady,
      true,
      [],
    )
  }

  return {
    clinicalCare: {
      authority: 'outside-orchestrator',
      financialStateMayDenyCare: false,
      diagnosticStateMayAuthorizeTreatment: false,
    },
    diagnosticContinuity,
    financialWorkflow,
    warnings,
  }
}
