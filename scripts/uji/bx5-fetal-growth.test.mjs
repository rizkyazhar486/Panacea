import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluateHadlockFetalGrowth,
  evaluateSerialFetalGrowthVelocity,
} from '../../src/domains/body-exposure/engine/fetalGrowthEngine.ts'

test('BX-5 1. Golden case: 32-week Hadlock biometry computes exact EFW, z-score, and percentile', () => {
  const scan32 = evaluateHadlockFetalGrowth({
    gestationalAgeWeeks: 32,
    bpdCm: 8.2,
    hcCm: 29.5,
    acCm: 28.0,
    flCm: 6.2,
  })
  assert.strictEqual(scan32.ok, true)
  assert.strictEqual(scan32.efwGrams, 1924.69)
  assert.strictEqual(scan32.classification, 'above-p90')
  assert.strictEqual(scan32.truthClass, 'derived')
})

test('BX-5 2. Paired serial velocity test: 28w -> 32w calculates positive grams/day and rejects reversed GA order', () => {
  const scan28 = { gestationalAgeWeeks: 28, bpdCm: 7.2, hcCm: 26.2, acCm: 24.0, flCm: 5.3 }
  const scan32 = { gestationalAgeWeeks: 32, bpdCm: 8.2, hcCm: 29.5, acCm: 28.0, flCm: 6.2 }

  const vel = evaluateSerialFetalGrowthVelocity(scan28, scan32)
  assert.strictEqual(vel.ok, true)
  assert.strictEqual(vel.intervalWeeks, 4)
  assert.strictEqual(vel.gramsPerDay > 20, true)

  const reversed = evaluateSerialFetalGrowthVelocity(scan32, scan28)
  assert.strictEqual(reversed.ok, false)
  assert.strictEqual(reversed.reason, 'non-chronological-scans')
})

test('BX-5 3. Boundary +-epsilon on gestational age [14, 40] weeks and invalid inputs fail closed', () => {
  const eps = 1e-4
  const at14 = evaluateHadlockFetalGrowth({
    gestationalAgeWeeks: 14,
    bpdCm: 2.8,
    hcCm: 10.0,
    acCm: 8.5,
    flCm: 1.5,
  })
  assert.strictEqual(at14.ok, true)

  const below14 = evaluateHadlockFetalGrowth({
    gestationalAgeWeeks: 14 - eps,
    bpdCm: 2.8,
    hcCm: 10.0,
    acCm: 8.5,
    flCm: 1.5,
  })
  assert.strictEqual(below14.ok, false)
  assert.strictEqual(below14.reason, 'gestational-age-out-of-range')

  const above40 = evaluateHadlockFetalGrowth({
    gestationalAgeWeeks: 40 + eps,
    bpdCm: 9.5,
    hcCm: 34.0,
    acCm: 34.0,
    flCm: 7.5,
  })
  assert.strictEqual(above40.ok, false)
  assert.strictEqual(above40.reason, 'gestational-age-out-of-range')
})
