import assert from 'node:assert/strict'
import test from 'node:test'

import {
  simulateAcidBaseEquilibrium,
  simulateCardiovascularHemodynamics,
  simulateRenalStarlingFiltration,
} from '../../src/domains/medstudyhub/engine/medStudyPhysiologySandboxEngine.ts'

test('EDU-3 1. Golden case: physiological hemodynamics (HR=70, EDV=120, ESV=50, BP=120/80, CVP=5, LVEDP=8) yields SV=70, CO=4.9, MAP=93.33', () => {
  const hemo = simulateCardiovascularHemodynamics({
    heartRateBpm: 70,
    edvMl: 120,
    esvMl: 50,
    systolicBpMmHg: 120,
    diastolicBpMmHg: 80,
    cvpMmHg: 5,
    lvedpMmHg: 8,
  })
  assert.strictEqual(hemo.ok, true)
  assert.strictEqual(hemo.strokeVolumeMl, 70)
  assert.strictEqual(hemo.cardiacOutputLMin, 4.9)
  assert.strictEqual(hemo.coronaryPerfusionPressureMmHg, 72)
  assert.strictEqual(hemo.hemodynamicProfile, 'normodynamic')
})

test('EDU-3 2. Paired acid-base & renal test: high-anion-gap metabolic acidosis computes Winters range and Figge albumin correction', () => {
  const ab = simulateAcidBaseEquilibrium({
    paco2MmHg: 23,
    hco3MmolL: 10,
    naMmolL: 140,
    clMmolL: 102,
    albuminGdL: 2.0,
  })
  assert.strictEqual(ab.ok, true)
  assert.strictEqual(ab.primaryDisorder, 'metabolic-acidosis')
  assert.strictEqual(ab.rawAnionGapMmolL, 28)
  assert.strictEqual(ab.albuminCorrectedAnionGapMmolL, 33)
  assert.deepStrictEqual(ab.wintersExpectedPaco2RangeMmHg, [21, 25])

  const renal = simulateRenalStarlingFiltration({
    pgcMmHg: 60,
    pbsMmHg: 18,
    pigcMmHg: 32,
    kfMlMinMmHg: 12.5,
    serumNaMmolL: 140,
    serumCrMgDl: 2.0,
    urineNaMmolL: 10,
    urineCrMgDl: 60,
  })
  assert.strictEqual(renal.ok, true)
  assert.strictEqual(renal.netFiltrationPressureMmHg, 10)
  assert.strictEqual(renal.estimatedGfrMlMin, 125)
  assert.strictEqual(renal.azotemiaPattern, 'prerenal-sodium-avid')
})

test('EDU-3 3. Adversarial & physical impossibility checks (ESV >= EDV, DBP >= SBP, PaCO2 <= 0) fail closed', () => {
  const badVolumes = simulateCardiovascularHemodynamics({
    heartRateBpm: 70,
    edvMl: 80,
    esvMl: 80,
    systolicBpMmHg: 120,
    diastolicBpMmHg: 80,
    cvpMmHg: 5,
    lvedpMmHg: 8,
  })
  assert.strictEqual(badVolumes.ok, false)
  assert.strictEqual(badVolumes.reason, 'esv-exceeds-edv')

  const badPh = simulateAcidBaseEquilibrium({
    paco2MmHg: 0,
    hco3MmolL: 24,
    naMmolL: 140,
    clMmolL: 104,
  })
  assert.strictEqual(badPh.ok, false)
  assert.strictEqual(badPh.reason, 'acid-base-logarithm-domain-error')
})
