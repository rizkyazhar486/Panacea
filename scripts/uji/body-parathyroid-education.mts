import assert from 'node:assert/strict'
import { PARATHYROID_EDUCATION_NODES, PARATHYROID_EVIDENCE, validateParathyroidEducationGraph } from '../../src/lib/bodyParathyroidEducation.ts'

const audit = validateParathyroidEducationGraph()
assert.deepEqual(audit.unresolvedEvidence, [])
assert.deepEqual(audit.invalidClaimScopes, [])
assert.deepEqual(audit.falseHumanReview, [])

const evidenceIds = new Set(PARATHYROID_EVIDENCE.map((evidence) => evidence.sourceId))
assert.equal(evidenceIds.size, PARATHYROID_EVIDENCE.length)
for (const evidence of PARATHYROID_EVIDENCE) {
  assert.ok(evidence.sourceLocator.length > 0)
  assert.ok(evidence.claimScope.length > 40)
  assert.notEqual(evidence.reviewState, 'human-reviewed')
}
const physiology = PARATHYROID_EDUCATION_NODES.find((node) => node.id === 'parathyroid-calcium-pth-feedback')!
assert.equal(physiology.evidenceState, 'source-checked')
assert.ok(physiology.sourceIds.includes('pubmed-29597231'))
const pathophysiology = PARATHYROID_EDUCATION_NODES.find((node) => node.id === 'parathyroid-insufficient-pth-context')!
assert.equal(pathophysiology.evidenceState, 'source-checked')
assert.ok(pathophysiology.sourceIds.includes('pubmed-36375809'))
console.log('body-parathyroid-education provenance boundaries OK')
