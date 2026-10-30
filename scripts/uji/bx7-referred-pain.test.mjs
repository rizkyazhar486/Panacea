import test from 'node:test'
import assert from 'node:assert/strict'
import { exploreDermatome } from '../../src/domains/body-exposure/engine/referredPainEngine.ts'

test('BX-7 Golden Case: C5 shoulder skin region maps to C5 dermatome and diaphragm/heart candidates', () => {
  const res = exploreDermatome('c5-shoulder')
  assert.equal(res.dermatomeLevel, 'C5')
  assert.ok(res.referredOrganCandidates.includes('Diaphragm'))
  assert.equal(res.disclaimer, 'Educational, not a diagnosis')
})

test('BX-7 Negative Case: Region with no mapping returns not available safely', () => {
  const res = exploreDermatome('unknown-skin-zone')
  assert.equal(res.dermatomeLevel, 'not available')
  assert.deepEqual(res.referredOrganCandidates, [])
})
