import assert from 'node:assert/strict'
import {
  buildStudyBaseline,
  compareStudyScore,
  STUDY_BASELINE_MAX_POINTS,
  STUDY_BASELINE_SOURCE,
  STUDY_BASELINE_UNIT,
  type StudyBaselinePoint,
} from '../../src/lib/knowledgeBridgeStudyBaseline.ts'

const point = (topicId: string, score: number, day: number): StudyBaselinePoint => ({
  topicId,
  score,
  recordedAt: `2026-09-${String(day).padStart(2, '0')}T08:00:00.000Z`,
  sourceIdentity: STUDY_BASELINE_SOURCE,
})

const insufficient = buildStudyBaseline('hypertension', [
  point('hypertension', 2, 1),
  point('hypertension', 3, 2),
])
assert.equal(insufficient.status, 'insufficient')
assert.equal(insufficient.median, null)
assert.equal(compareStudyScore(insufficient, 4).position, 'insufficient-baseline')

const ready = buildStudyBaseline('hypertension', [
  point('hypertension', 1, 1),
  point('asthma', 5, 2),
  point('hypertension', 2, 3),
  point('hypertension', 3, 4),
  point('hypertension', 4, 5),
  point('hypertension', 5, 6),
  { topicId: 'hypertension', score: 9, recordedAt: '2026-09-07T08:00:00.000Z', sourceIdentity: STUDY_BASELINE_SOURCE },
])
assert.equal(ready.status, 'ready')
assert.equal(ready.count, 5)
assert.equal(ready.median, 3)
assert.equal(ready.referenceLow, 2)
assert.equal(ready.referenceHigh, 4)
assert.equal(ready.unit, STUDY_BASELINE_UNIT)
assert.equal(ready.sourceIdentity, STUDY_BASELINE_SOURCE)
assert.equal(ready.firstRecordedAt, '2026-09-01T08:00:00.000Z')
assert.equal(ready.lastRecordedAt, '2026-09-06T08:00:00.000Z')
assert.deepEqual(compareStudyScore(ready, 1), {
  score: 1,
  deltaFromMedian: -2,
  position: 'below-reference',
  unit: STUDY_BASELINE_UNIT,
  interpretation: 'descriptive-learning-only',
})
assert.equal(compareStudyScore(ready, 3).position, 'within-reference')
assert.equal(compareStudyScore(ready, 5).position, 'above-reference')
assert.throws(() => compareStudyScore(ready, 0), RangeError)

const longHistory = buildStudyBaseline(
  'hypertension',
  Array.from({ length: 20 }, (_, index) => point('hypertension', (index % 5) + 1, index + 1)),
)
assert.equal(longHistory.points.length, STUDY_BASELINE_MAX_POINTS)
assert.equal(longHistory.firstRecordedAt, '2026-09-09T08:00:00.000Z')
assert.equal(longHistory.lastRecordedAt, '2026-09-20T08:00:00.000Z')

console.log('Knowledge Bridge study baseline is input-only, descriptive, source-labelled, deterministic, and bounded to 12 observations per topic.')
