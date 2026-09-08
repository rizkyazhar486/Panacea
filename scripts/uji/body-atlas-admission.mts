import assert from 'node:assert/strict'
import { evaluateBodyAtlasAdmission } from '../../src/lib/bodyAtlasAdmission.ts'
import { BODY_HIGH_END_ATLAS_CONTRACT } from '../../src/lib/bodyHighEndAtlasContract.ts'

const referenceReady = evaluateBodyAtlasAdmission({
  profile: 'balanced',
  focusLayers: ['visceral'],
  visibleLayers: ['cardiovascular', 'muscular'],
})
assert.equal(referenceReady.technicalReady, true, referenceReady.technicalReasons.join('\n'))
assert.equal(referenceReady.referenceDisplayAllowed, true)
assert.equal(referenceReady.biomedicalPublishable, false)
assert.equal(referenceReady.streaming.mandatoryBudgetExceeded, false)
assert.ok(referenceReady.streaming.resident.some((layer) => layer.layer === 'visceral'))
assert.ok(referenceReady.publicationReasons.some((reason) => reason.includes('Asset-level')))
assert.ok(referenceReady.publicationReasons.some((reason) => reason.includes('qualified academic review')))

const constrainedFailure = evaluateBodyAtlasAdmission({
  profile: 'constrained-mobile',
  focusLayers: ['cardiovascular', 'nervous', 'muscular'],
})
assert.equal(constrainedFailure.streaming.mandatoryBudgetExceeded, true)
assert.equal(constrainedFailure.technicalReady, false)
assert.equal(constrainedFailure.referenceDisplayAllowed, false)
assert.equal(constrainedFailure.biomedicalPublishable, false)
assert.ok(constrainedFailure.technicalReasons.some((reason) => reason.includes('runtime residency budget')))
for (const layer of ['cardiovascular', 'nervous', 'muscular'] as const) {
  assert.ok(constrainedFailure.streaming.resident.some((resident) => resident.layer === layer), `mandatory focus layer was silently evicted: ${layer}`)
}

const highFidelityReference = evaluateBodyAtlasAdmission({
  profile: '5k-reference-capture',
  visibleLayers: ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid'],
})
assert.equal(highFidelityReference.technicalReady, true, highFidelityReference.technicalReasons.join('\n'))
assert.equal(highFidelityReference.referenceDisplayAllowed, true)
assert.equal(highFidelityReference.biomedicalPublishable, false)
assert.equal(highFidelityReference.streaming.profile.id, '5k-reference-capture')
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.highFidelityCaptureLongEdgePx, 5120)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.patientSpecificBreathingModel, false)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.externalAssetImportAllowed, false)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.assetLevelProvenanceComplete, false)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.verifiedBiomedicalAssetPublicationAllowed, false)

console.log('Body atlas admission: technical readiness, explicit reference display, mandatory-budget failure, 5K reference mode, and fail-closed biomedical publication remain separate states.')
