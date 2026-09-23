import assert from 'node:assert/strict'
import { SPLEEN_EDUCATION_EDGES, SPLEEN_EDUCATION_NODES, SPLEEN_SYSTEM_ID, validateSpleenEducationGraph } from '../../src/lib/bodySpleenEducation.ts'

assert.equal(SPLEEN_SYSTEM_ID, 'immune')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(SPLEEN_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateSpleenEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of SPLEEN_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of SPLEEN_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(SPLEEN_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(SPLEEN_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured/i)
assert.match(SPLEEN_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(SPLEEN_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no CT/i)
console.log(`body-spleen-education: ${SPLEEN_EDUCATION_NODES.length} nodes, ${SPLEEN_EDUCATION_EDGES.length} bounded edges OK`)
