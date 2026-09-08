import {
  BODY_ATLAS_GRAPH,
  validateBodyAtlasGraph,
  type BodyAtlasGraph,
  type BodyAtlasLayer,
} from './bodyAtlasGraph'
import {
  planBodyAtlasStreaming,
  type BodyAtlasRuntimeProfileId,
  type BodyAtlasStreamingPlan,
} from './bodyAtlasStreaming'
import {
  BODY_HIGH_END_ATLAS_CONTRACT,
  validateBodyHighEndAtlasContract,
} from './bodyHighEndAtlasContract'

export interface BodyAtlasAdmissionRequest {
  profile: BodyAtlasRuntimeProfileId
  focusLayers?: readonly BodyAtlasLayer[]
  visibleLayers?: readonly BodyAtlasLayer[]
  warmLayers?: readonly BodyAtlasLayer[]
}

export interface BodyAtlasAdmissionDecision {
  technicalReady: boolean
  referenceDisplayAllowed: boolean
  biomedicalPublishable: boolean
  streaming: BodyAtlasStreamingPlan
  technicalReasons: string[]
  publicationReasons: string[]
}

/**
 * Canonical admission controller for the high-end Body atlas.
 *
 * TechnicalReady = GraphValid ∧ HighEndContractValid ∧ ¬MandatoryBudgetExceeded
 * ReferenceDisplayAllowed = TechnicalReady
 * BiomedicalPublishable = TechnicalReady ∧ AssetLevelProvenanceComplete
 *                         ∧ VerifiedBiomedicalAssetPublicationAllowed
 *
 * This controller intentionally does not invent clinical coverage thresholds,
 * anatomical importance, patient-specific measurements, or reviewer status.
 */
export function evaluateBodyAtlasAdmission(
  request: BodyAtlasAdmissionRequest,
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
): BodyAtlasAdmissionDecision {
  const technicalReasons: string[] = []
  const publicationReasons: string[] = []

  const graphValidation = validateBodyAtlasGraph(graph)
  if (!graphValidation.valid) technicalReasons.push(...graphValidation.reasons.map((reason) => `Atlas graph: ${reason}`))

  const contractValidation = validateBodyHighEndAtlasContract()
  if (!contractValidation.valid) technicalReasons.push(...contractValidation.reasons.map((reason) => `High-end contract: ${reason}`))

  const streaming = planBodyAtlasStreaming({
    profile: request.profile,
    focusLayers: request.focusLayers,
    visibleLayers: request.visibleLayers,
    warmLayers: request.warmLayers,
  }, graph)

  if (streaming.mandatoryBudgetExceeded) {
    technicalReasons.push(
      `Mandatory focus layers exceed the ${streaming.profile.id} runtime residency budget; focus geometry is preserved but this request is not technically admitted.`,
    )
  }

  const technicalReady = technicalReasons.length === 0
  const referenceDisplayAllowed = technicalReady

  if (!BODY_HIGH_END_ATLAS_CONTRACT.assetLevelProvenanceComplete) {
    publicationReasons.push('Asset-level source/revision/license/transformation provenance is incomplete for the runtime atlas assets.')
  }
  if (!BODY_HIGH_END_ATLAS_CONTRACT.verifiedBiomedicalAssetPublicationAllowed) {
    publicationReasons.push('Verified biomedical atlas publication remains disabled pending complete provenance and qualified academic review.')
  }
  if (!technicalReady) publicationReasons.push('Technical atlas admission has not passed.')

  const biomedicalPublishable = technicalReady
    && BODY_HIGH_END_ATLAS_CONTRACT.assetLevelProvenanceComplete
    && BODY_HIGH_END_ATLAS_CONTRACT.verifiedBiomedicalAssetPublicationAllowed

  return {
    technicalReady,
    referenceDisplayAllowed,
    biomedicalPublishable,
    streaming,
    technicalReasons: [...new Set(technicalReasons)],
    publicationReasons: [...new Set(publicationReasons)],
  }
}
