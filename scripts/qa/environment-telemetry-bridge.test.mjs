import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ENVIRONMENT_SOURCE_ADAPTERS,
} from '../../src/lib/environmentSourceAdapter.ts'
import {
  ENVIRONMENT_TELEMETRY_BRIDGE_POLICY,
  projectEnvironmentObservationToTelemetry,
} from '../../src/lib/environmentTelemetryBridge.ts'

const gebco = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'gebco-2026')
assert.ok(gebco)

const baseCandidate = {
  id: 'env-1',
  streamId: 'bathymetry:elevation',
  sequence: 1,
  domain: 'bathymetry',
  metric: 'elevation',
  value: -18.4,
  unit: 'm',
  observedAt: '2026-09-20T09:00:00Z',
  receivedAt: '2026-09-20T09:00:01Z',
  sourceRef: 'gebco-2026:tile-42',
  confidence: 0.9,
  timestampQuality: 'server-received',
}

test('GEBCO projects into canonical telemetry without pretending reference data are measured', () => {
  const result = projectEnvironmentObservationToTelemetry(
    gebco,
    baseCandidate,
    '2026-09-20T10:00:00Z',
  )

  assert.equal(result.admitted, true)
  assert.equal(result.errors.length, 0)
  assert.equal(result.telemetry.sourceType, 'environment')
  assert.equal(result.telemetry.truthClass, 'relayed')
  assert.equal(result.telemetry.metricId, 'elevation')
  assert.equal(result.provenance.environmentTruthClass, 'reference')
  assert.equal(result.provenance.sourceVersion, '2026')
  assert.equal(result.provenance.sourceRef, 'gebco-2026:tile-42')
  assert.equal(result.freshness.state, 'fresh')
})

test('modeled numeric data remain estimated while exact modeled provenance is preserved', () => {
  const noaa = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'noaa-ofs')
  assert.ok(noaa)
  const modeled = {
    ...noaa,
    canonicalNumericUnits: { current: ['m/s'] },
  }

  const result = projectEnvironmentObservationToTelemetry(
    modeled,
    {
      ...baseCandidate,
      id: 'env-2',
      streamId: 'ocean:current',
      domain: 'ocean',
      metric: 'current',
      value: 0.42,
      unit: 'm/s',
      sourceRef: 'ofs:cycle-1:grid-7',
    },
    '2026-09-20T10:00:00Z',
  )

  assert.equal(result.admitted, true)
  assert.equal(result.telemetry.truthClass, 'estimated')
  assert.equal(result.provenance.environmentTruthClass, 'modeled')
})

test('mixed source truth fails closed until a source-specific adapter disambiguates it', () => {
  const awc = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'aviation-weather-center')
  assert.ok(awc)
  const ambiguous = {
    ...awc,
    payloadKinds: [...awc.payloadKinds, 'numeric-observation'],
    canonicalNumericUnits: { temperature: ['C'] },
  }

  const result = projectEnvironmentObservationToTelemetry(
    ambiguous,
    {
      ...baseCandidate,
      domain: 'weather',
      metric: 'temperature',
      value: 24,
      unit: 'C',
      sourceRef: 'awc:test',
    },
    '2026-09-20T10:00:00Z',
  )

  assert.equal(result.admitted, false)
  assert.ok(result.errors.includes('truth-class-ambiguous'))
})

test('invalid metric/unit mappings, future observations and receipt-before-capture fail closed', () => {
  const badMetric = projectEnvironmentObservationToTelemetry(
    gebco,
    { ...baseCandidate, metric: 'temperature' },
    '2026-09-20T10:00:00Z',
  )
  assert.equal(badMetric.admitted, false)
  assert.ok(badMetric.errors.includes('metric'))

  const future = projectEnvironmentObservationToTelemetry(
    gebco,
    { ...baseCandidate, observedAt: '2026-09-21T09:00:00Z', receivedAt: '2026-09-21T09:00:01Z' },
    '2026-09-20T10:00:00Z',
  )
  assert.equal(future.admitted, false)
  assert.ok(future.errors.includes('observedAt-or-now'))

  const clockOrder = projectEnvironmentObservationToTelemetry(
    gebco,
    { ...baseCandidate, receivedAt: '2026-09-20T08:59:59Z' },
    '2026-09-20T10:00:00Z',
  )
  assert.equal(clockOrder.admitted, false)
  assert.ok(clockOrder.errors.includes('telemetry.clock-order'))
})

test('stale history remains available but cannot masquerade as fresh current context', () => {
  const result = projectEnvironmentObservationToTelemetry(
    gebco,
    baseCandidate,
    '2028-09-20T10:00:00Z',
  )
  assert.equal(result.admitted, true)
  assert.equal(result.freshness.state, 'stale')
  assert.equal(ENVIRONMENT_TELEMETRY_BRIDGE_POLICY.staleHistoricalDataMayRemainExplicitlyStale, true)
})
