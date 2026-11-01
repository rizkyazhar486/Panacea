import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateVqAndAlveolarGradient } from '../../src/domains/body-exposure/engine/vqMismatchEngine.ts'

test('BX-4 1. Golden case: room air (FiO2 0.21, Patm 760, PH2O 47, PaCO2 40, RQ 0.8, PaO2 90) yields PAO2 99.73 and A-a 9.73 mmHg', () => {
  const res = evaluateVqAndAlveolarGradient({
    fio2: 0.21,
    patmMmHg: 760,
    ph2oMmHg: 47,
    paco2MmHg: 40,
    pao2MmHg: 90,
    respiratoryQuotient: 0.8,
    ageYears: 40,
    alveolarVentilationLMin: 4.2,
    pulmonaryPerfusionLMin: 5.0,
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.pao2AlveolarMmHg, 99.73)
  assert.strictEqual(res.aaGradientMmHg, 9.73)
  assert.strictEqual(res.ageExpectedUpperLimitMmHg, 14)
  assert.strictEqual(res.isElevatedForAge, false)
  assert.strictEqual(res.vqRatio, 0.84)
  assert.strictEqual(res.regime, 'physiologic-matched')
})

test('BX-4 2. Paired test: dropping VA to 0 with Q=5.0 shifts regime to true-shunt (VQ=0)', () => {
  const shunt = evaluateVqAndAlveolarGradient({
    fio2: 0.21,
    paco2MmHg: 40,
    pao2MmHg: 55,
    alveolarVentilationLMin: 0,
    pulmonaryPerfusionLMin: 5.0,
  })
  assert.strictEqual(shunt.ok, true)
  assert.strictEqual(shunt.vqRatio, 0)
  assert.strictEqual(shunt.regime, 'true-shunt')
})

test('BX-4 3. Boundary +-epsilon and impossible gas tensions fail closed', () => {
  const eps = 1e-5
  const validLowerFiO2 = evaluateVqAndAlveolarGradient({
    fio2: 0.21,
    paco2MmHg: 40,
    pao2MmHg: 90,
  })
  assert.strictEqual(validLowerFiO2.ok, true)

  const belowRoomAir = evaluateVqAndAlveolarGradient({
    fio2: 0.21 - eps,
    paco2MmHg: 40,
    pao2MmHg: 90,
  })
  assert.strictEqual(belowRoomAir.ok, false)
  assert.strictEqual(belowRoomAir.reason, 'invalid-input')

  const pao2AboveAlveolar = evaluateVqAndAlveolarGradient({
    fio2: 0.21,
    paco2MmHg: 40,
    pao2MmHg: 110,
  })
  assert.strictEqual(pao2AboveAlveolar.ok, false)
  assert.strictEqual(pao2AboveAlveolar.reason, 'impossible-gas-tension')
})
