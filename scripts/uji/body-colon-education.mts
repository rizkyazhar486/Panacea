import assert from 'node:assert/strict'
import { COLON_EDUCATION_EDGES, COLON_EDUCATION_NODES, COLON_SYSTEM_ID, validateColonEducationGraph } from '../../src/lib/bodyColonEducation.ts'

assert.equal(COLON_SYSTEM_ID, 'digestive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(COLON_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateColonEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of COLON_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of COLON_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(COLON_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(COLON_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no motility/i)
assert.match(COLON_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(COLON_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no CT/i)
console.log(`body-colon-education: ${COLON_EDUCATION_NODES.length} nodes, ${COLON_EDUCATION_EDGES.length} bounded edges OK`)
