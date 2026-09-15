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
  const time = Date.parse(value)
  return Number.isFinite(time)
}

function sameIdentity(a: ScientificSourceSnapshot, b: ScientificSourceSnapshot): boolean {
  if (a.sourceId !== b.sourceId) return false
  if (a.sourceVersion && b.sourceVersion) return a.sourceVersion === b.sourceVersion
  if (a.contentDigest && b.contentDigest) return a.contentDigest === b.contentDigest
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
  if (!current.upstreamUrl.startsWith('https://') || !candidate.upstreamUrl.startsWith('https://')) {
    reasons.push('non-https upstream identity')
  }
  if (candidate.licenseState !== 'verified') {
    reasons.push('candidate license/access state is not verified')
  }
  if (!sameIdentity(current, candidate)) {
    reasons.push('source version or digest identity changed')
  }
  if (!candidate.immutable && !candidate.sourceVersion && !candidate.contentDigest) {
    reasons.push('mutable unversioned snapshot lacks digest identity')
  }

  const reusable = reasons.length === 0
  return { reusable, refreshRequired: !reusable, reasons }
}

export function snapshotCacheKey(snapshot: ScientificSourceSnapshot): string | null {
  const identity = snapshot.sourceVersion ?? snapshot.contentDigest
  if (!identity || !snapshot.sourceId) return null
  return `${snapshot.sourceId}:${identity}:${snapshot.kind}`
}

export function mayClaimSnapshotComplete(snapshot: ScientificSourceSnapshot): boolean {
  return Boolean(
    snapshot.sourceVersion &&
      snapshot.contentDigest &&
      snapshot.licenseState === 'verified' &&
      snapshot.immutable &&
      validIsoDate(snapshot.retrievedAt),
  )
}

export const SCIENTIFIC_SNAPSHOT_BOUNDARY =
  'A cached Panacea scientific snapshot preserves source identity and reproducibility only. It does not imply full upstream coverage, redistribution rights, causal validity, clinical validity, or patient-specific applicability.'
