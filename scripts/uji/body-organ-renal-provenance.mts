import assert from 'node:assert/strict'
import {
  RENAL_EVIDENCE_SOURCES,
  RENAL_KNOWLEDGE_EDGES,
  renalEvidenceFor,
  renalKnowledgeByDomain,
  renalKnowledgeHasCompleteProvenance,
  type RenalKnowledgeDomain,
} from '../../src/lib/bodyOrganRenal'

const domains: RenalKnowledgeDomain[] = ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging']

assert.equal(new Set(RENAL_EVIDENCE_SOURCES.map((source) => source.id)).size, RENAL_EVIDENCE_SOURCES.length, 'renal evidence source IDs must remain unique')
assert.equal(new Set(RENAL_KNOWLEDGE_EDGES.map((edge) => edge.id)).size, RENAL_KNOWLEDGE_EDGES.length, 'renal knowledge edge IDs must remain unique')

for (const source of RENAL_EVIDENCE_SOURCES) {
  assert.match(source.pmid, /^\d+$/, `renal source ${source.id} must retain a numeric PMID`)
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`, `renal source ${source.id} must retain its canonical PubMed URL`)
}

for (const domain of domains) {
  const edges = renalKnowledgeByDomain(domain)
  assert.ok(edges.length > 0, `renal ${domain} must retain at least one evidence-bounded educational relationship`)
  assert.ok(edges.every((edge) => edge.domain === domain), `renal ${domain} query must not leak relationships from another domain`)
}

for (const edge of RENAL_KNOWLEDGE_EDGES) {
  assert.ok(edge.sourceIds.length > 0, `${edge.id} must retain explicit evidence provenance`)
  assert.equal(renalKnowledgeHasCompleteProvenance(edge), true, `${edge.id} must fail completeness if a source cannot be resolved`)
  assert.equal(renalEvidenceFor(edge).length, edge.sourceIds.length, `${edge.id} must resolve every declared source`)
  assert.ok(edge.boundaries.includes('reference-educational'), `${edge.id} must remain explicitly educational reference content`)
}

for (const domain of ['pathophysiology', 'pharmacology', 'imaging'] as const) {
  for (const edge of renalKnowledgeByDomain(domain)) {
    assert.ok(edge.boundaries.includes('requires-patient-data'), `${edge.id} must not cross into patient inference without patient data`)
    assert.ok(edge.boundaries.includes('requires-clinician-review'), `${edge.id} must preserve clinician-review boundary for clinical interpretation`)
  }
}

const pharmacology = renalKnowledgeByDomain('pharmacology')
assert.ok(pharmacology.every((edge) => /Mechanism-of-action education only/.test(edge.summary)), 'renal pharmacology must not become prescribing guidance')

const imaging = renalKnowledgeByDomain('imaging')
assert.ok(imaging.every((edge) => /actual imaging study/.test(edge.summary)), 'renal imaging orientation must not imply patient lesion or pathology inference')

const unresolved = {
  ...RENAL_KNOWLEDGE_EDGES[0],
  id: 'renal-test-unresolved-source',
  sourceIds: ['pmid-does-not-exist'],
}
assert.equal(renalKnowledgeHasCompleteProvenance(unresolved), false, 'renal provenance completeness must fail closed for an unresolved source')
assert.deepEqual(renalEvidenceFor(unresolved), [], 'unresolved renal evidence must never be fabricated')

console.log(`renal organ provenance acceptance passed: ${RENAL_KNOWLEDGE_EDGES.length} relationships, ${RENAL_EVIDENCE_SOURCES.length} PubMed sources, ${domains.length} domains`)
