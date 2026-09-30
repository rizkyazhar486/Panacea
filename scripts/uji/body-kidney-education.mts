import assert from 'node:assert/strict'
import {
  KIDNEY_EDUCATION_EDGES,
  KIDNEY_EDUCATION_NODES,
  KIDNEY_SYSTEM_ID,
  validateKidneyEducationGraph,
} from '../../src/lib/bodyKidneyEducation.ts'

assert.equal(KIDNEY_SYSTEM_ID, 'urinary')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(KIDNEY_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateKidneyEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.sourceBackedWithoutSource, [])
assert.deepEqual(audit.educationalWithSourceClaim, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = KIDNEY_EDUCATION_NODES.find((node) => node.id === 'kidney-gross-reference')
assert.ok(anatomy)
assert.equal(anatomy.evidenceState, 'source-backed')
assert.equal(anatomy.sourceId, 'visceral.glb')
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /nephron microstructure/i)

for (const node of KIDNEY_EDUCATION_NODES.filter((item) => item.kind !== 'anatomy')) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.equal(node.sourceId, undefined)
}

for (const edge of KIDNEY_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no GFR/i)
assert.match(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no CT, MRI, ultrasound/i)

console.log(`body-kidney-education: ${KIDNEY_EDUCATION_NODES.length} nodes, ${KIDNEY_EDUCATION_EDGES.length} bounded edges OK`)
