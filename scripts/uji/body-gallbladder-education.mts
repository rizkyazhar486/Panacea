import assert from 'node:assert/strict'
import { GALLBLADDER_EDUCATION_EDGES, GALLBLADDER_EDUCATION_NODES, GALLBLADDER_SYSTEM_ID, validateGallbladderEducationGraph } from '../../src/lib/bodyGallbladderEducation.ts'

assert.equal(GALLBLADDER_SYSTEM_ID, 'digestive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(GALLBLADDER_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateGallbladderEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of GALLBLADDER_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of GALLBLADDER_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(GALLBLADDER_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(GALLBLADDER_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured/i)
assert.match(GALLBLADDER_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(GALLBLADDER_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)
console.log(`body-gallbladder-education: ${GALLBLADDER_EDUCATION_NODES.length} nodes, ${GALLBLADDER_EDUCATION_EDGES.length} bounded edges OK`)
