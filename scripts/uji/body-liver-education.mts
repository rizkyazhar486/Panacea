import assert from 'node:assert/strict'
import {
  LIVER_EDUCATION_EDGES,
  LIVER_EDUCATION_NODES,
  LIVER_SYSTEM_ID,
  validateLiverEducationGraph,
} from '../../src/lib/bodyLiverEducation.ts'

assert.equal(LIVER_SYSTEM_ID, 'digestive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(LIVER_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateLiverEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.sourceBackedWithoutSource, [])
assert.deepEqual(audit.educationalWithSourceClaim, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = LIVER_EDUCATION_NODES.find((node) => node.id === 'liver-gross-reference')
assert.ok(anatomy)
assert.equal(anatomy.evidenceState, 'source-backed')
assert.equal(anatomy.sourceId, 'visceral.glb')
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /microscopic lobules/i)

for (const node of LIVER_EDUCATION_NODES.filter((item) => item.kind !== 'anatomy')) {
  assert.equal(node.evidenceState, 'educational-only')
  assert.equal(node.sourceId, undefined)
}

for (const edge of LIVER_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}

assert.match(LIVER_EDUCATION_NODES.find((node) => node.kind === 'physiology')!.boundary, /no synthetic function/i)
assert.match(LIVER_EDUCATION_NODES.find((node) => node.kind === 'pharmacology')!.boundary, /no drug selection/i)
assert.match(LIVER_EDUCATION_NODES.find((node) => node.kind === 'imaging')!.boundary, /no ultrasound, CT, MRI/i)

console.log(`body-liver-education: ${LIVER_EDUCATION_NODES.length} nodes, ${LIVER_EDUCATION_EDGES.length} bounded edges OK`)
