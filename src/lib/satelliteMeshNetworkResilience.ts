/**
 * Panacea Satellite / Mesh Network Resilience Kernel
 *
 * Defensive purpose only: model Starlink-like LEO + terrestrial mesh connectivity,
 * failover, telemetry integrity and synthetic disruption scenarios. This module does
 * not scan, exploit, inject traffic into, authenticate against, or target external
 * networks. Adversarial scenarios operate only on caller-supplied synthetic link state.
 */

export type NetworkPathKind =
  | 'leo-satellite'
  | 'terrestrial-wan'
  | 'cellular'
  | 'wifi'
  | 'private-lan'

export type SyntheticDisruptionKind =
  | 'link-loss'
  | 'latency-spike'
  | 'packet-loss'
  | 'route-flap'
  | 'node-isolation'
  | 'gateway-outage'
  | 'jamming-symptom'
  | 'spoofed-telemetry'
  | 'replayed-telemetry'

export interface NetworkLinkTelemetry {
  id: string
  pathKind: NetworkPathKind
  capturedAt: string
  rttMs: number
  jitterMs: number
  packetLossRatio: number
  availabilityRatio: number
  integrityConfidence: number
  routeStability: number
  signalQuality?: number
}

export interface NetworkAnomaly {
  linkId: string
  code:
    | 'invalid-telemetry'
    | 'high-latency'
    | 'high-jitter'
    | 'high-packet-loss'
    | 'low-availability'
    | 'low-integrity'
    | 'route-instability'
  severity: 'info' | 'warning' | 'critical'
}

export interface SyntheticDisruption {
  kind: SyntheticDisruptionKind
  intensity: number
}

export interface LinkHealthAssessment {
  linkId: string
  healthScore: number
  riskScore: number
  anomalies: readonly NetworkAnomaly[]
}

export const PANACEA_NETWORK_RESILIENCE_POLICY = Object.freeze({
  defensiveOnly: true as const,
  syntheticAdversarialSimulationOnly: true as const,
  externalTargetingEnabled: false as const,
  credentialOperationsEnabled: false as const,
  activeScanningEnabled: false as const,
  exploitExecutionEnabled: false as const,
  packetInjectionEnabled: false as const,
  commandAndControlEnabled: false as const,
  failoverAnalysisEnabled: true as const,
  telemetryIntegrityAnalysisEnabled: true as const,
})

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

function validateTelemetry(link: NetworkLinkTelemetry): string[] {
  const invalid: string[] = []
  if (!link.id.trim()) invalid.push('id')
  if (!Number.isFinite(link.rttMs) || link.rttMs < 0) invalid.push('rttMs')
  if (!Number.isFinite(link.jitterMs) || link.jitterMs < 0) invalid.push('jitterMs')

  for (const field of [
    'packetLossRatio',
    'availabilityRatio',
    'integrityConfidence',
    'routeStability',
  ] as const) {
    const value = link[field]
    if (!Number.isFinite(value) || value < 0 || value > 1) invalid.push(field)
  }

  if (
    link.signalQuality !== undefined &&
    (!Number.isFinite(link.signalQuality) || link.signalQuality < 0 || link.signalQuality > 1)
  ) {
    invalid.push('signalQuality')
  }

  return invalid
}

/**
 * LatencyScore = 1 / (1 + RTT_ms / targetRTT_ms)
 *
 * This is an engineering normalization, not a network-service guarantee.
 */
export function calculateLatencyScore(rttMs: number, targetRttMs = 80): number {
  if (!Number.isFinite(rttMs) || rttMs < 0 || !Number.isFinite(targetRttMs) || targetRttMs <= 0) return 0
  return clamp01(1 / (1 + rttMs / targetRttMs))
}

/**
 * JitterScore = 1 / (1 + jitter_ms / targetJitter_ms)
 */
export function calculateJitterScore(jitterMs: number, targetJitterMs = 20): number {
  if (!Number.isFinite(jitterMs) || jitterMs < 0 || !Number.isFinite(targetJitterMs) || targetJitterMs <= 0) return 0
  return clamp01(1 / (1 + jitterMs / targetJitterMs))
}

/**
 * LinkHealth =
 *   0.30*availability +
 *   0.20*(1-packetLoss) +
 *   0.18*latencyScore +
 *   0.12*jitterScore +
 *   0.12*integrityConfidence +
 *   0.08*routeStability
 */
export function calculateLinkHealth(link: NetworkLinkTelemetry): number {
  if (validateTelemetry(link).length > 0) return 0

  return clamp01(
    0.30 * link.availabilityRatio +
    0.20 * (1 - link.packetLossRatio) +
    0.18 * calculateLatencyScore(link.rttMs) +
    0.12 * calculateJitterScore(link.jitterMs) +
    0.12 * link.integrityConfidence +
    0.08 * link.routeStability,
  )
}

/**
 * Risk =
 *   0.30*packetLoss +
 *   0.25*(1-integrity) +
 *   0.20*(1-routeStability) +
 *   0.15*(1-latencyScore) +
 *   0.10*(1-availability)
 */
export function calculateNetworkRisk(link: NetworkLinkTelemetry): number {
  if (validateTelemetry(link).length > 0) return 1

  return clamp01(
    0.30 * link.packetLossRatio +
    0.25 * (1 - link.integrityConfidence) +
    0.20 * (1 - link.routeStability) +
    0.15 * (1 - calculateLatencyScore(link.rttMs)) +
    0.10 * (1 - link.availabilityRatio),
  )
}

export function detectNetworkAnomalies(link: NetworkLinkTelemetry): NetworkAnomaly[] {
  const anomalies: NetworkAnomaly[] = []
  const invalid = validateTelemetry(link)

  if (invalid.length > 0) {
    anomalies.push({
      linkId: link.id || 'unknown',
      code: 'invalid-telemetry',
      severity: 'critical',
    })
    return anomalies
  }

  if (link.rttMs > 250) anomalies.push({ linkId: link.id, code: 'high-latency', severity: 'warning' })
  if (link.jitterMs > 80) anomalies.push({ linkId: link.id, code: 'high-jitter', severity: 'warning' })
  if (link.packetLossRatio > 0.10) anomalies.push({ linkId: link.id, code: 'high-packet-loss', severity: 'critical' })
  if (link.availabilityRatio < 0.95) anomalies.push({ linkId: link.id, code: 'low-availability', severity: 'warning' })
  if (link.integrityConfidence < 0.80) anomalies.push({ linkId: link.id, code: 'low-integrity', severity: 'critical' })
  if (link.routeStability < 0.70) anomalies.push({ linkId: link.id, code: 'route-instability', severity: 'warning' })

  return anomalies
}

export function assessNetworkLink(link: NetworkLinkTelemetry): LinkHealthAssessment {
  return Object.freeze({
    linkId: link.id,
    healthScore: calculateLinkHealth(link),
    riskScore: calculateNetworkRisk(link),
    anomalies: Object.freeze(detectNetworkAnomalies(link)),
  })
}

/**
 * Returns healthiest links first. Invalid telemetry always ranks last.
 */
export function rankFailoverLinks(links: readonly NetworkLinkTelemetry[]) {
  return [...links]
    .map(assessNetworkLink)
    .sort((a, b) => {
      if (b.healthScore !== a.healthScore) return b.healthScore - a.healthScore
      return a.riskScore - b.riskScore
    })
}

/**
 * Applies a disruption only to an in-memory synthetic link object.
 * It never performs network I/O.
 */
export function simulateSyntheticDisruption(
  link: NetworkLinkTelemetry,
  disruption: SyntheticDisruption,
): NetworkLinkTelemetry {
  const intensity = clamp01(disruption.intensity)
  const next: NetworkLinkTelemetry = { ...link }

  switch (disruption.kind) {
    case 'link-loss':
    case 'gateway-outage':
    case 'node-isolation':
      next.availabilityRatio = clamp01(link.availabilityRatio * (1 - intensity))
      next.packetLossRatio = clamp01(link.packetLossRatio + 0.75 * intensity)
      break
    case 'latency-spike':
      next.rttMs = Math.max(0, link.rttMs * (1 + 8 * intensity))
      next.jitterMs = Math.max(0, link.jitterMs * (1 + 5 * intensity))
      break
    case 'packet-loss':
      next.packetLossRatio = clamp01(link.packetLossRatio + 0.65 * intensity)
      break
    case 'route-flap':
      next.routeStability = clamp01(link.routeStability * (1 - 0.8 * intensity))
      next.jitterMs = Math.max(0, link.jitterMs * (1 + 3 * intensity))
      break
    case 'jamming-symptom':
      next.signalQuality = clamp01((link.signalQuality ?? 1) * (1 - 0.9 * intensity))
      next.packetLossRatio = clamp01(link.packetLossRatio + 0.50 * intensity)
      next.rttMs = Math.max(0, link.rttMs * (1 + 3 * intensity))
      break
    case 'spoofed-telemetry':
    case 'replayed-telemetry':
      next.integrityConfidence = clamp01(link.integrityConfidence * (1 - 0.95 * intensity))
      break
  }

  return Object.freeze(next)
}

export function chooseFailoverPath(links: readonly NetworkLinkTelemetry[]) {
  const ranked = rankFailoverLinks(links)
  const preferred = ranked.find(
    (entry) => entry.healthScore >= 0.65 && entry.riskScore <= 0.35 && !entry.anomalies.some((a) => a.severity === 'critical'),
  )

  return preferred ?? null
}
