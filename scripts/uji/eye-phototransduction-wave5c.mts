import assert from 'node:assert/strict'
import {
  EYE_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY,
  EYE_PHOTOTRANSDUCTION_WAVE5C_EDGES,
  EYE_PHOTOTRANSDUCTION_WAVE5C_NODES,
  validateEyePhototransductionWave5c,
} from '../../src/lib/anatomy/eyePhototransductionWave5c.ts'

assert.deepEqual(validateEyePhototransductionWave5c(), [])

const nodes = new Map(EYE_PHOTOTRANSDUCTION_WAVE5C_NODES.map((node) => [node.id, node]))
const edges = new Map(EYE_PHOTOTRANSDUCTION_WAVE5C_EDGES.map((edge) => [edge.id, edge]))

assert.equal(nodes.get('visual-phototransduction')?.externalIdentifier, 'Reactome:R-HSA-2187338')
assert.equal(nodes.get('phototransduction-cascade')?.externalIdentifier, 'Reactome:R-HSA-2514856')
assert.equal(nodes.get('activation-cascade')?.externalIdentifier, 'Reactome:R-HSA-2485179')
assert.equal(nodes.get('pde6-hydrolysis')?.externalIdentifier, 'Reactome:R-HSA-74059')
assert.equal(nodes.get('recovery-cascade')?.externalIdentifier, 'Reactome:R-HSA-2514859')

assert.match(nodes.get('gnat1-gene')?.externalIdentifier ?? '', /NCBI-Gene:2779/)
assert.match(nodes.get('gnat1-gene')?.externalIdentifier ?? '', /ENSG00000114349/)
assert.match(nodes.get('pde6a-gene')?.externalIdentifier ?? '', /NCBI-Gene:5145/)
assert.match(nodes.get('pde6b-gene')?.externalIdentifier ?? '', /NCBI-Gene:5158/)
assert.match(nodes.get('cnga1-gene')?.externalIdentifier ?? '', /NCBI-Gene:1259/)
assert.match(nodes.get('grk1-gene')?.externalIdentifier ?? '', /NCBI-Gene:6011/)
assert.match(nodes.get('sag-gene')?.externalIdentifier ?? '', /NCBI-Gene:6295/)

assert.equal(edges.get('pde6-hydrolysis-member-of-activation')?.evidence.locator, 'R-HSA-74059->R-HSA-2485179')
assert.equal(edges.get('grk1-reference')?.to, 'recovery-cascade')
assert.equal(edges.get('sag-reference')?.to, 'recovery-cascade')

for (const node of EYE_PHOTOTRANSDUCTION_WAVE5C_NODES) {
  assert.equal(node.reviewStatus, 'academic-review-pending')
  assert.equal(node.patientSpecific, false)
  assert.equal(node.inferredFromFreeText, false)
  assert.equal(node.publicationReady, false)
}

for (const edge of EYE_PHOTOTRANSDUCTION_WAVE5C_EDGES) {
  assert.equal(edge.patientSpecific, false)
  assert.equal(edge.inferredFromFreeText, false)
  assert.equal(edge.publicationReady, false)
  assert.equal(edge.evidence.retrievedOn, '2026-09-09')
}

assert.match(EYE_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY, /Do not infer patient expression/)
assert.match(EYE_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY, /kinetic constants/)
assert.match(EYE_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY, /membrane voltage/)
assert.match(EYE_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY, /gross\/subcellular coordinates/)

console.log(`eye-phototransduction-wave5c: ok (${EYE_PHOTOTRANSDUCTION_WAVE5C_NODES.length} nodes; ${EYE_PHOTOTRANSDUCTION_WAVE5C_EDGES.length} edges; publication remains fail-closed)`)
