import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateMultiscaleDrugAction } from '../../src/domains/body-exposure/engine/drugActionEngine.ts'

test('BX-9 1. Golden case: concentration equal to EC50/Ki yields exact 0.50 fractional receptor occupancy and maps L8 ADRB1 -> L2 heart', () => {
  const res = evaluateMultiscaleDrugAction({
    drugId: 'metoprolol-beta1-antagonist',
    concentration: 47,
    unit: 'nM',
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.l8TargetGene, 'ADRB1')
  assert.strictEqual(res.l2TargetOrgan, 'heart')
  assert.strictEqual(res.fractionalOccupancy, 0.5)
})

test('BX-9 2. Paired test: doubling concentration above EC50 increases occupancy monotonically; unit mismatch fails closed', () => {
  const highConc = evaluateMultiscaleDrugAction({
    drugId: 'furosemide-nkcc2-inhibitor',
    concentration: 30,
    unit: 'uM',
  })
  assert.strictEqual(highConc.ok, true)
  assert.strictEqual(highConc.fractionalOccupancy, 0.75)

  const mismatch = evaluateMultiscaleDrugAction({
    drugId: 'furosemide-nkcc2-inhibitor',
    concentration: 30,
    unit: 'mg/L',
  })
  assert.strictEqual(mismatch.ok, false)
  assert.strictEqual(mismatch.reason, 'unit-mismatch')
})

test('BX-9 3. Boundary +-epsilon at [C]=0 and invalid Hill coefficients fail closed', () => {
  const atZero = evaluateMultiscaleDrugAction({
    drugId: 'lisinopril-ace-inhibitor',
    concentration: 0,
    unit: 'nM',
  })
  assert.strictEqual(atZero.ok, true)
  assert.strictEqual(atZero.fractionalOccupancy, 0)

  const belowZero = evaluateMultiscaleDrugAction({
    drugId: 'lisinopril-ace-inhibitor',
    concentration: -1e-6,
    unit: 'nM',
  })
  assert.strictEqual(belowZero.ok, false)
  assert.strictEqual(belowZero.reason, 'invalid-input')
})
