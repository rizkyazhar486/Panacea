import assert from 'node:assert/strict'
import {
  MAX_LONGEVITY_SNAPSHOT_METRICS,
  buildLongevityRecordedSnapshot,
  longevitySnapshotProvenance,
} from '../../src/lib/longevityRecordedSnapshot.ts'

assert.deepEqual(
  buildLongevityRecordedSnapshot({}),
  [],
  'no shared measurements must produce an empty snapshot',
)

const recorded = buildLongevityRecordedSnapshot({
  vo2max: 41.2,
  restingHr: 58,
  sleepH: 7.4,
  systolic: 118,
  waistHipRatio: 0.86,
  source: 'Apple Health',
  measuredAt: '2026-09-08T20:00:00.000Z',
})

assert.equal(recorded.length, MAX_LONGEVITY_SNAPSHOT_METRICS)
assert.deepEqual(
  recorded.map((metric) => metric.key),
  ['vo2max', 'restingHr', 'sleepH', 'systolic', 'waistHipRatio'],
)
assert.deepEqual(
  recorded.map((metric) => metric.unit),
  ['ml/kg/min', 'bpm', 'h', 'mmHg', ''],
)
assert.equal(buildLongevityRecordedSnapshot({ sleepH: 0 }).length, 0)
assert.equal(buildLongevityRecordedSnapshot({ restingHr: -1 }).length, 0)
assert.deepEqual(
  longevitySnapshotProvenance({ source: ' Manual ', syncedAt: '2026-09-08T21:00:00.000Z' }),
  { source: 'Manual', timestamp: '2026-09-08T21:00:00.000Z' },
)
assert.deepEqual(longevitySnapshotProvenance({}), { source: null, timestamp: null })

console.log('Longevity recorded snapshot contract is bounded, unit-preserving and provenance-aware.')
