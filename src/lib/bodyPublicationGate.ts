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
  /** Strict biomedical publication readiness; recorded academic review is required. */
  publishable: boolean
  /** Allows a provenance-valid evidence overlay to be shown explicitly as reference-only while review is pending. */
  referenceDisplayAllowed: boolean
  renderAsVerifiedAnatomy: boolean
  displayAsReferenceOnly: boolean
  reasons: string[]
}

/**
 * Unified fail-closed publication decision for Body Exposure / shared Body3D.
 *
 * Formula:
 * verified anatomy = target contract AND strict asset provenance AND recorded review;
 * reference evidence display = target contract AND provenance-bearing mapping;
 * biomedical publication = reference evidence display AND recorded target + mapping review.
 *
 * A pending-review overlay may remain visible only as an explicitly reference-only
 * teaching overlay. It must never be described as publication-ready and must not
 * promote the underlying geometry to verified anatomy. Procedures deliberately
 * remain outside this gate until their dedicated procedure evidence/review gate
 * declares them ready.
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
    if (kind !== 'anatomy') reasons.push('Verified-anatomy mode is restricted to anatomy projections.')
    if (!request.asset) reasons.push('Verified anatomy requires an exact asset-level provenance record.')
    if (assetValidation && !assetValidation.validForVerifiedRender) reasons.push(...assetValidation.reasons)
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
      if (!validation.publishable) {
        const mappedReasons = validation.reasons.map((reason) => `Evidence mapping ${index + 1}: ${reason}`)
        reasons.push(...mappedReasons)
        referenceReasons.push(...mappedReasons)
      }
    }

    // Academic review is a publication gate, not a prerequisite for clearly
    // labelled reference-only display. This keeps review-pending material from
    // masquerading as published biomedical content while preserving a safe
    // evidence-backed teaching/reference state.
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
  const displayAsReferenceOnly = referenceDisplayAllowed && !assetVerified

  return {
    publishable,
    referenceDisplayAllowed,
    renderAsVerifiedAnatomy,
    displayAsReferenceOnly,
    reasons: [...new Set(reasons)],
  }
}
