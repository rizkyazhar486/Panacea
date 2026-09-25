import assert from 'node:assert/strict'
import { OVARY_EDUCATION_EDGES, OVARY_EDUCATION_NODES, OVARY_SYSTEM_ID, validateOvaryEducationGraph } from '../../src/lib/bodyOvaryEducation.ts'

assert.equal(OVARY_SYSTEM_ID, 'reproductive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(OVARY_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateOvaryEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of OVARY_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of OVARY_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(OVARY_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(OVARY_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured ovarian reserve/i)
assert.match(OVARY_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(OVARY_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)
console.log(`body-ovary-education: ${OVARY_EDUCATION_NODES.length} nodes, ${OVARY_EDUCATION_EDGES.length} bounded edges OK`)
