import assert from 'node:assert/strict'
import { BODY_PROJECTION_TARGETS, type BodyProjectionTarget } from '../../src/lib/bodyProjectionContract.ts'
import { evaluateProjectionReadiness, type ProjectionAssetProvenance } from '../../src/lib/bodyProjectionReadiness.ts'

const digestive = BODY_PROJECTION_TARGETS.find((target) => target.id === 'digestive-core')
const thermoreceptor = BODY_PROJECTION_TARGETS.find((target) => target.id === 'thermoreceptor-reference')
assert.ok(digestive)
assert.ok(thermoreceptor)

assert.deepEqual(evaluateProjectionReadiness(digestive), {
  readiness: 'verification-required',
  renderAsVerifiedAnatomy: false,
  reasons: ['No asset-level provenance record is attached.'],
})

const complete: ProjectionAssetProvenance = {
  targetId: digestive.id,
  sourceId: 'z_anatomy',
  assetId: 'example-asset-id',
  sourceRevision: 'pinned-revision',
  license: 'asset-specific-license-record',
  attribution: 'asset-specific-attribution',
  transformationHistory: ['source coordinates preserved', 'deterministic export recorded'],
  geometryStatus: 'verified-native',
  evidenceStatus: 'source-checked',
  academicReview: 'pending',
}

const pending = evaluateProjectionReadiness(digestive, complete)
assert.equal(pending.readiness, 'verification-required')
assert.equal(pending.renderAsVerifiedAnatomy, false)
assert.ok(pending.reasons.includes('Target academic review has not been recorded.'))
assert.ok(pending.reasons.includes('Asset academic review has not been recorded.'))

const missingLicense = evaluateProjectionReadiness(digestive, { ...complete, license: ' ' })
assert.equal(missingLicense.renderAsVerifiedAnatomy, false)
assert.ok(missingLicense.reasons.includes('Asset-level license is missing.'))

const missingTransform = evaluateProjectionReadiness(digestive, { ...complete, transformationHistory: [] })
assert.equal(missingTransform.renderAsVerifiedAnatomy, false)
assert.ok(missingTransform.reasons.includes('Transformation history is missing or incomplete.'))

const wrongTarget = evaluateProjectionReadiness(digestive, { ...complete, targetId: 'eye-core' })
assert.equal(wrongTarget.renderAsVerifiedAnatomy, false)
assert.ok(wrongTarget.reasons.includes('Asset provenance is attached to a different projection target.'))

const conceptual = evaluateProjectionReadiness(thermoreceptor, complete)
assert.equal(conceptual.readiness, 'reference-only')
assert.equal(conceptual.renderAsVerifiedAnatomy, false)

const reviewedTarget: BodyProjectionTarget = { ...digestive, academicReview: 'recorded' }
const withoutReviewer = evaluateProjectionReadiness(reviewedTarget, { ...complete, academicReview: 'recorded' })
assert.equal(withoutReviewer.renderAsVerifiedAnatomy, false)
assert.ok(withoutReviewer.reasons.some((reason) => reason.startsWith('Reviewer ')))

const impossibleReviewDate = evaluateProjectionReadiness(reviewedTarget, {
  ...complete,
  academicReview: 'recorded',
  reviewerName: 'Qualified reviewer fixture',
  reviewerCredentials: 'Recorded professional credentials fixture',
  reviewerDate: '2026-02-31',
  reviewerScope: 'Validator fixture only.',
})
assert.equal(impossibleReviewDate.renderAsVerifiedAnatomy, false)
assert.ok(impossibleReviewDate.reasons.includes('Reviewer date is missing or invalid.'))

const withReviewer = evaluateProjectionReadiness(reviewedTarget, {
  ...complete,
  academicReview: 'recorded',
  reviewerName: 'Qualified reviewer fixture',
  reviewerCredentials: 'Recorded professional credentials fixture',
  reviewerDate: '2026-09-08',
  reviewerScope: 'Validator fixture only: asset identity, anatomy mapping, transformations, and educational scope',
})
assert.equal(withReviewer.readiness, 'verified-reference')
assert.equal(withReviewer.renderAsVerifiedAnatomy, true)

const humanReviewed = evaluateProjectionReadiness(reviewedTarget, {
  ...complete,
  evidenceStatus: 'human-reviewed',
  academicReview: 'recorded',
  reviewerName: 'Qualified reviewer fixture',
  reviewerCredentials: 'Recorded professional credentials fixture',
  reviewerDate: '2026-09-08',
  reviewerScope: 'Validator fixture only.',
})
assert.equal(humanReviewed.renderAsVerifiedAnatomy, true)

console.log('Body projection readiness: verified anatomy requires recorded target + asset review metadata with a valid calendar date.')
