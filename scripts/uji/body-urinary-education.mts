import assert from 'node:assert/strict'
import {
  URINARY_EDUCATION_EDGES,
  URINARY_EDUCATION_NODES,
  URINARY_SYSTEM_ID,
  validateUrinaryEducationGraph,
} from '../../src/lib/bodyUrinaryEducation.ts'

assert.equal(URINARY_SYSTEM_ID, 'urinary')
for (const kind of ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging'] as const) {
  assert.ok(URINARY_EDUCATION_NODES.some((node) => node.kind === kind))
}

const audit = validateUrinaryEducationGraph()
assert.equal(audit.duplicateIds, false)
assert.deepEqual(audit.danglingEdges, [])
assert.deepEqual(audit.unsupportedLiteratureNodes, [])
assert.deepEqual(audit.boundaryMissing, [])
assert.deepEqual(audit.unresolvedSourceIds, [])
assert.deepEqual(audit.incompleteClaims, [])
assert.deepEqual(audit.invalidReviewStates, [])

const anatomy = URINARY_EDUCATION_NODES.find((node) => node.id === 'urinary-gross-reference')
assert.ok(anatomy)
assert.ok(anatomy.evidence.some((item) => item.kind === 'atlas-source' && item.id === 'visceral.glb'))
assert.match(anatomy.boundary, /not patient-specific anatomy/i)
assert.match(anatomy.boundary, /not nephron microanatomy/i)

const imaging = URINARY_EDUCATION_NODES.find((node) => node.kind === 'imaging')
assert.ok(imaging)
assert.equal(imaging.evidenceState, 'literature-backed')
assert.ok(imaging.evidence.some((item) => item.kind === 'pubmed' && item.id === '39022655'))
assert.match(imaging.boundary, /no patient scan/i)

for (const node of URINARY_EDUCATION_NODES) {
  assert.equal(node.reviewState, 'source-checked')
  assert.match(node.accessedOrReviewedAt, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(node.claimScope.length > 20)
  assert.ok(node.evidenceRole.endsWith('-reference'))
}

for (const node of URINARY_EDUCATION_NODES.filter((item) => item.evidenceState === 'literature-backed')) {
  assert.ok(node.evidence.length > 0)
  assert.ok(node.evidence.every((item) => item.kind === 'pubmed'))
  assert.ok(node.evidence.every((item) => /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(item.url ?? '')))
  assert.ok(node.evidence.every((item) => item.sourceType === 'peer-reviewed-review-or-article'))
  assert.ok(node.evidence.every((item) => item.sourceLocator === `PMID:${item.id}`))
}

for (const edge of URINARY_EDUCATION_EDGES) {
  assert.notEqual(edge.from, edge.to)
  assert.ok(edge.note.length > 20)
}

console.log(`body-urinary-education: ${URINARY_EDUCATION_NODES.length} nodes, ${URINARY_EDUCATION_EDGES.length} bounded edges OK`)