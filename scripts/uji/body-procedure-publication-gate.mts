import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS, PROCEDURE_PROJECTION_TARGETS } from '../../src/lib/bodyProjectionContract.ts'
import { evaluateBodyProcedurePublication, type BodyProcedureEvidenceRecord } from '../../src/lib/bodyProcedurePublicationGate.ts'

const appendectomy = PROCEDURE_PROJECTION_TARGETS.find((procedure) => procedure.id === 'appendectomy')
const digestive = BODY_PROJECTION_TARGETS.find((target) => target.id === 'digestive-core')
assert.ok(appendectomy)
assert.ok(digestive)

const reviewed: BodyProcedureEvidenceRecord = {
  id: 'appendectomy-education-evidence',
  procedureId: appendectomy.id,
  targetIds: [...appendectomy.anatomyTargetIds],
  sourceId: 'peer-reviewed-surgical-education-source',
  sourceVersion: 'doi:10.0000/panacea.fixture.2026.1',
  citation: 'Version-pinned surgical education citation fixture',
  sourceLocator: 'article:methods/anatomy-scope',
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

const missingRuntimeDisclosure = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, {
  ...reviewed,
  aiAssisted: undefined as unknown as boolean,
})
assert.equal(missingRuntimeDisclosure.publishable, false)
assert.ok(missingRuntimeDisclosure.reasons.some((reason) => reason.includes('explicit boolean')))

for (const sourceVersion of ['latest', 'main', 'HEAD', 'current', 'versioned-record']) {
  const floating = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, sourceVersion })
  assert.equal(floating.publishable, false, `floating procedure source revision ${sourceVersion} must fail closed`)
  assert.ok(floating.reasons.some((reason) => reason.includes('immutable')))
}

for (const sourceLocator of ['verified-source-record', 'repository-verified-source-record', 'source-record', 'placeholder']) {
  const placeholder = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, sourceLocator })
  assert.equal(placeholder.publishable, false, `placeholder procedure source locator ${sourceLocator} must fail closed`)
  assert.ok(placeholder.reasons.some((reason) => reason.includes('specific source location')))
}

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

for (const reviewedAt of ['2026-02-30', '2026-13-01', '2026-00-10']) {
  const impossibleDate = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, reviewedAt })
  assert.equal(impossibleDate.publishable, false, `impossible review date ${reviewedAt} must fail closed`)
  assert.ok(impossibleDate.reasons.some((reason) => reason.includes('real ISO calendar date')))
}

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

const duplicateEvidenceTargets = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, {
  ...reviewed,
  targetIds: [...reviewed.targetIds, reviewed.targetIds[0]],
})
assert.equal(duplicateEvidenceTargets.publishable, false)
assert.ok(duplicateEvidenceTargets.reasons.some((reason) => reason.includes('duplicate target ids')))

const duplicateContract = { ...appendectomy, anatomyTargetIds: [...appendectomy.anatomyTargetIds, appendectomy.anatomyTargetIds[0]] }
const duplicateContractEvidence = { ...reviewed, targetIds: [...duplicateContract.anatomyTargetIds] }
const duplicateContractDecision = evaluateBodyProcedurePublication(duplicateContract, BODY_PROJECTION_TARGETS, duplicateContractEvidence)
assert.equal(duplicateContractDecision.publishable, false)
assert.ok(duplicateContractDecision.reasons.some((reason) => reason.includes('duplicate anatomy target ids')))

const nonProcedureDigestive = { ...digestive, kinds: digestive.kinds.filter((kind) => kind !== 'procedure') }
const targetWithoutProcedurePermission = evaluateBodyProcedurePublication(
  appendectomy,
  BODY_PROJECTION_TARGETS.map((target) => target.id === digestive.id ? nonProcedureDigestive : target),
  reviewed,
)
assert.equal(targetWithoutProcedurePermission.publishable, false)
assert.ok(targetWithoutProcedurePermission.reasons.some((reason) => reason.includes('does not permit procedure projection')))

const crossSystemOnlyProcedure = { ...appendectomy, system: 'cardiovascular' as const }
const crossSystemOnly = evaluateBodyProcedurePublication(crossSystemOnlyProcedure, BODY_PROJECTION_TARGETS, reviewed)
assert.equal(crossSystemOnly.publishable, false)
assert.ok(crossSystemOnly.reasons.some((reason) => reason.includes('procedure system')))

const wrongProcedure = evaluateBodyProcedurePublication(appendectomy, BODY_PROJECTION_TARGETS, { ...reviewed, procedureId: 'cholecystectomy' })
assert.equal(wrongProcedure.publishable, false)
assert.ok(wrongProcedure.reasons.some((reason) => reason.includes('normalized procedure target')))

console.log('Body procedure publication gate: immutable provenance, target-contract integrity, explicit AI disclosure, qualified review, and forbidden operative-detail boundaries verified.')
