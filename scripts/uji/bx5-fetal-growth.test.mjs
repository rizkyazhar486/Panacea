import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateFetalTrajectory } from '../../src/domains/body-exposure/engine/fetalGrowthEngine.ts'

test('BX-5 Golden Case: Valid biometry within centile range marks normal status', () => {
  const series = [{ week: 20, value: 150 }]
  const res = evaluateFetalTrajectory(series, 100, 200)
  assert.equal(res[0].status, 'normal')
  assert.equal(res[0].truthClass, 'measured')
})

test('BX-5 Negative/Boundary Case: Value outside chart range is flagged as out-of-range, not clipped', () => {
  const series = [{ week: 24, value: 350 }] // di atas maxAllowed 300
  const res = evaluateFetalTrajectory(series, 100, 300)
  assert.equal(res[0].status, 'out-of-range')
  assert.equal(res[0].measuredValue, 350)
})
