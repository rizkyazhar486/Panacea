import assert from 'node:assert/strict'
import { BODY_MANDATORY_REFERENCE_SOURCES } from '../../src/lib/bodyMandatoryReferenceSources.ts'
import { BODY_ATLAS_GRAPH } from '../../src/lib/bodyAtlasGraph.ts'
import { BODY_RESPIRATORY_ATLAS } from '../../src/lib/bodyRespiratoryAtlas.ts'
import { BODY_ATLAS_ASSET_MANIFEST } from '../../src/lib/bodyAtlasStreaming.ts'
import {
  BODY_HIGH_END_ATLAS_CONTRACT,
  validateBodyHighEndAtlasContract,
} from '../../src/lib/bodyHighEndAtlasContract.ts'

const validation = validateBodyHighEndAtlasContract()
assert.equal(validation.valid, true, validation.reasons.join('\n'))
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.id, 'panacea-whole-body-high-end-v1')
assert.deepEqual([...BODY_HIGH_END_ATLAS_CONTRACT.benchmarkReferenceIds], [
  'thebuggeddev_anatomy',
  'thebuggeddev_breath_atlas',
])
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.externalAssetImportAllowed, false)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.patientSpecificBreathingModel, false)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.verifiedBiomedicalAssetPublicationAllowed, false)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.assetLevelProvenanceComplete, false)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.runtimeAssetPolicy, 'local-assets-reference-until-provenance-reviewed')
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.highFidelityCaptureLongEdgePx, 5120)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.renderLayerCount, 7)
assert.equal(BODY_HIGH_END_ATLAS_CONTRACT.respiratoryCompartmentCount, 7)

for (const id of BODY_HIGH_END_ATLAS_CONTRACT.benchmarkReferenceIds) {
  const source = BODY_MANDATORY_REFERENCE_SOURCES.find((entry) => entry.id === id)
  assert.ok(source)
  assert.equal(source.requiredForDesignReview, true)
  assert.equal(source.runtimeAssetImportAllowed, false)
  assert.equal(source.verifiedAnatomyAllowed, false)
}

assert.ok(BODY_ATLAS_GRAPH.nodes.length > 0)
assert.equal(BODY_ATLAS_ASSET_MANIFEST.length, 7)
assert.equal(BODY_RESPIRATORY_ATLAS.compartments.length, 7)
assert.ok(BODY_HIGH_END_ATLAS_CONTRACT.capabilities.includes('whole-body-source-graph'))
assert.ok(BODY_HIGH_END_ATLAS_CONTRACT.capabilities.includes('respiratory-compartment-atlas'))
assert.ok(BODY_HIGH_END_ATLAS_CONTRACT.capabilities.includes('cryptographic-local-asset-identity'))
assert.equal(
  BODY_HIGH_END_ATLAS_CONTRACT.capabilities.some((capability) => capability === ('cryptographic-local-asset-provenance' as never)),
  false,
)
assert.ok(BODY_HIGH_END_ATLAS_CONTRACT.capabilities.includes('explicit-coverage-gaps'))

console.log(`High-end atlas contract: ${BODY_ATLAS_GRAPH.nodes.length} local source meshes + ${BODY_RESPIRATORY_ATLAS.nodes.length} respiratory-classified meshes; cryptographic local identity is preserved while verified biomedical provenance remains explicitly blocked pending asset-level source/license/transformation records and qualified review.`)
