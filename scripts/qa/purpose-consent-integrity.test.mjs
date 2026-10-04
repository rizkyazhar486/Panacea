import test from 'node:test'
import assert from 'node:assert/strict'
import { createPurposeConsentLedger, appendPurposeConsentDecision, isEventPurposeAuthorized,
  purposeConsentStatus, filterStateByPurposeConsent } from '../../src/lib/purposeConsentLedger.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'

const at = '2026-10-04T12:00:00.000Z'
const event = { id: 'e', subjectId: 'p', domain: 'vital', metric: 'heart-rate', value: 70,
  unit: 'bpm', confidence: 1, semanticState: 'measured', recordedAt: '2026-10-01T00:00:00.000Z',
  provenance: { sourceKind: 'manual', sourceId: 's', capturedAt: '2026-10-01T00:00:00.000Z', receivedAt: at },
  consent: { granted: true, purposes: ['ai-context', 'clinical-support'], grantedAt: '2026-01-01T00:00:00.000Z' },
  review: { state: 'not-required' } }
const decision = (id, action, decidedAt, patch = {}) => ({ id, subjectId: 'p', purpose: 'ai-context', action, decidedAt, ...patch })
const grant = decision('grant', 'grant', '2026-09-01T00:00:00.000Z')
const revoke = decision('revoke', 'revoke', '2026-10-02T00:00:00.000Z')
const ledger = (...rows) => rows.reduce(appendPurposeConsentDecision, createPurposeConsentLedger())
const authorized = l => isEventPurposeAuthorized(event, l, 'ai-context', Date.parse(at))

test('imported consent indices cannot substitute another purpose or omit a revocation', () => {
  const wrongPurpose = { decisionsById: { grant: { ...grant, purpose: 'clinical-support' } }, decisionIdsByPurpose: { 'ai-context': ['grant'] } }
  const complete = ledger(grant, revoke)
  const invalid = [wrongPurpose,
    { ...complete, decisionIdsByPurpose: { 'ai-context': ['grant'] } },
    { ...complete, decisionIdsByPurpose: {} },
    { ...complete, decisionIdsByPurpose: { 'ai-context': ['grant', 'missing'] } },
    { ...complete, decisionIdsByPurpose: { 'ai-context': ['grant', 'grant', 'revoke'] } },
    { ...complete, decisionIdsByPurpose: { 'ai-context': 'grant' } },
    { decisionsById: { grant: { ...grant, id: 'other' } }, decisionIdsByPurpose: { 'ai-context': ['grant'] } },
    { decisionsById: { grant, revoke: null }, decisionIdsByPurpose: { 'ai-context': ['grant'] } },
    { decisionsById: { grant, revoke: { ...revoke, purpose: 'unsupported' } }, decisionIdsByPurpose: { 'ai-context': ['grant'] } },
    { decisionsById: [], decisionIdsByPurpose: {} },
    { decisionsById: {}, decisionIdsByPurpose: [] },
  ]
  const state = ingestLongitudinalEvent(createLongitudinalPatientState('p', at), event).state
  for (const l of invalid) {
    const before = structuredClone(l)
    assert.equal(authorized(l), false)
    assert.equal(purposeConsentStatus(l, 'p', 'ai-context', at).ledgerAuthorized, false)
    assert.deepEqual(filterStateByPurposeConsent(state, l, 'ai-context', at).eventsById, {})
    assert.deepEqual(l, before)
  }
})

test('revocation respects time rather than imported index order or equal-time IDs', () => {
  const complete = ledger(grant, revoke)
  assert.equal(authorized({ ...complete, decisionIdsByPurpose: { 'ai-context': ['revoke', 'grant'] } }), false)
  const future = decision('future', 'grant', '2026-10-05T00:00:00.000Z')
  const l = ledger(grant, revoke, future)
  assert.equal(authorized({ ...l, decisionIdsByPurpose: { 'ai-context': ['future', 'grant', 'revoke'] } }), false)
  for (const revokeId of ['a-revoke', 'z-revoke']) {
    const tied = ledger(grant, { ...revoke, id: revokeId }, { ...revoke, id: 'middle-grant', action: 'grant' })
    assert.equal(authorized(tied), false)
  }
})

test('unknown decision actions, purposes and invalid timestamps never authorize access', () => {
  for (const patch of [{ action: 'unsupported' }, { purpose: 'unsupported' }, { decidedAt: null }, { decidedAt: 1 }, { decidedAt: 'bad' }, { subjectId: 1 }]) {
    assert.throws(() => ledger({ ...grant, ...patch }))
  }
  for (const patch of [{ action: 'unsupported' }, { decidedAt: null }, { decidedAt: 1 }, { decidedAt: 'bad' }, { subjectId: 1 }]) {
    assert.equal(authorized({ decisionsById: { grant: { ...grant, ...patch } }, decisionIdsByPurpose: { 'ai-context': ['grant'] } }), false)
  }
  for (const recordedAt of [null, 1, 'bad', '2026-10-05T00:00:00.000Z']) {
    assert.equal(isEventPurposeAuthorized({ ...event, recordedAt }, ledger(grant), 'ai-context', Date.parse(at)), false)
  }
})

test('valid regrant preserves capture restrictions, subject isolation and independent purposes', () => {
  const regrant = decision('regrant', 'grant', '2026-10-03T00:00:00.000Z')
  const l = ledger(grant, revoke, regrant, decision('other-patient', 'revoke', '2026-10-04T00:00:00.000Z', { subjectId: 'other' }))
  assert.equal(authorized(l), true)
  assert.equal(isEventPurposeAuthorized({ ...event, recordedAt: '2026-10-02T06:00:00.000Z' }, l, 'ai-context', Date.parse(at)), false)
  assert.equal(isEventPurposeAuthorized(event, l, 'clinical-support', Date.parse(at)), true)
  assert.equal(authorized(createPurposeConsentLedger()), true)
  assert.equal(purposeConsentStatus(createPurposeConsentLedger(), 'p', 'ai-context', at).ledgerAuthorized, null)
})
