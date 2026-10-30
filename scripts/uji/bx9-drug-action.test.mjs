import test from 'node:test'
import assert from 'node:assert/strict'
import { mapDrugAction } from '../../src/domains/body-exposure/engine/drugActionEngine.ts'

test('BX-9 Golden Case: Known drug maps to target organ and mechanism with zero dose fields', () => {
  const res = mapDrugAction('salbutamol')
  assert.equal(res.targetOrgan, 'Lung (Bronchioles)')
  assert.equal(res.truthClass, 'reference')
  // Memastikan tipe objek sama sekali tidak memiliki properti dosis
  assert.equal('dose' in res, false)
  assert.equal('dosage' in res, false)
})

test('BX-9 Negative Case: Uncurated drug returns not available safely', () => {
  const res = mapDrugAction('unknown-experimental-drug')
  assert.equal(res.targetOrgan, 'not available')
})
