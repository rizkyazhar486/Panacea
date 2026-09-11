import assert from 'node:assert/strict'
import {
  EYE_CONE_OPSIN_WAVE5B_BOUNDARY,
  EYE_CONE_OPSIN_WAVE5B_EDGES,
  EYE_CONE_OPSIN_WAVE5B_NODES,
  validateEyeConeOpsinWave5b,
} from '../../src/lib/anatomy/eyeConeOpsinWave5b.ts'

assert.deepEqual(validateEyeConeOpsinWave5b(), [])

const nodes = new Map(EYE_CONE_OPSIN_WAVE5B_NODES.map((node) => [node.id, node]))
const edges = new Map(EYE_CONE_OPSIN_WAVE5B_EDGES.map((edge) => [edge.id, edge]))

assert.equal(nodes.get('opn1lw-protein')?.externalIdentifier, 'UniProtKB:P04000')
assert.equal(nodes.get('opn1lw-reactome')?.externalIdentifier, 'Reactome:R-HSA-419769')
assert.match(nodes.get('opn1lw-gene')?.externalIdentifier ?? '', /NCBI-Gene:5956/)
assert.match(nodes.get('opn1lw-gene')?.externalIdentifier ?? '', /ENSG00000102076/)
assert.equal(nodes.get('opn1lw-reviewed-transcript')?.externalIdentifier, 'RefSeq:NM_020061.6')
assert.equal(nodes.get('opn1lw-reviewed-protein-sequence')?.externalIdentifier, 'RefSeq:NP_064445.2')
assert.equal(nodes.get('opn1sw-protein')?.externalIdentifier, 'UniProtKB:P03999')
assert.equal(nodes.get('opn1sw-reactome')?.externalIdentifier, 'Reactome:R-HSA-419772')
assert.match(nodes.get('opn1sw-gene')?.externalIdentifier ?? '', /NCBI-Gene:611/)
assert.match(nodes.get('opn1sw-gene')?.externalIdentifier ?? '', /ENSG00000128617/)
assert.match(nodes.get('opn1mw-gene')?.externalIdentifier ?? '', /NCBI-Gene:2652/)
assert.match(nodes.get('opn1mw-gene')?.externalIdentifier ?? '', /ENSG00000268221/)
assert.equal(nodes.get('opn1mw-gene')?.crossDatabaseStatus, 'blocked-pending-exact-stable-id')
assert.equal(edges.get('opn1lw-localized-disc')?.to, 'cone-outer-segment-discs')
assert.equal(edges.get('opn1sw-localized-disc')?.to, 'cone-outer-segment-discs')
assert.equal(edges.get('opn1lw-encoded-by')?.evidence.sourceVersion, 'RS_2025_08;GRCh38.p14')
assert.equal(edges.get('opn1lw-reviewed-sequence')?.evidence.locator, 'NM_020061.6->NP_064445.2')

for (const node of EYE_CONE_OPSIN_WAVE5B_NODES) {
  assert.equal(node.representation, 'molecular-reference-only')
  assert.equal(node.reviewStatus, 'academic-review-pending')
  assert.equal(node.patientSpecific, false)
  assert.equal(node.inferredFromFreeText, false)
  assert.equal(node.publicationReady, false)
}
for (const edge of EYE_CONE_OPSIN_WAVE5B_EDGES) {
  assert.equal(edge.patientSpecific, false)
  assert.equal(edge.inferredFromFreeText, false)
  assert.equal(edge.publicationReady, false)
  assert.equal(edge.evidence.retrievedOn, '2026-09-09')
}

const blockedCrossDatabaseNodeIds = new Set(
  EYE_CONE_OPSIN_WAVE5B_NODES
    .filter((node) => node.crossDatabaseStatus === 'blocked-pending-exact-stable-id')
    .map((node) => node.id),
)
assert.ok(blockedCrossDatabaseNodeIds.has('opn1mw-gene'))
for (const edge of EYE_CONE_OPSIN_WAVE5B_EDGES) {
  assert.equal(
    blockedCrossDatabaseNodeIds.has(edge.from) || blockedCrossDatabaseNodeIds.has(edge.to),
    false,
    `Blocked cross-database node must not participate in an edge: ${edge.id}`,
  )
}

assert.match(EYE_CONE_OPSIN_WAVE5B_BOUNDARY, /Do not infer spectral maxima/)
assert.match(EYE_CONE_OPSIN_WAVE5B_BOUNDARY, /pathogenicity/)
assert.match(EYE_CONE_OPSIN_WAVE5B_BOUNDARY, /patient expression/)
console.log(`eye-cone-opsin-wave5b: ok (${EYE_CONE_OPSIN_WAVE5B_NODES.length} nodes; ${EYE_CONE_OPSIN_WAVE5B_EDGES.length} edges; M-opsin cross-database promotion blocked)`)
