import assert from 'node:assert/strict'
import {
  calculateStudyRatingSummary,
  STUDY_CALCULATOR_BOUNDARY,
  STUDY_CALCULATOR_INTERPRETATION,
  STUDY_CALCULATOR_MAX_RATINGS,
  STUDY_CALCULATOR_SOURCE,
} from '../../src/lib/knowledgeBridgeStudyCalculator.ts'

const ready = calculateStudyRatingSummary(' hypertension ', [1, 2, 3, 4, 5])
assert.deepEqual(ready, {
  topicId: 'hypertension',
  status: 'ready',
  count: 5,
  sum: 15,
  mean: 3,
  percentOfScaleMaximum: 60,
  min: 1,
  max: 5,
  sourceIdentity: STUDY_CALCULATOR_SOURCE,
  interpretation: STUDY_CALCULATOR_INTERPRETATION,
  boundary: STUDY_CALCULATOR_BOUNDARY,
  formulas: {
    mean: 'sum(scores) / count',
    percentOfScaleMaximum: '100 * sum(scores) / (5 * count)',
  },
  error: null,
})

const rounding = calculateStudyRatingSummary('asthma', [1, 1, 2])
assert.equal(rounding.mean, 1.33)
assert.equal(rounding.percentOfScaleMaximum, 26.7)
assert.equal(rounding.boundary, 'not-mastery-competence-or-clinical-score')
assert.equal(rounding.interpretation, 'personal-descriptive-self-rating-only')

const blankTopic = calculateStudyRatingSummary('   ', [3])
assert.equal(blankTopic.status, 'invalid-input')
assert.equal(blankTopic.mean, null)
assert.equal(blankTopic.percentOfScaleMaximum, null)

const noRatings = calculateStudyRatingSummary('asthma', [])
assert.equal(noRatings.status, 'invalid-input')
assert.equal(noRatings.count, 0)

for (const invalidScore of [0, 6, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
  const invalid = calculateStudyRatingSummary('asthma', [3, invalidScore])
  assert.equal(invalid.status, 'invalid-input', `score ${String(invalidScore)} must fail closed`)
  assert.equal(invalid.sum, null)
}

const bounded = calculateStudyRatingSummary(
  'asthma',
  Array.from({ length: STUDY_CALCULATOR_MAX_RATINGS + 1 }, () => 3),
)
assert.equal(bounded.status, 'invalid-input')
assert.match(bounded.error ?? '', /At most 20/)

const edge = calculateStudyRatingSummary('asthma', [5])
assert.equal(edge.percentOfScaleMaximum, 100)
assert.equal(edge.mean, 5)
assert.equal(edge.min, 5)
assert.equal(edge.max, 5)

console.log('Knowledge Bridge study calculator uses transparent arithmetic, strict bounded input, and explicitly never presents a self-rating percentage as mastery, competence, or a clinical score.')
