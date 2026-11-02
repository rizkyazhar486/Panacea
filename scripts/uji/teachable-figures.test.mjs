import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PV_LOOP_FIGURE,
  CICR_FIGURE,
  getTeachableFigure,
  listTeachableFigures,
  TEACHABLE_FIGURE_DISCLAIMER,
} from '../../src/domains/prometheus-learning/index.ts'

test('registry contains PV loop and CICR figures with scientific references and disclaimers', () => {
  const all = listTeachableFigures()
  assert.ok(all.length >= 2)
  assert.equal(getTeachableFigure(PV_LOOP_FIGURE.id), PV_LOOP_FIGURE)
  assert.equal(getTeachableFigure(CICR_FIGURE.id), CICR_FIGURE)
  assert.equal(getTeachableFigure('fig:non_existent'), null)
  assert.match(TEACHABLE_FIGURE_DISCLAIMER, /Illustrative educational causal simulation/)
})

test('PV Loop Figure: prediction choices have exactly one accurate answer', () => {
  const accurate = PV_LOOP_FIGURE.predictionQuestion.choices.filter((c) => c.isAccurate)
  assert.equal(accurate.length, 1)
  assert.equal(accurate[0].id, 'pred_1')
  assert.match(accurate[0].rationale, /truncates the ejection phase/)
})

test('PV Loop Figure: simulation calculates physiologically sound outputs for baseline parameters', () => {
  const res = PV_LOOP_FIGURE.simulate(PV_LOOP_FIGURE.defaultParams)
  assert.equal(res.ok, true)
  if (res.ok) {
    assert.equal(res.outputs.esvMl > 0, true)
    assert.equal(res.outputs.svMl, 120 - res.outputs.esvMl)
    assert.ok(res.outputs.efPercent >= 50 && res.outputs.efPercent <= 70)
    assert.ok(res.outputs.coLMin > 4 && res.outputs.coLMin < 7)
    assert.match(res.narrative, /stroke volume/)
  }
})

test('PV Loop Figure: increasing afterload decreases stroke volume at fixed inotropy', () => {
  const baseline = PV_LOOP_FIGURE.simulate({ ...PV_LOOP_FIGURE.defaultParams, mapMmHg: 90 })
  const highAfterload = PV_LOOP_FIGURE.simulate({ ...PV_LOOP_FIGURE.defaultParams, mapMmHg: 150 })
  assert.equal(baseline.ok, true)
  assert.equal(highAfterload.ok, true)
  if (baseline.ok && highAfterload.ok) {
    assert.ok(highAfterload.outputs.svMl < baseline.outputs.svMl, 'Higher afterload must reduce SV')
    assert.ok(highAfterload.outputs.esvMl > baseline.outputs.esvMl, 'Higher afterload must increase ESV')
  }
})

test('PV Loop Figure: NEG boundaries reject out-of-range or non-finite parameters', () => {
  assert.equal(PV_LOOP_FIGURE.simulate({ ...PV_LOOP_FIGURE.defaultParams, edvMl: 300 }).ok, false)
  assert.equal(PV_LOOP_FIGURE.simulate({ ...PV_LOOP_FIGURE.defaultParams, mapMmHg: 30 }).ok, false)
  assert.equal(PV_LOOP_FIGURE.simulate({ ...PV_LOOP_FIGURE.defaultParams, inotropyPercent: NaN }).ok, false)
})

test('CICR Figure: simulation calculates peak calcium, tau, and force correctly', () => {
  const baseline = CICR_FIGURE.simulate(CICR_FIGURE.defaultParams)
  assert.equal(baseline.ok, true)
  if (baseline.ok) {
    assert.ok(baseline.outputs.peakCytosolicCaMicroM > 0.5 && baseline.outputs.peakCytosolicCaMicroM < 1.5)
    assert.equal(baseline.outputs.relaxationTauMs, 220)
    assert.equal(baseline.outputs.contractileForceRelative, 1)
  }
})

test('CICR Figure: inhibiting SERCA2a prolongs relaxation tau (diastolic delay)', () => {
  const normal = CICR_FIGURE.simulate(CICR_FIGURE.defaultParams)
  const impaired = CICR_FIGURE.simulate({ ...CICR_FIGURE.defaultParams, sercaActivityPercent: 50 })
  assert.equal(normal.ok, true)
  assert.equal(impaired.ok, true)
  if (normal.ok && impaired.ok) {
    assert.ok(impaired.outputs.relaxationTauMs > normal.outputs.relaxationTauMs)
    assert.equal(impaired.outputs.relaxationTauMs, 440)
    assert.equal(impaired.visualStateKey, 'diastolic_delay')
  }
})

test('CICR Figure: NEG boundaries reject out-of-range parameters', () => {
  assert.equal(CICR_FIGURE.simulate({ ...CICR_FIGURE.defaultParams, cavCurrentPercent: 10 }).ok, false)
  assert.equal(CICR_FIGURE.simulate({ ...CICR_FIGURE.defaultParams, actionPotentialRateHz: 5 }).ok, false)
})
