import assert from 'node:assert/strict'
import {
  ADRENAL_EVIDENCE_RELATIONSHIPS,
  ADRENAL_EVIDENCE_SOURCES,
  auditAdrenalEvidenceRelationships,
} from '../../src/lib/bodyAdrenalEvidenceRelationships.ts'

assert.deepEqual(new Set(ADRENAL_EVIDENCE_RELATIONSHIPS.map((item) => item.domain)), new Set(['anatomy','physiology','pathophysiology','pharmacology','imaging']))

const audit = auditAdrenalEvidenceRelationships()
assert.deepEqual(audit.duplicateRelationshipIds, [])
assert.deepEqual(audit.unresolvedSourceIds, [])
assert.deepEqual(audit.invalidClaimScopes, [])
assert.deepEqual(audit.falseHumanReviewClaims, [])

for (const relationship of ADRENAL_EVIDENCE_RELATIONSHIPS) {
  assert.equal(relationship.boundary.educationalOnly, true)
  assert.equal(relationship.boundary.patientSpecificInference, false)
  assert.equal(relationship.boundary.diagnosisOrTreatment, false)
}

const drug = ADRENAL_EVIDENCE_RELATIONSHIPS.find((item) => item.id === 'adrenal-cyp11b1-cortisol-synthesis')
assert.ok(drug)
assert.equal(drug.domain, 'pharmacology')
assert.match(drug.teachingRelationship, /CYP11B1/)
assert.ok(drug.sourceIds.includes('dailymed-isturisa-v10-moa'))

const imaging = ADRENAL_EVIDENCE_RELATIONSHIPS.find((item) => item.id === 'adrenal-ct-mri-lipid-context')
assert.ok(imaging)
assert.equal(imaging.domain, 'imaging')
assert.ok(imaging.sourceIds.includes('pubmed-42579733'))

for (const source of ADRENAL_EVIDENCE_SOURCES) {
  assert.ok(source.sourceId)
  assert.ok(source.sourceLocator)
  assert.match(source.accessedOrReviewedAt, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(source.claimScope.length > 30)
  assert.notEqual(source.reviewState, 'human-reviewed')
}

console.log('body-adrenal-evidence: five-domain provenance contract verified')
