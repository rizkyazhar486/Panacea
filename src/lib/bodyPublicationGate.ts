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
  publishable: boolean
  renderAsVerifiedAnatomy: boolean
  displayAsReferenceOnly: boolean
  reasons: string[]
}

/**
 * Unified fail-closed publication decision for Body Exposure / shared Body3D.
 *
 * Formula:
 * verified anatomy = target contract AND strict asset provenance;
 * evidence overlay = target contract AND at least one valid provenance-bearing
 * mapping. An overlay can be publishable as reference-only without promoting
 * the underlying geometry to verified anatomy. Procedures deliberately remain
 * outside this gate until a procedure-specific evidence/review contract exists.
 */
export function evaluateBodyPublication(request: BodyPublicationRequest): BodyPublicationDecision {
  const { target, kind } = request
  const reasons: string[] = []

  if (!target.kinds.includes(kind)) reasons.push(`Projection target does not permit publication kind "${kind}".`)
  if (target.geometryStatus === 'blocked' || target.evidenceStatus === 'unsupported') {
    reasons.push('Projection target contract blocks publication.')
  }

  if (kind === 'procedure') {
    reasons.push('Procedure publication requires a dedicated procedure evidence and qualified-review gate.')
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
      reasons.push('Evidence-overlay mode only accepts lesion, drug-target, adverse-effect, or physiology mappings.')
    }

    const evidence = request.evidence ?? []
    if (evidence.length === 0) reasons.push('Evidence overlay requires at least one provenance-bearing mapping.')

    for (const [index, record] of evidence.entries()) {
      if (record.kind !== kind) reasons.push(`Evidence mapping ${index + 1} kind does not match publication kind.`)
      const validation = validateBodyEvidenceMapping(target, record)
      if (!validation.publishable) reasons.push(...validation.reasons.map((reason) => `Evidence mapping ${index + 1}: ${reason}`))
    }
  }

  const publishable = reasons.length === 0
  const renderAsVerifiedAnatomy = publishable && request.mode === 'verified-anatomy' && assetVerified
  const displayAsReferenceOnly = publishable && request.mode === 'evidence-overlay' && !assetVerified

  return {
    publishable,
    renderAsVerifiedAnatomy,
    displayAsReferenceOnly,
    reasons: [...new Set(reasons)],
  }
}
