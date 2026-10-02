import assert from 'node:assert/strict'
import {
  RESPIRATORY_EVIDENCE_SOURCES,
  RESPIRATORY_KNOWLEDGE_EDGES,
  respiratoryEvidenceFor,
  respiratoryKnowledgeByDomain,
  respiratoryKnowledgeHasCompleteProvenance,
  type RespiratoryKnowledgeDomain,
} from '../../src/lib/bodyOrganRespiratory'

const domains: RespiratoryKnowledgeDomain[] = ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging']

assert.equal(new Set(RESPIRATORY_EVIDENCE_SOURCES.map((source) => source.id)).size, RESPIRATORY_EVIDENCE_SOURCES.length, 'respiratory evidence source IDs must remain unique')
assert.equal(new Set(RESPIRATORY_KNOWLEDGE_EDGES.map((edge) => edge.id)).size, RESPIRATORY_KNOWLEDGE_EDGES.length, 'respiratory knowledge edge IDs must remain unique')

for (const source of RESPIRATORY_EVIDENCE_SOURCES) {
  if (source.kind === 'pubmed') {
    assert.match(source.pmid ?? '', /^\d+$/, `${source.id} must retain a numeric PMID`)
    assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`, `${source.id} must retain its canonical PubMed URL`)
  } else {
    assert.match(source.setId ?? '', /^[0-9a-f-]{36}$/, `${source.id} must retain a DailyMed set ID`)
    assert.equal(source.sectionCode, '43679-0', `${source.id} must retain the mechanism-of-action section code`)
    assert.ok((source.version ?? 0) > 0, `${source.id} must retain a positive label version`)
  }
}

for (const domain of domains) {
  const edges = respiratoryKnowledgeByDomain(domain)
  assert.ok(edges.length > 0, `respiratory ${domain} must retain at least one evidence-bounded educational relationship`)
  assert.ok(edges.every((edge) => edge.domain === domain), `respiratory ${domain} query must not leak another domain`)
}

for (const edge of RESPIRATORY_KNOWLEDGE_EDGES) {
  assert.ok(edge.sourceIds.length > 0, `${edge.id} must retain explicit evidence provenance`)
  assert.equal(respiratoryKnowledgeHasCompleteProvenance(edge), true, `${edge.id} must resolve all declared sources`)
  assert.equal(respiratoryEvidenceFor(edge).length, edge.sourceIds.length, `${edge.id} must resolve every declared source exactly once`)
  assert.ok(edge.boundaries.includes('reference-educational'), `${edge.id} must remain explicitly educational reference content`)
}

for (const domain of ['pathophysiology', 'pharmacology', 'imaging'] as const) {
  for (const edge of respiratoryKnowledgeByDomain(domain)) {
    assert.ok(edge.boundaries.includes('requires-patient-data'), `${edge.id} must not cross into patient inference without patient data`)
    assert.ok(edge.boundaries.includes('requires-clinician-review'), `${edge.id} must preserve clinician-review boundary`)
  }
}

assert.ok(respiratoryKnowledgeByDomain('pharmacology').every((edge) => /Mechanism-of-action education only/.test(edge.summary)), 'respiratory pharmacology must not become prescribing guidance')
assert.ok(respiratoryKnowledgeByDomain('imaging').every((edge) => /actual imaging study/.test(edge.summary)), 'respiratory imaging orientation must not imply patient pathology')

const unresolved = { ...RESPIRATORY_KNOWLEDGE_EDGES[0], id: 'respiratory-test-unresolved', sourceIds: ['missing-source'] }
assert.equal(respiratoryKnowledgeHasCompleteProvenance(unresolved), false, 'respiratory provenance must fail closed for unresolved evidence')
assert.deepEqual(respiratoryEvidenceFor(unresolved), [], 'unresolved respiratory evidence must never be fabricated')

console.log(`respiratory organ provenance acceptance passed: ${RESPIRATORY_KNOWLEDGE_EDGES.length} relationships, ${RESPIRATORY_EVIDENCE_SOURCES.length} sources, ${domains.length} domains`)
