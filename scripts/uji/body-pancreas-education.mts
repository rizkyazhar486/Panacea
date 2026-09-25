import assert from 'node:assert/strict'
import { PANCREAS_EDUCATION_EDGES, PANCREAS_EDUCATION_NODES, PANCREAS_SYSTEM_IDS, validatePancreasEducationGraph } from '../../src/lib/bodyPancreasEducation.ts'

assert.deepEqual(PANCREAS_SYSTEM_IDS, ['digestive', 'endocrine'])
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(PANCREAS_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validatePancreasEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of PANCREAS_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of PANCREAS_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(PANCREAS_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(PANCREAS_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no measured/i)
assert.match(PANCREAS_EDUCATION_NODES.find((node) => node.kind === 'pathophysiology')!.boundary, /does not diagnose/i)
assert.match(PANCREAS_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(PANCREAS_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no CT/i)
console.log(`body-pancreas-education: ${PANCREAS_EDUCATION_NODES.length} nodes, ${PANCREAS_EDUCATION_EDGES.length} bounded edges OK`)
