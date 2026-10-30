import test from 'node:test'
import assert from 'node:assert/strict'
import { computeOrganOverlays } from '../../src/domains/body-exposure/engine/recordOverlayEngine.ts'

test('BX-8 Positive Golden Case: valid canonical record maps correctly', () => {
  const records = [
    { targetOrgan: 'kidney', testName: 'eGFR', value: 92, unit: 'mL/min', timestamp: '2026-10-30T00:00:00Z', source: 'lab-adapter' }
  ]
  const result = computeOrganOverlays(records)
  assert.equal(result.length, 1)
  assert.equal(result[0].organId, 'kidney')
  assert.equal(result[0].value, 92)
  assert.equal(result[0].truthClass, 'measured')
})

test('BX-8 Negative Case: missing or empty canonical data returns empty array safely', () => {
  const resultEmpty = computeOrganOverlays([])
  assert.deepEqual(resultEmpty, [])

  const resultNull = computeOrganOverlays(null)
  assert.deepEqual(resultNull, [])
})

test('BX-8 Missing provenance/value falls back gracefully to not available', () => {
  const records = [
    { targetOrgan: 'heart', testName: 'troponin' } // missing value & unit
  ]
  const result = computeOrganOverlays(records)
  assert.equal(result[0].value, 'not available')
})
