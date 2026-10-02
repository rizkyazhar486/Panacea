import assert from 'node:assert/strict'
import { ESOPHAGUS_EDUCATION_EDGES, ESOPHAGUS_EDUCATION_NODES, ESOPHAGUS_SYSTEM_ID, validateEsophagusEducationGraph } from '../../src/lib/bodyEsophagusEducation.ts'

assert.equal(ESOPHAGUS_SYSTEM_ID, 'digestive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) assert.ok(ESOPHAGUS_EDUCATION_NODES.some((node) => node.kind === kind))
const audit = validateEsophagusEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.nonEducationalNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
for (const node of ESOPHAGUS_EDUCATION_NODES) { assert.equal(node.evidenceState, 'educational-only'); assert.ok(node.boundary.length > 40) }
for (const edge of ESOPHAGUS_EDUCATION_EDGES) { assert.notEqual(edge.from, edge.to); assert.ok(edge.note.length > 40) }
assert.match(ESOPHAGUS_EDUCATION_NODES.find((node) => node.kind === 'anatomy')!.boundary, /no geometry/i)
assert.match(ESOPHAGUS_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no motility/i)
assert.match(ESOPHAGUS_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(ESOPHAGUS_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no endoscopy/i)
console.log(`body-esophagus-education: ${ESOPHAGUS_EDUCATION_NODES.length} nodes, ${ESOPHAGUS_EDUCATION_EDGES.length} bounded edges OK`)
