import assert from 'node:assert/strict'
import {
  CARDIOVASCULAR_EVIDENCE_SOURCES,
  CARDIOVASCULAR_KNOWLEDGE_EDGES,
  cardiovascularEvidenceFor,
  cardiovascularKnowledgeByDomain,
  cardiovascularKnowledgeHasCompleteProvenance,
  type CardiovascularKnowledgeDomain,
} from '../../src/lib/bodyOrganCardiovascular'

const domains: CardiovascularKnowledgeDomain[] = ['anatomy', 'physiology', 'pathophysiology', 'pharmacology', 'imaging']

assert.equal(
  new Set(CARDIOVASCULAR_EVIDENCE_SOURCES.map((source) => source.id)).size,
  CARDIOVASCULAR_EVIDENCE_SOURCES.length,
  'cardiovascular evidence source IDs must remain unique',
)
assert.equal(
  new Set(CARDIOVASCULAR_KNOWLEDGE_EDGES.map((edge) => edge.id)).size,
  CARDIOVASCULAR_KNOWLEDGE_EDGES.length,
  'cardiovascular knowledge edge IDs must remain unique',
)

for (const source of CARDIOVASCULAR_EVIDENCE_SOURCES) {
  assert.match(source.pmid, /^\d+$/, `cardiovascular source ${source.id} must retain a numeric PMID`)
  assert.equal(
    source.url,
    `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`,
    `cardiovascular source ${source.id} must retain its canonical PubMed URL`,
  )
}

for (const domain of domains) {
  const edges = cardiovascularKnowledgeByDomain(domain)
  assert.ok(edges.length > 0, `cardiovascular ${domain} must retain at least one evidence-bounded educational relationship`)
  assert.ok(edges.every((edge) => edge.domain === domain), `cardiovascular ${domain} query must not leak relationships from another domain`)
}

for (const edge of CARDIOVASCULAR_KNOWLEDGE_EDGES) {
  assert.ok(edge.sourceIds.length > 0, `${edge.id} must retain explicit evidence provenance`)
  assert.equal(cardiovascularKnowledgeHasCompleteProvenance(edge), true, `${edge.id} must fail completeness if a source cannot be resolved`)
  assert.equal(cardiovascularEvidenceFor(edge).length, edge.sourceIds.length, `${edge.id} must resolve every declared source`)
  assert.ok(edge.boundaries.includes('reference-educational'), `${edge.id} must remain explicitly educational reference content`)
}

for (const domain of ['pathophysiology', 'pharmacology', 'imaging'] as const) {
  for (const edge of cardiovascularKnowledgeByDomain(domain)) {
    assert.ok(edge.boundaries.includes('requires-patient-data'), `${edge.id} must not cross into patient inference without patient data`)
    assert.ok(edge.boundaries.includes('requires-clinician-review'), `${edge.id} must preserve clinician-review boundary for clinical interpretation`)
  }
}

const pharmacology = cardiovascularKnowledgeByDomain('pharmacology')
assert.ok(
  pharmacology.every((edge) => /Mechanism-of-action education only/.test(edge.summary)),
  'cardiovascular pharmacology must not become prescribing guidance',
)

const imaging = cardiovascularKnowledgeByDomain('imaging')
assert.ok(
  imaging.every((edge) => /actual cardiac imaging study/.test(edge.summary)),
  'cardiovascular imaging orientation must not imply patient lesion or plaque inference',
)

const unresolved = {
  ...CARDIOVASCULAR_KNOWLEDGE_EDGES[0],
  id: 'cardiovascular-test-unresolved-source',
  sourceIds: ['pmid-does-not-exist'],
}
assert.equal(
  cardiovascularKnowledgeHasCompleteProvenance(unresolved),
  false,
  'cardiovascular provenance completeness must fail closed for an unresolved source',
)
assert.deepEqual(cardiovascularEvidenceFor(unresolved), [], 'unresolved cardiovascular evidence must never be fabricated')

console.log(
  `cardiovascular organ provenance acceptance passed: ${CARDIOVASCULAR_KNOWLEDGE_EDGES.length} relationships, ${CARDIOVASCULAR_EVIDENCE_SOURCES.length} PubMed sources, ${domains.length} domains`,
)
