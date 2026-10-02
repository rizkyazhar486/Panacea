import assert from 'node:assert/strict'
import {
  DIGESTIVE_EDUCATION_EDGES,
  DIGESTIVE_EDUCATION_NODES,
  DIGESTIVE_SYSTEM_ID,
  validateDigestiveEducationGraph,
} from '../../src/lib/bodyDigestiveEducation.ts'

assert.equal(DIGESTIVE_SYSTEM_ID, 'digestive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(DIGESTIVE_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateDigestiveEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = DIGESTIVE_EDUCATION_NODES.find((node) => node.id === 'digestive-gross-reference')
assert.ok(anatomy)
assert.ok(anatomy.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'visceral.glb'))
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /not microscopic mucosa/i)

const imaging = DIGESTIVE_EDUCATION_NODES.find((node) => node.kind === 'imaging')
assert.ok(imaging)
assert.equal(imaging.evidenceState, 'educational-only')
assert.deepEqual(imaging.evidence, [])
assert.match(imaging.boundary, /no radiograph, ultrasound, CT, MRI, fluoroscopy, endoscopy/i)

for (const node of DIGESTIVE_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.length > 0)
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
  assert.ok(node.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url ?? '')))
}

for (const edge of DIGESTIVE_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 20)
}

console.log(`body-digestive-education: ${DIGESTIVE_EDUCATION_NODES.length} nodes, ${DIGESTIVE_EDUCATION_EDGES.length} bounded edges OK`)
