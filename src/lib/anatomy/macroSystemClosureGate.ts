import {
  MACRO_ARTICULAR_FASCIAL_TARGETS,
  auditMacroArticularFascialReadiness,
  type MacroDomain,
  type MacroTargetReadiness,
} from './macroArticularFascialReadiness'

export type MacroClosureStatus = 'blocked' | 'ready-for-qualified-review' | 'complete'

export interface MacroTargetPublicationRecord {
  targetId: string
  exactAssetSource: string
  sourceRevision: string
  license: string
  attribution: string
  transformationHistory: readonly string[]
  reviewerIdentity: string
  reviewerCredentials: string
  reviewDate: string
  reviewScope: string
  disposition: 'approved' | 'changes-required'
}

export interface MacroDomainClosureReport {
  domain: MacroDomain
  status: MacroClosureStatus
  requiredTargetIds: readonly string[]
  sourceCandidateMissing: readonly string[]
  publicationRecordMissing: readonly string[]
  publicationRecordRejected: readonly string[]
  completeTargetIds: readonly string[]
  mayPromoteSystemRootToShipped: boolean
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function nonEmpty(value: string) {
  return value.trim().length > 0
}

function recordIsComplete(record: MacroTargetPublicationRecord) {
  return nonEmpty(record.exactAssetSource)
    && nonEmpty(record.sourceRevision)
    && nonEmpty(record.license)
    && nonEmpty(record.attribution)
    && record.transformationHistory.length > 0
    && record.transformationHistory.every(nonEmpty)
    && nonEmpty(record.reviewerIdentity)
    && nonEmpty(record.reviewerCredentials)
    && ISO_DATE.test(record.reviewDate)
    && !Number.isNaN(Date.parse(`${record.reviewDate}T00:00:00Z`))
    && nonEmpty(record.reviewScope)
    && record.disposition === 'approved'
}

function readinessByDomain(domain: MacroDomain): readonly MacroTargetReadiness[] {
  return auditMacroArticularFascialReadiness().filter((entry) => entry.target.domain === domain)
}

/**
 * Fail-closed closure gate for the two current whole-body system blockers.
 * A generated/runtime source-name candidate never proves verified anatomy.
 * System-root promotion is allowed only when every required macro target has a
 * source candidate and a complete, approved asset-level provenance + qualified
 * academic-review record.
 */
export function evaluateMacroDomainClosure(
  domain: MacroDomain,
  records: readonly MacroTargetPublicationRecord[] = [],
): MacroDomainClosureReport {
  const readiness = readinessByDomain(domain)
  const requiredTargetIds = MACRO_ARTICULAR_FASCIAL_TARGETS
    .filter((target) => target.domain === domain)
    .map((target) => target.id)
    .sort()

  const sourceCandidateMissing = readiness
    .filter((entry) => entry.status === 'source-candidate-missing')
    .map((entry) => entry.target.id)
    .sort()

  const recordsByTarget = new Map(records.map((record) => [record.targetId, record]))
  const publicationRecordMissing: string[] = []
  const publicationRecordRejected: string[] = []
  const completeTargetIds: string[] = []

  for (const targetId of requiredTargetIds) {
    const readinessEntry = readiness.find((entry) => entry.target.id === targetId)
    if (!readinessEntry || readinessEntry.status === 'source-candidate-missing') continue

    const record = recordsByTarget.get(targetId)
    if (!record) {
      publicationRecordMissing.push(targetId)
      continue
    }
    if (!recordIsComplete(record)) {
      publicationRecordRejected.push(targetId)
      continue
    }
    completeTargetIds.push(targetId)
  }

  const allTargetsComplete = requiredTargetIds.length > 0
    && completeTargetIds.length === requiredTargetIds.length
    && sourceCandidateMissing.length === 0
    && publicationRecordMissing.length === 0
    && publicationRecordRejected.length === 0

  const hasSourceCoverage = sourceCandidateMissing.length === 0
  const status: MacroClosureStatus = allTargetsComplete
    ? 'complete'
    : hasSourceCoverage
      ? 'ready-for-qualified-review'
      : 'blocked'

  return {
    domain,
    status,
    requiredTargetIds,
    sourceCandidateMissing,
    publicationRecordMissing: publicationRecordMissing.sort(),
    publicationRecordRejected: publicationRecordRejected.sort(),
    completeTargetIds: completeTargetIds.sort(),
    mayPromoteSystemRootToShipped: allTargetsComplete,
  }
}

export function evaluateCurrentMacroSystemClosure() {
  return {
    articular: evaluateMacroDomainClosure('articular'),
    fascial: evaluateMacroDomainClosure('fascial'),
  } as const
}
