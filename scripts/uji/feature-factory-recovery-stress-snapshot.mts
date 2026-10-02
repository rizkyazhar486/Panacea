import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readiness = readFileSync('src/pages/Readiness.tsx', 'utf8')

// The existing /readiness surface is the Recovery/Stress snapshot. Keep the
// snapshot tied to explicit recorded observations instead of adding a second
// dashboard or synthesizing a proprietary-style readiness score.
assert.match(readiness, /title="Readiness & Recovery"/)
assert.match(readiness, /Recorded signals and your own recent history — without a synthetic readiness score/)
assert.match(readiness, /title="Morning Check-in"/)
assert.match(readiness, /Overnight HRV \(ms\)/)
assert.match(readiness, /Resting HR \(bpm\)/)
assert.match(readiness, /Sleep \(hours\)/)

// Missing observations must stay absent. The persisted store is normalized and
// the page starts without seeded HRV/RHR/sleep values when nothing was recorded.
assert.match(readiness, /store\[tk\] \?\? \{ behaviors: \[\], workouts: \[\] \}/)
assert.match(readiness, /missing values stay missing/i)
assert.match(readiness, /No HRV, resting-HR or sleep value is recorded yet|buildRecoveryRecordedChecklist/)

// Provenance is explicit when a value matches the shared recorded-vitals
// snapshot; local-only values must not be silently attributed to a device.
assert.match(readiness, /vitals\.source/)
assert.match(readiness, /vitals\.measuredAt/)
assert.match(readiness, /vitals\.syncedAt/)
assert.match(readiness, /Loaded from shared recorded vitals/)
assert.match(readiness, /source: 'Manual'/)

// The only displayed historical reference is an arithmetic mean of at least
// three prior recorded observations. It is explicitly not a population range
// or readiness classification.
assert.match(readiness, /values\.length < 3/)
assert.match(readiness, /values\.reduce\(\(sum, value\) => sum \+ value, 0\) \/ values\.length/)
assert.match(readiness, /simple arithmetic means of at least three recorded prior-day observations/)
assert.match(readiness, /not population reference ranges, diagnostic thresholds, readiness classifications/i)

// Training load is transparent recorded-data arithmetic only.
assert.match(readiness, /workout\.rpe \* workout\.min/)
assert.match(readiness, /Explicit arithmetic only: session RPE × recorded minutes/)

// Snapshot must remain local-first and must not acquire a page-level third-party
// API path or claims that provider-derived scores were locally reproduced.
assert.doesNotMatch(readiness, /\bfetch\s*\(/)
assert.doesNotMatch(readiness, /axios\./)
assert.match(readiness, /Provider-derived scores must remain attributed to their provider/)
assert.match(readiness, /does not convert HRV, resting heart rate, sleep, behaviors, or workout entries into a home-made recovery score or training prescription/)

console.log('feature-factory recovery/stress recorded snapshot: ok')
