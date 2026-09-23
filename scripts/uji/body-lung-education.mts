import assert from 'node:assert/strict'
import {
  LUNG_EDUCATION_EDGES,
  LUNG_EDUCATION_NODES,
  LUNG_SYSTEM_ID,
  validateLungEducationGraph,
} from '../../src/lib/bodyLungEducation.ts'

assert.equal(LUNG_SYSTEM_ID, 'respiratory')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(LUNG_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateLungEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

for (const node of LUNG_EDUCATION_NODES) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.ok(node.boundary.length > 40)
}
for (const edge of LUNG_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(LUNG_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(LUNG_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no gas exchange/i)
assert.match(LUNG_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(LUNG_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no chest radiograph/i)

console.log(`body-lung-education: ${LUNG_EDUCATION_NODES.length} nodes, ${LUNG_EDUCATION_EDGES.length} bounded edges OK`)
