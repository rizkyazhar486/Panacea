import registryJson from '../../governance/panacea-99-axioms.json' with { type: 'json' }

export type Panacea99Decision = 'ALLOW' | 'DEFER' | 'ESCALATE' | 'BLOCK'
export type Panacea99Applicability = 'applicable' | 'not-applicable' | 'unknown'
export type Panacea99Status = 'pass' | 'fail' | 'unknown'
export type Panacea99HumanReviewState = 'approved' | 'rejected' | 'pending'

export interface Panacea99EvidenceRef {
  id: string
  kind: 'test' | 'citation' | 'audit' | 'approval' | 'runtime' | 'measurement' | 'other'
  source: string
  capturedAt?: string
}

export interface Panacea99HumanReview {
  state: Panacea99HumanReviewState
  reviewerId?: string
  reviewedAt?: string
}

export interface Panacea99Assessment {
  axiomId: string
  applicability: Panacea99Applicability
  status: Panacea99Status
  rationale?: string
  evidence?: readonly Panacea99EvidenceRef[]
  criticalityOverride?: 'hard'
  humanReviewRequired?: boolean
  humanReview?: Panacea99HumanReview
}

export interface Panacea99EvaluationInput {
  actionId: string
  evaluatedAt: string
  assessments: readonly Panacea99Assessment[]
}

export interface Panacea99AssessmentReceipt {
  axiomId: string
  enforcement: string
  hard: boolean
  applicability: Panacea99Applicability
  status: Panacea99Status
  evidenceCount: number
  disposition: 'pass' | 'not-applicable' | 'advisory' | 'unresolved' | 'review-required' | 'failed'
  reasons: readonly string[]
}

export interface Panacea99DecisionReceipt {
  registryId: string
  registrySchemaVersion: number
  actionId: string
  evaluatedAt: string
  decision: Panacea99Decision
  executionGate: 0 | 1
  hardGateProduct: 0 | 1
  counts: {
    assessed: number
    applicable: number
    hardApplicable: number
    hardPassed: number
    hardFailed: number
    hardUnresolved: number
    reviewRequired: number
    advisoryIssues: number
  }
  failedHardAxiomIds: readonly string[]
  unresolvedHardAxiomIds: readonly string[]
  humanReviewAxiomIds: readonly string[]
  advisoryAxiomIds: readonly string[]
  assessments: readonly Panacea99AssessmentReceipt[]
}

interface RegistryAxiom {
  id: string
  enforcement: string
}

interface RegistryShape {
  schemaVersion: number
  id: string
  enforcementPolicy: {
    hardByDefaultSurfaces: string[]
    hardPassRequiresEvidence: boolean
    hardCriticalityMayBeDowngraded: boolean
  }
  axioms: RegistryAxiom[]
}

const registry = registryJson as RegistryShape
const axiomById = new Map(registry.axioms.map((axiom) => [axiom.id, axiom]))
const hardByDefault = new Set(registry.enforcementPolicy.hardByDefaultSurfaces)

function validIso(value: string) {
  return Number.isFinite(Date.parse(value))
}

function requiredText(value: string, field: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function validateEvidence(evidence: readonly Panacea99EvidenceRef[] | undefined) {
  for (const ref of evidence ?? []) {
    requiredText(ref.id, 'evidence.id')
    requiredText(ref.source, 'evidence.source')
    if (ref.capturedAt !== undefined && !validIso(ref.capturedAt)) {
      throw new Error('evidence.capturedAt must be a valid ISO timestamp')
    }
  }
}

function validateHumanReview(review: Panacea99HumanReview | undefined) {
  if (!review) return
  if (review.state === 'approved' || review.state === 'rejected') {
    requiredText(review.reviewerId ?? '', 'humanReview.reviewerId')
    if (!review.reviewedAt || !validIso(review.reviewedAt)) {
      throw new Error('approved/rejected human review requires a valid reviewedAt timestamp')
    }
  }
}

function decisionFromFlags(flags: {
  failed: boolean
  review: boolean
  unresolved: boolean
}): Panacea99Decision {
  if (flags.failed) return 'BLOCK'
  if (flags.review) return 'ESCALATE'
  if (flags.unresolved) return 'DEFER'
  return 'ALLOW'
}

export function panacea99AxiomIdsForSurfaces(surfaces: readonly string[]) {
  const normalized = new Set(surfaces.map((surface) => requiredText(surface, 'surface')))
  return registry.axioms
    .filter((axiom) => normalized.has(axiom.enforcement))
    .map((axiom) => axiom.id)
}

export function evaluatePanacea99(input: Panacea99EvaluationInput): Panacea99DecisionReceipt {
  const actionId = requiredText(input.actionId, 'actionId')
  if (!validIso(input.evaluatedAt)) throw new Error('evaluatedAt must be a valid ISO timestamp')

  const seen = new Set<string>()
  const receipts: Panacea99AssessmentReceipt[] = []
  const failedHardAxiomIds: string[] = []
  const unresolvedHardAxiomIds: string[] = []
  const humanReviewAxiomIds: string[] = []
  const advisoryAxiomIds: string[] = []

  let applicable = 0
  let hardApplicable = 0
  let hardPassed = 0

  for (const assessment of input.assessments) {
    const axiom = axiomById.get(assessment.axiomId)
    if (!axiom) throw new Error(`unknown 99-Axiom id: ${assessment.axiomId}`)
    if (seen.has(assessment.axiomId)) throw new Error(`duplicate 99-Axiom assessment: ${assessment.axiomId}`)
    seen.add(assessment.axiomId)

    validateEvidence(assessment.evidence)
    validateHumanReview(assessment.humanReview)

    if ((assessment.applicability === 'not-applicable' || assessment.applicability === 'unknown')
      && !assessment.rationale?.trim()) {
      throw new Error(`${assessment.axiomId} requires rationale when applicability is not-applicable or unknown`)
    }

    const hard = hardByDefault.has(axiom.enforcement) || assessment.criticalityOverride === 'hard'
    const reasons: string[] = []
    let disposition: Panacea99AssessmentReceipt['disposition'] = 'pass'

    if (assessment.applicability === 'not-applicable') {
      disposition = 'not-applicable'
    } else if (assessment.applicability === 'unknown') {
      if (hard) {
        unresolvedHardAxiomIds.push(assessment.axiomId)
        disposition = 'unresolved'
        reasons.push('hard-gate applicability is unresolved')
      } else {
        advisoryAxiomIds.push(assessment.axiomId)
        disposition = 'advisory'
        reasons.push('advisory applicability is unresolved')
      }
    } else {
      applicable += 1
      if (hard) hardApplicable += 1

      if (assessment.status === 'fail') {
        if (hard) {
          failedHardAxiomIds.push(assessment.axiomId)
          disposition = 'failed'
          reasons.push('applicable hard invariant explicitly failed')
        } else {
          advisoryAxiomIds.push(assessment.axiomId)
          disposition = 'advisory'
          reasons.push('applicable advisory invariant failed')
        }
      } else if (assessment.status === 'unknown') {
        if (hard) {
          unresolvedHardAxiomIds.push(assessment.axiomId)
          disposition = 'unresolved'
          reasons.push('applicable hard invariant has unknown status')
        } else {
          advisoryAxiomIds.push(assessment.axiomId)
          disposition = 'advisory'
          reasons.push('applicable advisory invariant has unknown status')
        }
      } else if (hard && registry.enforcementPolicy.hardPassRequiresEvidence && (assessment.evidence?.length ?? 0) === 0) {
        unresolvedHardAxiomIds.push(assessment.axiomId)
        disposition = 'unresolved'
        reasons.push('hard pass has no evidence reference')
      } else if (assessment.humanReviewRequired) {
        if (!assessment.humanReview || assessment.humanReview.state === 'pending') {
          humanReviewAxiomIds.push(assessment.axiomId)
          disposition = 'review-required'
          reasons.push('required human review is pending')
        } else if (assessment.humanReview.state === 'rejected') {
          failedHardAxiomIds.push(assessment.axiomId)
          disposition = 'failed'
          reasons.push('required human review rejected the action')
        } else {
          if (hard) hardPassed += 1
          reasons.push('required human review approved')
        }
      } else if (hard) {
        hardPassed += 1
      }
    }

    receipts.push({
      axiomId: assessment.axiomId,
      enforcement: axiom.enforcement,
      hard,
      applicability: assessment.applicability,
      status: assessment.status,
      evidenceCount: assessment.evidence?.length ?? 0,
      disposition,
      reasons,
    })
  }

  const failed = failedHardAxiomIds.length > 0
  const review = humanReviewAxiomIds.length > 0
  const unresolved = unresolvedHardAxiomIds.length > 0
  const decision = decisionFromFlags({ failed, review, unresolved })
  const executionGate: 0 | 1 = decision === 'ALLOW' ? 1 : 0

  return {
    registryId: registry.id,
    registrySchemaVersion: registry.schemaVersion,
    actionId,
    evaluatedAt: input.evaluatedAt,
    decision,
    executionGate,
    hardGateProduct: executionGate,
    counts: {
      assessed: receipts.length,
      applicable,
      hardApplicable,
      hardPassed,
      hardFailed: failedHardAxiomIds.length,
      hardUnresolved: unresolvedHardAxiomIds.length,
      reviewRequired: humanReviewAxiomIds.length,
      advisoryIssues: advisoryAxiomIds.length,
    },
    failedHardAxiomIds,
    unresolvedHardAxiomIds,
    humanReviewAxiomIds,
    advisoryAxiomIds,
    assessments: receipts,
  }
}

export function panacea99GeometricMaturity(
  scores: readonly { axiomId: string; score: number; weight?: number }[],
) {
  if (scores.length === 0) return null

  let weightedLogSum = 0
  let totalWeight = 0
  for (const item of scores) {
    if (!axiomById.has(item.axiomId)) throw new Error(`unknown 99-Axiom id: ${item.axiomId}`)
    if (!Number.isFinite(item.score) || item.score < 0 || item.score > 1) {
      throw new Error('maturity score must be within [0,1]')
    }
    const weight = item.weight ?? 1
    if (!Number.isFinite(weight) || weight <= 0) throw new Error('maturity weight must be finite and positive')
    if (item.score === 0) return 0
    weightedLogSum += weight * Math.log(item.score)
    totalWeight += weight
  }

  return Math.exp(weightedLogSum / totalWeight)
}
