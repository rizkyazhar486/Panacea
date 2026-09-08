import type { BodyProjectionTarget, ProcedureProjectionTarget } from './bodyProjectionContract'

export interface BodyProcedureEvidenceRecord {
  id: string
  procedureId: string
  targetIds: string[]
  sourceId: string
  sourceVersion: string
  citation: string
  sourceLocator: string
  educationalScope: string
  aiAssisted: boolean
  containsPatientSpecificTrajectory: boolean
  containsSafeZoneCoordinates: boolean
  containsTrocarCoordinates: boolean
  containsForceThresholds: boolean
  containsDeviceSettings: boolean
  containsInsufflationPressure: boolean
  containsDose: boolean
  containsAutonomousDecisionLogic: boolean
  reviewerName?: string
  reviewerCredentials?: string
  reviewedAt?: string
  reviewScope?: string
}

export interface BodyProcedurePublicationDecision {
  publishable: boolean
  reasons: string[]
}

const nonBlank = (value: string | undefined) => Boolean(value?.trim())
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z)?$/
const FLOATING_VERSION_RE = /^(?:latest|main|master|head|current|versioned-record)$/i
const PLACEHOLDER_LOCATOR_RE = /^(?:verified-source-record|repository-verified-source-record|source-record|placeholder)$/i

function isPinnedSourceVersion(value: string | undefined) {
  if (!nonBlank(value)) return false
  return !FLOATING_VERSION_RE.test(value!.trim())
}

function isSpecificSourceLocator(value: string | undefined) {
  if (!nonBlank(value)) return false
  return !PLACEHOLDER_LOCATOR_RE.test(value!.trim())
}

function isValidIsoDate(value: string | undefined) {
  if (!nonBlank(value) || !ISO_DATE_RE.test(value!.trim())) return false
  const normalized = value!.trim()
  const parsed = new Date(normalized.length === 10 ? `${normalized}T00:00:00Z` : normalized)
  if (Number.isNaN(parsed.getTime())) return false
  const [year, month, day] = normalized.slice(0, 10).split('-').map(Number)
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day
}

export function evaluateBodyProcedurePublication(
  procedure: ProcedureProjectionTarget,
  targets: BodyProjectionTarget[],
  evidence: BodyProcedureEvidenceRecord,
): BodyProcedurePublicationDecision {
  const reasons: string[] = []

  if (evidence.procedureId !== procedure.id) reasons.push('Procedure evidence does not match the normalized procedure target.')
  if (!nonBlank(evidence.id)) reasons.push('Procedure evidence id is missing.')
  if (!nonBlank(evidence.sourceId)) reasons.push('Procedure evidence source identity is missing.')
  if (!isPinnedSourceVersion(evidence.sourceVersion)) reasons.push('Procedure evidence version/revision must be immutable and explicitly pinned.')
  if (!nonBlank(evidence.citation)) reasons.push('Procedure evidence citation is missing.')
  if (!isSpecificSourceLocator(evidence.sourceLocator)) reasons.push('Procedure evidence source locator must identify a specific source location.')
  if (!nonBlank(evidence.educationalScope)) reasons.push('Procedure educational scope is missing.')
  if (typeof evidence.aiAssisted !== 'boolean') reasons.push('AI-assistance disclosure must be an explicit boolean.')

  const expected = new Set(procedure.anatomyTargetIds)
  const provided = new Set(evidence.targetIds)
  if (expected.size !== procedure.anatomyTargetIds.length) {
    reasons.push('Procedure contract contains duplicate anatomy target ids.')
  }
  if (provided.size !== evidence.targetIds.length) {
    reasons.push('Procedure evidence target coverage must not contain duplicate target ids.')
  }
  if (expected.size !== provided.size || [...expected].some((id) => !provided.has(id))) {
    reasons.push('Procedure evidence target coverage does not match the normalized anatomy targets.')
  }

  let sameSystemTargetFound = false
  for (const targetId of procedure.anatomyTargetIds) {
    const target = targets.find((candidate) => candidate.id === targetId)
    if (!target) {
      reasons.push(`Required anatomy target "${targetId}" is missing from the projection contract.`)
      continue
    }
    if (target.system === procedure.system) sameSystemTargetFound = true
    if (!target.kinds.includes('procedure')) {
      reasons.push(`Required anatomy target "${targetId}" does not permit procedure projection.`)
    }
    if (target.geometryStatus === 'blocked' || target.evidenceStatus === 'unsupported') {
      reasons.push(`Required anatomy target "${targetId}" is not publishable.`)
    }
  }
  if (!sameSystemTargetFound) {
    reasons.push('Procedure contract must include at least one anatomy target from the procedure system.')
  }

  const forbidden = [
    [evidence.containsPatientSpecificTrajectory, 'Patient-specific trajectory'],
    [evidence.containsSafeZoneCoordinates, 'Safe-zone coordinates'],
    [evidence.containsTrocarCoordinates, 'Trocar coordinates'],
    [evidence.containsForceThresholds, 'Force thresholds'],
    [evidence.containsDeviceSettings, 'Device settings'],
    [evidence.containsInsufflationPressure, 'Insufflation pressure'],
    [evidence.containsDose, 'Dose'],
    [evidence.containsAutonomousDecisionLogic, 'Autonomous operative decision logic'],
  ] as const
  for (const [present, label] of forbidden) if (present) reasons.push(`${label} is forbidden in Body procedure teaching publication.`)

  if (!nonBlank(evidence.reviewerName)) reasons.push('Qualified reviewer identity is required.')
  if (!nonBlank(evidence.reviewerCredentials)) reasons.push('Qualified reviewer credentials are required.')
  if (!nonBlank(evidence.reviewScope)) reasons.push('Qualified review scope is required.')
  if (!isValidIsoDate(evidence.reviewedAt)) reasons.push('Qualified review requires a real ISO calendar date/timestamp.')

  if (procedure.reviewRequired !== true) reasons.push('Procedure contract must remain review-required.')
  if (procedure.productionReady) reasons.push('Procedure target must not self-declare production readiness before this gate passes.')

  return { publishable: reasons.length === 0, reasons: [...new Set(reasons)] }
}
