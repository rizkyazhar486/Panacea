/**
 * Panacea Dive Expedition Field Science OS
 *
 * Additive field-science layer for reef observation, specimen provenance,
 * dive-to-dive surface interval bookkeeping, and resilient expedition
 * connectivity. It composes the existing underwater relay and network
 * resilience kernels instead of creating a parallel communications stack.
 *
 * Safety / scientific boundary:
 * - observation-first; no coral harvest or sampling procedure generator;
 * - invasive sample records require explicit permit + authority references;
 * - no protected-species override or collection authorization inference;
 * - surface interval is timestamp arithmetic only, never decompression advice;
 * - satellite/GNSS are surface/backhaul technologies, not direct underwater links.
 */

import {
  buildUnderwaterCommunicationPlan,
  type UnderwaterCommunicationPlan,
} from './sportAdventureRescueOS.ts'
import {
  chooseFailoverPath,
  type NetworkLinkTelemetry,
} from './satelliteMeshNetworkResilience.ts'

export type ReefObservationMethod =
  | 'photo-quadrat'
  | 'video-transect'
  | 'visual-demographic'
  | 'manual-note'
  | 'connected-sensor'

export type ReefConditionClass =
  | 'apparently-healthy'
  | 'paling'
  | 'partial-bleaching'
  | 'bleaching'
  | 'recent-mortality'
  | 'old-mortality'
  | 'lesion-or-disease-sign'
  | 'uncertain'

export interface ReefPositionContext {
  lat: number
  lon: number
  accuracyM: number
  source: 'surface-gnss' | 'vessel-gnss' | 'relay-derived' | 'manual'
}

export interface ReefObservation {
  id: string
  siteId: string
  capturedAt: string
  depthM: number
  method: ReefObservationMethod
  condition: ReefConditionClass
  taxonReference?: string
  photoOrVideoRef?: string
  position?: ReefPositionContext
  bleachingFraction?: number
  liveTissueFraction?: number
  observerConfidence: number
  sourceRef: string
}

export interface ReefConditionSummary {
  observationCount: number
  meanBleachingFraction: number | null
  meanLiveTissueFraction: number | null
  confidenceWeightedBleachingFraction: number | null
  methods: readonly ReefObservationMethod[]
  boundary: string
}

export type MarineSampleKind =
  | 'water-edna'
  | 'mucus-or-swab'
  | 'tissue-fragment'
  | 'skeletal-fragment'
  | 'other'

export type SamplingImpact = 'non-invasive' | 'minimally-invasive' | 'invasive'

export interface SampleCustodyEvent {
  at: string
  actorRef: string
  action: 'collected' | 'transferred' | 'received' | 'archived' | 'disposed'
  locationRef?: string
}

export interface MarineSampleRecord {
  specimenId: string
  observationId: string
  sampleKind: MarineSampleKind
  impact: SamplingImpact
  collectedAt: string
  collectorRef: string
  permitRef?: string
  authorityRef?: string
  protocolRef?: string
  chainOfCustody: readonly SampleCustodyEvent[]
  sourceRef: string
}

export interface DiveSurfaceInterval {
  previousSurfacedAt: string
  nextSubmergedAt: string
  minutes: number
  formula: '(nextSubmergedAt - previousSurfacedAt) / 60,000'
  boundary: string
}

export type ExpeditionConnectivityMode =
  | 'online'
  | 'degraded'
  | 'offline-store-and-forward'

export interface DiveExpeditionConnectivity {
  underwater: UnderwaterCommunicationPlan
  mode: ExpeditionConnectivityMode
  selectedBackhaulLinkId: string | null
  selectedBackhaulPathKind: NetworkLinkTelemetry['pathKind'] | null
  storeAndForward: true
  directSatelliteUnderwater: false
  boundary: string
}

export const DIVE_EXPEDITION_FIELD_SCIENCE_POLICY = Object.freeze({
  observationFirst: true as const,
  invasiveSamplingRequiresPermitRef: true as const,
  invasiveSamplingRequiresAuthorityRef: true as const,
  protectedSpeciesOverrideAllowed: false as const,
  collectionProcedureGenerationAllowed: false as const,
  decompressionAdviceFromSurfaceIntervalAllowed: false as const,
  directSatelliteUnderwaterAllowed: false as const,
  directGnssUnderwaterAllowed: false as const,
  offlineStoreAndForwardRequired: true as const,
  occurrenceDataEqualsGuaranteedPresence: false as const,
})

const clamp01 = (value: number) =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

const validDate = (value: string) => Number.isFinite(Date.parse(value))

const validPosition = (position: ReefPositionContext) =>
  Number.isFinite(position.lat) &&
  Number.isFinite(position.lon) &&
  position.lat >= -90 &&
  position.lat <= 90 &&
  position.lon >= -180 &&
  position.lon <= 180 &&
  Number.isFinite(position.accuracyM) &&
  position.accuracyM >= 0

export function validateReefObservation(observation: ReefObservation): string[] {
  const errors: string[] = []

  if (!observation.id.trim()) errors.push('id')
  if (!observation.siteId.trim()) errors.push('siteId')
  if (!validDate(observation.capturedAt)) errors.push('capturedAt')
  if (!Number.isFinite(observation.depthM) || observation.depthM < 0) errors.push('depthM')
  if (!Number.isFinite(observation.observerConfidence) || observation.observerConfidence < 0 || observation.observerConfidence > 1) {
    errors.push('observerConfidence')
  }
  if (!observation.sourceRef.trim()) errors.push('sourceRef')
  if (observation.position && !validPosition(observation.position)) errors.push('position')

  for (const [key, value] of [
    ['bleachingFraction', observation.bleachingFraction],
    ['liveTissueFraction', observation.liveTissueFraction],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)) errors.push(key)
  }

  return errors
}

/**
 * Confidence-weighted bleaching fraction:
 *   sum(confidence_i * bleachingFraction_i) / sum(confidence_i)
 *
 * Only valid source observations contribute. This is an observational summary,
 * not a reef-health diagnosis or a claim of ecological causation.
 */
export function summarizeReefCondition(
  observations: readonly ReefObservation[],
): ReefConditionSummary {
  const valid = observations.filter((entry) => validateReefObservation(entry).length === 0)
  const bleaching = valid.filter((entry) => entry.bleachingFraction !== undefined)
  const live = valid.filter((entry) => entry.liveTissueFraction !== undefined)

  const mean = (values: readonly number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null

  const bleachingValues = bleaching.map((entry) => clamp01(entry.bleachingFraction ?? 0))
  const liveValues = live.map((entry) => clamp01(entry.liveTissueFraction ?? 0))

  const weightSum = bleaching.reduce((sum, entry) => sum + clamp01(entry.observerConfidence), 0)
  const weightedBleaching = weightSum > 0
    ? bleaching.reduce(
        (sum, entry) =>
          sum + clamp01(entry.observerConfidence) * clamp01(entry.bleachingFraction ?? 0),
        0,
      ) / weightSum
    : null

  return Object.freeze({
    observationCount: valid.length,
    meanBleachingFraction: mean(bleachingValues),
    meanLiveTissueFraction: mean(liveValues),
    confidenceWeightedBleachingFraction: weightedBleaching,
    methods: Object.freeze([...new Set(valid.map((entry) => entry.method))]),
    boundary: 'Observational field summary only; retain protocol, imagery, taxon and environmental context before scientific interpretation.',
  })
}

export function validateMarineSampleRecord(record: MarineSampleRecord): string[] {
  const errors: string[] = []

  if (!record.specimenId.trim()) errors.push('specimenId')
  if (!record.observationId.trim()) errors.push('observationId')
  if (!validDate(record.collectedAt)) errors.push('collectedAt')
  if (!record.collectorRef.trim()) errors.push('collectorRef')
  if (!record.sourceRef.trim()) errors.push('sourceRef')
  if (record.chainOfCustody.length === 0) errors.push('chainOfCustody')

  for (const event of record.chainOfCustody) {
    if (!validDate(event.at)) errors.push('chainOfCustody.at')
    if (!event.actorRef.trim()) errors.push('chainOfCustody.actorRef')
  }

  if (record.impact === 'invasive') {
    if (!record.permitRef?.trim()) errors.push('permitRef')
    if (!record.authorityRef?.trim()) errors.push('authorityRef')
  }

  return [...new Set(errors)]
}

/**
 * Surface interval bookkeeping:
 *   intervalMinutes = (nextSubmergedAt - previousSurfacedAt) / 60,000
 *
 * Timestamp arithmetic only. It intentionally does not model inert-gas loading,
 * no-decompression limits, repetitive-dive planning, oxygen exposure, or ascent.
 */
export function calculateSurfaceInterval(
  previousSurfacedAt: string,
  nextSubmergedAt: string,
): DiveSurfaceInterval | null {
  const previousMs = Date.parse(previousSurfacedAt)
  const nextMs = Date.parse(nextSubmergedAt)

  if (!Number.isFinite(previousMs) || !Number.isFinite(nextMs) || nextMs < previousMs) return null

  return Object.freeze({
    previousSurfacedAt,
    nextSubmergedAt,
    minutes: (nextMs - previousMs) / 60_000,
    formula: '(nextSubmergedAt - previousSurfacedAt) / 60,000' as const,
    boundary: 'Timestamp bookkeeping only; the connected dive computer and recognized dive-planning procedures remain authoritative.',
  })
}

/**
 * Composes the existing underwater relay plan with the existing defensive
 * failover kernel. No network is invented: callers provide observed link
 * telemetry from authorized adapters.
 */
export function buildDiveExpeditionConnectivity(
  environment: UnderwaterCommunicationPlan['environment'],
  backhaulLinks: readonly NetworkLinkTelemetry[],
  repeaterCount = 0,
): DiveExpeditionConnectivity {
  const underwater = buildUnderwaterCommunicationPlan(environment, repeaterCount)
  const selected = chooseFailoverPath(backhaulLinks)
  const selectedLink = selected
    ? backhaulLinks.find((link) => link.id === selected.linkId) ?? null
    : null

  const mode: ExpeditionConnectivityMode = !selected
    ? 'offline-store-and-forward'
    : selected.healthScore >= 0.80 && selected.riskScore <= 0.20
      ? 'online'
      : 'degraded'

  return Object.freeze({
    underwater,
    mode,
    selectedBackhaulLinkId: selected?.linkId ?? null,
    selectedBackhaulPathKind: selectedLink?.pathKind ?? null,
    storeAndForward: true,
    directSatelliteUnderwater: false,
    boundary: 'Underwater data must reach an acoustic/optical/tether relay or surface gateway before cellular/Wi-Fi/LEO backhaul; offline capture remains available when all backhaul fails.',
  })
}
