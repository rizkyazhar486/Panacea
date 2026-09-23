import assert from 'node:assert/strict'
import {
  STOMACH_EDUCATION_EDGES,
  STOMACH_EDUCATION_NODES,
  STOMACH_SYSTEM_ID,
  validateStomachEducationGraph,
} from '../../src/lib/bodyStomachEducation.ts'

assert.equal(STOMACH_SYSTEM_ID, 'digestive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(STOMACH_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateStomachEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

for (const node of STOMACH_EDUCATION_NODES) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.ok(node.boundary.length > 40)
}
for (const edge of STOMACH_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(STOMACH_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(STOMACH_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no secretion/i)
assert.match(STOMACH_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(STOMACH_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no endoscopy/i)

console.log(`body-stomach-education: ${STOMACH_EDUCATION_NODES.length} nodes, ${STOMACH_EDUCATION_EDGES.length} bounded edges OK`)
