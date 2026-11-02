import assert from 'node:assert/strict'
import test from 'node:test'

import { scheduleSpacedRetrievalReview } from '../../src/domains/medstudyhub/engine/medStudySpacedRetrievalEngine.ts'

test('EDU-2 1. Golden case: at elapsedDays === stabilityDays (t = S = 10), retrievability R(10, 10) is exactly 0.90', () => {
  const res = scheduleSpacedRetrievalReview({
    conceptId: 'med-cv-02-excitation-contraction-cicr',
    stabilityDays: 10,
    difficulty: 5,
    elapsedDays: 10,
    rating: 3,
    desiredRetention: 0.9,
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.retrievabilityBeforeReview, 0.9)
  assert.strictEqual(res.nextStabilityDays > 10, true)
  assert.strictEqual(res.isLapse, false)
})

test('EDU-2 2. Paired test: rating=1 (Again/Lapse) contracts stability, increases difficulty, and triggers prerequisite remediation', () => {
  const lapse = scheduleSpacedRetrievalReview({
    conceptId: 'med-cv-04-acute-hfref-management',
    stabilityDays: 10,
    difficulty: 5,
    elapsedDays: 10,
    rating: 1,
    prerequisiteConceptIds: ['med-cv-02-excitation-contraction-cicr', 'med-cv-03-frank-starling-pv-loop'],
  })
  assert.strictEqual(lapse.ok, true)
  assert.strictEqual(lapse.isLapse, true)
  assert.strictEqual(lapse.nextStabilityDays < 10, true)
  assert.strictEqual(lapse.nextDifficulty > 5, true)
  assert.deepStrictEqual(lapse.remediationPrerequisiteIds, [
    'med-cv-02-excitation-contraction-cicr',
    'med-cv-03-frank-starling-pv-loop',
  ])
})

test('EDU-2 3. Boundary +-epsilon on difficulty [1, 10] and desiredRetention [0.70, 0.99] fail closed', () => {
  const eps = 1e-6
  const atMinDiff = scheduleSpacedRetrievalReview({
    conceptId: 'med-cv-01',
    stabilityDays: 5,
    difficulty: 1,
    elapsedDays: 2,
    rating: 4,
    desiredRetention: 0.7,
  })
  assert.strictEqual(atMinDiff.ok, true)

  const belowMinDiff = scheduleSpacedRetrievalReview({
    conceptId: 'med-cv-01',
    stabilityDays: 5,
    difficulty: 1 - eps,
    elapsedDays: 2,
    rating: 4,
  })
  assert.strictEqual(belowMinDiff.ok, false)
  assert.strictEqual(belowMinDiff.reason, 'invalid-difficulty')

  const aboveMaxRetention = scheduleSpacedRetrievalReview({
    conceptId: 'med-cv-01',
    stabilityDays: 5,
    difficulty: 5,
    elapsedDays: 2,
    rating: 3,
    desiredRetention: 0.99 + eps,
  })
  assert.strictEqual(aboveMaxRetention.ok, false)
  assert.strictEqual(aboveMaxRetention.reason, 'invalid-retention-target')
})
