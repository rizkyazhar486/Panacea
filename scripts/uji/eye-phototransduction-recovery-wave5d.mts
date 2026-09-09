import assert from 'node:assert/strict'
import {
  EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_BOUNDARY,
  EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_EDGES,
  EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_NODES,
  validateEyePhototransductionRecoveryWave5d,
} from '../../src/lib/anatomy/eyePhototransductionRecoveryWave5d.ts'

assert.deepEqual(validateEyePhototransductionRecoveryWave5d(), [])

const nodes = new Map(EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_NODES.map((node) => [node.id, node]))
const edges = new Map(EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_EDGES.map((edge) => [edge.id, edge]))

assert.match(nodes.get('rcvrn-gene')?.externalIdentifier ?? '', /NCBI-Gene:5957/)
assert.match(nodes.get('rcvrn-gene')?.externalIdentifier ?? '', /ENSG00000109047/)
assert.match(nodes.get('slc24a1-gene')?.externalIdentifier ?? '', /NCBI-Gene:9187/)
assert.match(nodes.get('slc24a1-gene')?.externalIdentifier ?? '', /ENSG00000074621/)
assert.equal(nodes.get('rcvrn-cytosol')?.externalIdentifier, 'Reactome:R-HSA-62913')
assert.equal(nodes.get('rcvrn-ca2-inhibits-grk1')?.externalIdentifier, 'Reactome:R-HSA-3229213')
assert.equal(nodes.get('grk1-phosphorylates-mii')?.externalIdentifier, 'Reactome:R-HSA-2581474')
assert.equal(nodes.get('gnat1-gtp-hydrolysis')?.externalIdentifier, 'Reactome:R-HSA-2584246')
assert.equal(nodes.get('slc24a1-calcium-exchange')?.externalIdentifier, 'Reactome:R-HSA-2514891')

assert.equal(edges.get('rcvrn-recovery-context')?.to, 'recovery-cascade')
assert.equal(edges.get('grk1-recovery-context')?.to, 'recovery-cascade')
assert.equal(edges.get('gnat1-recovery-context')?.to, 'recovery-cascade')
assert.equal(edges.get('slc24a1-activation-context')?.to, 'activation-cascade')

for (const node of EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_NODES) {
  assert.equal(node.reviewStatus, 'academic-review-pending')
  assert.equal(node.patientSpecific, false)
  assert.equal(node.inferredFromFreeText, false)
  assert.equal(node.publicationReady, false)
}
for (const edge of EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_EDGES) {
  assert.equal(edge.patientSpecific, false)
  assert.equal(edge.inferredFromFreeText, false)
  assert.equal(edge.publicationReady, false)
  assert.equal(edge.evidence.retrievedOn, '2026-09-09')
}

assert.match(EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_BOUNDARY, /Do not infer calcium concentration/)
assert.match(EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_BOUNDARY, /voltage/)
assert.match(EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_BOUNDARY, /adaptation magnitude/)
assert.match(EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_BOUNDARY, /spatial coordinates/)

console.log(`eye-phototransduction-recovery-wave5d: ok (${EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_NODES.length} nodes; ${EYE_PHOTOTRANSDUCTION_RECOVERY_WAVE5D_EDGES.length} edges; recovery physiology remains reference-only)`)
