import assert from 'node:assert/strict'
import { Z_ANATOMY_CLEAR_INDONESIAN_ATLAS } from '../../src/domains/body-exposure/data/zAnatomyClearIndonesianAtlas.ts'
import { CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES } from '../../src/domains/one-os/omnicausalisRecursiveDiscoveryAndKnowledgeGraphEngine.ts'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import { ANATOMICAL_SYSTEM_IDS } from '../../src/types/realityView.ts'
import {
  MESH_TO_ONTOLOGY_MAP,
  REGISTERED_CANONICAL_MESH_COUNT,
  listBindingsBySystem,
  projectTm1DualCodingMetadata,
  resolveMeshOntology,
} from '../../src/engines/reality-view/anatomyOntologyRegistry.ts'

const indeksByName = new Map(INDEKS_TUBUH.map((entry) => [entry.n, entry]))
const atlasIds = new Set(Z_ANATOMY_CLEAR_INDONESIAN_ATLAS.map((card) => card.id))
const kgEdgeIds = new Set(CANONICAL_MULTISCALE_KNOWLEDGE_GRAPH_EDGES.map((edge) => edge.edgeId))

// 1. 100% of registered canonical seeds must bind verbatim to INDEKS_TUBUH (zero drift)
assert.equal(
  MESH_TO_ONTOLOGY_MAP.size,
  REGISTERED_CANONICAL_MESH_COUNT,
  `Expected all ${REGISTERED_CANONICAL_MESH_COUNT} canonical meshes to resolve in INDEKS_TUBUH, got ${MESH_TO_ONTOLOGY_MAP.size}`,
)

// 2. All 10 AnatomicalSystemId systems must have >= 1 verified 1:1 mesh binding
for (const systemId of ANATOMICAL_SYSTEM_IDS) {
  const bindings = listBindingsBySystem(systemId)
  assert.ok(bindings.length >= 1, `System ${systemId} has 0 1:1 ontology bindings`)
}

// 3. Referential integrity across INDEKS_TUBUH, Z_ANATOMY_CLEAR_INDONESIAN_ATLAS & 20-relation KG
for (const [meshId, binding] of MESH_TO_ONTOLOGY_MAP.entries()) {
  const shipped = indeksByName.get(meshId)
  assert.ok(shipped, `Mesh ${meshId} missing from INDEKS_TUBUH`)
  assert.equal(shipped.l, binding.layer, `Layer mismatch for ${meshId}`)
  assert.equal(binding.selectable, true)
  assert.ok(binding.indonesianLabel.trim().length > 0, `Missing Indonesian label for ${meshId}`)
  assert.ok(binding.englishLabel.trim().length > 0, `Missing English label for ${meshId}`)
  assert.ok(/^(FMA|UBERON):\d+$/.test(binding.canonicalOntologyId), `Invalid ontology ID ${binding.canonicalOntologyId}`)
  assert.ok(/^SCTID:\d+$/.test(binding.snomedCtId), `Invalid SNOMED-CT ID ${binding.snomedCtId}`)
  if (binding.zAnatomyAtlasCardId !== null) {
    assert.ok(atlasIds.has(binding.zAnatomyAtlasCardId), `Unknown Z-Anatomy atlas card ${binding.zAnatomyAtlasCardId}`)
  }
  assert.ok(binding.knowledgeGraphEdgeIds.length >= 1, `Mesh ${meshId} has no 20-relation KG edge anchor`)
  for (const edgeId of binding.knowledgeGraphEdgeIds) {
    assert.ok(kgEdgeIds.has(edgeId), `Unknown KG edge ${edgeId} on ${meshId}`)
  }
}

// 4. Zero fuzzy string matching at runtime + unmapped decorative meshes cleanly return selectable: false
assert.equal(resolveMeshOntology('Left ventricle').selectable, true)
assert.equal(resolveMeshOntology('left ventricle').selectable, false, 'case-insensitive fuzzy match must be rejected')
assert.equal(resolveMeshOntology('Left ventr').selectable, false, 'prefix fuzzy match must be rejected')
assert.equal(resolveMeshOntology('decorative_outer_shell_glow').selectable, false)
assert.equal(resolveMeshOntology('').selectable, false)

// 5. WHO ICD-11 Ch. 26 / TM1 dual coding is strictly optional metadata overlay (never mutates meshId/ontologyId)
const tmOff = projectTm1DualCodingMetadata('Left ventricle', false)
const tmOn = projectTm1DualCodingMetadata('Left ventricle', true)
assert.equal(tmOff.meshId, 'Left ventricle')
assert.equal(tmOff.canonicalOntologyId, 'FMA:7101')
assert.equal(tmOff.icd11Tm1Code, undefined)
assert.equal(tmOn.meshId, tmOff.meshId)
assert.equal(tmOn.canonicalOntologyId, tmOff.canonicalOntologyId)
assert.equal(tmOn.icd11Tm1Code, 'SF50')

console.log(`verify-reality-view-ontology: PASS (${MESH_TO_ONTOLOGY_MAP.size}/${REGISTERED_CANONICAL_MESH_COUNT} 1:1 meshes across 10 systems, zero fuzzy matching, TM1 immutable)`)
