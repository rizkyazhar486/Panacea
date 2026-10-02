import assert from 'node:assert/strict'
import {
  THYROID_EDUCATION_EDGES,
  THYROID_EDUCATION_NODES,
  THYROID_SYSTEM_ID,
  validateThyroidEducationGraph,
} from '../../src/lib/bodyThyroidEducation.ts'

assert.equal(THYROID_SYSTEM_ID, 'endocrine')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(THYROID_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateThyroidEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

for (const node of THYROID_EDUCATION_NODES) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.ok(node.boundary.length > 40)
}
for (const edge of THYROID_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(THYROID_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(THYROID_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no hormone concentration/i)
assert.match(THYROID_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(THYROID_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)

console.log(`body-thyroid-education: ${THYROID_EDUCATION_NODES.length} nodes, ${THYROID_EDUCATION_EDGES.length} bounded edges OK`)
