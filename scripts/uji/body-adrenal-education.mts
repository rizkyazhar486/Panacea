import assert from 'node:assert/strict'
import {
  ADRENAL_EDUCATION_EDGES,
  ADRENAL_EDUCATION_NODES,
  ADRENAL_SYSTEM_ID,
  validateAdrenalEducationGraph,
} from '../../src/lib/bodyAdrenalEducation.ts'

assert.equal(ADRENAL_SYSTEM_ID, 'endocrine')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(ADRENAL_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateAdrenalEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.unsupportedSourceNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = ADRENAL_EDUCATION_NODES.find((node) => node.id === 'adrenal-gross-reference')
assert.ok(anatomy)
assert.ok(anatomy.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'visceral.glb'))
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /not evidence for cortical zonation/i)

const physiology = ADRENAL_EDUCATION_NODES.find((node) => node.id === 'adrenal-hpa-feedback')
assert.ok(physiology)
assert.equal(physiology.evidenceState, 'literature-backed')
assert.ok(physiology.evidence.some((item) => item.kind === 'pubmed' && item.id === '29764284'))
assert.match(physiology.boundary, /no person-level cortisol/i)

for (const node of ADRENAL_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.length > 0)
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
  assert.ok(node.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url ?? '')))
}

for (const node of ADRENAL_EDUCATION_NODES.filter((item) => item.evidenceState === 'educational-only')) {
  assert.deepEqual(node.evidence, [])
}

for (const edge of ADRENAL_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 20)
}

console.log(`body-adrenal-education: ${ADRENAL_EDUCATION_NODES.length} nodes, ${ADRENAL_EDUCATION_EDGES.length} bounded edges OK`)
