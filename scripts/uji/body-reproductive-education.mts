import assert from 'node:assert/strict'
import {
  REPRODUCTIVE_EDUCATION_EDGES,
  REPRODUCTIVE_EDUCATION_NODES,
  REPRODUCTIVE_SYSTEM_ID,
  validateReproductiveEducationGraph,
} from '../../src/lib/bodyReproductiveEducation.ts'

assert.equal(REPRODUCTIVE_SYSTEM_ID, 'reproductive')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(REPRODUCTIVE_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateReproductiveEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = REPRODUCTIVE_EDUCATION_NODES.find((node) => node.id === 'reproductive-gross-reference')
assert.ok(anatomy)
assert.ok(anatomy.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'visceral.glb'))
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /female structures may be unavailable/i)

const imaging = REPRODUCTIVE_EDUCATION_NODES.find((node) => node.kind === 'imaging')
assert.ok(imaging)
assert.equal(imaging.evidenceState, 'educational-only')
assert.deepEqual(imaging.evidence, [])
assert.match(imaging.boundary, /no ultrasound, mammography, hysterosalpingography, CT, MRI/i)

for (const node of REPRODUCTIVE_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.length > 0)
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
  assert.ok(node.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url ?? '')))
}

for (const edge of REPRODUCTIVE_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 20)
}

console.log(`body-reproductive-education: ${REPRODUCTIVE_EDUCATION_NODES.length} nodes, ${REPRODUCTIVE_EDUCATION_EDGES.length} bounded edges OK`)
