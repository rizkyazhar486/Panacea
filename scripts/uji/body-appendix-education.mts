import assert from 'node:assert/strict'
import { APPENDIX_EDUCATION_BOUNDARY, APPENDIX_EDUCATION_RELATIONSHIPS, APPENDIX_EVIDENCE_SOURCES, validateAppendixEducationEvidence } from '../../src/lib/bodyAppendixEducation.ts'

assert.equal(APPENDIX_EDUCATION_BOUNDARY.educationalOnly, true)
assert.equal(APPENDIX_EDUCATION_BOUNDARY.patientSpecificInference, false)
assert.equal(APPENDIX_EDUCATION_BOUNDARY.diagnosisOrTreatment, false)
assert.equal(APPENDIX_EDUCATION_BOUNDARY.procedureTargeting, false)

const audit = validateAppendixEducationEvidence()
assert.deepEqual(audit.duplicateSourceIds, [])
assert.deepEqual(audit.duplicateRelationshipIds, [])
assert.deepEqual(audit.unresolvedSourceIds, [])
assert.deepEqual(audit.emptyClaimScopes, [])
assert.deepEqual(audit.invalidEvidenceRoles, [])
assert.deepEqual(audit.falseHumanReviewClaims, [])

assert.ok(APPENDIX_EVIDENCE_SOURCES.some((source) => source.pmid === '33753873'))
assert.ok(APPENDIX_EDUCATION_RELATIONSHIPS.some((edge) => edge.id === 'appendix-galt-lymphoid-architecture'))
for (const edge of APPENDIX_EDUCATION_RELATIONSHIPS) {
  assert.equal(edge.reviewState, 'source-checked')
  assert.equal(edge.boundary.patientSpecificInference, false)
  assert.equal(edge.boundary.diagnosisOrTreatment, false)
  assert.ok(edge.claimScope.trim().length > 20)
}
console.log('body-appendix-education source-bounded relationships verified')
