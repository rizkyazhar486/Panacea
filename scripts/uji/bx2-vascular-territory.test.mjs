import test from 'node:test'
import assert from 'node:assert/strict'
import { mapCoronaryToAHA17 } from '../../src/domains/body-exposure/engine/vascularTerritoryEngine.ts'

test('BX-2 Golden Case: LAD with right dominance maps to AHA segments 1, 2, 7, 8, 13, 14, 17', () => {
  const res = mapCoronaryToAHA17('LAD', 'right')
  assert.deepEqual(res.segments, [1, 2, 7, 8, 13, 14, 17])
  assert.equal(res.truthClass, 'reference')
})

test('BX-2 Negative Case: Unknown dominance returns empty segments with unknown variant', () => {
  const res = mapCoronaryToAHA17('LAD', 'unknown')
  assert.deepEqual(res.segments, [])
  assert.equal(res.dominanceVariant, 'unknown')
})
