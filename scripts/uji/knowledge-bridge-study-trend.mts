import assert from 'node:assert/strict'
import { buildStudyBaseline, STUDY_BASELINE_SOURCE, type StudyBaselinePoint } from '../../src/lib/knowledgeBridgeStudyBaseline.ts'
import {
  buildStudyTrend,
  STUDY_TREND_INTERPRETATION,
  STUDY_TREND_METHOD,
  type StudyTrend,
} from '../../src/lib/knowledgeBridgeStudyTrend.ts'

const point = (topicId: string, score: number, day: number): StudyBaselinePoint => ({
  topicId,
  score,
  recordedAt: `2026-09-${String(day).padStart(2, '0')}T08:00:00.000Z`,
  sourceIdentity: STUDY_BASELINE_SOURCE,
})

function trendFor(topicId: string, points: StudyBaselinePoint[]): StudyTrend {
  return buildStudyTrend(buildStudyBaseline(topicId, points))
}

const insufficient = trendFor('hypertension', [point('hypertension', 2, 1), point('hypertension', 3, 2)])
assert.equal(insufficient.status, 'insufficient')
assert.equal(insufficient.direction, 'insufficient')
assert.equal(insufficient.slopePerObservation, null)
assert.equal(insufficient.recentChange, null)
assert.equal(insufficient.firstScore, null)
assert.equal(insufficient.lastScore, null)

const improving = trendFor('hypertension', [
  point('hypertension', 1, 1),
  point('hypertension', 2, 2),
  point('hypertension', 3, 3),
  point('hypertension', 4, 4),
  point('hypertension', 5, 5),
])
assert.equal(improving.status, 'ready')
assert.equal(improving.direction, 'improving')
assert.equal(improving.slopePerObservation, 1)
assert.equal(improving.recentChange, 4)
assert.equal(improving.firstScore, 1)
assert.equal(improving.lastScore, 5)
assert.equal(improving.method, STUDY_TREND_METHOD)
assert.equal(improving.interpretation, STUDY_TREND_INTERPRETATION)

const declining = trendFor('hypertension', [
  point('hypertension', 5, 1),
  point('hypertension', 4, 2),
  point('hypertension', 3, 3),
  point('hypertension', 2, 4),
  point('hypertension', 1, 5),
])
assert.equal(declining.direction, 'declining')
assert.equal(declining.slopePerObservation, -1)
assert.equal(declining.recentChange, -4)

const stable = trendFor('hypertension', [
  point('hypertension', 3, 1),
  point('hypertension', 3, 2),
  point('hypertension', 4, 3),
  point('hypertension', 3, 4),
  point('hypertension', 3, 5),
])
assert.equal(stable.direction, 'stable', 'a near-zero slope must read as stable, not a directional claim')
assert.equal(stable.recentChange, 0)

const otherTopicIgnored = trendFor('hypertension', [
  point('hypertension', 1, 1),
  point('asthma', 5, 2),
  point('hypertension', 2, 3),
  point('hypertension', 3, 4),
  point('hypertension', 4, 5),
])
assert.equal(otherTopicIgnored.count, 4, 'points from a different topic must not enter the trend window')

console.log('Knowledge Bridge study trend derives direction only from the shared validated baseline window, fails closed below the minimum count, and never claims a directional change from noise-level slope.')
