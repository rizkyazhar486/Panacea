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

const APPLICABILITIES = new Set<Panacea99Applicability>(['applicable', 'not-applicable', 'unknown'])
const STATUSES = new Set<Panacea99Status>(['pass', 'fail', 'unknown'])
const HUMAN_REVIEW_STATES = new Set<Panacea99HumanReviewState>(['approved', 'rejected', 'pending'])
const EVIDENCE_KINDS = new Set<Panacea99EvidenceRef['kind']>([
  'test',
  'citation',
  'audit',
  'approval',
  'runtime',
  'measurement',
  'other',
])
const ISO_8601_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/

function validIso(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = ISO_8601_TIMESTAMP.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const offsetHour = match[7] === undefined ? 0 : Number(match[7])
  const offsetMinute = match[8] === undefined ? 0 : Number(match[8])
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  if (month < 1 || month > 12) return false
  if (day < 1 || day > (daysInMonth[month - 1] ?? 0)) return false
  if (hour > 23 || minute > 59 || second > 59) return false
  if (offsetHour > 14 || offsetMinute > 59) return false
  if (offsetHour === 14 && offsetMinute !== 0) return false
  return Number.isFinite(Date.parse(value))
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`)
  }
  return value as Record<string, unknown>
}

function validateEvidence(evidence: unknown): readonly Panacea99EvidenceRef[] | undefined {
  if (evidence === undefined) return undefined
  if (!Array.isArray(evidence)) throw new Error('evidence must be an array')

  for (const [index, rawRef] of evidence.entries()) {
    const ref = asRecord(rawRef, `evidence[${index}]`)
    requiredText(ref.id, `evidence[${index}].id`)
    requiredText(ref.source, `evidence[${index}].source`)
    if (!EVIDENCE_KINDS.has(ref.kind as Panacea99EvidenceRef['kind'])) {
      throw new Error(`evidence[${index}].kind is invalid`)
    }
    if (ref.capturedAt !== undefined && !validIso(ref.capturedAt)) {
      throw new Error(`evidence[${index}].capturedAt must be a valid ISO timestamp`)
    }
  }

  return evidence as readonly Panacea99EvidenceRef[]
}

function validateHumanReview(review: unknown): Panacea99HumanReview | undefined {
  if (review === undefined) return undefined
  const value = asRecord(review, 'humanReview')
  if (!HUMAN_REVIEW_STATES.has(value.state as Panacea99HumanReviewState)) {
    throw new Error('humanReview.state is invalid')
  }

  const state = value.state as Panacea99HumanReviewState
  if (value.reviewerId !== undefined) requiredText(value.reviewerId, 'humanReview.reviewerId')
  if (value.reviewedAt !== undefined && !validIso(value.reviewedAt)) {
    throw new Error('humanReview.reviewedAt must be a valid ISO timestamp when supplied')
  }

  if (state === 'approved' || state === 'rejected') {
    const reviewerId = requiredText(value.reviewerId, 'humanReview.reviewerId')
    if (!validIso(value.reviewedAt)) {
      throw new Error('approved/rejected human review requires a valid reviewedAt timestamp')
    }
    return { state, reviewerId, reviewedAt: value.reviewedAt }
  }

  return {
    state,
    reviewerId: value.reviewerId as string | undefined,
    reviewedAt: value.reviewedAt as string | undefined,
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
  const rawInput = asRecord(input, 'input')
  const actionId = requiredText(rawInput.actionId, 'actionId')
  const evaluatedAt = rawInput.evaluatedAt
  if (!validIso(evaluatedAt)) throw new Error('evaluatedAt must be a valid ISO timestamp')
  const assessments = rawInput.assessments
  if (!Array.isArray(assessments)) throw new Error('assessments must be an array')

  const seen = new Set<string>()
  const receipts: Panacea99AssessmentReceipt[] = []
  const failedHardAxiomIds: string[] = []
  const unresolvedHardAxiomIds: string[] = []
  const humanReviewAxiomIds: string[] = []
  const advisoryAxiomIds: string[] = []

  let applicable = 0
  let hardApplicable = 0
  let hardPassed = 0

  for (const [index, rawAssessment] of assessments.entries()) {
    const assessmentRecord = asRecord(rawAssessment, `assessments[${index}]`)
    const axiomId = requiredText(assessmentRecord.axiomId, `assessments[${index}].axiomId`)
    const assessment = { ...assessmentRecord, axiomId } as unknown as Panacea99Assessment
    const axiom = axiomById.get(assessment.axiomId)
    if (!axiom) throw new Error(`unknown 99-Axiom id: ${assessment.axiomId}`)
    if (seen.has(assessment.axiomId)) throw new Error(`duplicate 99-Axiom assessment: ${assessment.axiomId}`)
    seen.add(assessment.axiomId)

    if (!APPLICABILITIES.has(assessment.applicability as Panacea99Applicability)) {
      throw new Error(`${assessment.axiomId} applicability is invalid`)
    }
    if (!STATUSES.has(assessment.status as Panacea99Status)) {
      throw new Error(`${assessment.axiomId} status is invalid`)
    }
    if (assessment.criticalityOverride !== undefined && assessment.criticalityOverride !== 'hard') {
      throw new Error(`${assessment.axiomId} criticalityOverride is invalid`)
    }
    if (assessment.humanReviewRequired !== undefined && typeof assessment.humanReviewRequired !== 'boolean') {
      throw new Error(`${assessment.axiomId} humanReviewRequired must be boolean when supplied`)
    }
    if (assessment.rationale !== undefined && typeof assessment.rationale !== 'string') {
      throw new Error(`${assessment.axiomId} rationale must be a string when supplied`)
    }

    const evidence = validateEvidence(assessment.evidence)
    const humanReview = validateHumanReview(assessment.humanReview)

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
      } else if (hard && registry.enforcementPolicy.hardPassRequiresEvidence && (evidence?.length ?? 0) === 0) {
        unresolvedHardAxiomIds.push(assessment.axiomId)
        disposition = 'unresolved'
        reasons.push('hard pass has no evidence reference')
      } else if (assessment.humanReviewRequired) {
        if (!humanReview || humanReview.state === 'pending') {
          humanReviewAxiomIds.push(assessment.axiomId)
          disposition = 'review-required'
          reasons.push('required human review is pending')
        } else if (humanReview.state === 'rejected') {
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
      evidenceCount: evidence?.length ?? 0,
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
    evaluatedAt,
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
