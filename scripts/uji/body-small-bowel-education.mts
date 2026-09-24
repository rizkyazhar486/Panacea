import assert from 'node:assert/strict'
import { SMALL_BOWEL_EDUCATION_EDGES, SMALL_BOWEL_EDUCATION_NODES, SMALL_BOWEL_SYSTEM_ID, validateSmallBowelEducationGraph } from '../../src/lib/bodySmallBowelEducation.ts'

assert.equal(SMALL_BOWEL_SYSTEM_ID, 'digestive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(SMALL_BOWEL_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateSmallBowelEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of SMALL_BOWEL_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of SMALL_BOWEL_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(SMALL_BOWEL_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(SMALL_BOWEL_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured absorption/i)
assert.match(SMALL_BOWEL_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(SMALL_BOWEL_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no CT/i)
console.log(`body-small-bowel-education: ${SMALL_BOWEL_EDUCATION_NODES.length} nodes, ${SMALL_BOWEL_EDUCATION_EDGES.length} bounded edges OK`)
