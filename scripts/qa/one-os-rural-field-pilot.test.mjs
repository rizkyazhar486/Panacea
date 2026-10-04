import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const protocol = readFileSync(new URL('../../docs/pilots/ONE_OS_RURAL_FIELD_PILOT.md', import.meta.url), 'utf8')
const metrics = JSON.parse(readFileSync(new URL('../../governance/ONE_OS_PILOT_METRICS.json', import.meta.url), 'utf8'))

test('field pilot measures all permanent One OS proof dimensions plus resilience', () => {
  for (const phrase of [
    'Time reduction (%)',
    'Trusted completeness',
    'Trust coverage',
    'Understanding =',
    'Resilience success rate',
    'Result-return rate',
    'First-pass clean-claim rate',
  ]) {
    assert.match(protocol, new RegExp(phrase.replace(/[()]/g, '\\$&')))
  }
})

test('public pilot schema contains no direct patient identity fields', () => {
  const serialized = JSON.stringify(metrics).toLowerCase()
  for (const forbidden of ['patient-name', 'mrn', 'email', 'phone', 'address', 'credential', 'raw-clinical-payload']) {
    assert.equal(serialized.includes('"' + forbidden + '"'), false)
  }
  assert.match(metrics.privacy_rule, /no direct patient identifiers/i)
})

test('ratio metrics declare both numerator and denominator', () => {
  for (const metric of metrics.metrics.filter((row) => row.unit === 'ratio')) {
    assert.ok(metric.numerator, metric.id + ' missing numerator')
    assert.ok(metric.denominator, metric.id + ' missing denominator')
  }
})

test('protocol cannot promote evidence merely because the document exists', () => {
  assert.match(protocol, /completing this document alone changes no evidence level/i)
  assert.match(protocol, /Do not claim patient-outcome improvement from workflow timing alone/)
  assert.match(protocol, /Do not deliberately interrupt connectivity during emergency or time-critical patient care/)
})
