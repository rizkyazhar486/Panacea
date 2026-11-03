// scripts/qa/organ-biometric-overlay.test.mjs
// Deterministic verification of Organ Biometric Overlay & Multiscale Anatomical Bindings (Pillar IV)

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ATLAS_STRUCTURE_DISCLAIMER,
  CANONICAL_ORGAN_BINDINGS,
  computeCanonicalRecordOverlays,
  resolveAnatomicalOverlayBinding,
} from '../../src/domains/body-exposure/engine/recordOverlayEngine.ts'

test('Pillar IV: 11-Organ Multiscale Anatomical Binding Resolution', () => {
  const TEST_ORGANS = [
    { input: 'heart', expectedId: 'heart', fma: 'FMA:7088' },
    { input: 'cardiac', expectedId: 'heart', fma: 'FMA:7088' },
    { input: 'kidneys', expectedId: 'kidney', fma: 'FMA:7203' },
    { input: 'renal', expectedId: 'kidney', fma: 'FMA:7203' },
    { input: 'lungs', expectedId: 'lung', fma: 'FMA:7195' },
    { input: 'pulmonary', expectedId: 'lung', fma: 'FMA:7195' },
    { input: 'liver', expectedId: 'liver', fma: 'FMA:7197' },
    { input: 'hepar', expectedId: 'liver', fma: 'FMA:7197' },
    { input: 'pancreas', expectedId: 'pancreas', fma: 'FMA:7198' },
    { input: 'brain', expectedId: 'brain', fma: 'FMA:50801' },
    { input: 'otak', expectedId: 'brain', fma: 'FMA:50801' },
    { input: 'vasculature', expectedId: 'vasculature', fma: 'FMA:50720' },
    { input: 'stomach', expectedId: 'stomach', fma: 'FMA:7148' },
    { input: 'lambung', expectedId: 'stomach', fma: 'FMA:7148' },
    { input: 'spleen', expectedId: 'spleen', fma: 'FMA:7196' },
    { input: 'thyroid', expectedId: 'thyroid', fma: 'FMA:9603' },
    { input: 'bladder', expectedId: 'bladder', fma: 'FMA:15900' },
    { input: 'kandung_kemih', expectedId: 'bladder', fma: 'FMA:15900' },
  ]

  for (const item of TEST_ORGANS) {
    const binding = resolveAnatomicalOverlayBinding(item.input)
    assert.ok(binding, `Failed to resolve anatomical binding for: ${item.input}`)
    assert.equal(binding.canonicalOrganId, item.expectedId)
    assert.equal(binding.fmaId, item.fma)
    assert.ok(binding.l1System.length > 0)
    assert.ok(binding.l3Substructure.length > 0)
    assert.ok(binding.l5Cell.length > 0)
    assert.ok(binding.l7Pathway.length > 0)
    assert.equal(binding.atlasDisclaimer, ATLAS_STRUCTURE_DISCLAIMER)
  }
})

test('Pillar IV: Unit Conversions & Conversion Formula Provenance', () => {
  const refTime = '2026-11-03T10:00:00Z'
  const records = [
    // Creatinine in umol/L -> mg/dL (88.42 umol/L = 1.0 mg/dL)
    {
      targetOrgan: 'kidneys',
      testName: 'creatinine',
      value: 88.42,
      unit: 'umol/L',
      timestamp: '2026-11-03T09:00:00Z',
    },
    // Glucose in mmol/L -> mg/dL (5.0 mmol/L = 90.091 mg/dL)
    {
      targetOrgan: 'pancreas',
      testName: 'glucose',
      value: 5.0,
      unit: 'mmol/L',
      timestamp: '2026-11-03T09:00:00Z',
    },
    // Systolic BP in kPa -> mmHg (16.0 kPa = 120.01 mmHg)
    {
      targetOrgan: 'heart',
      testName: 'blood_pressure_systolic',
      value: 16.0,
      unit: 'kPa',
      timestamp: '2026-11-03T09:00:00Z',
    },
  ]

  const results = computeCanonicalRecordOverlays(records, {
    referenceTimeIso: refTime,
    allowExplicitConversion: true,
  })

  assert.equal(results.length, 3)

  // Creatinine
  const cr = results[0]
  assert.equal(cr.ok, true)
  if (cr.ok) {
    assert.equal(cr.organId, 'kidney')
    assert.equal(cr.metricName, 'creatinine')
    assert.equal(cr.unit, 'mg/dL')
    assert.equal(Math.round(cr.value), 1)
    assert.equal(cr.conversion.converted, true)
    assert.ok(cr.conversion.formula.includes('88.42'))
  }

  // Glucose
  const glu = results[1]
  assert.equal(glu.ok, true)
  if (glu.ok) {
    assert.equal(glu.organId, 'pancreas')
    assert.equal(glu.metricName, 'glucose')
    assert.equal(glu.unit, 'mg/dL')
    assert.equal(Math.round(glu.value), 90)
    assert.equal(glu.conversion.converted, true)
    assert.ok(glu.conversion.formula.includes('18.0182'))
  }

  // Blood pressure
  const bp = results[2]
  assert.equal(bp.ok, true)
  if (bp.ok) {
    assert.equal(bp.organId, 'heart')
    assert.equal(bp.metricName, 'blood_pressure_systolic')
    assert.equal(bp.unit, 'mmHg')
    assert.equal(Math.round(bp.value), 120)
    assert.equal(bp.conversion.converted, true)
  }
})

test('Pillar IV: Reference Status & Abnormality Detection', () => {
  const refTime = '2026-11-03T10:00:00Z'
  const records = [
    // Normal troponin (0.02 ng/mL <= 0.04)
    {
      targetOrgan: 'heart',
      testName: 'troponin',
      value: 0.02,
      unit: 'ng/mL',
      timestamp: '2026-11-03T09:00:00Z',
    },
    // Elevated troponin (0.25 ng/mL > 0.04) -> Myocardial injury indicator
    {
      targetOrgan: 'heart',
      testName: 'troponin',
      value: 0.25,
      unit: 'ng/mL',
      timestamp: '2026-11-03T09:00:00Z',
    },
    // Hypoxemic SpO2 (88% < 95%)
    {
      targetOrgan: 'lung',
      testName: 'spo2',
      value: 88,
      unit: '%',
      timestamp: '2026-11-03T09:00:00Z',
    },
  ]

  const results = computeCanonicalRecordOverlays(records, { referenceTimeIso: refTime })
  assert.equal(results.length, 3)

  assert.equal(results[0].ok, true)
  if (results[0].ok) {
    assert.equal(results[0].referenceStatus, 'within-range')
  }

  assert.equal(results[1].ok, true)
  if (results[1].ok) {
    assert.equal(results[1].referenceStatus, 'above-range')
  }

  assert.equal(results[2].ok, true)
  if (results[2].ok) {
    assert.equal(results[2].referenceStatus, 'below-range')
  }
})

test('Pillar IV: Empty is Not Zero & Fail-Closed Safety Boundaries', () => {
  const refTime = '2026-11-03T10:00:00Z'

  // Null/missing values return missing-value, never 0
  const missingResult = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'kidney', testName: 'creatinine', value: null, unit: 'mg/dL', timestamp: refTime }],
    { referenceTimeIso: refTime },
  )
  assert.equal(missingResult.length, 1)
  assert.equal(missingResult[0].ok, false)
  if (!missingResult[0].ok) {
    assert.equal(missingResult[0].reason, 'missing-value')
    assert.equal(missingResult[0].displayValue, 'not available')
  }

  // Simulated records rejected when rejectSimulatedInObservedMode is true
  const simResult = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'heart', testName: 'troponin', value: 0.02, unit: 'ng/mL', timestamp: refTime, truthClass: 'simulated' }],
    { referenceTimeIso: refTime, rejectSimulatedInObservedMode: true },
  )
  assert.equal(simResult.length, 1)
  assert.equal(simResult[0].ok, false)
  if (!simResult[0].ok) {
    assert.equal(simResult[0].reason, 'simulated-in-observed-channel')
  }

  // Unmapped organ identity rejected when requireMappedOrganIdentity is true
  const unmappedResult = computeCanonicalRecordOverlays(
    [{ targetOrgan: 'non-existent-organ-xyz', testName: 'creatinine', value: 1.0, unit: 'mg/dL', timestamp: refTime }],
    { referenceTimeIso: refTime, requireMappedOrganIdentity: true },
  )
  assert.equal(unmappedResult.length, 1)
  assert.equal(unmappedResult[0].ok, false)
  if (!unmappedResult[0].ok) {
    assert.equal(unmappedResult[0].reason, 'unmapped-organ-identity')
  }
})
