export type ScientificSnapshotKind = 'api-response' | 'release-file' | 'manual-curation'

export interface ScientificSourceSnapshot {
  sourceId: string
  sourceVersion: string | null
  retrievedAt: string
  kind: ScientificSnapshotKind
  upstreamUrl: string
  contentDigest: string | null
  licenseState: 'verified' | 'unknown' | 'restricted'
  immutable: boolean
}

export interface SnapshotDecision {
  reusable: boolean
  refreshRequired: boolean
  reasons: string[]
}

function validIsoDate(value: string): boolean {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function normalizedIdentity(value: string | null): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized === '' ? null : normalized
}

function hasHttpsIdentity(value: string): boolean {
  return typeof value === 'string' && value.startsWith('https://')
}

function sameIdentity(a: ScientificSourceSnapshot, b: ScientificSourceSnapshot): boolean {
  const aSourceId = normalizedIdentity(a.sourceId)
  const bSourceId = normalizedIdentity(b.sourceId)
  if (!aSourceId || !bSourceId || aSourceId !== bSourceId) return false

  const aSourceVersion = normalizedIdentity(a.sourceVersion)
  const bSourceVersion = normalizedIdentity(b.sourceVersion)
  if (aSourceVersion && bSourceVersion) return aSourceVersion === bSourceVersion

  const aContentDigest = normalizedIdentity(a.contentDigest)
  const bContentDigest = normalizedIdentity(b.contentDigest)
  if (aContentDigest && bContentDigest) return aContentDigest === bContentDigest
  return false
}

/**
 * Decides whether a previously captured scientific source snapshot can be reused.
 * This never grants redistribution rights and never upgrades source evidence.
 */
export function decideSnapshotReuse(
  current: ScientificSourceSnapshot,
  candidate: ScientificSourceSnapshot,
): SnapshotDecision {
  const reasons: string[] = []

  if (!validIsoDate(current.retrievedAt) || !validIsoDate(candidate.retrievedAt)) {
    reasons.push('invalid retrieval timestamp')
  }
  if (!hasHttpsIdentity(current.upstreamUrl) || !hasHttpsIdentity(candidate.upstreamUrl)) {
    reasons.push('non-https upstream identity')
  }
  if (candidate.licenseState !== 'verified') {
    reasons.push('candidate license/access state is not verified')
  }
  if (!sameIdentity(current, candidate)) {
    reasons.push('source version or digest identity changed')
  }
  if (!candidate.immutable && !normalizedIdentity(candidate.sourceVersion) && !normalizedIdentity(candidate.contentDigest)) {
    reasons.push('mutable unversioned snapshot lacks digest identity')
  }

  const reusable = reasons.length === 0
  return { reusable, refreshRequired: !reusable, reasons }
}

export function snapshotCacheKey(snapshot: ScientificSourceSnapshot): string | null {
  const sourceId = normalizedIdentity(snapshot.sourceId)
  const identity = normalizedIdentity(snapshot.sourceVersion) ?? normalizedIdentity(snapshot.contentDigest)
  if (!sourceId || !identity) return null
  return `${sourceId}:${identity}:${snapshot.kind}`
}

export function mayClaimSnapshotComplete(snapshot: ScientificSourceSnapshot): boolean {
  return Boolean(
    normalizedIdentity(snapshot.sourceId) &&
      normalizedIdentity(snapshot.sourceVersion) &&
      normalizedIdentity(snapshot.contentDigest) &&
      hasHttpsIdentity(snapshot.upstreamUrl) &&
      snapshot.licenseState === 'verified' &&
      snapshot.immutable &&
      validIsoDate(snapshot.retrievedAt),
  )
}

export const SCIENTIFIC_SNAPSHOT_BOUNDARY =
  'A cached Panacea scientific snapshot preserves source identity and reproducibility only. It does not imply full upstream coverage, redistribution rights, causal validity, clinical validity, or patient-specific applicability.'
