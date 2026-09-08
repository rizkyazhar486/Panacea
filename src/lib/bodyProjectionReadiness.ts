import type { AcademicReviewStatus, BodyProjectionTarget, EvidenceStatus, GeometryStatus } from './bodyProjectionContract'

export type ProjectionReadiness = 'blocked' | 'reference-only' | 'verification-required' | 'verified-reference'

export interface ProjectionAssetProvenance {
  targetId: string
  sourceId: string
  assetId: string
  sourceRevision: string
  license: string
  attribution: string
  transformationHistory: string[]
  geometryStatus: Extract<GeometryStatus, 'verified-native' | 'verified-adjacent'>
  evidenceStatus: Extract<EvidenceStatus, 'source-checked' | 'human-reviewed'>
  academicReview: AcademicReviewStatus
  reviewerName?: string
  reviewerCredentials?: string
  reviewerDate?: string
  reviewerScope?: string
}

export interface ProjectionReadinessResult {
  readiness: ProjectionReadiness
  renderAsVerifiedAnatomy: boolean
  reasons: string[]
}

const nonBlank = (value: string | undefined) => Boolean(value?.trim())

/**
 * Fail-closed readiness gate for Body3D projection assets.
 *
 * A roadmap target can only render as verified reference anatomy when an
 * asset-level record pins source identity/revision/license/attribution,
 * preserves transformation history, and satisfies the target's evidence and
 * academic-review contract. Repository-level licensing or a matching label is
 * intentionally insufficient.
 */
export function evaluateProjectionReadiness(
  target: BodyProjectionTarget,
  provenance?: ProjectionAssetProvenance,
): ProjectionReadinessResult {
  const reasons: string[] = []

  if (target.geometryStatus === 'blocked' || target.evidenceStatus === 'unsupported') {
    return { readiness: 'blocked', renderAsVerifiedAnatomy: false, reasons: ['Target contract blocks verified rendering.'] }
  }

  if (target.geometryStatus === 'reference-only') {
    return {
      readiness: 'reference-only',
      renderAsVerifiedAnatomy: false,
      reasons: ['Target is conceptual/reference-only and must not be promoted to gross-organ verified geometry.'],
    }
  }

  if (!provenance) {
    return { readiness: 'verification-required', renderAsVerifiedAnatomy: false, reasons: ['No asset-level provenance record is attached.'] }
  }

  if (provenance.targetId !== target.id) reasons.push('Asset provenance is attached to a different projection target.')
  if (!target.preferredSourceIds.includes(provenance.sourceId as never)) reasons.push('Source identity is not an approved source for this target contract.')
  if (!nonBlank(provenance.assetId)) reasons.push('Asset identity is missing.')
  if (!nonBlank(provenance.sourceRevision)) reasons.push('Source revision is missing.')
  if (!nonBlank(provenance.license)) reasons.push('Asset-level license is missing.')
  if (!nonBlank(provenance.attribution)) reasons.push('Asset attribution is missing.')
  if (!provenance.transformationHistory.length || provenance.transformationHistory.some((step) => !nonBlank(step))) {
    reasons.push('Transformation history is missing or incomplete.')
  }
  if (!['verified-native', 'verified-adjacent'].includes(provenance.geometryStatus)) reasons.push('Geometry is not verified.')
  if (!['source-checked', 'human-reviewed'].includes(provenance.evidenceStatus)) reasons.push('Evidence has not been source-checked.')

  if (target.academicReview === 'recorded') {
    if (provenance.academicReview !== 'recorded') reasons.push('Required academic review has not been recorded.')
    if (!nonBlank(provenance.reviewerName)) reasons.push('Reviewer identity is missing.')
    if (!nonBlank(provenance.reviewerCredentials)) reasons.push('Reviewer credentials are missing.')
    if (!nonBlank(provenance.reviewerDate)) reasons.push('Reviewer date is missing.')
    if (!nonBlank(provenance.reviewerScope)) reasons.push('Reviewer scope is missing.')
  }

  if (target.patientSpecificAllowed) reasons.push('Reference Body3D projection contract must not silently enable patient-specific geometry.')

  return reasons.length
    ? { readiness: 'verification-required', renderAsVerifiedAnatomy: false, reasons }
    : { readiness: 'verified-reference', renderAsVerifiedAnatomy: true, reasons: [] }
}

export function canRenderProjectionAsVerified(
  target: BodyProjectionTarget,
  provenance?: ProjectionAssetProvenance,
): boolean {
  return evaluateProjectionReadiness(target, provenance).renderAsVerifiedAnatomy
}
