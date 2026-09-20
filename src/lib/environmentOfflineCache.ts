/**
 * Offline cache contract for source-backed environment data.
 *
 * Stores only provenance metadata needed to judge whether an offline snapshot
 * may be used as current context or only as historical/reference material.
 * Payload persistence is implemented elsewhere.
 */

import {
  assessEnvironmentSourceFreshness,
  validateEnvironmentSourceAdapter,
  type EnvironmentPayloadKind,
  type EnvironmentSourceAdapter,
  type EnvironmentSourceFreshness,
  type EnvironmentSourceTruthClass,
} from './environmentSourceAdapter'

export interface EnvironmentOfflineCacheEntry {
  cacheId: string
  adapterId: string
  sourceId: string
  sourceVersion: string
  sourceRef: string
  payloadKind: EnvironmentPayloadKind
  truthClass: EnvironmentSourceTruthClass
  /** Observation time, reference release time, or forecast issue time. */
  sourceTime: string
  /** Forecast target/valid time when applicable; never substitutes for sourceTime. */
  validAt?: string
  cachedAt: string
  payloadSha256: string
  byteLength: number
  licenseRef: string
  authorityRef: string
}

export interface EnvironmentOfflineCacheAssessment {
  valid: boolean
  errors: readonly string[]
  freshness: EnvironmentSourceFreshness
  cacheAgeMs: number | null
  targetState: 'not-applicable' | 'future-target' | 'target-reached-or-past' | 'invalid-target'
  usableAsCurrentSourceContext: boolean
  historicalReadable: boolean
}

const SHA256_HEX = /^[a-f0-9]{64}$/i

export function validateEnvironmentOfflineCacheEntry(
  adapter: EnvironmentSourceAdapter,
  entry: EnvironmentOfflineCacheEntry,
): string[] {
  const errors = [...validateEnvironmentSourceAdapter(adapter)]
  if (!entry.cacheId?.trim()) errors.push('cacheId')
  if (entry.adapterId !== adapter.adapterId) errors.push('adapterId')
  if (entry.sourceId !== adapter.sourceId) errors.push('sourceId')
  if (entry.sourceVersion !== adapter.sourceVersion) errors.push('sourceVersion')
  if (!entry.sourceRef?.trim()) errors.push('sourceRef')
  if (!adapter.payloadKinds.includes(entry.payloadKind)) errors.push('payloadKind')
  if (entry.truthClass !== adapter.truthClass) errors.push('truthClass')
  if (!Number.isFinite(Date.parse(entry.sourceTime))) errors.push('sourceTime')
  if (!Number.isFinite(Date.parse(entry.cachedAt))) errors.push('cachedAt')
  if (!SHA256_HEX.test(entry.payloadSha256)) errors.push('payloadSha256')
  if (!Number.isInteger(entry.byteLength) || entry.byteLength <= 0) errors.push('byteLength')
  if (entry.licenseRef !== adapter.licenseRef) errors.push('licenseRef')
  if (entry.authorityRef !== adapter.authorityRef) errors.push('authorityRef')

  const sourceMs = Date.parse(entry.sourceTime)
  const cachedMs = Date.parse(entry.cachedAt)
  if (Number.isFinite(sourceMs) && Number.isFinite(cachedMs) && cachedMs < sourceMs) {
    errors.push('cache-before-source')
  }

  if (entry.validAt !== undefined) {
    const validMs = Date.parse(entry.validAt)
    if (!Number.isFinite(validMs)) errors.push('validAt')
    else if (Number.isFinite(sourceMs) && validMs < sourceMs) errors.push('validAt')
    if (!adapter.payloadKinds.includes('forecast-report')) errors.push('validAt-without-forecast')
  }

  return [...new Set(errors)]
}

/**
 * Current-source use is intentionally stricter than historical readability:
 * - invalid provenance or time fails closed;
 * - stale/age-unknown snapshots remain inspectable but cannot masquerade as
 *   current source context;
 * - a forecast whose target time has already passed is retained as history.
 */
export function assessEnvironmentOfflineCacheEntry(
  adapter: EnvironmentSourceAdapter,
  entry: EnvironmentOfflineCacheEntry,
  now: string,
): EnvironmentOfflineCacheAssessment {
  const errors = validateEnvironmentOfflineCacheEntry(adapter, entry)
  const freshness = assessEnvironmentSourceFreshness(adapter, entry.sourceTime, now)
  const nowMs = Date.parse(now)
  const cachedMs = Date.parse(entry.cachedAt)

  if (!Number.isFinite(nowMs)) errors.push('now')
  if (Number.isFinite(cachedMs) && Number.isFinite(nowMs) && cachedMs > nowMs) {
    errors.push('future-cache-time')
  }
  if (freshness.state === 'invalid-time') errors.push('source-time')

  let targetState: EnvironmentOfflineCacheAssessment['targetState'] = 'not-applicable'
  if (entry.validAt !== undefined) {
    const validMs = Date.parse(entry.validAt)
    if (!Number.isFinite(validMs) || !Number.isFinite(nowMs)) targetState = 'invalid-target'
    else targetState = validMs > nowMs ? 'future-target' : 'target-reached-or-past'
  }

  const uniqueErrors = [...new Set(errors)]
  const valid = uniqueErrors.length === 0
  const targetAllowsCurrentUse =
    entry.validAt === undefined || targetState === 'future-target'

  return Object.freeze({
    valid,
    errors: Object.freeze(uniqueErrors),
    freshness,
    cacheAgeMs:
      Number.isFinite(cachedMs) && Number.isFinite(nowMs)
        ? Math.max(0, nowMs - cachedMs)
        : null,
    targetState,
    usableAsCurrentSourceContext:
      valid && freshness.state === 'fresh' && targetAllowsCurrentUse,
    historicalReadable:
      valid && freshness.state !== 'invalid-time',
  })
}

export const ENVIRONMENT_OFFLINE_CACHE_POLICY = Object.freeze({
  payloadDigestRequired: true as const,
  sourceVersionPinned: true as const,
  sourceLicenseAndAuthorityPinned: true as const,
  staleDataCannotMasqueradeAsCurrent: true as const,
  ageUnknownCannotMasqueradeAsCurrent: true as const,
  forecastIssueAndTargetTimeRemainDistinct: true as const,
})
