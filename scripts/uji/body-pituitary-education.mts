import assert from 'node:assert/strict'
import { PITUITARY_EDUCATION_EDGES, PITUITARY_EDUCATION_NODES, PITUITARY_SYSTEM_ID, validatePituitaryEducationGraph } from '../../src/lib/bodyPituitaryEducation.ts'

assert.equal(PITUITARY_SYSTEM_ID, 'endocrine')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(PITUITARY_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validatePituitaryEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of PITUITARY_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of PITUITARY_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(PITUITARY_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no sellar geometry/i)
assert.match(PITUITARY_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no anterior or posterior hormone axis/i)
assert.match(PITUITARY_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no hormone-replacement selection/i)
assert.match(PITUITARY_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no MRI/i)
console.log(`body-pituitary-education: ${PITUITARY_EDUCATION_NODES.length} nodes, ${PITUITARY_EDUCATION_EDGES.length} bounded edges OK`)
