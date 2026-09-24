import assert from 'node:assert/strict'
import { PARATHYROID_EDUCATION_EDGES, PARATHYROID_EDUCATION_NODES, PARATHYROID_SYSTEM_ID, validateParathyroidEducationGraph } from '../../src/lib/bodyParathyroidEducation.ts'

assert.equal(PARATHYROID_SYSTEM_ID, 'endocrine')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(PARATHYROID_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateParathyroidEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of PARATHYROID_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of PARATHYROID_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(PARATHYROID_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(PARATHYROID_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no hormone concentration/i)
assert.match(PARATHYROID_EDUCATION_NODES.find((node) => node.kind === 'pathophysiology')!.boundary, /does not diagnose/i)
assert.match(PARATHYROID_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(PARATHYROID_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound/i)
console.log(`body-parathyroid-education: ${PARATHYROID_EDUCATION_NODES.length} nodes, ${PARATHYROID_EDUCATION_EDGES.length} bounded edges OK`)
