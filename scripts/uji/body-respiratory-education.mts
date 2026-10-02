import assert from 'node:assert/strict'
import {
  RESPIRATORY_EDUCATION_EDGES,
  RESPIRATORY_EDUCATION_NODES,
  RESPIRATORY_SYSTEM_ID,
  validateRespiratoryEducationGraph,
} from '../../src/lib/bodyRespiratoryEducation.ts'

assert.equal(RESPIRATORY_SYSTEM_ID, 'respiratory')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(RESPIRATORY_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateRespiratoryEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = RESPIRATORY_EDUCATION_NODES.find((node) => node.id === 'respiratory-gross-reference')
assert.ok(anatomy)
assert.ok(anatomy.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'visceral.glb'))
assert.ok(anatomy.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'muscular.glb'))
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /not alveolar microgeometry/i)

const imaging = RESPIRATORY_EDUCATION_NODES.find((node) => node.kind === 'imaging')
assert.ok(imaging)
assert.equal(imaging.evidenceState, 'educational-only')
assert.deepEqual(imaging.evidence, [])
assert.match(imaging.boundary, /no radiograph, CT, ultrasound, bronchoscopy, or lesion interpretation/i)

for (const node of RESPIRATORY_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.length > 0)
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
  assert.ok(node.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url ?? '')))
}

for (const edge of RESPIRATORY_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 20)
}

console.log(`body-respiratory-education: ${RESPIRATORY_EDUCATION_NODES.length} nodes, ${RESPIRATORY_EDUCATION_EDGES.length} bounded edges OK`)
