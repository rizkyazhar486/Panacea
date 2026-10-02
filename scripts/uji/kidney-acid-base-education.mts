import assert from 'node:assert/strict'
import {
  KIDNEY_ACID_BASE_BOUNDARY,
  KIDNEY_ACID_BASE_EVIDENCE,
  KIDNEY_ACID_BASE_RELATIONSHIPS,
} from '../../src/lib/kidneyAcidBaseEducation.ts'

assert.deepEqual(
  KIDNEY_ACID_BASE_RELATIONSHIPS.map((item) => item.id),
  ['proximal-bicarbonate', 'proximal-ammoniagenesis', 'collecting-duct-acid-secretion', 'distal-rta-disruption'],
  'kidney acid-base teaching must preserve nephron-segment topology',
)

for (const item of KIDNEY_ACID_BASE_RELATIONSHIPS) {
  assert.ok(item.anatomy.length > 0, `${item.id} needs an anatomy anchor`)
  assert.ok(item.physiology.length > 0, `${item.id} needs physiology`)
  assert.ok(item.educationalRelationships.length > 0, `${item.id} needs an explicit relationship`)
  assert.ok(item.evidence.length > 0, `${item.id} needs provenance`)
}

const evidenceIds = new Set(KIDNEY_ACID_BASE_EVIDENCE.map((source) => source.id))
for (const item of KIDNEY_ACID_BASE_RELATIONSHIPS) {
  for (const evidence of item.evidence) assert.ok(evidenceIds.has(evidence), `${item.id} cites unknown evidence ${evidence}`)
}

assert.deepEqual(KIDNEY_ACID_BASE_EVIDENCE.map((source) => source.pmid), ['38448728', '37016093'])
for (const source of KIDNEY_ACID_BASE_EVIDENCE) {
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
  assert.ok(source.role.length > 20)
}

const boundary = JSON.stringify(KIDNEY_ACID_BASE_BOUNDARY).toLowerCase()
for (const required of ['patient-specific', 'diagnosis', 'treatment', 'dose', 'human clinical review', 'clinical validity']) {
  assert.ok(boundary.includes(required), `boundary must explicitly contain: ${required}`)
}

const claims = JSON.stringify(KIDNEY_ACID_BASE_RELATIONSHIPS).toLowerCase()
for (const required of ['bicarbonate', 'ammonia', 'collecting duct', 'intercalated', 'distal renal tubular acidosis']) {
  assert.ok(claims.includes(required), `bounded renal teaching relationship missing: ${required}`)
}

console.log('kidney acid-base education: deterministic provenance and safety checks passed')
