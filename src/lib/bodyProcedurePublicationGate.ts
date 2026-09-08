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

export function evaluateBodyProcedurePublication(
  procedure: ProcedureProjectionTarget,
  targets: BodyProjectionTarget[],
  evidence: BodyProcedureEvidenceRecord,
): BodyProcedurePublicationDecision {
  const reasons: string[] = []

  if (evidence.procedureId !== procedure.id) reasons.push('Procedure evidence does not match the normalized procedure target.')
  if (!nonBlank(evidence.id)) reasons.push('Procedure evidence id is missing.')
  if (!nonBlank(evidence.sourceId)) reasons.push('Procedure evidence source identity is missing.')
  if (!nonBlank(evidence.sourceVersion)) reasons.push('Procedure evidence version/revision is missing.')
  if (!nonBlank(evidence.citation)) reasons.push('Procedure evidence citation is missing.')
  if (!nonBlank(evidence.sourceLocator)) reasons.push('Procedure evidence source locator is missing.')
  if (!nonBlank(evidence.educationalScope)) reasons.push('Procedure educational scope is missing.')

  const expected = new Set(procedure.anatomyTargetIds)
  const provided = new Set(evidence.targetIds)
  if (expected.size !== provided.size || [...expected].some((id) => !provided.has(id))) {
    reasons.push('Procedure evidence target coverage does not match the normalized anatomy targets.')
  }

  for (const targetId of procedure.anatomyTargetIds) {
    const target = targets.find((candidate) => candidate.id === targetId)
    if (!target) reasons.push(`Required anatomy target "${targetId}" is missing from the projection contract.`)
    else if (target.geometryStatus === 'blocked' || target.evidenceStatus === 'unsupported') reasons.push(`Required anatomy target "${targetId}" is not publishable.`)
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
  if (!nonBlank(evidence.reviewedAt) || !ISO_DATE_RE.test(evidence.reviewedAt!.trim())) reasons.push('Qualified review requires an ISO date/timestamp.')

  if (procedure.reviewRequired !== true) reasons.push('Procedure contract must remain review-required.')
  if (procedure.productionReady) reasons.push('Procedure target must not self-declare production readiness before this gate passes.')

  return { publishable: reasons.length === 0, reasons: [...new Set(reasons)] }
}
