import assert from 'node:assert/strict'
import { PROSTATE_EDUCATION_EDGES, PROSTATE_EDUCATION_NODES, PROSTATE_SYSTEM_ID, validateProstateEducationGraph } from '../../src/lib/bodyProstateEducation.ts'

assert.equal(PROSTATE_SYSTEM_ID, 'reproductive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(PROSTATE_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateProstateEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of PROSTATE_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of PROSTATE_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(PROSTATE_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(PROSTATE_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured secretion/i)
assert.match(PROSTATE_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(PROSTATE_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)
console.log(`body-prostate-education: ${PROSTATE_EDUCATION_NODES.length} nodes, ${PROSTATE_EDUCATION_EDGES.length} bounded edges OK`)
