import assert from 'node:assert/strict'
import {
  ORGAN_EDUCATION_BOUNDARY,
  ORGAN_EDUCATION_REFERENCES,
  ORGAN_EDUCATION_RELATIONSHIPS,
  getOrganEducationRelationships,
  hasSourceBackedOrganRelationship,
} from '../../src/lib/bodyOrganEducationAtlas.ts'

assert.equal(ORGAN_EDUCATION_BOUNDARY.patientSpecificInference, false)
assert.equal(ORGAN_EDUCATION_BOUNDARY.diagnosisOrTreatment, false)
assert.equal(ORGAN_EDUCATION_BOUNDARY.procedureTargeting, false)
assert.equal(ORGAN_EDUCATION_BOUNDARY.unsupportedRelationshipsFailClosed, true)

const ids = ORGAN_EDUCATION_RELATIONSHIPS.map((relationship) => relationship.id)
assert.equal(new Set(ids).size, ids.length, 'relationship ids must be unique')

const evidenceIds = new Set(ORGAN_EDUCATION_REFERENCES.map((reference) => reference.id))
for (const relationship of ORGAN_EDUCATION_RELATIONSHIPS) {
  assert.equal(relationship.boundary.educationalOnly, true)
  assert.equal(relationship.boundary.patientSpecificInference, false)
  assert.equal(relationship.boundary.diagnosisOrTreatment, false)
  assert.ok(relationship.evidenceIds.length > 0, `${relationship.id} must retain provenance`)
  for (const evidenceId of relationship.evidenceIds) {
    assert.ok(evidenceIds.has(evidenceId), `${relationship.id} references missing evidence ${evidenceId}`)
  }
  assert.equal(hasSourceBackedOrganRelationship(relationship.id), true)
}

assert.equal(getOrganEducationRelationships('kidney').length, 1)
assert.equal(getOrganEducationRelationships('lung').length, 1)
assert.equal(getOrganEducationRelationships('liver').length, 1)
assert.equal(getOrganEducationRelationships('unsupported-organ').length, 0)
assert.equal(hasSourceBackedOrganRelationship('missing-relationship'), false)

console.log(`body-organ-education-atlas: ${ORGAN_EDUCATION_RELATIONSHIPS.length} source-bounded relationships verified`)
