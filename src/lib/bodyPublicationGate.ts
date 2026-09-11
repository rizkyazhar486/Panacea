import type { BodyProjectionTarget, ProjectionKind } from './bodyProjectionContract'
import { validateBodyAssetProvenance, type BodyAssetProvenanceRecord } from './bodyAssetProvenance'
import { validateBodyEvidenceMapping, type BodyEvidenceMappingRecord } from './bodyEvidenceMapping'

export type BodyPublicationMode = 'verified-anatomy' | 'evidence-overlay'

export interface BodyPublicationRequest {
  mode: BodyPublicationMode
  kind: ProjectionKind
  target: BodyProjectionTarget
  asset?: BodyAssetProvenanceRecord
  evidence?: BodyEvidenceMappingRecord[]
}

export interface BodyPublicationDecision {
  /** Strict biomedical publication readiness. */
  publishable: boolean
  /** Provenance-valid evidence may remain visible as explicitly reference-only while review is pending. */
  referenceDisplayAllowed: boolean
  renderAsVerifiedAnatomy: boolean
  displayAsReferenceOnly: boolean
  reasons: string[]
}

const REVIEW_ONLY_EVIDENCE_REASON = 'Target requires recorded academic review metadata for publication.'

/**
 * Unified fail-closed publication decision for Body Exposure / shared Body3D.
 *
 * Formula:
 * verified anatomy = target contract AND strict asset provenance AND recorded review;
 * reference evidence display = provenance-valid mapping AND safe target contract;
 * biomedical publication = reference evidence display AND recorded target + mapping review.
 *
 * Review-pending evidence may remain visible only as an explicitly reference-only
 * teaching overlay. It must never be described as publication-ready, and verified
 * underlying geometry must not launder an unreviewed overlay into a verified claim.
 * Procedures remain delegated to the dedicated procedure publication gate.
 */
export function evaluateBodyPublication(request: BodyPublicationRequest): BodyPublicationDecision {
  const { target, kind } = request
  const reasons: string[] = []
  const referenceReasons: string[] = []

  const addSharedReason = (reason: string) => {
    reasons.push(reason)
    referenceReasons.push(reason)
  }

  if (!target.kinds.includes(kind)) addSharedReason(`Projection target does not permit publication kind "${kind}".`)
  if (target.geometryStatus === 'blocked' || target.evidenceStatus === 'unsupported') {
    addSharedReason('Projection target contract blocks publication.')
  }

  if (kind === 'procedure') {
    addSharedReason('Procedure publication requires a dedicated procedure evidence and qualified-review gate.')
  }

  const assetValidation = request.asset ? validateBodyAssetProvenance(target, request.asset) : null
  const assetVerified = Boolean(assetValidation?.validForVerifiedRender)

  if (request.mode === 'verified-anatomy') {
    if (kind !== 'anatomy') addSharedReason('Verified-anatomy mode is restricted to anatomy projections.')
    if (!request.asset) addSharedReason('Verified anatomy requires an exact asset-level provenance record.')
    if (assetValidation && !assetValidation.validForVerifiedRender) {
      for (const reason of assetValidation.reasons) addSharedReason(reason)
    }
  }

  if (request.mode === 'evidence-overlay') {
    if (kind === 'anatomy' || kind === 'procedure') {
      addSharedReason('Evidence-overlay mode only accepts lesion, drug-target, adverse-effect, or physiology mappings.')
    }

    const evidence = request.evidence ?? []
    if (evidence.length === 0) addSharedReason('Evidence overlay requires at least one provenance-bearing mapping.')

    for (const [index, record] of evidence.entries()) {
      if (record.kind !== kind) addSharedReason(`Evidence mapping ${index + 1} kind does not match publication kind.`)
      const validation = validateBodyEvidenceMapping(target, record)
      for (const reason of validation.reasons) {
        const mapped = `Evidence mapping ${index + 1}: ${reason}`
        reasons.push(mapped)
        if (reason !== REVIEW_ONLY_EVIDENCE_REASON) referenceReasons.push(mapped)
      }
    }

    if (target.academicReview !== 'recorded') {
      reasons.push('Target academic review must be recorded before biomedical publication.')
    }
    for (const [index, record] of evidence.entries()) {
      if (record.academicReview.status !== 'recorded') {
        reasons.push(`Evidence mapping ${index + 1}: academic review must be recorded before biomedical publication.`)
      }
    }
  }

  const referenceDisplayAllowed = request.mode === 'evidence-overlay' && referenceReasons.length === 0
  const publishable = reasons.length === 0
  const renderAsVerifiedAnatomy = publishable && request.mode === 'verified-anatomy' && assetVerified
  const displayAsReferenceOnly = referenceDisplayAllowed && (!publishable || !assetVerified)

  return {
    publishable,
    referenceDisplayAllowed,
    renderAsVerifiedAnatomy,
    displayAsReferenceOnly,
    reasons: [...new Set(reasons)],
  }
}
