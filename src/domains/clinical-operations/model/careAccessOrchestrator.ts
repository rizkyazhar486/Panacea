export type CoverageState = 'unknown' | 'self-pay' | 'active' | 'inactive'
export type PreauthorizationState = 'unknown' | 'not-required' | 'required' | 'requested' | 'approved' | 'denied'
export type PaymentState = 'not-submitted' | 'submitted' | 'adjudicating' | 'approved' | 'partially-approved' | 'paid' | 'denied'
export type DiagnosticRouteState = 'local' | 'referral-required' | 'in-transit' | 'processing-remote' | 'result-returned'
export type OrchestrationPriority = 'blocked' | 'attention' | 'ready'

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

export interface CareAccessOrchestrationResult {
  priority: OrchestrationPriority
  nextOperationalAction: string
  claimReady: boolean
  diagnosticContinuityReady: boolean
  missingClaimEvidence: string[]
  blockedDiagnosticIds: string[]
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

function diagnosticRouteReady(route: DiagnosticReferralState): boolean {
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

/**
 * Operational orchestrator for care access, diagnostics and reimbursement.
 *
 * It never decides what test/treatment is clinically indicated and never
 * invents payer approval. Its job is to expose administrative/logistics gaps
 * so a clinically authorized plan can move without losing patient identity,
 * provenance, diagnostic continuity or reimbursement evidence.
 */
export function evaluateCareAccessOrchestration(
  input: CareAccessOrchestrationInput,
): CareAccessOrchestrationResult {
  const missingClaimEvidence = CLAIM_EVIDENCE_LABELS
    .filter(([key]) => !input.payer.evidence[key])
    .map(([, label]) => label)

  const blockedDiagnosticIds = input.diagnostics
    .filter((route) => !diagnosticRouteReady(route))
    .map((route) => route.id)

  const diagnosticContinuityReady = blockedDiagnosticIds.length === 0
  const coverageAllowsClaim = input.payer.coverage === 'active'
  const preauthorizationReady =
    input.payer.preauthorization === 'not-required' ||
    input.payer.preauthorization === 'approved'
  const claimReady =
    coverageAllowsClaim &&
    input.payer.payerAdapterConfigured &&
    preauthorizationReady &&
    missingClaimEvidence.length === 0

  const warnings: string[] = []
  if (input.payer.coverage === 'unknown') warnings.push('Coverage status is unknown')
  if (input.payer.coverage === 'inactive') warnings.push('Coverage is inactive')
  if (coverageAllowsClaim && !input.payer.payerAdapterConfigured) warnings.push('Payer adapter is not configured')
  if (input.payer.preauthorization === 'denied') warnings.push('Preauthorization was denied')
  if (input.payer.payment === 'denied') warnings.push('Submitted claim/payment was denied')
  if (blockedDiagnosticIds.length) warnings.push('One or more diagnostic routes have continuity gaps')

  if (!diagnosticContinuityReady) {
    return {
      priority: 'blocked',
      nextOperationalAction: 'Resolve diagnostic referral, transport, identity, or result-linkage gap',
      claimReady,
      diagnosticContinuityReady,
      missingClaimEvidence,
      blockedDiagnosticIds,
      warnings,
    }
  }

  if (input.payer.coverage === 'self-pay') {
    return {
      priority: 'ready',
      nextOperationalAction: 'Proceed with transparent self-pay estimate and settlement workflow',
      claimReady: false,
      diagnosticContinuityReady,
      missingClaimEvidence: [],
      blockedDiagnosticIds,
      warnings,
    }
  }

  if (input.payer.coverage !== 'active') {
    return {
      priority: 'blocked',
      nextOperationalAction: 'Resolve coverage or payment responsibility before claim submission',
      claimReady: false,
      diagnosticContinuityReady,
      missingClaimEvidence,
      blockedDiagnosticIds,
      warnings,
    }
  }

  if (!input.payer.payerAdapterConfigured) {
    return {
      priority: 'blocked',
      nextOperationalAction: 'Configure the jurisdiction/payer reimbursement adapter',
      claimReady: false,
      diagnosticContinuityReady,
      missingClaimEvidence,
      blockedDiagnosticIds,
      warnings,
    }
  }

  if (input.payer.preauthorization === 'required' || input.payer.preauthorization === 'requested' || input.payer.preauthorization === 'unknown') {
    return {
      priority: 'attention',
      nextOperationalAction: 'Resolve coverage eligibility and preauthorization state',
      claimReady: false,
      diagnosticContinuityReady,
      missingClaimEvidence,
      blockedDiagnosticIds,
      warnings,
    }
  }

  if (input.payer.preauthorization === 'denied') {
    return {
      priority: 'blocked',
      nextOperationalAction: 'Review payer denial and authorized alternatives with responsible staff',
      claimReady: false,
      diagnosticContinuityReady,
      missingClaimEvidence,
      blockedDiagnosticIds,
      warnings,
    }
  }

  if (missingClaimEvidence.length > 0) {
    return {
      priority: 'attention',
      nextOperationalAction: 'Complete claim evidence without fabricating missing clinical documentation',
      claimReady: false,
      diagnosticContinuityReady,
      missingClaimEvidence,
      blockedDiagnosticIds,
      warnings,
    }
  }

  return {
    priority: 'ready',
    nextOperationalAction: input.payer.payment === 'not-submitted'
      ? 'Claim packet is ready for authorized submission'
      : 'Track adjudication, reconciliation and settlement',
    claimReady,
    diagnosticContinuityReady,
    missingClaimEvidence,
    blockedDiagnosticIds,
    warnings,
  }
}
