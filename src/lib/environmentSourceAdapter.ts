/**
 * Canonical environment-source adapter contract.
 *
 * This module describes how external environment sources are admitted into
 * Panacea without hiding source version, resolution, units, uncertainty,
 * licensing or stale/failure semantics.
 */

import type { EnvironmentDomain, EnvironmentSourceClass } from './wearableEnvironmentOS'

export type EnvironmentSourceTruthClass =
  | 'measured'
  | 'reference'
  | 'modeled'
  | 'forecast'
  | 'occurrence'
  | 'mixed'

export type EnvironmentPayloadKind =
  | 'numeric-observation'
  | 'vector-field'
  | 'gridded-raster'
  | 'occurrence-reference'
  | 'weather-report'
  | 'forecast-report'

export interface ResolutionDescriptor {
  description: string
  nominalValue?: number
  unit?: 'm' | 'km' | 'arc-second' | 'minute' | 'hour'
}

export interface EnvironmentSourceAdapter {
  adapterId: string
  sourceId: string
  sourceName: string
  sourceVersion: string
  domains: readonly EnvironmentDomain[]
  sourceClass: EnvironmentSourceClass
  truthClass: EnvironmentSourceTruthClass
  payloadKinds: readonly EnvironmentPayloadKind[]
  spatialResolution: ResolutionDescriptor
  temporalResolution: ResolutionDescriptor
  unitSemantics: string
  uncertaintySemantics: string
  licenseRef: string
  authorityRef: string
  staleAfterMs: number | null
  failureSemantics: readonly string[]
  canonicalNumericUnits?: Readonly<Record<string, readonly string[]>>
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

export const ENVIRONMENT_SOURCE_ADAPTERS = Object.freeze([
  {
    adapterId: 'gebco-grid-v1',
    sourceId: 'gebco-2026',
    sourceName: 'GEBCO 2026 Grid',
    sourceVersion: '2026',
    domains: ['terrain', 'bathymetry', 'geology'],
    sourceClass: 'bathymetry-grid',
    truthClass: 'reference',
    payloadKinds: ['numeric-observation', 'gridded-raster'],
    spatialResolution: {
      description: '15 arc-second global grid; source-data class must retain the companion TID context.',
      nominalValue: 15,
      unit: 'arc-second',
    },
    temporalResolution: {
      description: 'Static annual reference release rather than a live environmental observation.',
    },
    unitSemantics: 'Grid elevation/depth values are normalized in metres; preserve sign and datum semantics from the source product.',
    uncertaintySemantics: 'Resolution alone is not uncertainty. Preserve GEBCO TID/source-data class and any source-specific limitations rather than inventing positional or depth precision.',
    licenseRef: 'https://www.gebco.net/data-products-gridded-bathymetry-data/gebco2026-grid',
    authorityRef: 'GEBCO Bathymetric Compilation Group 2026',
    staleAfterMs: 366 * DAY_MS,
    failureSemantics: [
      'missing-grid-cell',
      'missing-tid-provenance',
      'unsupported-datum-or-unit',
      'source-version-mismatch',
    ],
    canonicalNumericUnits: {
      elevation: ['m'],
      depth: ['m'],
    },
  },
  {
    adapterId: 'noaa-ofs-v1',
    sourceId: 'noaa-ofs',
    sourceName: 'NOAA Operational Forecast Systems',
    sourceVersion: 'operational-system-specific',
    domains: ['ocean', 'weather', 'atmosphere', 'maritime'],
    sourceClass: 'forecast-model',
    truthClass: 'modeled',
    payloadKinds: ['numeric-observation', 'vector-field', 'forecast-report'],
    spatialResolution: {
      description: 'Region/model-specific hydrodynamic grid; preserve the originating OFS region and model metadata.',
    },
    temporalResolution: {
      description: 'Operational nowcast/forecast cycles; preserve model cycle, valid time and forecast horizon for every value.',
    },
    unitSemantics: 'Normalize only at the adapter boundary and retain the original source unit and variable identity in provenance.',
    uncertaintySemantics: 'Model guidance is not a direct measurement; preserve modeled/forecast truth class, cycle age, coverage and unavailable-field semantics.',
    licenseRef: 'https://oceanservice.noaa.gov/facts/ofs.html',
    authorityRef: 'NOAA Center for Operational Oceanographic Products and Services',
    staleAfterMs: 6 * HOUR_MS,
    failureSemantics: [
      'outside-model-domain',
      'model-cycle-unavailable',
      'forecast-horizon-exceeded',
      'variable-unavailable',
      'stale-model-cycle',
    ],
  },
  {
    adapterId: 'obis-occurrence-v1',
    sourceId: 'obis',
    sourceName: 'Ocean Biodiversity Information System',
    sourceVersion: 'dataset-query-snapshot-required',
    domains: ['marine-biodiversity'],
    sourceClass: 'biodiversity-dataset',
    truthClass: 'occurrence',
    payloadKinds: ['occurrence-reference'],
    spatialResolution: {
      description: 'Record-specific occurrence coordinates and dataset metadata; precision varies by contributing dataset.',
    },
    temporalResolution: {
      description: 'Occurrence/event time is record-specific; retrieval time must be retained separately from observation time.',
    },
    unitSemantics: 'Occurrence records are references, not numeric environmental measurements; never synthesize a species-presence score.',
    uncertaintySemantics: 'Occurrence does not guarantee present-time presence. Preserve dataset, record, coordinate precision and sampling context when available.',
    licenseRef: 'https://obis.org/manual/access/',
    authorityRef: 'Ocean Biodiversity Information System',
    staleAfterMs: null,
    failureSemantics: [
      'record-provenance-missing',
      'coordinate-uncertainty-unknown',
      'dataset-license-unknown',
      'occurrence-time-unknown',
    ],
  },
  {
    adapterId: 'awc-data-api-v1',
    sourceId: 'aviation-weather-center',
    sourceName: 'Aviation Weather Center Data API',
    sourceVersion: 'query-time-product-snapshot',
    domains: ['aviation', 'weather', 'atmosphere'],
    sourceClass: 'weather-station',
    truthClass: 'mixed',
    payloadKinds: ['weather-report', 'forecast-report'],
    spatialResolution: {
      description: 'Product-dependent station, route or hazard geometry; preserve product type and location semantics.',
    },
    temporalResolution: {
      description: 'Product-dependent observation/forecast valid time; retain issue time, valid time and product family.',
    },
    unitSemantics: 'Preserve product-native aviation units and convert only through an explicit, audited adapter mapping.',
    uncertaintySemantics: 'Observation and forecast products must remain distinguishable; missing/stale reports cannot be silently substituted.',
    licenseRef: 'https://aviationweather.gov/data/api/',
    authorityRef: 'NOAA/NWS Aviation Weather Center',
    staleAfterMs: null,
    failureSemantics: [
      'product-unavailable',
      'rate-limited',
      'query-window-exceeded',
      'product-valid-time-missing',
      'unsupported-product-format',
    ],
  },
] satisfies readonly EnvironmentSourceAdapter[])

export function validateEnvironmentSourceAdapter(
  adapter: EnvironmentSourceAdapter,
): string[] {
  const errors: string[] = []
  if (!adapter.adapterId?.trim()) errors.push('adapterId')
  if (!adapter.sourceId?.trim()) errors.push('sourceId')
  if (!adapter.sourceName?.trim()) errors.push('sourceName')
  if (!adapter.sourceVersion?.trim()) errors.push('sourceVersion')
  if (!adapter.domains?.length) errors.push('domains')
  if (!adapter.payloadKinds?.length) errors.push('payloadKinds')
  if (!adapter.spatialResolution?.description?.trim()) errors.push('spatialResolution')
  if (!adapter.temporalResolution?.description?.trim()) errors.push('temporalResolution')
  if (!adapter.unitSemantics?.trim()) errors.push('unitSemantics')
  if (!adapter.uncertaintySemantics?.trim()) errors.push('uncertaintySemantics')
  if (!adapter.licenseRef?.trim()) errors.push('licenseRef')
  if (!adapter.authorityRef?.trim()) errors.push('authorityRef')
  if (adapter.staleAfterMs !== null && (!Number.isFinite(adapter.staleAfterMs) || adapter.staleAfterMs <= 0)) {
    errors.push('staleAfterMs')
  }
  if (!adapter.failureSemantics?.length) errors.push('failureSemantics')
  return [...new Set(errors)]
}

export interface EnvironmentSourceFreshness {
  state: 'fresh' | 'stale' | 'age-unknown' | 'invalid-time'
  ageMs: number | null
  staleAfterMs: number | null
}

/**
 * ageMs = max(0, now - observedAt)
 * stale when staleAfterMs is defined and ageMs > staleAfterMs.
 */
export function assessEnvironmentSourceFreshness(
  adapter: EnvironmentSourceAdapter,
  observedAt: string,
  now: string,
): EnvironmentSourceFreshness {
  const observedMs = Date.parse(observedAt)
  const nowMs = Date.parse(now)
  if (!Number.isFinite(observedMs) || !Number.isFinite(nowMs)) {
    return { state: 'invalid-time', ageMs: null, staleAfterMs: adapter.staleAfterMs }
  }

  const ageMs = Math.max(0, nowMs - observedMs)
  if (adapter.staleAfterMs == null) {
    return { state: 'age-unknown', ageMs, staleAfterMs: null }
  }

  return {
    state: ageMs > adapter.staleAfterMs ? 'stale' : 'fresh',
    ageMs,
    staleAfterMs: adapter.staleAfterMs,
  }
}

export interface NumericEnvironmentObservationCandidate {
  domain: EnvironmentDomain
  metric: string
  unit: string
  observedAt: string
  sourceRef: string
  confidence: number
}

export function validateNumericObservationAgainstSource(
  adapter: EnvironmentSourceAdapter,
  observation: NumericEnvironmentObservationCandidate,
) {
  const errors: string[] = []
  if (!adapter.payloadKinds.includes('numeric-observation')) errors.push('payload-kind')
  if (!adapter.domains.includes(observation.domain)) errors.push('domain')
  if (!observation.metric.trim()) errors.push('metric')
  if (!observation.unit.trim()) errors.push('unit')
  if (!Number.isFinite(Date.parse(observation.observedAt))) errors.push('observedAt')
  if (!observation.sourceRef.trim()) errors.push('sourceRef')
  if (!Number.isFinite(observation.confidence) || observation.confidence < 0 || observation.confidence > 1) {
    errors.push('confidence')
  }

  const allowedUnits = adapter.canonicalNumericUnits?.[observation.metric]
  if (allowedUnits && !allowedUnits.includes(observation.unit)) errors.push('unit')

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze([...new Set(errors)]),
  })
}
