import assert from 'node:assert/strict'
import {
  EYE_LEARNING_VIEW_BOUNDARY,
  EYE_LEARNING_VIEW_EXTERNAL_REFERENCES,
  evaluateEyeLearningView,
  type EyeLearningViewState,
} from '../../src/lib/anatomy/eyeLearningViewContract.ts'

const staticView: EyeLearningViewState = {
  id: 'eye-reference-view',
  label: 'Eye reference view',
  scale: 'organ',
  canonicalNodeIds: ['organ:eye'],
  evidenceRefs: ['repo:test-fixture:eye-reference-view'],
  motion: 'static',
  reviewStatus: 'academic-review-pending',
  patientSpecific: false,
  functionalInferenceAllowed: false,
  lesionLocalizationAllowed: false,
  publicationReady: false,
}

const staticDecision = evaluateEyeLearningView(staticView)
assert.equal(staticDecision.status, 'eligible')
assert.equal(staticDecision.mayAnimate, true)
assert.equal(staticDecision.mayPublish, false)
assert.equal(staticDecision.mayLocalizeLesion, false)

const unsupportedMotion = evaluateEyeLearningView({ ...staticView, id: 'unsupported-motion', motion: 'representational' })
assert.equal(unsupportedMotion.status, 'blocked')
assert.ok(unsupportedMotion.blockers.includes('missing-conformational-evidence'))
assert.equal(unsupportedMotion.mayAnimate, false)

const evidenceBoundMotion = evaluateEyeLearningView({
  ...staticView,
  id: 'evidence-bound-motion',
  scale: 'molecular',
  motion: 'representational',
  conformationalEvidenceRefs: ['PDB:test-fixture:not-production-evidence'],
})
assert.equal(evidenceBoundMotion.status, 'eligible')
assert.equal(evidenceBoundMotion.mayAnimate, true)
assert.equal(evidenceBoundMotion.mayPublish, false)

const missingCanonicalNode = evaluateEyeLearningView({ ...staticView, id: 'missing-node', canonicalNodeIds: [] })
assert.equal(missingCanonicalNode.status, 'blocked')
assert.ok(missingCanonicalNode.blockers.includes('missing-canonical-node'))

for (const reference of EYE_LEARNING_VIEW_EXTERNAL_REFERENCES) {
  assert.equal(reference.use, 'design-reference-only')
  assert.equal(reference.codeReuseAllowed, false)
  assert.equal(reference.assetReuseAllowed, false)
}

assert.match(EYE_LEARNING_VIEW_BOUNDARY, /Do not copy external code\/assets/)
assert.match(EYE_LEARNING_VIEW_BOUNDARY, /infer function from spatial contact/)
assert.match(EYE_LEARNING_VIEW_BOUNDARY, /localize patient lesions/)
assert.match(EYE_LEARNING_VIEW_BOUNDARY, /qualified academic review/)

console.log('eye-learning-view-contract: clean-room learning/pose architecture remains fail-closed')
