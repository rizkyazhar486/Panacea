import assert from 'node:assert/strict'
import { featureFactoryEvent, sanitisePanaceaEvent, validatePanaceaEvent } from '../../src/lib/product/panaceaEventEnvelope'

const event = featureFactoryEvent('ff-today-organizer-sync', 'feature_reached', 'today', '2026-09-13T15:55:00Z')
assert.deepEqual(validatePanaceaEvent(event), [])

const dirty = sanitisePanaceaEvent({
  ...event,
  properties: {
    route: '/today',
    mode: 'push',
    patientName: 'should-not-survive',
    diagnosis: 'should-not-survive',
    huge: 'x'.repeat(500),
    brokenNumber: Number.POSITIVE_INFINITY,
  },
})
assert.equal(dirty.properties.patientName, undefined)
assert.equal(dirty.properties.diagnosis, undefined)
assert.equal(dirty.properties.route, '/today')
assert.equal(String(dirty.properties.huge).length, 160)
assert.equal(dirty.properties.brokenNumber, null)
assert.deepEqual(validatePanaceaEvent(dirty), [])

const invalid = { ...event, occurredAt: 'not-a-date', properties: { symptom: 'x' } }
assert.ok(validatePanaceaEvent(invalid).some((problem) => problem.includes('invalid occurredAt')))
assert.ok(validatePanaceaEvent(invalid).some((problem) => problem.includes('disallowed property key')))

console.log('panacea-event-envelope: ok')
