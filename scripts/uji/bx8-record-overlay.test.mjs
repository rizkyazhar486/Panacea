import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ATLAS_STRUCTURE_DISCLAIMER,
  aggregateLongitudinalOrganOverlay,
  computeCanonicalRecordOverlays,
  resolveAnatomicalOverlayBinding,
} from '../../src/domains/body-exposure/index.ts'

test('BX-8 1. Golden case: valid canonical record resolves multiscale anatomical identity (L1..L7) and reference status', () => {
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
  assert.strictEqual(results[0].organId, 'kidney')
  assert.strictEqual(results[0].metricName, 'creatinine')
  assert.strictEqual(results[0].value, 1.2)
  assert.strictEqual(results[0].unit, 'mg/dL')
  assert.strictEqual(results[0].displayValue, '1.2 mg/dL')
  assert.strictEqual(results[0].truthClass, 'measured')
  assert.strictEqual(results[0].referenceStatus, 'within-range')
  assert.strictEqual(results[0].anatomicalBinding?.fmaId, 'FMA:7203')
  assert.strictEqual(results[0].anatomicalBinding?.l1System, 'renal-urinary-system')
  assert.strictEqual(results[0].anatomicalBinding?.l5Cell, 'podocyte-and-proximal-tubular-epithelial-cell')
  assert.strictEqual(results[0].anatomicalBinding?.atlasDisclaimer, ATLAS_STRUCTURE_DISCLAIMER)
})

test('BX-8 2. Paired test: unit mismatch fails closed by default, and converts deterministically when allowExplicitConversion is enabled', () => {
  const recordUmol = [
    {
      targetOrgan: 'kidney',
      testName: 'creatinine',
      value: 88.42,
      unit: 'umol/L',
      timestamp: '2026-10-30T10:00:00Z',
    },
  ]

  const rejectedDefault = computeCanonicalRecordOverlays(recordUmol, {
    referenceTimeIso: '2026-10-30T12:00:00Z',
  })
  assert.strictEqual(rejectedDefault.length, 1)
  assert.strictEqual(rejectedDefault[0].ok, false)
  assert.strictEqual(rejectedDefault[0].reason, 'unit-mismatch')
  assert.strictEqual(rejectedDefault[0].displayValue, 'not available')

  const convertedExplicit = computeCanonicalRecordOverlays(recordUmol, {
    referenceTimeIso: '2026-10-30T12:00:00Z',
    allowExplicitConversion: true,
  })
  assert.strictEqual(convertedExplicit.length, 1)
  assert.strictEqual(convertedExplicit[0].ok, true)
  assert.strictEqual(convertedExplicit[0].value, 1)
  assert.strictEqual(convertedExplicit[0].unit, 'mg/dL')
  assert.strictEqual(convertedExplicit[0].conversion.converted, true)
  assert.strictEqual(convertedExplicit[0].conversion.rawValue, 88.42)
  assert.strictEqual(convertedExplicit[0].conversion.rawUnit, 'umol/L')
})

test('BX-8 3. Dimensional incompatibility: pressure unit (mmHg) on mass-concentration metric (creatinine) fails closed even with conversion enabled', () => {
  const incompatible = computeCanonicalRecordOverlays(
    [
      {
        targetOrgan: 'kidney',
        testName: 'creatinine',
        value: 1.1,
        unit: 'mmHg',
        timestamp: '2026-10-30T10:00:00Z',
      },
    ],
    {
      referenceTimeIso: '2026-10-30T12:00:00Z',
      allowExplicitConversion: true,
    },
  )
  assert.strictEqual(incompatible.length, 1)
  assert.strictEqual(incompatible[0].ok, false)
  assert.strictEqual(incompatible[0].reason, 'dimensional-incompatibility')
  assert.strictEqual(incompatible[0].displayValue, 'not available')
})

test('BX-8 4. Missing, null, undefined, or whitespace values: marked as missing-value with displayValue "not available", never 0', () => {
  const records = [
    { targetOrgan: 'heart', testName: 'troponin', value: null, unit: 'ng/mL', timestamp: '2026-10-30T10:00:00Z' },
    { targetOrgan: 'heart', testName: 'troponin', value: undefined, unit: 'ng/mL', timestamp: '2026-10-30T10:00:00Z' },
    { targetOrgan: 'heart', testName: 'troponin', value: '   ', unit: 'ng/mL', timestamp: '2026-10-30T10:00:00Z' },
  ]
  const results = computeCanonicalRecordOverlays(records, { referenceTimeIso: '2026-10-30T12:00:00Z' })
  assert.strictEqual(results.length, 3)
  for (const item of results) {
    assert.strictEqual(item.ok, false)
    assert.strictEqual(item.reason, 'missing-value')
    assert.strictEqual(item.displayValue, 'not available')
  }
})

test('BX-8 5. Boundary +-epsilon: staleness threshold accepts exact maxStaleAgeMs and rejects maxStaleAgeMs + 1 ms', () => {
  const maxAgeMs = 3600_000 // 1 hour
  const refTime = '2026-10-30T12:00:00.000Z'

  const exactBoundary = computeCanonicalRecordOverlays(
    [
      {
        targetOrgan: 'heart',
        testName: 'heart_rate',
        value: 72,
        unit: 'bpm',
        timestamp: '2026-10-30T11:00:00.000Z',
      },
    ],
    { referenceTimeIso: refTime, maxStaleAgeMs: maxAgeMs },
  )
  assert.strictEqual(exactBoundary[0].ok, true)

  const pastBoundaryBy1Ms = computeCanonicalRecordOverlays(
    [
      {
        targetOrgan: 'heart',
        testName: 'heart_rate',
        value: 72,
        unit: 'bpm',
        timestamp: '2026-10-30T10:59:59.999Z',
      },
    ],
    { referenceTimeIso: refTime, maxStaleAgeMs: maxAgeMs },
  )
  assert.strictEqual(pastBoundaryBy1Ms[0].ok, false)
  assert.strictEqual(pastBoundaryBy1Ms[0].reason, 'stale-data')
})

test('BX-8 6. Boundary +-epsilon on physiological range: troponin accepts 0 and 500 ng/mL, rejects -1e-6 and 500 + 1e-6', () => {
  const eps = 1e-6
  const refTime = '2026-10-30T12:00:00Z'

  const atZero = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'heart', testName: 'troponin', value: 0, unit: 'ng/mL', timestamp: '2026-10-30T11:00:00Z' }],
    { referenceTimeIso: refTime },
  )
  assert.strictEqual(atZero[0].ok, true)
  assert.strictEqual(atZero[0].value, 0)

  const belowZero = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'heart', testName: 'troponin', value: -eps, unit: 'ng/mL', timestamp: '2026-10-30T11:00:00Z' }],
    { referenceTimeIso: refTime },
  )
  assert.strictEqual(belowZero[0].ok, false)
  assert.strictEqual(belowZero[0].reason, 'invalid-numeric-value')

  const aboveMax = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'heart', testName: 'troponin', value: 500 + eps, unit: 'ng/mL', timestamp: '2026-10-30T11:00:00Z' }],
    { referenceTimeIso: refTime },
  )
  assert.strictEqual(aboveMax[0].ok, false)
  assert.strictEqual(aboveMax[0].reason, 'invalid-numeric-value')
})

test('BX-8 7. Invalid inputs: NaN, Infinity, invalid ISO timestamp, and inverted referenceRange fail closed', () => {
  const refTime = '2026-10-30T12:00:00Z'

  const nanRes = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'heart', testName: 'troponin', value: Number.NaN, unit: 'ng/mL', timestamp: '2026-10-30T11:00:00Z' }],
    { referenceTimeIso: refTime },
  )
  assert.strictEqual(nanRes[0].ok, false)
  assert.strictEqual(nanRes[0].reason, 'invalid-numeric-value')

  const infRes = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'heart', testName: 'troponin', value: Number.POSITIVE_INFINITY, unit: 'ng/mL', timestamp: '2026-10-30T11:00:00Z' }],
    { referenceTimeIso: refTime },
  )
  assert.strictEqual(infRes[0].ok, false)
  assert.strictEqual(infRes[0].reason, 'invalid-numeric-value')

  const invertedRange = computeCanonicalRecordOverlays(
    [
      {
        targetOrgan: 'heart',
        testName: 'troponin',
        value: 0.02,
        unit: 'ng/mL',
        timestamp: '2026-10-30T11:00:00Z',
        referenceRange: [0.5, 0.01],
      },
    ],
    { referenceTimeIso: refTime },
  )
  assert.strictEqual(invertedRange[0].ok, false)
  assert.strictEqual(invertedRange[0].reason, 'inverted-reference-range')

  const badTimestamp = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'heart', testName: 'troponin', value: 0.02, unit: 'ng/mL', timestamp: 'not-a-timestamp' }],
    { referenceTimeIso: refTime },
  )
  assert.strictEqual(badTimestamp[0].ok, false)
  assert.strictEqual(badTimestamp[0].reason, 'invalid-record')
})

test('BX-8 8. Observed vs simulated channel separation: simulated values are rejected when rejectSimulatedInObservedMode is enabled', () => {
  const simulatedRecord = [
    {
      targetOrgan: 'heart',
      testName: 'heart_rate',
      value: 110,
      unit: 'bpm',
      timestamp: '2026-10-30T11:00:00Z',
      truthClass: 'simulated',
    },
  ]

  const blocked = computeCanonicalRecordOverlays(simulatedRecord, {
    referenceTimeIso: '2026-10-30T12:00:00Z',
    rejectSimulatedInObservedMode: true,
  })
  assert.strictEqual(blocked[0].ok, false)
  assert.strictEqual(blocked[0].reason, 'simulated-in-observed-channel')
})

test('BX-8 9. Unmapped organ identity guard rejects unknown organ IDs when requireMappedOrganIdentity is true', () => {
  assert.strictEqual(resolveAnatomicalOverlayBinding('jantung')?.canonicalOrganId, 'heart')
  assert.strictEqual(resolveAnatomicalOverlayBinding('nonexistent_organ'), null)

  const unmapped = computeCanonicalRecordOverlays(
    [
      {
        targetOrgan: 'nonexistent_organ',
        testName: 'troponin',
        value: 0.01,
        unit: 'ng/mL',
        timestamp: '2026-10-30T11:00:00Z',
      },
    ],
    {
      referenceTimeIso: '2026-10-30T12:00:00Z',
      requireMappedOrganIdentity: true,
    },
  )
  assert.strictEqual(unmapped[0].ok, false)
  assert.strictEqual(unmapped[0].reason, 'unmapped-organ-identity')
})

test('BX-8 10. Longitudinal aggregation orders series chronologically, computes delta/trend, and rejects conflicting concurrent records', () => {
  const seriesRes = aggregateLongitudinalOrganOverlay(
    [
      { targetOrgan: 'kidney', testName: 'creatinine', value: 1.4, unit: 'mg/dL', timestamp: '2026-10-30T11:00:00Z' },
      { targetOrgan: 'kidney', testName: 'creatinine', value: 1.0, unit: 'mg/dL', timestamp: '2026-10-30T09:00:00Z' },
    ],
    { referenceTimeIso: '2026-10-30T12:00:00Z' },
  )
  assert.strictEqual(seriesRes.length, 1)
  assert.strictEqual(seriesRes[0].ok, true)
  assert.strictEqual(seriesRes[0].pointCount, 2)
  assert.strictEqual(seriesRes[0].deltaFromPrevious, 0.4)
  assert.strictEqual(seriesRes[0].trend, 'rising')
  assert.strictEqual(seriesRes[0].latest.value, 1.4)

  const conflictingRes = aggregateLongitudinalOrganOverlay(
    [
      { targetOrgan: 'kidney', testName: 'creatinine', value: 1.1, unit: 'mg/dL', timestamp: '2026-10-30T11:00:00Z' },
      { targetOrgan: 'kidney', testName: 'creatinine', value: 2.3, unit: 'mg/dL', timestamp: '2026-10-30T11:00:00Z' },
    ],
    { referenceTimeIso: '2026-10-30T12:00:00Z' },
  )
  assert.strictEqual(conflictingRes.length, 1)
  assert.strictEqual(conflictingRes[0].ok, false)
  assert.strictEqual(conflictingRes[0].reason, 'conflicting-concurrent-records')
})

test('BX-8 11. Empty, null, or undefined input array returns frozen empty array safely', () => {
  assert.deepStrictEqual(computeCanonicalRecordOverlays([]), [])
  assert.deepStrictEqual(computeCanonicalRecordOverlays(null), [])
  assert.deepStrictEqual(computeCanonicalRecordOverlays(undefined), [])
})
