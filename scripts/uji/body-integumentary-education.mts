import assert from 'node:assert/strict'
import {
  INTEGUMENTARY_EDUCATION_EDGES,
  INTEGUMENTARY_EDUCATION_NODES,
  INTEGUMENTARY_SYSTEM_ID,
  validateIntegumentaryEducationGraph,
} from '../../src/lib/bodyIntegumentaryEducation.ts'

assert.equal(INTEGUMENTARY_SYSTEM_ID, 'integumentary-surface')
assert.ok(INTEGUMENTARY_EDUCATION_NODES.some((node) => node.kind === 'anatomy'))
assert.ok(INTEGUMENTARY_EDUCATION_NODES.some((node) => node.kind === 'physiology'))
assert.ok(INTEGUMENTARY_EDUCATION_NODES.some((node) => node.kind === 'pathophysiology'))
assert.ok(INTEGUMENTARY_EDUCATION_NODES.some((node) => node.kind === 'pharmacology'))
assert.ok(INTEGUMENTARY_EDUCATION_NODES.some((node) => node.kind === 'imaging'))

const audit = validateIntegumentaryEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.patientSpecificBoundaryMissing, [])

const surface = INTEGUMENTARY_EDUCATION_NODES.find((node) => node.id === 'surface-reference')
assert.ok(surface)
assert.ok(surface.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'surface.glb'))
assert.match(surface.boundary, /not patient-specific anatomy/i)
assert.match(surface.boundary, /not microscopic skin-layer geometry/i)

const imaging = INTEGUMENTARY_EDUCATION_NODES.find((node) => node.kind === 'imaging')
assert.ok(imaging)
assert.equal(imaging.evidenceState, 'educational-only')
assert.deepEqual(imaging.evidence, [])
assert.match(imaging.boundary, /no dermoscopy, ultrasound, pathology, or lesion interpretation/i)

for (const node of INTEGUMENTARY_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
  assert.ok(node.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url ?? '')))
}

for (const edge of INTEGUMENTARY_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 20)
}

console.log(`body-integumentary-education: ${INTEGUMENTARY_EDUCATION_NODES.length} nodes, ${INTEGUMENTARY_EDUCATION_EDGES.length} bounded edges OK`)
