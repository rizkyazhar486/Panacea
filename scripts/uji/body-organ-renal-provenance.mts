import assert from 'node:assert/strict'
import {
  RENAL_EVIDENCE_SOURCES, RENAL_KNOWLEDGE_EDGES, renalEvidenceFor,
  renalKnowledgeByDomain, renalKnowledgeHasCompleteProvenance,
  type RenalKnowledgeDomain,
} from '../../src/lib/bodyOrganRenal'

const domains: RenalKnowledgeDomain[] = ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging']
assert.equal(new Set(RENAL_EVIDENCE_SOURCES.map((s) => s.id)).size, RENAL_EVIDENCE_SOURCES.length)
assert.equal(new Set(RENAL_KNOWLEDGE_EDGES.map((e) => e.id)).size, RENAL_KNOWLEDGE_EDGES.length)
for (const source of RENAL_EVIDENCE_SOURCES) {
  assert.match(source.pmid, /^\d+$/)
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
}
for (const domain of domains) {
  const edges = renalKnowledgeByDomain(domain)
  assert.ok(edges.length > 0, `renal ${domain} must retain evidence-bounded educational content`)
  assert.ok(edges.every((edge) => edge.domain === domain))
}
for (const edge of RENAL_KNOWLEDGE_EDGES) {
  assert.ok(edge.sourceIds.length > 0)
  assert.equal(renalKnowledgeHasCompleteProvenance(edge), true)
  assert.equal(renalEvidenceFor(edge).length, edge.sourceIds.length)
  assert.ok(edge.boundaries.includes('reference-educational'))
}
for (const domain of ['pathophysiology', 'pharmacology', 'imaging'] as const) {
  for (const edge of renalKnowledgeByDomain(domain)) {
    assert.ok(edge.boundaries.includes('requires-patient-data'))
    assert.ok(edge.boundaries.includes('requires-clinician-review'))
  }
}
assert.ok(renalKnowledgeByDomain('pharmacology').every((edge) => /Mechanism education only/.test(edge.summary)))
assert.ok(renalKnowledgeByDomain('imaging').every((edge) => /actual imaging study/.test(edge.summary)))
const unresolved = { ...RENAL_KNOWLEDGE_EDGES[0], id: 'renal-test-unresolved', sourceIds: ['missing-source'] }
assert.equal(renalKnowledgeHasCompleteProvenance(unresolved), false)
assert.deepEqual(renalEvidenceFor(unresolved), [])
console.log(`renal organ provenance acceptance passed: ${RENAL_KNOWLEDGE_EDGES.length} relationships, ${RENAL_EVIDENCE_SOURCES.length} sources`)
