import assert from 'node:assert/strict'
import {
  TESTIS_EDUCATION_EDGES,
  TESTIS_EDUCATION_NODES,
  TESTIS_SYSTEM_ID,
  validateTestisEducationGraph,
} from '../../src/lib/bodyTestisEducation.ts'

assert.equal(TESTIS_SYSTEM_ID, 'reproductive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(TESTIS_EDUCATION_NODES.some((node) => node.kind === kind))
}
const audit = validateTestisEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of TESTIS_EDUCATION_NODES) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.ok(node.boundary.length > 40)
}
for (const edge of TESTIS_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}
assert.match(TESTIS_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(TESTIS_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured/i)
assert.match(TESTIS_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(TESTIS_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)
console.log(`body-testis-education: ${TESTIS_EDUCATION_NODES.length} nodes, ${TESTIS_EDUCATION_EDGES.length} bounded edges OK`)
