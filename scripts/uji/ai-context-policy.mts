import assert from 'node:assert/strict'
import { minimizeAiContext } from '../../src/lib/aiContextPolicy.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

const consent = {
  granted: true,
  purposes: ['ai-context'] as const,
  grantedAt: '2026-08-01T00:00:00.000Z',
}

function event(id: string, metric: string, domain: LongitudinalEvent['domain'], value: unknown, recordedAt: string, confidence: number): LongitudinalEvent {
  return {
    id,
    subjectId: 'context-subject',
    domain,
    metric,
    value,
    recordedAt,
    confidence,
    provenance: {
      sourceKind: domain === 'clinical-note' ? 'clinical-system' : 'wearable',
      sourceId: domain === 'clinical-note' ? 'emr' : 'device',
      capturedAt: recordedAt,
      receivedAt: new Date(Date.parse(recordedAt) + 60_000).toISOString(),
    },
    consent,
    review: domain === 'clinical-note'
      ? { state: 'accepted', reviewerId: 'clin-1', reviewedAt: new Date(Date.parse(recordedAt) + 120_000).toISOString() }
      : { state: 'not-required' },
  }
}

let state = createLongitudinalPatientState('context-subject', '2026-08-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  event('rhr', 'resting-heart-rate', 'vital', 58, '2026-09-16T00:00:00.000Z', 0.95),
  event('sleep', 'sleep-duration', 'sleep', 6.5, '2026-09-15T00:00:00.000Z', 0.9),
  event('note', 'clinical-note-summary', 'clinical-note', 'Sensitive raw narrative', '2026-09-16T12:00:00.000Z', 0.99),
  event('old', 'old-metric', 'activity', 123, '2026-08-01T00:00:00.000Z', 0.99),
])

const context = minimizeAiContext(state, {
  maxSignals: 2,
  maxAgeDays: 14,
  freshnessHalfLifeDays: 3,
}, '2026-09-17T00:00:00.000Z')

assert.equal(context.signals.length, 2)
assert.equal(context.omitted.expiredByAge, 1)
assert.equal(context.omitted.rawClinicalNotesRedacted, 1)
assert.equal(context.governance.minimumNecessaryContext, true)
assert.equal(context.governance.packingScoreIsNotClinicalImportance, true)
assert.equal(context.governance.autonomousClinicalCommitAllowed, false)
assert.ok(context.signals.every((signal) => signal.packingScore >= 0 && signal.packingScore <= 1))

const note = context.signals.find((signal) => signal.domain === 'clinical-note')
assert.ok(note)
assert.equal(note.rawValueRedacted, true)
assert.match(String(note.value), /omitted/)
assert.notEqual(note.value, 'Sensitive raw narrative')

const domainLimited = minimizeAiContext(state, {
  maxSignals: 5,
  maxAgeDays: 60,
  freshnessHalfLifeDays: 7,
  includeDomains: ['sleep'],
}, '2026-09-17T00:00:00.000Z')
assert.deepEqual(domainLimited.signals.map((signal) => signal.domain), ['sleep'])
assert.ok(domainLimited.omitted.outsideDomainPolicy >= 1)

console.log('AI context policy verified: minimum-necessary packing, exponential freshness, confidence weighting, age/domain filters, and default raw clinical-note redaction.')
