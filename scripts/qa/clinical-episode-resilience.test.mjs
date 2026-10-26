import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateClinicalEpisodeResilience } from '../../src/domains/clinical-operations/model/clinicalEpisodeResilience.ts'

const base = {
  patientId: 'patient-001',
  episodeId: 'encounter-001',
  kind: 'observation',
  authoredAt: '2026-10-04T09:00:00.000Z',
  sourceId: 'clinic-device-1',
  sequence: 1,
  payloadDigest: 'sha256:abc',
  delivery: 'pending',
  durableLocalCopy: true,
  encryptedAtRest: true,
  retryCount: 0,
}

const input = (events, overrides = {}) => ({
  patientId: 'patient-001',
  episodeId: 'encounter-001',
  connectivity: 'offline',
  secureLocalStorageAvailable: true,
  events,
  evaluatedAt: '2026-10-04T10:00:00.000Z',
  maxRetryCount: 4,
  ...overrides,
})

test('offline episode can continue only with durable encrypted pending events', () => {
  const result = evaluateClinicalEpisodeResilience(input([{ ...base, eventId: 'evt-1' }]))
  assert.equal(result.state, 'degraded')
  assert.equal(result.safeToContinueOffline, true)
  assert.equal(result.pendingCount, 1)
  assert.match(result.nextOperationalAction, /encrypted queue/)
})

test('offline episode fails closed when pending event is not encrypted or durable', () => {
  const result = evaluateClinicalEpisodeResilience(input([
    { ...base, eventId: 'evt-1', encryptedAtRest: false },
    { ...base, eventId: 'evt-2', sequence: 2, durableLocalCopy: false },
  ]))
  assert.equal(result.state, 'blocked')
  assert.equal(result.safeToContinueOffline, false)
  assert.deepEqual(result.unprotectedPendingIds, ['evt-1', 'evt-2'])
})

test('exact duplicate transport replay is idempotent and does not create new truth', () => {
  const event = { ...base, eventId: 'evt-1' }
  const result = evaluateClinicalEpisodeResilience(input([event, { ...event }]))
  assert.equal(result.state, 'degraded')
  assert.deepEqual(result.idempotentReplayIds, ['evt-1'])
  assert.equal(result.pendingCount, 1)
})

test('pending replay cannot hide weakened protection or exhausted retries behind idempotent deduplication', () => {
  const event = { ...base, eventId: 'evt-1' }
  for (const patch of [
    { encryptedAtRest: false },
    { durableLocalCopy: false },
    { retryCount: 4 },
    { encryptedAtRest: false, durableLocalCopy: false, retryCount: 2 },
  ]) {
    const changed = { ...event, ...patch }
    for (const events of [[event, changed], [changed, event]]) {
      const result = evaluateClinicalEpisodeResilience(input(events))
      const label = JSON.stringify({ patch, order: events[0] === event ? 'canonical-first' : 'changed-first' })
      assert.equal(result.state, 'blocked', label)
      assert.equal(result.safeToContinueOffline, false, label)
      assert.deepEqual(result.integrityConflictIds, ['evt-1'], label)
      assert.deepEqual(result.idempotentReplayIds, [], label)
    }
  }
})

test('acknowledged transport update keeps idempotent deduplication for post-acknowledgement metadata', () => {
  // Pin intentional flexibility: once a copy is no longer pending, delivery
  // state and storage metadata may legitimately change without conflict.
  const event = { ...base, eventId: 'evt-2' }
  const acked = { ...event, delivery: 'acknowledged', durableLocalCopy: false, encryptedAtRest: false, retryCount: 1 }
  for (const events of [[event, acked], [acked, event]]) {
    const result = evaluateClinicalEpisodeResilience(input(events))
    const label = events[0] === event ? 'pending-first' : 'acked-first'
    assert.deepEqual(result.integrityConflictIds, [], label)
    assert.deepEqual(result.idempotentReplayIds, ['evt-2'], label)
  }
})

test('same event id with a different digest is an integrity conflict', () => {
  const result = evaluateClinicalEpisodeResilience(input([
    { ...base, eventId: 'evt-1' },
    { ...base, eventId: 'evt-1', payloadDigest: 'sha256:tampered' },
  ]))