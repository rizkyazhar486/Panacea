import assert from 'node:assert/strict'
import { ADRENAL_EDUCATION_EDGES, ADRENAL_EDUCATION_NODES, ADRENAL_SYSTEM_ID, validateAdrenalEducationGraph } from '../../src/lib/bodyAdrenalEducation.ts'

assert.equal(ADRENAL_SYSTEM_ID, 'endocrine')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(ADRENAL_EDUCATION_NODES.some((node) => node.kind === kind))

const audit = validateAdrenalEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of ADRENAL_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of ADRENAL_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(ADRENAL_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(ADRENAL_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no hormone concentration/i)
assert.match(ADRENAL_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(ADRENAL_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no CT/i)
console.log(`body-adrenal-education: ${ADRENAL_EDUCATION_NODES.length} nodes, ${ADRENAL_EDUCATION_EDGES.length} bounded edges OK`)
