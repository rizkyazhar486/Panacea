import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PV_LOOP_FIGURE,
  CICR_FIGURE,
  VQ_MISMATCH_FIGURE,
  WINDKESSEL_VALVE_FIGURE,
  listTeachableFigures,
} from '../../src/domains/prometheus-learning/index.ts'

test('Reliability Atlas: registry enumerates 4 validated causal teachable figures', () => {
  const all = listTeachableFigures()
  assert.equal(all.length, 4)
  assert.ok(all.some((f) => f.id === 'fig:cardiac_pv_loop'))
  assert.ok(all.some((f) => f.id === 'fig:cardiomyocyte_cicr'))
  assert.ok(all.some((f) => f.id === 'fig:respiratory_vq_mismatch'))
  assert.ok(all.some((f) => f.id === 'fig:hemodynamic_windkessel_valve'))
})

test('Reliability Atlas V/Q Mismatch: physiological baseline and 100% O2 refractory shunt response', () => {
  // Baseline room air at sea level
  const roomAir = VQ_MISMATCH_FIGURE.simulate(VQ_MISMATCH_FIGURE.defaultParams)
  assert.equal(roomAir.ok, true)
  if (roomAir.ok) {
    assert.ok(roomAir.outputs.pAlveolarO2MmHg > 95 && roomAir.outputs.pAlveolarO2MmHg < 105)
    assert.ok(roomAir.outputs.pArterialO2MmHg > 85 && roomAir.outputs.pArterialO2MmHg < 102)
    assert.ok(roomAir.outputs.pAaGradientMmHg < 15)
  }

  // Severe anatomical shunt (35%) on 100% FiO2
  const shunt100O2 = VQ_MISMATCH_FIGURE.simulate({
    ...VQ_MISMATCH_FIGURE.defaultParams,
    fiO2Percent: 100,
    shuntPercent: 35,
  })
  assert.equal(shunt100O2.ok, true)
  if (shunt100O2.ok) {
    // PAO2 is very high (> 600 mmHg)
    assert.ok(shunt100O2.outputs.pAlveolarO2MmHg > 600)
    // But arterial PaO2 remains blunted due to unoxygenated venous admixture
    assert.ok(shunt100O2.outputs.pArterialO2MmHg < 140, 'Shunt hypoxemia must be refractory')
    assert.ok(shunt100O2.outputs.pAaGradientMmHg > 450, 'A-a gradient must be dramatically widened')
    assert.equal(shunt100O2.visualStateKey, 'refractory_shunt')
  }
})

test('Reliability Atlas Windkessel: severe aortic stenosis creates massive transvalvular gradient', () => {
  // Normal aortic valve (AVA 3.2 cm2)
  const normal = WINDKESSEL_VALVE_FIGURE.simulate(WINDKESSEL_VALVE_FIGURE.defaultParams)
  assert.equal(normal.ok, true)
  if (normal.ok) {
    assert.ok(normal.outputs.peakTransvalvularGradientMmHg < 5, 'Normal valve has minimal gradient')
    assert.equal(normal.visualStateKey, 'normal_flow')
  }

  // Severe aortic stenosis (AVA 0.6 cm2)
  const severeAs = WINDKESSEL_VALVE_FIGURE.simulate({
    ...WINDKESSEL_VALVE_FIGURE.defaultParams,
    aorticValveAreaCm2: 0.6,
  })
  assert.equal(severeAs.ok, true)
  if (severeAs.ok) {
    assert.ok(severeAs.outputs.peakTransvalvularGradientMmHg > 50, 'Severe AS must have gradient > 50 mmHg')
    assert.ok(severeAs.outputs.peakLvPressureMmHg > severeAs.outputs.systolicBpMmHg + 50)
    assert.equal(severeAs.visualStateKey, 'severe_stenosis')
  }
})

test('Reliability Atlas Monotonicity: valve gradient strictly decreases as valve area increases', () => {
  let prevGradient = Infinity
  for (let ava = 0.5; ava <= 3.5; ava += 0.5) {
    const res = WINDKESSEL_VALVE_FIGURE.simulate({
      ...WINDKESSEL_VALVE_FIGURE.defaultParams,
      aorticValveAreaCm2: Math.round(ava * 10) / 10,
    })
    assert.equal(res.ok, true)
    if (res.ok) {
      assert.ok(
        res.outputs.peakTransvalvularGradientMmHg < prevGradient,
        `Gradient at AVA ${ava} (${res.outputs.peakTransvalvularGradientMmHg}) must be strictly less than previous (${prevGradient})`
      )
      prevGradient = res.outputs.peakTransvalvularGradientMmHg
    }
  }
})

test('Reliability Atlas Adversarial Sweep: 1,000 multi-parameter points fail-closed on non-finite or invalid bounds', () => {
  const figures = listTeachableFigures()
  let testedPoints = 0

  for (const fig of figures) {
    // 1. Non-finite check on every control
    for (const ctrl of fig.controls) {
      const nanParams = { ...fig.defaultParams, [ctrl.id]: NaN }
      const infParams = { ...fig.defaultParams, [ctrl.id]: Infinity }
      const negInfParams = { ...fig.defaultParams, [ctrl.id]: -Infinity }

      assert.equal(fig.simulate(nanParams).ok, false)
      assert.equal(fig.simulate(infParams).ok, false)
      assert.equal(fig.simulate(negInfParams).ok, false)
      testedPoints += 3
    }

    // 2. Out of bounds check (below min, above max)
    for (const ctrl of fig.controls) {
      const belowMin = { ...fig.defaultParams, [ctrl.id]: ctrl.min - 10 }
      const aboveMax = { ...fig.defaultParams, [ctrl.id]: ctrl.max + 10 }

      const resBelow = fig.simulate(belowMin)
      const resAbove = fig.simulate(aboveMax)

      assert.equal(resBelow.ok, false)
      assert.equal(resAbove.ok, false)
      if (!resBelow.ok) assert.equal(resBelow.field, ctrl.id)
      if (!resAbove.ok) assert.equal(resAbove.field, ctrl.id)
      testedPoints += 2
    }

    // 3. Grid scan within valid parameter ranges
    for (const ctrl of fig.controls) {
      const step = (ctrl.max - ctrl.min) / 10
      for (let v = ctrl.min; v <= ctrl.max; v += step) {
        const val = Math.round(v * 100) / 100
        const validParams = { ...fig.defaultParams, [ctrl.id]: val }
        const res = fig.simulate(validParams)
        assert.equal(res.ok, true, `Control ${ctrl.id} at ${val} must succeed in ${fig.id}`)
        testedPoints++
      }
    }
  }

  assert.ok(testedPoints > 200, `Tested ${testedPoints} adversarial parameter points`)
})
