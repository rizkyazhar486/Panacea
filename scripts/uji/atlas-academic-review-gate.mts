import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { validateAtlasManifest, type AtlasManifest } from '../../src/lib/anatomy/atlasKernel.ts'
import {
  validateAtlasAcademicReviewEvidence,
  type AtlasProvenanceWithAcademicReview,
} from '../../src/lib/anatomy/atlasAcademicReviewGate.ts'

const base: AtlasProvenanceWithAcademicReview = {
  sourceId: 'test-source',
  sourceRevision: '2026-09-09-r1',
  license: 'test-only',
  sourceLocator: 'scripts/uji/atlas-academic-review-gate.mts',
  reviewStatus: 'academic-reviewed',
}

const missingRecord = validateAtlasAcademicReviewEvidence(base)
assert.equal(missingRecord.reviewClaimValid, false)
assert.equal(missingRecord.academicPublicationAllowed, false)
assert.ok(missingRecord.reasons.some((reason) => reason.includes('qualified academic review record')))

const malformedRecord = validateAtlasAcademicReviewEvidence({
  ...base,
  qualifiedAcademicReview: {
    reviewerName: ' ',
    reviewerCredentials: '',
    reviewDate: '2026-02-30',
    reviewScope: '',
    disposition: 'approved',
  },
})
assert.equal(malformedRecord.reviewClaimValid, false)
assert.equal(malformedRecord.academicPublicationAllowed, false)
assert.ok(malformedRecord.reasons.length >= 4)

const changesRequired = validateAtlasAcademicReviewEvidence({
  ...base,
  qualifiedAcademicReview: {
    reviewerName: 'Qualified Reviewer',
    reviewerCredentials: 'Relevant specialist credentials',
    reviewDate: '2026-09-09',
    reviewScope: 'Defined atlas educational anatomy scope',
    disposition: 'changes-required',
  },
})
assert.equal(changesRequired.reviewClaimValid, true)
assert.equal(changesRequired.academicPublicationAllowed, false)

const approvedProvenance: AtlasProvenanceWithAcademicReview = {
  ...base,
  qualifiedAcademicReview: {
    reviewerName: 'Qualified Reviewer',
    reviewerCredentials: 'Relevant specialist credentials',
    reviewDate: '2026-09-09',
    reviewScope: 'Defined atlas educational anatomy scope',
    disposition: 'approved',
    limitations: 'Test fixture only; no real reviewer is asserted by this regression test.',
  },
}
const approved = validateAtlasAcademicReviewEvidence(approvedProvenance)
assert.equal(approved.reviewClaimValid, true)
assert.equal(approved.academicPublicationAllowed, true)

const manifestNode = (provenance: AtlasProvenanceWithAcademicReview): AtlasManifest => ({
  id: 'academic-review-wire-fixture',
  revision: 'test-r1',
  nodes: [{
    id: 'fixture-node',
    label: 'Fixture node',
    system: 'skeletal',
    regions: ['whole-body'],
    laterality: 'not-applicable',
    scale: 'organism',
    source: { nodeHints: ['fixture'], mode: 'specific-fallback' },
    provenance,
    geometryStatus: 'reference-only',
    educationalPriority: 0.5,
  }],
})

const manifestMissingRecord = validateAtlasManifest(manifestNode(base))
assert.ok(
  manifestMissingRecord.some((issue) => issue.code === 'invalid-academic-review' && issue.message.includes('qualified academic review record')),
  'canonical validateAtlasManifest must reject academic-reviewed without qualified review evidence',
)

const manifestApproved = validateAtlasManifest(manifestNode(approvedProvenance))
assert.equal(
  manifestApproved.some((issue) => issue.code === 'invalid-academic-review'),
  false,
  'canonical validateAtlasManifest must accept structurally valid approved qualified review evidence',
)

for (const node of COMPLETE_WHOLE_BODY_ATLAS.nodes) {
  const result = validateAtlasAcademicReviewEvidence(node.provenance)
  if (node.provenance.reviewStatus === 'academic-reviewed') {
    assert.equal(result.reviewClaimValid, true, `${node.id} must carry qualified review evidence`)
  } else {
    assert.equal(result.academicPublicationAllowed, false, `${node.id} must not be academically publishable from non-academic review status`)
  }
}

const canonicalAtlasIssues = validateAtlasManifest(COMPLETE_WHOLE_BODY_ATLAS)
assert.equal(
  canonicalAtlasIssues.some((issue) => issue.code === 'invalid-academic-review'),
  false,
  'current complete atlas must remain free of invalid academic-review claims',
)

console.log(`atlas-academic-review-gate: ok (${COMPLETE_WHOLE_BODY_ATLAS.nodes.length} atlas nodes checked; canonical manifest review gate wired)`)
