import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = new URL('../../data/body-knowledge/reproductive-ovary-evidence.json', import.meta.url)
const seed = JSON.parse(readFileSync(path, 'utf8')) as {
  system: string
  organ: string
  relationships: Array<{ id: string; evidence: string[]; status: string }>
  sources: Array<{ id: string; pmid: string; url: string; sourceType: string }>
  provenanceBoundary: { sourceCheckedDoesNotMean: string[]; forbiddenInferences: string[] }
}

assert.equal(seed.system, 'reproductive')
assert.equal(seed.organ, 'ovary')
assert.ok(seed.relationships.length >= 3)
assert.ok(seed.sources.length >= 2)

const sourceIds = new Set(seed.sources.map((source) => source.id))
for (const source of seed.sources) {
  assert.match(source.id, /^pmid:\d+$/)
  assert.equal(source.id, `pmid:${source.pmid}`)
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
  assert.ok(source.sourceType.length > 0)
}

for (const relationship of seed.relationships) {
  assert.equal(relationship.status, 'source-checked')
  assert.ok(relationship.evidence.length > 0)
  for (const evidenceId of relationship.evidence) assert.ok(sourceIds.has(evidenceId))
}

for (const requiredBoundary of ['patient-specific', 'human-reviewed-in-panacea', 'diagnostic-or-treatment-advice']) {
  assert.ok(seed.provenanceBoundary.sourceCheckedDoesNotMean.includes(requiredBoundary))
}
for (const forbidden of ['generic-atlas-to-patient-specific-anatomy', 'educational-relationship-to-diagnosis', 'source-checked-to-human-reviewed']) {
  assert.ok(seed.provenanceBoundary.forbiddenInferences.includes(forbidden))
}

console.log('body reproductive evidence provenance: ok')
