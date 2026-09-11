import assert from 'node:assert/strict'
import {
  EYE_MOLECULAR_WAVE5_EDGES,
  EYE_MOLECULAR_WAVE5_NODES,
  EYE_WAVE5_SCIENTIFIC_BOUNDARY,
  validateEyeMolecularWave5,
} from '../../src/lib/anatomy/eyeMolecularWave5.ts'

assert.deepEqual(validateEyeMolecularWave5(), [])

const nodes = new Map(EYE_MOLECULAR_WAVE5_NODES.map((node) => [node.id, node]))
const edges = new Map(EYE_MOLECULAR_WAVE5_EDGES.map((edge) => [edge.id, edge]))

assert.equal(nodes.get('rho-protein')?.externalIdentifier, 'UniProtKB:P08100')
assert.match(nodes.get('rho-gene')?.externalIdentifier ?? '', /NCBI-Gene:6010/)
assert.match(nodes.get('rho-gene')?.externalIdentifier ?? '', /ENSG00000163914/)
assert.equal(nodes.get('rho-reviewed-transcript')?.externalIdentifier, 'RefSeq:NM_000539.3')
assert.equal(nodes.get('rho-reviewed-protein-sequence')?.externalIdentifier, 'RefSeq:NP_000530.1')
assert.equal(nodes.get('rho-reactome-entity')?.externalIdentifier, 'Reactome:R-HSA-419802')

assert.equal(edges.get('rho-localized-disc')?.to, 'rod-outer-segment-discs')
assert.equal(edges.get('rho-localized-disc')?.evidence.locator, 'R-HSA-419802')
assert.equal(edges.get('rho-binds-11cis-retinal')?.relation, 'binds')
assert.equal(edges.get('rho-binds-11cis-retinal')?.evidence.sourceVersion, 'RS_2025_08;GRCh38.p14')
assert.equal(edges.get('rho-transcript-reviewed-protein')?.evidence.locator, 'NM_000539.3->NP_000530.1')

for (const node of EYE_MOLECULAR_WAVE5_NODES) {
  assert.equal(node.representation, 'molecular-reference-only')
  assert.equal(node.reviewStatus, 'academic-review-pending')
  assert.equal(node.patientSpecific, false)
  assert.equal(node.inferredFromFreeText, false)
  assert.equal(node.publicationReady, false)
}

for (const edge of EYE_MOLECULAR_WAVE5_EDGES) {
  assert.equal(edge.patientSpecific, false)
  assert.equal(edge.inferredFromFreeText, false)
  assert.equal(edge.publicationReady, false)
  assert.equal(edge.evidence.retrievedOn, '2026-09-09')
  assert.ok(edge.evidence.locator.length > 3)
  assert.ok(edge.evidence.sourceVersion.length > 3)
}

assert.match(EYE_WAVE5_SCIENTIFIC_BOUNDARY, /Do not infer patient expression/)
assert.match(EYE_WAVE5_SCIENTIFIC_BOUNDARY, /pathogenicity/)
assert.match(EYE_WAVE5_SCIENTIFIC_BOUNDARY, /gross-anatomy geometry/)

const unsafe = EYE_MOLECULAR_WAVE5_NODES.map((node) => ({ ...node }))
unsafe[0] = { ...unsafe[0], publicationReady: true as false }
assert.ok(validateEyeMolecularWave5(unsafe, EYE_MOLECULAR_WAVE5_EDGES).some((error) => error.startsWith('unsafe-node:')))

console.log(`eye-molecular-wave5: ok (${EYE_MOLECULAR_WAVE5_NODES.length} nodes; ${EYE_MOLECULAR_WAVE5_EDGES.length} provenance-bearing edges)`)
