import assert from 'node:assert/strict'
import {
  BLADDER_EDUCATION_EDGES,
  BLADDER_EDUCATION_NODES,
  BLADDER_SYSTEM_ID,
  validateBladderEducationGraph,
} from '../../src/lib/bodyBladderEducation.ts'

assert.equal(BLADDER_SYSTEM_ID, 'urinary')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(BLADDER_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateBladderEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

for (const node of BLADDER_EDUCATION_NODES) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.ok(node.boundary.length > 40)
}
for (const edge of BLADDER_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(BLADDER_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(BLADDER_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no pressure/i)
assert.match(BLADDER_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(BLADDER_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)

console.log(`body-bladder-education: ${BLADDER_EDUCATION_NODES.length} nodes, ${BLADDER_EDUCATION_EDGES.length} bounded edges OK`)
