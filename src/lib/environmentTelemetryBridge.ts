/**
 * Environment source -> canonical performance telemetry bridge.
 *
 * Keeps the environment source's richer truth/provenance beside the coarse
 * telemetry truth class so downstream graphs cannot mistake modeled/reference
 * values for measurements.
 */

import {
  assessEnvironmentSourceFreshness,
  validateEnvironmentSourceAdapter,
  validateNumericObservationAgainstSource,
  type EnvironmentSourceAdapter,
  type EnvironmentSourceFreshness,
  type EnvironmentSourceTruthClass,
  type NumericEnvironmentObservationCandidate,
} from './environmentSourceAdapter.ts'
import {
  validatePerformanceTelemetry,
  type PerformanceTelemetryEnvelope,
  type TelemetryTruthClass,
  type TimestampQuality,
} from './performanceTelemetryEnvelope.ts'

export interface EnvironmentTelemetryCandidate extends NumericEnvironmentObservationCandidate {
  id: string
  streamId: string
  sequence: number
  value: number
  receivedAt: string
  timestampQuality: TimestampQuality
  syncGroup?: string
  uncertainty?: number
  position?: {
    lat: number
    lon: number
    accuracyM?: number
  }
}

export interface EnvironmentTelemetryProvenance {
  adapterId: string
  sourceId: string
  sourceName: string
  sourceVersion: string
  sourceRef: string
  environmentTruthClass: EnvironmentSourceTruthClass
  licenseRef: string
  authorityRef: string
}

export interface EnvironmentTelemetryProjection {
  admitted: boolean
  errors: readonly string[]
  freshness: EnvironmentSourceFreshness
  telemetry: PerformanceTelemetryEnvelope | null
  provenance: EnvironmentTelemetryProvenance | null
}

function mapEnvironmentTruthClass(
  truthClass: EnvironmentSourceTruthClass,
): TelemetryTruthClass | null {
  if (truthClass === 'measured') return 'measured'
  if (truthClass === 'modeled' || truthClass === 'forecast') return 'estimated'
  if (truthClass === 'reference') return 'relayed'

  // occurrence is not numeric telemetry, while mixed must be disambiguated by
  // a source-specific adapter before projection.
  return null
}

/**
 * Projects a validated numeric environment observation into the shared
 * telemetry envelope while preserving the source's exact environmental truth
 * class and provenance in a companion object.
 *
 * Stale historical observations remain admissible but explicitly stale. Future
 * observation timestamps, ambiguous source truth, invalid metric/unit mappings,
 * and invalid telemetry chronology fail closed.
 */
export function projectEnvironmentObservationToTelemetry(
  adapter: EnvironmentSourceAdapter,
  candidate: EnvironmentTelemetryCandidate,
  now: string,
): EnvironmentTelemetryProjection {
  const errors = [
    ...validateEnvironmentSourceAdapter(adapter),
    ...validateNumericObservationAgainstSource(adapter, candidate).errors,
  ]

  if (!Number.isFinite(candidate.value)) errors.push('value')

  const freshness = assessEnvironmentSourceFreshness(adapter, candidate.observedAt, now)
  if (freshness.state === 'invalid-time') errors.push('observedAt-or-now')

  const telemetryTruthClass = mapEnvironmentTruthClass(adapter.truthClass)
  if (!telemetryTruthClass) errors.push('truth-class-ambiguous')

  if (errors.length || !telemetryTruthClass) {
    return Object.freeze({
      admitted: false,
      errors: Object.freeze([...new Set(errors)]),
      freshness,
      telemetry: null,
      provenance: null,
    })
  }

  const telemetry: PerformanceTelemetryEnvelope = {
    id: candidate.id,
    streamId: candidate.streamId,
    sequence: candidate.sequence,
    metricId: candidate.metric,
    value: candidate.value,
    unit: candidate.unit,
    capturedAt: candidate.observedAt,
    receivedAt: candidate.receivedAt,
    truthClass: telemetryTruthClass,
    sourceType: 'environment',
    sourceId: adapter.sourceId,
    confidence: candidate.confidence,
    uncertainty: candidate.uncertainty,
    timestampQuality: candidate.timestampQuality,
    syncGroup: candidate.syncGroup,
    position: candidate.position,
  }

  const nowMs = Date.parse(now)
  const validation = validatePerformanceTelemetry(
    telemetry,
    Number.isFinite(nowMs) ? nowMs : Date.now(),
  )
  if (!validation.valid) {
    return Object.freeze({
      admitted: false,
      errors: Object.freeze(validation.errors.map((error) => `telemetry.${error}`)),
      freshness,
      telemetry: null,
      provenance: null,
    })
  }

  return Object.freeze({
    admitted: true,
    errors: Object.freeze([]),
    freshness,
    telemetry: Object.freeze(telemetry),
    provenance: Object.freeze({
      adapterId: adapter.adapterId,
      sourceId: adapter.sourceId,
      sourceName: adapter.sourceName,
      sourceVersion: adapter.sourceVersion,
      sourceRef: candidate.sourceRef,
      environmentTruthClass: adapter.truthClass,
      licenseRef: adapter.licenseRef,
      authorityRef: adapter.authorityRef,
    }),
  })
}

export const ENVIRONMENT_TELEMETRY_BRIDGE_POLICY = Object.freeze({
  sourceSpecificMetricUnitMappingRequired: true as const,
  environmentTruthClassPreserved: true as const,
  ambiguousMixedTruthFailsClosed: true as const,
  occurrenceCannotBecomeNumericTelemetry: true as const,
  staleHistoricalDataMayRemainExplicitlyStale: true as const,
  futureObservationCannotMasqueradeAsTelemetry: true as const,
})
