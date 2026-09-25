import assert from 'node:assert/strict'
import {
  bioAgeTrajectoryPointToLongitudinalEvents,
  bioAgeTrajectoryToLongitudinalEvents,
  labEntriesToLongitudinalEvents,
  labLogToLongitudinalEvents,
  labMetricFor,
} from '../../src/lib/labLongitudinalBridge.ts'
import { ingestLongitudinalEvent, requiresClinicianReview, createLongitudinalPatientState } from '../../src/lib/panaceaLongitudinalState.ts'

const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
  grantedAt: '2026-09-01T00:00:00.000Z',
}

const context = {
  consent,
  receivedAt: '2026-09-17T01:30:00.000Z',
  confidence: {
    labManualEntry: 0.7,
    bioAgeDerived: 0.65,
  },
} as const

// ── Normal mapping: unit/domain/metric correctness ────────────────────────
const hba1c = labEntriesToLongitudinalEvents('subject-1', 'hba1c', [
  { id: 'hba1c-1', tanggal: '2026-06-01', nilai: 5.4 },
  { id: 'hba1c-2', tanggal: '2026-07-01', nilai: 5.6, rujukanBawah: 4.0, rujukanAtas: 5.7 },
], context)

assert.equal(hba1c.skipped.length, 0)
assert.equal(hba1c.events.length, 2)
assert.equal(labMetricFor('hba1c'), 'lab-hba1c')
assert.ok(hba1c.events.every((event) => event.metric === 'lab-hba1c'))
assert.ok(hba1c.events.every((event) => event.domain === 'lab'))
assert.ok(hba1c.events.every((event) => event.unit === '%'))
assert.ok(hba1c.events.every((event) => event.subjectId === 'subject-1'))
assert.ok(hba1c.events.every((event) => event.provenance.sourceKind === 'manual'))
assert.ok(hba1c.events.every((event) => event.provenance.sourceId === 'panaceamed:lab-log'))
assert.equal(hba1c.events[0].recordedAt, '2026-06-01T00:00:00.000Z')
assert.equal(hba1c.events[0].confidence, 0.7)
assert.ok(hba1c.events[1].tags?.includes('ref-low:4'))
assert.ok(hba1c.events[1].tags?.includes('ref-high:5.7'))

// ── Clinician-review-state correctness: this is the easy part to get wrong ──
// `lab` requires clinician review, so a freshly bridged value must read as
// genuinely unreviewed ('pending'), never a fabricated 'not-required' or
// 'accepted'.
assert.ok(hba1c.events.every((event) => requiresClinicianReview(event)))
assert.ok(hba1c.events.every((event) => event.review.state === 'pending'))
assert.ok(hba1c.events.every((event) => event.review.reviewerId === undefined))

// ── Unknown lab type fails closed rather than guessing a taxonomy ─────────
const unknown = labEntriesToLongitudinalEvents('subject-1', 'not-a-real-lab-type', [
  { id: 'x-1', tanggal: '2026-06-01', nilai: 1 },
], context)
assert.equal(unknown.events.length, 0)
assert.deepEqual(unknown.skipped, [{ sourceRecordId: 'x-1', reason: 'unknown-lab-type' }])

// ── Skip on invalid input, never silently dropped or guessed ──────────────
const invalid = labEntriesToLongitudinalEvents('subject-1', 'hba1c', [
  { id: 'bad id with spaces', tanggal: '2026-06-01', nilai: 5.4 },
  { id: 'hba1c-3', tanggal: 'not-a-date', nilai: 5.4 },
  { id: 'hba1c-4', tanggal: '2026-06-01', nilai: -1 },
  { id: 'hba1c-5', tanggal: '2026-06-01', nilai: Number.NaN },
], context)
assert.equal(invalid.events.length, 0)
assert.deepEqual(invalid.skipped, [
  { sourceRecordId: 'bad id with spaces', reason: 'invalid-record-id', field: 'id' },
  { sourceRecordId: 'hba1c-3', reason: 'invalid-date', field: 'tanggal' },
  { sourceRecordId: 'hba1c-4', reason: 'invalid-value', field: 'nilai' },
  { sourceRecordId: 'hba1c-5', reason: 'invalid-value', field: 'nilai' },
])

// ── Full log mapping (ambilLab()'s shape) across several lab types ────────
const log = labLogToLongitudinalEvents('subject-1', {
  hba1c: [{ id: 'hba1c-1', tanggal: '2026-06-01', nilai: 5.4 }],
  ldl: [{ id: 'ldl-1', tanggal: '2026-06-01', nilai: 92 }],
}, context)
assert.equal(log.events.length, 2)
assert.deepEqual(log.events.map((e) => e.metric).sort(), ['lab-hba1c', 'lab-ldl'])

// ── Idempotent re-ingestion: duplicate ids → 'duplicate', never double-counted ──
let state = createLongitudinalPatientState('subject-1', '2026-09-01T00:00:00.000Z')
const first = ingestLongitudinalEvent(state, hba1c.events[0])
assert.equal(first.status, 'inserted')
state = first.state
const second = ingestLongitudinalEvent(state, labEntriesToLongitudinalEvents('subject-1', 'hba1c', [
  { id: 'hba1c-1', tanggal: '2026-06-01', nilai: 5.4 },
], context).events[0])
assert.equal(second.status, 'duplicate')
assert.equal(second.state.revision, state.revision)

// ── Biological-age trajectory: 'longevity' does not require clinician review,
// and the bridge never computes PhenoAge — only projects a value the caller
// already derived. ─────────────────────────────────────────────────────────
const point = bioAgeTrajectoryPointToLongitudinalEvents('subject-1', {
  tanggal: '2026-08-01',
  usia: 40,
  phenoAge: 38.2,
  ageGap: -1.8,
  metode: 'phenoage-levine-2018',
}, context)
assert.equal(point.events.length, 2)
assert.equal(point.skipped.length, 0)
assert.deepEqual(point.events.map((e) => e.metric).sort(), ['phenoage', 'phenoage-age-gap'])
assert.ok(point.events.every((event) => event.domain === 'longevity'))
assert.ok(point.events.every((event) => !requiresClinicianReview(event)))
assert.ok(point.events.every((event) => event.review.state === 'not-required'))
assert.ok(point.events.every((event) => event.provenance.sourceKind === 'derived'))
assert.ok(point.events.every((event) => event.provenance.sourceId === 'panaceamed:bioage-trajectory'))
assert.ok(point.events.every((event) => event.provenance.method === 'phenoage-levine-2018'))
assert.equal(point.events.find((e) => e.metric === 'phenoage')?.value, 38.2)
assert.equal(point.events.find((e) => e.metric === 'phenoage-age-gap')?.value, -1.8)

const badPoint = bioAgeTrajectoryPointToLongitudinalEvents('subject-1', {
  tanggal: 'not-a-date',
  usia: 40,
  phenoAge: 38.2,
  ageGap: -1.8,
  metode: 'phenoage-levine-2018',
}, context)
assert.equal(badPoint.events.length, 0)
assert.deepEqual(badPoint.skipped, [{ sourceRecordId: 'not-a-date', reason: 'invalid-date', field: 'tanggal' }])

const trajectory = bioAgeTrajectoryToLongitudinalEvents('subject-1', [
  { tanggal: '2026-06-01', usia: 40, phenoAge: 39.0, ageGap: -1.0, metode: 'phenoage-levine-2018' },
  { tanggal: '2026-08-01', usia: 40.2, phenoAge: 38.2, ageGap: -1.8, metode: 'phenoage-levine-2018' },
], context)
assert.equal(trajectory.events.length, 4)
assert.equal(trajectory.skipped.length, 0)

console.log('Lab log + biological-age trajectory → longitudinal bridge contract verified without fabricated review status or timestamps.')
