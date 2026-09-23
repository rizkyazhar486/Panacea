import assert from 'node:assert/strict'
import { UTERUS_EDUCATION_EDGES, UTERUS_EDUCATION_NODES, UTERUS_SYSTEM_ID, validateUterusEducationGraph } from '../../src/lib/bodyUterusEducation.ts'

assert.equal(UTERUS_SYSTEM_ID, 'reproductive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(UTERUS_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateUterusEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of UTERUS_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of UTERUS_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(UTERUS_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(UTERUS_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no cycle timing/i)
assert.match(UTERUS_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(UTERUS_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)
console.log(`body-uterus-education: ${UTERUS_EDUCATION_NODES.length} nodes, ${UTERUS_EDUCATION_EDGES.length} bounded edges OK`)
