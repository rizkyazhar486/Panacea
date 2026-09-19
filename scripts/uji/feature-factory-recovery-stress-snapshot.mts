import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildRecoveryRecordedSnapshot } from '../../src/lib/recoveryRecordedSnapshot'

const empty = buildRecoveryRecordedSnapshot({}, { hrv: null, rhr: null, sleepH: null })
assert.equal(empty.recordedCount, 0)
assert.equal(empty.completeness, 0)
assert.match(empty.headline, /No morning vitals recorded/)
assert.ok(empty.vitals.every((vital) => vital.recorded === null && vital.deltaFromBaseline === null))
assert.equal(empty.todayLoad, 0)
assert.equal(empty.hasWorkoutToday, false)

const partial = buildRecoveryRecordedSnapshot(
  { hrv: 60, loadRpeMin: 240 },
  { hrv: { value: 55, count: 5 }, rhr: null, sleepH: null },
)
assert.equal(partial.recordedCount, 1)
assert.equal(partial.completeness, 1 / 3)
assert.match(partial.headline, /1\/3 morning vitals/)
const hrvVital = partial.vitals.find((v) => v.id === 'hrv')
assert.equal(hrvVital?.recorded, 60)
assert.equal(hrvVital?.deltaFromBaseline, 5)
const rhrVital = partial.vitals.find((v) => v.id === 'rhr')
assert.equal(rhrVital?.recorded, null)
assert.equal(rhrVital?.deltaFromBaseline, null)
assert.equal(partial.todayLoad, 240)
assert.equal(partial.hasWorkoutToday, true)

const noBaselineYet = buildRecoveryRecordedSnapshot(
  { hrv: 60 },
  { hrv: null, rhr: null, sleepH: null },
)
const hrvNoBaseline = noBaselineYet.vitals.find((v) => v.id === 'hrv')
assert.equal(hrvNoBaseline?.recorded, 60)
assert.equal(hrvNoBaseline?.deltaFromBaseline, null)

const complete = buildRecoveryRecordedSnapshot(
  { hrv: 62, rhr: 56, sleepH: 7.4 },
  {
    hrv: { value: 60, count: 10 },
    rhr: { value: 58, count: 10 },
    sleepH: { value: 7.2, count: 10 },
  },
)
assert.equal(complete.recordedCount, 3)
assert.equal(complete.completeness, 1)
assert.match(complete.headline, /All 3 morning vitals/)
assert.deepEqual(complete.vitals.map((v) => v.deltaFromBaseline), [2, -2, 0.2])

// It must never introduce a synthesized score, only restate recorded values and deltas.
const allValues = JSON.stringify(complete)
assert.doesNotMatch(allValues, /score/i)

const readiness = readFileSync('src/pages/Readiness.tsx', 'utf8')
assert.match(readiness, /buildRecoveryRecordedSnapshot/)
assert.match(readiness, /Today at a Glance/)
assert.match(readiness, /not a readiness, recovery or stress score/i)
assert.doesNotMatch(readiness, /\bfetch\s*\(/)
assert.doesNotMatch(readiness, /axios\./)

// The glance card sits on the existing dedicated Readiness & Recovery surface;
// it must not fork into a second dashboard or page.
assert.match(readiness, /title="Readiness & Recovery"/)
assert.match(readiness, /Recorded signals and your own recent history — without a synthetic readiness score/)

// Missing observations must stay absent — the glance card cannot backfill or
// infer a vital that was never recorded.
assert.match(readiness, /missing values stay missing/i)

// Provenance stays explicit: local-only values are never silently attributed
// to a device, and provider-derived scores remain out of scope here too.
assert.match(readiness, /Loaded from shared recorded vitals/)
assert.match(readiness, /Provider-derived scores must remain attributed to their provider/)
assert.match(readiness, /does not convert HRV, resting heart rate, sleep, behaviors, or workout entries into a home-made recovery score or training prescription/)

// The 14-day baseline the glance card diffs against remains a plain arithmetic
// mean of at least three prior recorded days, not a population/reference range.
assert.match(readiness, /values\.length < 3/)
assert.match(readiness, /values\.reduce\(\(sum, value\) => sum \+ value, 0\) \/ values\.length/)
assert.match(readiness, /not population reference ranges, diagnostic thresholds, readiness classifications/i)

console.log('feature-factory recovery/stress snapshot: ok')
