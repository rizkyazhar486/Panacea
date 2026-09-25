import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveScientificGraph,
  SCIENTIFIC_GRAPH_RENDERER_POLICY,
} from '../../src/lib/scientificGraphRenderer.ts'

const hrItem = (overrides = {}) => ({
  id: 'hr-1',
  streamId: 'hr-strap',
  sequence: 1,
  metricId: 'heart-rate',
  value: 150,
  unit: 'bpm',
  capturedAt: '2026-09-25T00:00:00.000Z',
  receivedAt: '2026-09-25T00:00:00.100Z',
  truthClass: 'measured',
  sourceType: 'wearable',
  sourceId: 'strap-1',
  confidence: 0.95,
  timestampQuality: 'hardware-clock',
  syncGroup: 'session-1',
  ...overrides,
})

test('single-metric time-series graph resolves with derived elapsed-time axis', () => {
  const items = [
    hrItem(),
    hrItem({ id: 'hr-2', sequence: 2, value: 155, capturedAt: '2026-09-25T00:00:05.000Z', receivedAt: '2026-09-25T00:00:05.100Z' }),
  ]
  const result = resolveScientificGraph('physiology-hr-time', 'running-road', { 'heart-rate': items })
  assert.equal(result.ok, true)
  assert.equal(result.xAxis.isDerivedTime, true)
  assert.equal(result.xAxis.unit, 's')
  assert.equal(result.series.length, 1)
  assert.equal(result.series[0].unit, 'bpm')
  assert.equal(result.series[0].points.length, 2)
  assert.equal(result.series[0].points[0].tSeconds, 0)
  assert.equal(result.series[0].points[1].tSeconds, 5)
})

test('unknown graph id fails closed', () => {
  const result = resolveScientificGraph('does-not-exist', 'running-road', {})
  assert.equal(result.ok, false)
  assert.deepEqual(result.errors, ['unknown-graph'])
})

test('graph not applicable to the given sport fails closed', () => {
  const result = resolveScientificGraph('baseball-batted-ball', 'running-road', {})
  assert.equal(result.ok, false)
  assert.deepEqual(result.errors, ['graph-not-applicable-to-sport'])
})

test('missing required metric fails closed rather than fabricating a series', () => {
  const result = resolveScientificGraph('physiology-hr-time', 'running-road', {})
  assert.equal(result.ok, false)
  assert.deepEqual(result.errors, ['missing-metric:heart-rate'])
})

test('unit mismatch fails closed instead of silently converting', () => {
  const result = resolveScientificGraph('physiology-hr-time', 'running-road', {
    'heart-rate': [hrItem({ unit: 'beats-per-min' })],
  })
  assert.equal(result.ok, false)
  assert.deepEqual(result.errors, ['unit-mismatch:heart-rate'])
})

test('invalid telemetry (e.g. receipt before capture) fails closed', () => {
  const invalid = hrItem({ capturedAt: '2026-09-25T00:00:05.000Z', receivedAt: '2026-09-25T00:00:00.000Z' })
  const result = resolveScientificGraph('physiology-hr-time', 'running-road', { 'heart-rate': [invalid] })
  assert.equal(result.ok, false)
  assert.deepEqual(result.errors, ['invalid-telemetry:heart-rate'])
})

test('unregistered metric referenced by a graph fails closed rather than guessing a unit', () => {
  // 'dive-motion-control' also needs 'dive-depth' and 'dive-hover-score'; omit those
  // to isolate the unknown-metric path if the registry ever drops a definition again.
  const result = resolveScientificGraph('dive-motion-control', 'scuba-diving', {})
  assert.equal(result.ok, false)
  assert.ok(result.errors.length > 0)
})

test('multi-stream overlay requires clock synchronization before combining traces', () => {
  const hr = [hrItem({ streamId: 'hr-strap', syncGroup: 'session-1' })]
  const power = [
    {
      id: 'power-1',
      streamId: 'power-meter',
      sequence: 1,
      metricId: 'mechanical-power',
      value: 220,
      unit: 'W',
      capturedAt: '2026-09-25T00:00:09.000Z',
      receivedAt: '2026-09-25T00:00:09.100Z',
      truthClass: 'measured',
      sourceType: 'sport-equipment',
      sourceId: 'meter-1',
      confidence: 0.95,
      timestampQuality: 'hardware-clock',
      syncGroup: 'session-1',
    },
  ]
  const skewed = resolveScientificGraph('endurance-power-hr', 'road-cycling', {
    'heart-rate': hr,
    'mechanical-power': power,
  })
  assert.equal(skewed.ok, false)
  assert.equal(skewed.errors[0].startsWith('unsynchronized:'), true)

  const synced = resolveScientificGraph('endurance-power-hr', 'road-cycling', {
    'heart-rate': hr,
    'mechanical-power': [{ ...power[0], capturedAt: '2026-09-25T00:00:00.400Z', receivedAt: '2026-09-25T00:00:00.500Z' }],
  })
  assert.equal(synced.ok, true)
  // endurance-power-hr plots heart-rate against the mechanical-power axis, so
  // only the y-metric becomes a rendered series; the x-metric is the axis.
  assert.equal(synced.series.length, 1)
  assert.equal(synced.xAxis.metricId, 'mechanical-power')
})

test('distance-or-time pseudo axis falls back to elapsed-time when no distance stream is supplied', () => {
  const speed = [
    {
      id: 'speed-1',
      streamId: 'vehicle-telemetry',
      sequence: 1,
      metricId: 'motorsport-speed',
      value: 300,
      unit: 'km/h',
      capturedAt: '2026-09-25T00:00:00.000Z',
      receivedAt: '2026-09-25T00:00:00.050Z',
      truthClass: 'measured',
      sourceType: 'vehicle',
      sourceId: 'car-1',
      confidence: 0.99,
      timestampQuality: 'hardware-clock',
      syncGroup: 'lap-1',
    },
  ]
  const brake = [{ ...speed[0], id: 'brake-1', metricId: 'motorsport-brake-pressure', unit: 'source unit', value: 40 }]
  const throttle = [{ ...speed[0], id: 'throttle-1', metricId: 'motorsport-throttle', unit: '%', value: 80 }]
  const result = resolveScientificGraph('motorsport-control', 'f1', {
    'motorsport-speed': speed,
    'motorsport-brake-pressure': brake,
    'motorsport-throttle': throttle,
  })
  assert.equal(result.ok, true)
  assert.equal(result.xAxis.isDerivedTime, true)
  assert.equal(result.xAxis.metricId, 'elapsed-time')
  assert.ok(result.warnings.some((w) => w.includes('distance-or-time fell back to elapsed-time')))
})

test('safety boundary text is always preserved and never dropped', () => {
  const dive = [
    {
      id: 'depth-1',
      streamId: 'dive-computer',
      sequence: 1,
      metricId: 'dive-depth',
      value: 12,
      unit: 'm',
      capturedAt: '2026-09-25T00:00:00.000Z',
      receivedAt: '2026-09-25T00:00:00.050Z',
      truthClass: 'measured',
      sourceType: 'sport-equipment',
      sourceId: 'computer-1',
      confidence: 0.99,
      timestampQuality: 'hardware-clock',
      syncGroup: 'dive-1',
    },
  ]
  const pressure = [{ ...dive[0], id: 'pressure-1', metricId: 'dive-ambient-pressure', unit: 'Pa', value: 220000 }]
  const result = resolveScientificGraph('dive-depth-pressure', 'scuba-diving', {
    'dive-depth': dive,
    'dive-ambient-pressure': pressure,
  })
  assert.equal(result.ok, true)
  assert.equal(result.safetyBoundary, 'Not a decompression schedule or freedive blackout predictor.')
})

test('renderer policy documents the fail-closed contract', () => {
  assert.equal(SCIENTIFIC_GRAPH_RENDERER_POLICY.neverInterpolatesAcrossMetrics, true)
  assert.equal(SCIENTIFIC_GRAPH_RENDERER_POLICY.multiStreamOverlayRequiresClockSync, true)
})
