import assert from 'node:assert/strict'
import test from 'node:test'

import {
  REFERRED_PAIN_DISCLAIMER,
  VISCERAL_REFERRED_PAIN_TABLE,
  evaluateViscerosomaticConvergence,
} from '../../src/domains/body-exposure/engine/referredPainEngine.ts'

test('BX-7 1. Golden case: myocardial T1-T5 and diaphragmatic C3-C5 Kehr sign convergence match cited table', () => {
  const cardiac = evaluateViscerosomaticConvergence({
    organ: 'heart-myocardium',
    activeCutaneousDermatomes: { T1: 1, T2: 1, T3: 0.5, T4: 0.5, T5: 1 },
  })
  assert.strictEqual(cardiac.ok, true)
  assert.strictEqual(cardiac.label, REFERRED_PAIN_DISCLAIMER)
  assert.deepStrictEqual(cardiac.matchedDermatomeSegments, ['T1', 'T2', 'T3', 'T4', 'T5'])
  assert.strictEqual(cardiac.jaccardOverlap, 1)
  assert.strictEqual(cardiac.weightedConvergenceScore, 4 / 5)
})

test('BX-7 2. Paired test: switching organ from diaphragm (C3-C5) to appendix (T10) with C4 dermatome drops overlap to 0', () => {
  const diaphragm = evaluateViscerosomaticConvergence({
    organ: 'diaphragm-central-tendon',
    activeCutaneousDermatomes: { C3: 1, C4: 1, C5: 1 },
  })
  const appendix = evaluateViscerosomaticConvergence({
    organ: 'appendix-visceral-early',
    activeCutaneousDermatomes: { C3: 1, C4: 1, C5: 1 },
  })
  assert.strictEqual(diaphragm.ok, true)
  assert.strictEqual(diaphragm.jaccardOverlap, 1)
  assert.strictEqual(appendix.ok, true)
  assert.strictEqual(appendix.jaccardOverlap, 0)
  assert.deepStrictEqual(appendix.matchedDermatomeSegments, [])
})

test('BX-7 3. Boundary +-epsilon and invalid inputs: C9, T13, NaN, inverted bounds, and unverified sources fail closed', () => {
  const eps = 1e-6
  const validAtBounds = evaluateViscerosomaticConvergence({
    organ: 'appendix-visceral-early',
    activeCutaneousDermatomes: { T10: 1 - eps, T9: 0 },
  })
  assert.strictEqual(validAtBounds.ok, true)

  const outOfBounds = evaluateViscerosomaticConvergence({
    organ: 'appendix-visceral-early',
    activeCutaneousDermatomes: { T10: 1 + eps },
  })
  assert.strictEqual(outOfBounds.ok, false)
  assert.strictEqual(outOfBounds.reason, 'invalid-input')

  const badSegment = evaluateViscerosomaticConvergence({
    organ: 'heart-myocardium',
    activeCutaneousDermatomes: { C9: 0.5 },
  })
  assert.strictEqual(badSegment.ok, false)
  assert.strictEqual(badSegment.reason, 'invalid-spinal-segment')

  const inverted = evaluateViscerosomaticConvergence({
    organ: 'heart-myocardium',
    activeCutaneousDermatomes: { T1: 0.5 },
    intensityBounds: [0.9, 0.1],
  })
  assert.strictEqual(inverted.ok, false)
  assert.strictEqual(inverted.reason, 'inverted-intensity-range')

  const unverified = evaluateViscerosomaticConvergence({
    organ: 'heart-myocardium',
    activeCutaneousDermatomes: { T1: 0.5 },
    tableOverride: {
      ...VISCERAL_REFERRED_PAIN_TABLE,
      'heart-myocardium': {
        ...VISCERAL_REFERRED_PAIN_TABLE['heart-myocardium'],
        source: { citation: 'Draft', pmid: '0', verifiedFrom: 'unverified', tableVerified: false },
      },
    },
  })
  assert.strictEqual(unverified.ok, false)
  assert.strictEqual(unverified.reason, 'source-not-verified')
})
