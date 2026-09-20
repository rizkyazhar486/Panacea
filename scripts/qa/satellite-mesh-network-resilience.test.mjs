import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PANACEA_NETWORK_RESILIENCE_POLICY,
  assessNetworkLink,
  calculateJitterScore,
  calculateLatencyScore,
  chooseFailoverPath,
  detectNetworkAnomalies,
  rankFailoverLinks,
  simulateSyntheticDisruption,
} from '../../src/lib/satelliteMeshNetworkResilience.ts'

const healthyLeo = {
  id: 'leo-a',
  pathKind: 'leo-satellite',
  capturedAt: '2026-09-20T08:00:00Z',
  rttMs: 55,
  jitterMs: 12,
  packetLossRatio: 0.01,
  availabilityRatio: 0.999,
  integrityConfidence: 0.99,
  routeStability: 0.98,
  signalQuality: 0.92,
}

const backupWan = {
  ...healthyLeo,
  id: 'wan-b',
  pathKind: 'terrestrial-wan',
  rttMs: 35,
  packetLossRatio: 0.02,
  availabilityRatio: 0.995,
}

test('security policy is defensive and disables offensive network operations', () => {
  assert.equal(PANACEA_NETWORK_RESILIENCE_POLICY.defensiveOnly, true)
  assert.equal(PANACEA_NETWORK_RESILIENCE_POLICY.syntheticAdversarialSimulationOnly, true)
  assert.equal(PANACEA_NETWORK_RESILIENCE_POLICY.externalTargetingEnabled, false)
  assert.equal(PANACEA_NETWORK_RESILIENCE_POLICY.activeScanningEnabled, false)
  assert.equal(PANACEA_NETWORK_RESILIENCE_POLICY.exploitExecutionEnabled, false)
  assert.equal(PANACEA_NETWORK_RESILIENCE_POLICY.packetInjectionEnabled, false)
  assert.equal(PANACEA_NETWORK_RESILIENCE_POLICY.commandAndControlEnabled, false)
})

test('latency and jitter normalization are bounded', () => {
  assert.equal(calculateLatencyScore(-1), 0)
  assert.equal(calculateJitterScore(-1), 0)
  assert.ok(calculateLatencyScore(20) > calculateLatencyScore(200))
  assert.ok(calculateJitterScore(5) > calculateJitterScore(100))
})

test('healthy redundant links can be ranked for failover', () => {
  const ranked = rankFailoverLinks([healthyLeo, backupWan])
  assert.equal(ranked.length, 2)
  assert.ok(ranked[0].healthScore >= ranked[1].healthScore)
  assert.ok(chooseFailoverPath([healthyLeo, backupWan]))
})

test('synthetic disruption degrades only copied in-memory telemetry', () => {
  const disrupted = simulateSyntheticDisruption(healthyLeo, {
    kind: 'jamming-symptom',
    intensity: 0.9,
  })

  assert.equal(healthyLeo.packetLossRatio, 0.01)
  assert.ok(disrupted.packetLossRatio > healthyLeo.packetLossRatio)
  assert.ok(disrupted.rttMs > healthyLeo.rttMs)
  assert.ok((disrupted.signalQuality ?? 1) < (healthyLeo.signalQuality ?? 1))
})

test('telemetry integrity failures are detected without active probing', () => {
  const suspicious = simulateSyntheticDisruption(healthyLeo, {
    kind: 'spoofed-telemetry',
    intensity: 1,
  })

  const anomalies = detectNetworkAnomalies(suspicious)
  assert.ok(anomalies.some((entry) => entry.code === 'low-integrity' && entry.severity === 'critical'))
})

test('invalid telemetry fails closed and cannot become preferred failover', () => {
  const invalid = { ...healthyLeo, id: 'invalid', packetLossRatio: 2 }
  const assessment = assessNetworkLink(invalid)

  assert.equal(assessment.healthScore, 0)
  assert.equal(assessment.riskScore, 1)
  assert.ok(assessment.anomalies.some((entry) => entry.code === 'invalid-telemetry'))

  const chosen = chooseFailoverPath([invalid, healthyLeo])
  assert.equal(chosen?.linkId, healthyLeo.id)
})
