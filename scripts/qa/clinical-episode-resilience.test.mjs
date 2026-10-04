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

test('same event id with a different digest is an integrity conflict', () => {
  const result = evaluateClinicalEpisodeResilience(input([
    { ...base, eventId: 'evt-1' },
    { ...base, eventId: 'evt-1', payloadDigest: 'sha256:tampered' },
  ]))
  assert.equal(result.state, 'blocked')
  assert.deepEqual(result.integrityConflictIds, ['evt-1'])
})

test('sequence collision between different events fails closed', () => {
  const result = evaluateClinicalEpisodeResilience(input([
    { ...base, eventId: 'evt-1' },
    { ...base, eventId: 'evt-2', payloadDigest: 'sha256:def' },
  ]))
  assert.equal(result.state, 'blocked')
  assert.deepEqual(result.sequenceConflictIds.sort(), ['evt-1', 'evt-2'])
})

test('foreign patient or episode data cannot be reconciled into this episode', () => {
  const result = evaluateClinicalEpisodeResilience(input([
    { ...base, eventId: 'evt-foreign', patientId: 'patient-002' },
  ]))
  assert.equal(result.state, 'blocked')
  assert.deepEqual(result.foreignContextIds, ['evt-foreign'])
})

test('future timestamp and exhausted retry both block reconciliation', () => {
  const result = evaluateClinicalEpisodeResilience(input([
    { ...base, eventId: 'evt-future', authoredAt: '2026-10-05T00:00:00.000Z' },
    { ...base, eventId: 'evt-retry', sequence: 2, retryCount: 4 },
  ]))
  assert.equal(result.state, 'blocked')
  assert.deepEqual(result.invalidTimestampIds, ['evt-future'])
  assert.deepEqual(result.retryExhaustedIds, ['evt-retry'])
})

test('online pending events stay degraded until acknowledged', () => {
  const result = evaluateClinicalEpisodeResilience(input(
    [{ ...base, eventId: 'evt-1' }],
    { connectivity: 'online' },
  ))
  assert.equal(result.state, 'degraded')
  assert.equal(result.pendingCount, 1)
  assert.match(result.nextOperationalAction, /Drain pending/)
})

test('fully acknowledged online episode reaches ready transport state', () => {
  const result = evaluateClinicalEpisodeResilience(input(
    [{
      ...base,
      eventId: 'evt-1',
      delivery: 'acknowledged',
      durableLocalCopy: false,
      encryptedAtRest: false,
    }],
    { connectivity: 'online' },
  ))
  assert.equal(result.state, 'ready')
  assert.equal(result.pendingCount, 0)
  assert.equal(result.acknowledgedCount, 1)
})

test('transport resilience never claims clinical readiness', () => {
  const source = String(evaluateClinicalEpisodeResilience)
  assert.doesNotMatch(source, /diagnos|treat|prescrib/i)
})
