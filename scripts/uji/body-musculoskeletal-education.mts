import assert from 'node:assert/strict'
import {
  MUSCULOSKELETAL_EDUCATION_EDGES,
  MUSCULOSKELETAL_EDUCATION_NODES,
  MUSCULOSKELETAL_SYSTEM_ID,
  validateMusculoskeletalEducationGraph,
} from '../../src/lib/bodyMusculoskeletalEducation.ts'

assert.equal(MUSCULOSKELETAL_SYSTEM_ID, 'musculoskeletal')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(MUSCULOSKELETAL_EDUCATION_NODES.some((node) => node.kind === kind))
}
const audit = validateMusculoskeletalEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.sourceBackedWithoutAtlas, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = MUSCULOSKELETAL_EDUCATION_NODES.find((node) => node.id === 'musculoskeletal-gross-reference')
assert.ok(anatomy)
assert.ok(anatomy.evidence.some((item) => item.id === 'skeletal.glb'))
assert.ok(anatomy.evidence.some((item) => item.id === 'muscular.glb'))

for (const node of MUSCULOSKELETAL_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.length > 0)
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
}
for (const kind of ['pharmacology', 'imaging'] as const) {
  const node = MUSCULOSKELETAL_EDUCATION_NODES.find((item) => item.kind === kind)
  assert.ok(node)
  assert.equal(node.evidenceState, 'educational-only')
  assert.deepEqual(node.evidence, [])
}
for (const edge of MUSCULOSKELETAL_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 40)
}
console.log('body-musculoskeletal-education OK')
