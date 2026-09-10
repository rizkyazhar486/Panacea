import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildRecoveryRecordedChecklist } from '../../src/lib/recoveryRecordedChecklist'

const expectedChecklistIds = ['completeness', 'source', 'timestamp', 'units', 'scientific-boundary']

const empty = buildRecoveryRecordedChecklist({}, {})
assert.deepEqual(empty.map((item) => item.id), expectedChecklistIds)
assert.equal(new Set(empty.map((item) => item.id)).size, expectedChecklistIds.length)
assert.deepEqual(
  empty.map((item) => item.status),
  ['waiting', 'waiting', 'waiting', 'waiting', 'pass'],
)
assert.match(empty.find((item) => item.id === 'completeness')?.detail ?? '', /rather than inventing a default/i)

const traced = buildRecoveryRecordedChecklist(
  { hrv: 62, rhr: 56, sleepH: 7.4 },
  {
    hrvMs: 62,
    restingHr: 56,
    sleepH: 7.4,
    source: 'Manual',
    measuredAt: '2026-09-10T05:00:00.000Z',
  },
)
assert.deepEqual(traced.map((item) => item.id), expectedChecklistIds)
assert.ok(traced.every((item) => item.status === 'pass'))
assert.match(traced.find((item) => item.id === 'source')?.detail ?? '', /Manual/)
assert.match(traced.find((item) => item.id === 'units')?.detail ?? '', /HRV in ms[\s\S]*bpm[\s\S]*hours/)

const localOnly = buildRecoveryRecordedChecklist(
  { hrv: 63, rhr: 56, sleepH: 7.4 },
  {
    hrvMs: 62,
    restingHr: 56,
    sleepH: 7.4,
    source: 'Manual',
    measuredAt: '2026-09-10T05:00:00.000Z',
  },
)
assert.equal(localOnly.find((item) => item.id === 'source')?.status, 'attention')
assert.equal(localOnly.find((item) => item.id === 'timestamp')?.status, 'attention')
assert.match(localOnly.find((item) => item.id === 'source')?.detail ?? '', /Do not assign a device source/i)
assert.match(localOnly.find((item) => item.id === 'timestamp')?.detail ?? '', /rather than guessing/i)

const partial = buildRecoveryRecordedChecklist(
  { hrv: 62, rhr: 56 },
  {
    hrvMs: 62,
    restingHr: 56,
    source: 'Manual',
    measuredAt: '2026-09-10T05:00:00.000Z',
  },
)
assert.equal(partial.find((item) => item.id === 'completeness')?.status, 'attention')
assert.match(partial.find((item) => item.id === 'completeness')?.detail ?? '', /2\/3 morning inputs/)
assert.equal(partial.find((item) => item.id === 'source')?.status, 'pass')

const scientificBoundary = traced.find((item) => item.id === 'scientific-boundary')
assert.equal(scientificBoundary?.status, 'pass')
assert.match(scientificBoundary?.detail ?? '', /does not calculate[\s\S]*readiness[\s\S]*provider-derived metrics/i)

const readiness = readFileSync('src/pages/Readiness.tsx', 'utf8')
assert.match(readiness, /buildRecoveryRecordedChecklist/)
assert.match(readiness, /Recorded-data safety check/)
assert.match(readiness, /not clinical clearance/i)
assert.match(readiness, /Completeness, provenance, units and scientific boundary/)
assert.doesNotMatch(readiness, /\bfetch\s*\(/)
assert.doesNotMatch(readiness, /axios\./)

console.log('feature-factory recovery/stress checklist: ok')
