import assert from 'node:assert/strict'
import test from 'node:test'

import { computeCanonicalRecordOverlays } from '../../src/domains/body-exposure/index.ts'

test('BX-8 1. Golden case: valid canonical records map successfully with measured truthClass', () => {
  const records = [
    {
      targetOrgan: 'kidney',
      testName: 'creatinine',
      value: 1.2,
      unit: 'mg/dL',
      timestamp: '2026-10-30T10:00:00Z',
      source: 'lab-system',
      truthClass: 'measured',
    },
  ]
  const results = computeCanonicalRecordOverlays(records, { referenceTimeIso: '2026-10-30T12:00:00Z' })
  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].ok, true)
  if (results[0].ok) {
    assert.strictEqual(results[0].organId, 'kidney')
    assert.strictEqual(results[0].metricName, 'creatinine')
    assert.strictEqual(results[0].value, 1.2)
    assert.strictEqual(results[0].unit, 'mg/dL')
    assert.strictEqual(results[0].truthClass, 'measured')
  }
})

test('BX-8 2. Unit mismatch: incorrect unit is rejected fail-closed, never forced', () => {
  const records = [
    {
      targetOrgan: 'kidney',
      testName: 'creatinine',
      value: 100,
      unit: 'umol/L', // mismatch dengan mg/dL
      timestamp: '2026-10-30T10:00:00Z',
    },
  ]
  const results = computeCanonicalRecordOverlays(records, { referenceTimeIso: '2026-10-30T12:00:00Z' })
  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].ok, false)
  if (!results[0].ok) {
    assert.strictEqual(results[0].reason, 'unit-mismatch')
  }
})

test('BX-8 3. Missing or empty value: treated as missing / not available, never substituted with 0', () => {
  const records = [
    {
      targetOrgan: 'heart',
      testName: 'troponin',
      value: null,
      unit: 'ng/mL',
      timestamp: '2026-10-30T10:00:00Z',
    },
    {
      targetOrgan: 'heart',
      testName: 'troponin',
      value: undefined,
      unit: 'ng/mL',
      timestamp: '2026-10-30T10:00:00Z',
    },
  ]
  const results = computeCanonicalRecordOverlays(records, { referenceTimeIso: '2026-10-30T12:00:00Z' })
  assert.strictEqual(results.length, 2)
  assert.strictEqual(results[0].ok, false)
  assert.strictEqual(results[1].ok, false)
  if (!results[0].ok) {
    assert.strictEqual(results[0].reason, 'missing-value')
  }
})

test('BX-8 4. Stale data: records older than maxStaleAgeMs are rejected as stale', () => {
  const records = [
    {
      targetOrgan: 'heart',
      testName: 'heart_rate',
      value: 75,
      unit: 'bpm',
      timestamp: '2025-01-01T00:00:00Z', // sangat lama / stale
    },
  ]
  const results = computeCanonicalRecordOverlays(records, { referenceTimeIso: '2026-10-30T12:00:00Z' })
  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].ok, false)
  if (!results[0].ok) {
    assert.strictEqual(results[0].reason, 'stale-data')
  }
})

test('BX-8 5. Empty or null input array returns empty array safely', () => {
  assert.deepStrictEqual(computeCanonicalRecordOverlays([]), [])
  assert.deepStrictEqual(computeCanonicalRecordOverlays(null), [])
  assert.deepStrictEqual(computeCanonicalRecordOverlays(undefined), [])
})
