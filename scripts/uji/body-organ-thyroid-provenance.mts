import assert from 'node:assert/strict'
import { THYROID_EVIDENCE_SOURCES, THYROID_KNOWLEDGE_EDGES, thyroidEvidenceFor, thyroidKnowledgeByDomain, thyroidKnowledgeHasCompleteProvenance, type ThyroidKnowledgeDomain } from '../../src/lib/bodyOrganThyroid'

const domains: ThyroidKnowledgeDomain[] = ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging']
assert.equal(new Set(THYROID_EVIDENCE_SOURCES.map(s => s.id)).size, THYROID_EVIDENCE_SOURCES.length)
assert.equal(new Set(THYROID_KNOWLEDGE_EDGES.map(e => e.id)).size, THYROID_KNOWLEDGE_EDGES.length)
for (const source of THYROID_EVIDENCE_SOURCES) {
  assert.match(source.pmid, /^\d+$/)
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
}
for (const domain of domains) {
  const edges = thyroidKnowledgeByDomain(domain)
  assert.ok(edges.length > 0)
  assert.ok(edges.every(e => e.domain === domain))
}
for (const edge of THYROID_KNOWLEDGE_EDGES) {
  assert.ok(edge.sourceIds.length > 0)
  assert.equal(thyroidKnowledgeHasCompleteProvenance(edge), true)
  assert.equal(thyroidEvidenceFor(edge).length, edge.sourceIds.length)
  assert.ok(edge.boundaries.includes('reference-educational'))
}
for (const domain of ['pathophysiology', 'pharmacology', 'imaging'] as const) {
  for (const edge of thyroidKnowledgeByDomain(domain)) {
    assert.ok(edge.boundaries.includes('requires-patient-data'))
    assert.ok(edge.boundaries.includes('requires-clinician-review'))
  }
}
assert.ok(thyroidKnowledgeByDomain('pharmacology').every(e => /Mechanism education only/.test(e.summary)))
assert.ok(thyroidKnowledgeByDomain('imaging').every(e => /actual imaging study/.test(e.summary)))
const unresolved = { ...THYROID_KNOWLEDGE_EDGES[0], id: 'thyroid-unresolved', sourceIds: ['missing'] }
assert.equal(thyroidKnowledgeHasCompleteProvenance(unresolved), false)
assert.deepEqual(thyroidEvidenceFor(unresolved), [])
console.log('thyroid organ provenance acceptance passed')
