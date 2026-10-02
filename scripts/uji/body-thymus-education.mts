import assert from 'node:assert/strict'
import {
  THYMUS_EDUCATION_EDGES,
  THYMUS_EDUCATION_NODES,
  THYMUS_SYSTEM_ID,
  validateThymusEducationGraph,
} from '../../src/lib/bodyThymusEducation.ts'

assert.equal(THYMUS_SYSTEM_ID, 'lymphatic-immune')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(THYMUS_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateThymusEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

for (const node of THYMUS_EDUCATION_NODES) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.ok(node.boundary.length > 40)
}
for (const edge of THYMUS_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(THYMUS_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(THYMUS_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no immune function/i)
assert.match(THYMUS_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(THYMUS_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no CT/i)

console.log(`body-thymus-education: ${THYMUS_EDUCATION_NODES.length} nodes, ${THYMUS_EDUCATION_EDGES.length} bounded edges OK`)
