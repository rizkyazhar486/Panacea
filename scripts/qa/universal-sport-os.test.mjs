import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SCIENTIFIC_SPORT_GRAPHS,
  SPORT_UNIVERSE,
  UNIVERSAL_SPORT_OS_POLICY,
  boyleRelativeGasVolume,
  criticalSpeedMps,
  getSportProfile,
  listScientificGraphs,
  listSportMetrics,
  resultantG,
  sessionRpeLoad,
  underwaterAbsolutePressurePa,
} from '../../src/lib/universalSportOS.ts'

test('universal sport registry covers broad sport families and requested sports', () => {
  assert.ok(SPORT_UNIVERSE.length >= 50)
  for (const id of [
    'tennis','baseball','f1','daytona-endurance','motogp',
    'scuba-diving','freediving','triathlon','road-cycling','hyrox',
    'tactical-fitness','skydiving',
  ]) {
    const sport = getSportProfile(id)
    assert.ok(sport, id)
    assert.ok(sport.layers.length >= 5, id)
    assert.ok(sport.metricPacks.length >= 1, id)
  }
})

test('sport metric catalog remains source-gated', () => {
  for (const id of ['tennis','baseball','f1','motogp','scuba-diving','freediving']) {
    const metrics = listSportMetrics(id)
    assert.ok(metrics.base.length > 0)
    for (const metric of [...metrics.base, ...metrics.specialized]) {
      assert.equal(metric.requiresSource ?? true, true)
    }
  }
})

test('scientific graph catalog covers key physiology and telemetry modes', () => {
  assert.ok(SCIENTIFIC_SPORT_GRAPHS.length >= 10)
  assert.ok(listScientificGraphs('baseball').some((graph) => graph.id === 'baseball-batted-ball'))
  assert.ok(listScientificGraphs('f1').some((graph) => graph.id === 'motorsport-driver-load'))
  assert.ok(listScientificGraphs('freediving').some((graph) => graph.id === 'freedive-physiology'))
  assert.ok(listScientificGraphs('scuba-diving').some((graph) => graph.id === 'dive-depth-pressure'))
})

test('high-risk boundaries are hard-coded fail-safe invariants', () => {
  assert.equal(UNIVERSAL_SPORT_OS_POLICY.noAutonomousVehicleControl, true)
  assert.equal(UNIVERSAL_SPORT_OS_POLICY.noCertifiedNavigationReplacement, true)
  assert.equal(UNIVERSAL_SPORT_OS_POLICY.noDecompressionPlanner, true)
  assert.equal(UNIVERSAL_SPORT_OS_POLICY.noFreediveBlackoutPrediction, true)
  assert.equal(UNIVERSAL_SPORT_OS_POLICY.noUniversalMentalToughnessScore, true)
})

test('session RPE formula validates domain', () => {
  assert.equal(sessionRpeLoad(60, 7), 420)
  assert.equal(sessionRpeLoad(60, 11), null)
  assert.equal(sessionRpeLoad(-1, 5), null)
})

test('hydrostatic pressure rises with depth and respects surface pressure', () => {
  const surface = 101325
  const p0 = underwaterAbsolutePressurePa(0, surface)
  const p10 = underwaterAbsolutePressurePa(10, surface)
  assert.equal(p0, surface)
  assert.ok(p10 && p10 > surface)
})

test('Boyle approximation reduces gas volume as absolute pressure rises', () => {
  assert.equal(boyleRelativeGasVolume(1, 100000, 200000), 0.5)
  assert.equal(boyleRelativeGasVolume(1, 0, 200000), null)
})

test('resultant g uses vector magnitude', () => {
  const g = resultantG(9.80665, 0, 0)
  assert.ok(g != null)
  assert.ok(Math.abs(g - 1) < 1e-12)
})

test('critical speed uses two valid maximal efforts', () => {
  assert.equal(criticalSpeedMps(200, 100, 400, 220), 200 / 120)
  assert.equal(criticalSpeedMps(400, 220, 200, 100), null)
})
