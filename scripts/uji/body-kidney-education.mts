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
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

for (const node of KIDNEY_EDUCATION_NODES) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.ok(node.boundary.length > 40)
}
for (const edge of KIDNEY_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured filtration/i)
assert.match(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(KIDNEY_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)

console.log(`body-kidney-education: ${KIDNEY_EDUCATION_NODES.length} nodes, ${KIDNEY_EDUCATION_EDGES.length} bounded edges OK`)
