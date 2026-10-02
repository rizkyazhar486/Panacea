import assert from 'node:assert/strict'
import {
  ENDOCRINE_EDUCATION_EDGES,
  ENDOCRINE_EDUCATION_NODES,
  ENDOCRINE_SYSTEM_ID,
  validateEndocrineEducationGraph,
} from '../../src/lib/bodyEndocrineEducation.ts'

assert.equal(ENDOCRINE_SYSTEM_ID, 'endocrine')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(ENDOCRINE_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateEndocrineEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.boundaryMissing, [])

const anatomy = ENDOCRINE_EDUCATION_NODES.find((node) => node.id === 'endocrine-gross-reference')
assert.ok(anatomy)
assert.ok(anatomy.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'visceral.glb'))
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /not microscopic gland architecture/i)

const hpt = ENDOCRINE_EDUCATION_NODES.find((node) => node.id === 'endocrine-hpt-axis')
assert.ok(hpt)
assert.equal(hpt.kind, 'physiology')
assert.ok(hpt.evidence.some((item) => item.kind === 'pubmed' && item.id === '27347897'))
assert.match(hpt.boundary, /no person-level hormone/i)
assert.ok(ENDOCRINE_EDUCATION_EDGES.some((edge) => edge.from === 'endocrine-hpt-axis' && edge.to === 'thyroid-hormone-replacement-context'))

const imaging = ENDOCRINE_EDUCATION_NODES.find((node) => node.kind === 'imaging')
assert.ok(imaging)
assert.equal(imaging.evidenceState, 'educational-only')
assert.deepEqual(imaging.evidence, [])
assert.match(imaging.boundary, /no ultrasound, CT, MRI, scintigraphy, PET, or lesion interpretation/i)

for (const node of ENDOCRINE_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.length > 0)
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
  assert.ok(node.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url ?? '')))
}

for (const edge of ENDOCRINE_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 20)
}

console.log(`body-endocrine-education: ${ENDOCRINE_EDUCATION_NODES.length} nodes, ${ENDOCRINE_EDUCATION_EDGES.length} bounded edges OK`)
