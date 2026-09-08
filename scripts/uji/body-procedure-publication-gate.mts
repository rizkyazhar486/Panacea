import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS, PROCEDURE_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'
import { evaluateBodyProcedurePublication, type BodyProcedureEvidenceRecord } from '../../src/lib/bodyProcedurePublicationGate.ts'

const appendectomy = PROCEDURE_PROJECTION_TARGETS.find((procedure) => procedure.id === 'appendectomy')
assert.ok(appendectomy)

const reviewed: BodyProcedureEvidenceRecord = {
  id: 'appendectomy-education-evidence',
  procedureId: appendectomy.id,
  targetIds: [...appendectomy.anatomyTargetIds],
  sourceId: 'peer-reviewed-surgical-education-source',
  sourceVersion: 'versioned-record',
  citation: 'Version-pinned surgical education citation fixture',
  sourceLocator: 'verified-source-record',
  educationalScope: 'Generic anatomy-oriented teaching only; not patient-specific operative guidance.',
  aiAssisted: true,
  containsPatientSpecificTrajectory: false,
  containsSafeZoneCoordinates: false,
  containsTrocarCoordinates: false,
  containsForceThresholds: false,
  containsDeviceSettings: false,
  containsInsufflationPressure: false,
  containsDose: false,
  containsAutonomousDecisionLogic: false,
  reviewerName: 'Qualified reviewer fixture',
  reviewerCredentials: 'Recorded professional credentials fixture',
  reviewedAt: '2026-09-08',
  reviewScope: 'Procedure naming, anatomy scope, evidence provenance, and teaching boundaries.',
}

assert.equal(evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, reviewed).publishable, true)
assert.equal(evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, aiAssisted: false }).publishable, true, 'explicit false must remain a valid AI-assistance disclosure')

const unreviewed = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, {
  ...reviewed,
  reviewerName: ' ',
  reviewerCredentials: ' ',
  reviewedAt: 'today',
  reviewScope: ' ',
})
assert.equal(unreviewed.publishable, false)
assert.ok(unreviewed.reasons.some((reason) => reason.includes('reviewer identity')))
assert.ok(unreviewed.reasons.some((reason) => reason.includes('credentials')))

for (const field of [
  'containsPatientSpecificTrajectory',
  'containsSafeZoneCoordinates',
  'containsTrocarCoordinates',
  'containsForceThresholds',
  'containsDeviceSettings',
  'containsInsufflationPressure',
  'containsDose',
  'containsAutonomousDecisionLogic',
] as const) {
  const blocked = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, [field]: true })
  assert.equal(blocked.publishable, false)
}

const wrongCoverage = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, targetIds: ['cardiovascular-core'] })
assert.equal(wrongCoverage.publishable, false)
assert.ok(wrongCoverage.reasons.some((reason) => reason.includes('target coverage')))

const wrongProcedure = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, procedureId: 'cholecystectomy' })
assert.equal(wrongProcedure.publishable, false)
assert.ok(wrongProcedure.reasons.some((reason) => reason.includes('normalized procedure target')))

console.log('Body procedure publication gate: provenance, normalized targets, explicit AI disclosure, qualified review, and forbidden operative-detail boundaries verified.')
