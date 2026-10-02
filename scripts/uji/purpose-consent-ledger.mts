import assert from 'node:assert/strict'
import {
  appendPurposeConsentDecision,
  createPurposeConsentLedger,
  filterStateByPurposeConsent,
  isEventPurposeAuthorized,
  purposeConsentStatus,
} from '../../src/lib/purposeConsentLedger.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

function event(id: string, recordedAt: string): LongitudinalEvent<number> {
  return {
    id,
    subjectId: 'consent-subject',
    domain: 'sleep',
    metric: 'sleep-duration',
    value: 7,
    unit: 'h',
    recordedAt,
    confidence: 0.9,
    provenance: {
      sourceKind: 'wearable',
      sourceId: 'device',
      capturedAt: recordedAt,
      receivedAt: new Date(Date.parse(recordedAt) + 60_000).toISOString(),
    },
    consent: {
      granted: true,
      purposes: ['personal-visualization', 'clinical-support', 'ai-context'],
      grantedAt: '2026-09-01T00:00:00.000Z',
    },
    review: { state: 'not-required' },
  }
}

const beforeRevoke = event('before', '2026-09-10T00:00:00.000Z')
const duringRevoke = event('during', '2026-09-12T00:00:00.000Z')
const afterRegrant = event('after', '2026-09-14T00:00:00.000Z')
let state = createLongitudinalPatientState('consent-subject', '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [beforeRevoke, duringRevoke, afterRegrant])

let ledger = createPurposeConsentLedger()
ledger = appendPurposeConsentDecision(ledger, {
  id: 'ai-grant-1', subjectId: 'consent-subject', purpose: 'ai-context', action: 'grant', decidedAt: '2026-09-01T00:00:00.000Z', source: 'user',
})
ledger = appendPurposeConsentDecision(ledger, {
  id: 'ai-revoke-1', subjectId: 'consent-subject', purpose: 'ai-context', action: 'revoke', decidedAt: '2026-09-11T00:00:00.000Z', source: 'user',
})
ledger = appendPurposeConsentDecision(ledger, {
  id: 'ai-grant-2', subjectId: 'consent-subject', purpose: 'ai-context', action: 'grant', decidedAt: '2026-09-13T00:00:00.000Z', source: 'user',
})

assert.equal(isEventPurposeAuthorized(beforeRevoke, ledger, 'ai-context', Date.parse('2026-09-12T12:00:00.000Z')), false)
assert.equal(isEventPurposeAuthorized(duringRevoke, ledger, 'ai-context', Date.parse('2026-09-14T12:00:00.000Z')), false)
assert.equal(isEventPurposeAuthorized(beforeRevoke, ledger, 'ai-context', Date.parse('2026-09-14T12:00:00.000Z')), true)
assert.equal(isEventPurposeAuthorized(afterRegrant, ledger, 'ai-context', Date.parse('2026-09-14T12:00:00.000Z')), true)

const filtered = filterStateByPurposeConsent(state, ledger, 'ai-context', '2026-09-14T12:00:00.000Z')
assert.deepEqual(filtered.metricEventIds['sleep-duration'], ['before', 'after'])
assert.equal(Object.keys(filtered.eventsById).length, 2)

assert.equal(isEventPurposeAuthorized(duringRevoke, ledger, 'clinical-support', Date.parse('2026-09-14T12:00:00.000Z')), true)
const status = purposeConsentStatus(ledger, 'consent-subject', 'ai-context', '2026-09-14T12:00:00.000Z')
assert.equal(status.decisionCount, 3)
assert.equal(status.ledgerAuthorized, true)
assert.equal(status.latestDecision?.id, 'ai-grant-2')

console.log('Purpose consent ledger verified: independent AI-context revocation/regrant, capture-interval filtering, clinical-support independence, and immutable consent history.')
