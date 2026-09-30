import assert from 'node:assert/strict'
import {
  featureFactoryEvent,
  isAllowedPanaceaEventPropertyKey,
  PANACEA_EVENT_BOUNDARY,
  sanitisePanaceaEvent,
  validatePanaceaEvent,
} from '../../src/lib/product/panaceaEventEnvelope'

const event = featureFactoryEvent('ff-today-organizer-sync', 'feature_reached', 'today', '2026-09-15T12:20:00Z')
assert.deepEqual(validatePanaceaEvent(event), [])

const dirty = sanitisePanaceaEvent({
  ...event,
  sessionId: 'session-123',
  properties: {
    route: '/today',
    mode: 'push',
    patientName: 'must-not-survive',
    diagnosis: 'must-not-survive',
    symptom: 'must-not-survive',
    arbitraryFreeText: 'must-not-survive',
    durationMs: 342,
    huge: 'x'.repeat(500),
    brokenNumber: Number.POSITIVE_INFINITY,
  },
})

assert.equal(dirty.properties.patientName, undefined)
assert.equal(dirty.properties.diagnosis, undefined)
assert.equal(dirty.properties.symptom, undefined)
assert.equal(dirty.properties.arbitraryFreeText, undefined)
assert.equal(dirty.properties.route, '/today')
assert.equal(dirty.properties.mode, 'push')
assert.equal(dirty.properties.durationMs, 342)
assert.equal(dirty.properties.huge, undefined)
assert.equal(dirty.properties.brokenNumber, undefined)
assert.deepEqual(validatePanaceaEvent(dirty), [])

assert.equal(isAllowedPanaceaEventPropertyKey('route'), true)
assert.equal(isAllowedPanaceaEventPropertyKey('diagnosis'), false)
assert.equal(isAllowedPanaceaEventPropertyKey('freeText'), false)

const runtimeDirty = {
  ...event,
  patientName: 'must-not-survive-top-level',
  clinicalNote: { diagnosis: 'must-not-survive-top-level' },
  properties: {
    route: { patientName: 'nested-sensitive-value' },
    surface: ['nested-sensitive-value'],
    mode: 'push',
    durationMs: 42,
  },
} as unknown as Parameters<typeof sanitisePanaceaEvent>[0]

const runtimeClean = sanitisePanaceaEvent(runtimeDirty)
assert.equal('patientName' in runtimeClean, false)
assert.equal('clinicalNote' in runtimeClean, false)
assert.equal(runtimeClean.properties.route, undefined)
assert.equal(runtimeClean.properties.surface, undefined)
assert.equal(runtimeClean.properties.mode, 'push')
assert.equal(runtimeClean.properties.durationMs, 42)
assert.deepEqual(validatePanaceaEvent(runtimeClean), [])

const unsanitisedProblems = validatePanaceaEvent(runtimeDirty)
assert.ok(unsanitisedProblems.includes('unsupported event field: patientName'))
assert.ok(unsanitisedProblems.includes('unsupported event field: clinicalNote'))
assert.ok(unsanitisedProblems.includes('invalid property value: route'))
assert.ok(unsanitisedProblems.includes('invalid property value: surface'))

assert.deepEqual(validatePanaceaEvent(null), ['event must be an object'])
assert.ok(validatePanaceaEvent({ ...event, properties: null }).includes('properties must be an object'))
assert.ok(validatePanaceaEvent({ ...event, area: 'clinical-record' }).includes('invalid area'))
assert.ok(validatePanaceaEvent({ ...event, source: 'patient' }).includes('invalid source'))

for (const occurredAt of [
  'September 15, 2026 12:20:00 UTC',
  '2026-02-30T12:20:00Z',
  '2026-09-15T24:20:00Z',
  '2026-09-15T12:20:00+14:01',
]) {
  assert.ok(
    validatePanaceaEvent({ ...event, occurredAt }).includes('invalid occurredAt'),
    occurredAt,
  )
}
assert.deepEqual(
  validatePanaceaEvent({ ...event, occurredAt: '2026-09-15T12:20:00+14:00' }),
  [],
)

const invalid = {
  ...event,
  eventName: 'feature reached with spaces',
  occurredAt: 'not-a-date',
  properties: { symptom: 'x' },
}
const invalidProblems = validatePanaceaEvent(invalid)
assert.ok(invalidProblems.some((problem) => problem.includes('invalid event name')))
assert.ok(invalidProblems.some((problem) => problem.includes('invalid occurredAt')))
assert.ok(invalidProblems.some((problem) => problem.includes('disallowed property key')))

const identifiers = sanitisePanaceaEvent({
  ...event,
  eventName: 'patient Jane Doe diagnosis',
  featureId: 'feature with spaces',
  sessionId: 'session with spaces',
})
assert.equal(identifiers.eventName, '')
assert.equal(identifiers.featureId, null)
assert.equal(identifiers.sessionId, null)
assert.ok(PANACEA_EVENT_BOUNDARY.includes('operational telemetry'))
assert.ok(PANACEA_EVENT_BOUNDARY.includes('Only allowlisted operational keys'))

console.log('panacea-event-envelope: ok')
