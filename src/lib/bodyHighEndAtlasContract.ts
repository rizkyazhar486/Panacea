import {
  BODY_HIGH_FIDELITY_REFERENCE_TIER,
  BODY_MANDATORY_REFERENCE_SOURCES,
  BODY_REFERENCE_INTERACTION_REQUIREMENTS,
  validateBodyMandatoryReferenceSources,
} from './bodyMandatoryReferenceSources'
import {
  BODY_ATLAS_GRAPH,
  BODY_ATLAS_LAYER_FILES,
  validateBodyAtlasGraph,
} from './bodyAtlasGraph'
import {
  BODY_RESPIRATORY_ATLAS,
  validateRespiratoryAtlas,
} from './bodyRespiratoryAtlas'
import {
  BODY_ATLAS_ASSET_MANIFEST,
  BODY_ATLAS_RUNTIME_PROFILES,
  validateBodyAtlasAssetManifest,
} from './bodyAtlasStreaming'

export type BodyHighEndCapability =
  | 'whole-body-source-graph'
  | 'stable-source-node-identity'
  | 'contralateral-linkage'
  | 'fail-closed-search'
  | 'adaptive-lod'
  | 'triangle-budget-residency'
  | 'layer-streaming-budget'
  | 'cryptographic-local-asset-identity'
  | 'respiratory-compartment-atlas'
  | 'airway-generation-index'
  | 'explicit-coverage-gaps'
  | 'normalized-breath-animation'
  | '5k-reference-capture'

export interface BodyHighEndAtlasContract {
  id: 'panacea-whole-body-high-end-v1'
  benchmarkReferenceIds: readonly ['thebuggeddev_anatomy', 'thebuggeddev_breath_atlas']
  runtimeAssetPolicy: 'local-assets-reference-until-provenance-reviewed'
  renderLayerCount: 7
  respiratoryCompartmentCount: 7
  capabilities: readonly BodyHighEndCapability[]
  mandatoryInteractions: typeof BODY_REFERENCE_INTERACTION_REQUIREMENTS
  externalAssetImportAllowed: false
  patientSpecificBreathingModel: false
  verifiedBiomedicalAssetPublicationAllowed: false
  assetLevelProvenanceComplete: false
  highFidelityCaptureLongEdgePx: 5120
}

export const BODY_HIGH_END_ATLAS_CONTRACT: BodyHighEndAtlasContract = {
  id: 'panacea-whole-body-high-end-v1',
  benchmarkReferenceIds: ['thebuggeddev_anatomy', 'thebuggeddev_breath_atlas'],
  runtimeAssetPolicy: 'local-assets-reference-until-provenance-reviewed',
  renderLayerCount: 7,
  respiratoryCompartmentCount: 7,
  capabilities: [
    'whole-body-source-graph',
    'stable-source-node-identity',
    'contralateral-linkage',
    'fail-closed-search',
    'adaptive-lod',
    'triangle-budget-residency',
    'layer-streaming-budget',
    'cryptographic-local-asset-identity',
    'respiratory-compartment-atlas',
    'airway-generation-index',
    'explicit-coverage-gaps',
    'normalized-breath-animation',
    '5k-reference-capture',
  ],
  mandatoryInteractions: BODY_REFERENCE_INTERACTION_REQUIREMENTS,
  externalAssetImportAllowed: false,
  patientSpecificBreathingModel: false,
  verifiedBiomedicalAssetPublicationAllowed: false,
  assetLevelProvenanceComplete: false,
  highFidelityCaptureLongEdgePx: 5120,
}

/**
 * Technical high-end atlas readiness is deliberately distinct from biomedical
 * publication readiness. A Git blob SHA proves the checked-in bytes are
 * addressable and stable inside this repository; it does not prove upstream
 * source identity, asset-level licensing, transformation lineage, or qualified
 * anatomical review. Until those records exist for every runtime atlas asset,
 * the atlas may operate as an explicitly reference/teaching experience but the
 * contract must not claim verified biomedical asset provenance.
 */
export function validateBodyHighEndAtlasContract() {
  const reasons: string[] = []
  const mandatoryReferences = validateBodyMandatoryReferenceSources()
  const atlasGraph = validateBodyAtlasGraph()
  const respiratory = validateRespiratoryAtlas()
  const assets = validateBodyAtlasAssetManifest()

  reasons.push(...mandatoryReferences.reasons, ...atlasGraph.reasons, ...respiratory.reasons, ...assets.reasons)

  const referenceById = new Map(BODY_MANDATORY_REFERENCE_SOURCES.map((source) => [source.id, source] as const))
  for (const referenceId of BODY_HIGH_END_ATLAS_CONTRACT.benchmarkReferenceIds) {
    const reference = referenceById.get(referenceId)
    if (!reference) reasons.push(`Missing mandatory high-end benchmark reference: ${referenceId}.`)
    else {
      if (!reference.requiredForDesignReview) reasons.push(`${referenceId}: benchmark must remain mandatory for design review.`)
      if (reference.runtimeAssetImportAllowed) reasons.push(`${referenceId}: external runtime asset import must remain blocked.`)
    }
  }

  if (BODY_HIGH_END_ATLAS_CONTRACT.externalAssetImportAllowed) reasons.push('High-end atlas contract must not enable external benchmark asset import.')
  if (BODY_HIGH_END_ATLAS_CONTRACT.patientSpecificBreathingModel) reasons.push('Generic Breath Atlas visualization must not masquerade as a patient-specific breathing model.')
  if (BODY_HIGH_END_ATLAS_CONTRACT.assetLevelProvenanceComplete) reasons.push('Asset-level provenance must remain pending until exact source/revision/license/transformation records exist for every runtime atlas asset.')
  if (BODY_HIGH_END_ATLAS_CONTRACT.verifiedBiomedicalAssetPublicationAllowed) reasons.push('Verified biomedical atlas publication must remain blocked while asset-level provenance and qualified review are incomplete.')
  if (BODY_HIGH_END_ATLAS_CONTRACT.highFidelityCaptureLongEdgePx !== BODY_HIGH_FIDELITY_REFERENCE_TIER.longEdgePx) {
    reasons.push('High-end capture tier must stay aligned with the mandatory 5K reference contract.')
  }

  const layerCount = Object.keys(BODY_ATLAS_LAYER_FILES).length
  if (layerCount !== BODY_HIGH_END_ATLAS_CONTRACT.renderLayerCount) reasons.push(`Expected ${BODY_HIGH_END_ATLAS_CONTRACT.renderLayerCount} whole-body render layers; found ${layerCount}.`)
  if (BODY_ATLAS_ASSET_MANIFEST.length !== layerCount) reasons.push('Every whole-body render layer must have one local asset identity record.')
  if (BODY_ATLAS_GRAPH.stats.nodeCount <= 0) reasons.push('Whole-body source graph must contain actual named source meshes.')
  if (BODY_RESPIRATORY_ATLAS.compartments.length !== BODY_HIGH_END_ATLAS_CONTRACT.respiratoryCompartmentCount) reasons.push('Respiratory compartment contract is incomplete.')

  const runtimeProfiles = Object.keys(BODY_ATLAS_RUNTIME_PROFILES)
  for (const required of ['constrained-mobile', 'balanced', 'workstation', '5k-reference-capture']) {
    if (!runtimeProfiles.includes(required)) reasons.push(`Missing runtime profile: ${required}.`)
  }

  const capabilities = new Set(BODY_HIGH_END_ATLAS_CONTRACT.capabilities)
  const requiredCapabilities: readonly BodyHighEndCapability[] = [
    'whole-body-source-graph',
    'stable-source-node-identity',
    'fail-closed-search',
    'adaptive-lod',
    'cryptographic-local-asset-identity',
    'respiratory-compartment-atlas',
    'explicit-coverage-gaps',
    '5k-reference-capture',
  ]
  for (const capability of requiredCapabilities) {
    if (!capabilities.has(capability)) reasons.push(`Missing high-end atlas capability: ${capability}.`)
  }

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] }
}
