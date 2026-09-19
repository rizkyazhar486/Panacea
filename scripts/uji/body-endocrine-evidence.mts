import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = new URL('../../data/body-knowledge/endocrine-pituitary-evidence.json', import.meta.url)
const seed = JSON.parse(readFileSync(path, 'utf8')) as {
  system: string
  organ: string
  relationships: Array<{ id: string; evidence: string[]; status: string }>
  sources: Array<{ id: string; pmid: string; url: string; sourceType: string }>
  provenanceBoundary: { sourceCheckedDoesNotMean: string[]; forbiddenInferences: string[] }
}

assert.equal(seed.system, 'endocrine')
assert.equal(seed.organ, 'pituitary')
assert.ok(seed.relationships.length >= 2)
assert.ok(seed.sources.length >= 1)

const sourceIds = new Set(seed.sources.map((source) => source.id))
for (const source of seed.sources) {
  assert.match(source.id, /^pmid:\d+$/)
  assert.equal(source.id, `pmid:${source.pmid}`)
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
  assert.equal(source.sourceType, 'review')
}

for (const relationship of seed.relationships) {
  assert.equal(relationship.status, 'source-checked')
  assert.ok(relationship.evidence.length > 0)
  for (const evidenceId of relationship.evidence) {
    assert.ok(sourceIds.has(evidenceId), `${relationship.id} references unknown evidence ${evidenceId}`)
  }
}

assert.ok(seed.provenanceBoundary.sourceCheckedDoesNotMean.includes('human-reviewed-in-panacea'))
assert.ok(seed.provenanceBoundary.sourceCheckedDoesNotMean.includes('patient-specific'))
assert.ok(seed.provenanceBoundary.forbiddenInferences.includes('generic-atlas-to-patient-specific-anatomy'))
assert.ok(seed.provenanceBoundary.forbiddenInferences.includes('source-checked-to-human-reviewed'))

console.log('Endocrine evidence seed verified: PubMed-backed educational relationships remain bounded by explicit provenance and patient-specific inference guards.')
