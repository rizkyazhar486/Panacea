import assert from 'node:assert/strict'
import {
  HEPATOBILIARY_EVIDENCE_SOURCES,
  HEPATOBILIARY_KNOWLEDGE_EDGES,
  hepatobiliaryEvidenceFor,
  hepatobiliaryKnowledgeByDomain,
  hepatobiliaryKnowledgeHasCompleteProvenance,
  type HepatobiliaryKnowledgeDomain,
} from '../../src/lib/bodyOrganHepatobiliary'

const domains: HepatobiliaryKnowledgeDomain[] = ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging']

assert.equal(new Set(HEPATOBILIARY_EVIDENCE_SOURCES.map((source) => source.id)).size, HEPATOBILIARY_EVIDENCE_SOURCES.length)
assert.equal(new Set(HEPATOBILIARY_KNOWLEDGE_EDGES.map((edge) => edge.id)).size, HEPATOBILIARY_KNOWLEDGE_EDGES.length)

for (const source of HEPATOBILIARY_EVIDENCE_SOURCES) {
  assert.match(source.pmid, /^\d+$/)
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
}

for (const domain of domains) {
  const edges = hepatobiliaryKnowledgeByDomain(domain)
  assert.ok(edges.length > 0, `hepatobiliary ${domain} must retain at least one evidence-bounded relationship`)
  assert.ok(edges.every((edge) => edge.domain === domain))
}

for (const edge of HEPATOBILIARY_KNOWLEDGE_EDGES) {
  assert.ok(edge.sourceIds.length > 0)
  assert.equal(hepatobiliaryKnowledgeHasCompleteProvenance(edge), true)
  assert.equal(hepatobiliaryEvidenceFor(edge).length, edge.sourceIds.length)
  assert.ok(edge.boundaries.includes('reference-educational'))
}

for (const domain of ['pathophysiology', 'pharmacology', 'imaging'] as const) {
  for (const edge of hepatobiliaryKnowledgeByDomain(domain)) {
    assert.ok(edge.boundaries.includes('requires-patient-data'))
    assert.ok(edge.boundaries.includes('requires-clinician-review'))
  }
}

assert.ok(
  hepatobiliaryKnowledgeByDomain('pharmacology').every((edge) => /Mechanism-of-action context only/.test(edge.summary)),
  'hepatobiliary pharmacology context must not become drug-selection or dose guidance',
)

assert.ok(
  hepatobiliaryKnowledgeByDomain('imaging').every((edge) => /actual hepatobiliary imaging study/.test(edge.summary)),
  'hepatobiliary imaging orientation must not imply a patient lesion or obstruction',
)

const unresolved = {
  ...HEPATOBILIARY_KNOWLEDGE_EDGES[0],
  id: 'hepatobiliary-test-unresolved-source',
  sourceIds: ['pmid-does-not-exist'],
}
assert.equal(hepatobiliaryKnowledgeHasCompleteProvenance(unresolved), false)
assert.deepEqual(hepatobiliaryEvidenceFor(unresolved), [])

console.log(
  `hepatobiliary organ provenance acceptance passed: ${HEPATOBILIARY_KNOWLEDGE_EDGES.length} relationships, ${HEPATOBILIARY_EVIDENCE_SOURCES.length} PubMed sources, ${domains.length} domains`,
)
