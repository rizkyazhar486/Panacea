import assert from 'node:assert/strict'
import {
  EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY,
  EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_EDGES,
  EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_NODES,
  validateEyeRodPhototransductionWave5c,
} from '../../src/lib/anatomy/eyeRodPhototransductionWave5c.ts'

assert.deepEqual(validateEyeRodPhototransductionWave5c(), [])

const nodes = new Map(EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_NODES.map((item) => [item.id, item]))
const edges = new Map(EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_EDGES.map((item) => [item.id, item]))

assert.equal(nodes.get('gnat1-gene')?.stableIdentifier, 'NCBI-Gene:2779;Ensembl:ENSG00000114349')
assert.equal(nodes.get('pde6b-gene')?.stableIdentifier, 'NCBI-Gene:5158;Ensembl:ENSG00000133256')
assert.equal(nodes.get('transducin-beta-gamma-complex')?.stableIdentifier, 'Reactome:R-HSA-74061')
assert.equal(nodes.get('gt-dissociation-reaction')?.stableIdentifier, 'Reactome:R-HSA-2485182')
assert.equal(nodes.get('gnat1-pde6-activation-reaction')?.stableIdentifier, 'Reactome:R-HSA-74065')

assert.equal(edges.get('beta-gamma-in-dissociation')?.evidence.locator, 'R-HSA-2485182;R-HSA-74061')
assert.equal(edges.get('dissociation-before-pde6-activation')?.evidence.locator, 'R-HSA-2485182 -> R-HSA-74065')

for (const item of EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_NODES) {
  assert.equal(item.reviewStatus, 'academic-review-pending')
  assert.equal(item.patientSpecific, false)
  assert.equal(item.inferredFromFreeText, false)
  assert.equal(item.publicationReady, false)
  assert.equal(item.retrievedOn, '2026-09-09')
}

for (const item of EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_EDGES) {
  assert.equal(item.patientSpecific, false)
  assert.equal(item.inferredFromFreeText, false)
  assert.equal(item.publicationReady, false)
  assert.equal(item.evidence.retrievedOn, '2026-09-09')
}

assert.match(EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY, /Do not infer patient retinal activity/)
assert.match(EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY, /reaction kinetics/)
assert.match(EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_BOUNDARY, /gross Body3D coordinates/)

const unsafeNodes = EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_NODES.map((item) => ({ ...item, publicationReady: true as const }))
assert.ok(validateEyeRodPhototransductionWave5c(unsafeNodes, EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_EDGES).some((item) => item.startsWith('unsafe-node:')))

console.log(`eye-rod-phototransduction-wave5c: ok (${EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_NODES.length} nodes; ${EYE_ROD_PHOTOTRANSDUCTION_WAVE5C_EDGES.length} edges; reference-only, review pending)`)
