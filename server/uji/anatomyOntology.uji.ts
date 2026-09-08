import assert from 'node:assert/strict'
import { anatomyOntologyLookup, anatomyStructureLookup } from '../src/anatomyOntology'

const originalFetch = globalThis.fetch
const seenUrls: string[] = []

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
})

const fakeFetch: typeof fetch = async (input) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  seenUrls.push(url)
  const parsed = new URL(url)

  if (parsed.hostname === 'www.ebi.ac.uk' && parsed.pathname === '/ols4/api/search') {
    const ontology = parsed.searchParams.get('ontology')
    if (ontology === 'doid') {
      return json({ response: { docs: [{
        obo_id: 'DOID:0060249',
        label: 'Back pain disease',
        description: ['A disease has_symptom back pain.'],
        iri: 'http://purl.obolibrary.org/obo/DOID_0060249',
      }] } })
    }
    if (ontology === 'hp') {
      return json({ response: { docs: [{
        obo_id: 'HP:0003418',
        label: 'Back pain phenotype',
        description: ['Pain located in the back.'],
        iri: 'http://purl.obolibrary.org/obo/HP_0003418',
      }] } })
    }
    return json({ response: { docs: [] } })
  }

  if (parsed.hostname === 'clinicaltables.nlm.nih.gov' && parsed.pathname.includes('/conditions/')) {
    return json([1, ['condition-key-123'], null, ['Back pain condition']])
  }

  if (parsed.hostname === 'clinicaltables.nlm.nih.gov' && parsed.pathname.includes('/hpo/')) {
    return json([1, ['HP:0012531'], null, ['Back pain symptom']])
  }

  throw new Error(`Unexpected request: ${url}`)
}

globalThis.fetch = fakeFetch

try {
  const result = await anatomyOntologyLookup(['   back    pain   ', 'BACK PAIN'])

  const olsDisease = result.diseases.find((term) => term.source === 'ols4')
  assert.ok(olsDisease, 'OLS disease result must survive aggregation')
  assert.equal(olsDisease.id, 'DOID:0060249')
  assert.equal(olsDisease.ontology, 'doid')
  assert.equal(olsDisease.idSystem, 'DOID')

  const nlmCondition = result.diseases.find((term) => term.source === 'nlm-ctss')
  assert.ok(nlmCondition, 'NLM conditions result must survive aggregation')
  assert.equal(nlmCondition.id, 'condition-key-123')
  assert.equal(nlmCondition.ontology, 'doid', 'legacy disease bucket remains backward-compatible')
  assert.equal(nlmCondition.idSystem, 'NLM_CONDITIONS_KEY', 'NLM key_id must never be mislabeled as DOID')
  assert.notMatch(nlmCondition.id, /^DOID:/)

  const nlmPhenotype = result.phenotypes.find((term) => term.source === 'nlm-ctss')
  assert.ok(nlmPhenotype, 'NLM HPO result must survive aggregation')
  assert.equal(nlmPhenotype.id, 'HP:0012531')
  assert.equal(nlmPhenotype.ontology, 'hp')
  assert.equal(nlmPhenotype.idSystem, 'HP')

  const olsDoidUrl = seenUrls.find((url) => url.includes('ontology=doid'))
  assert.ok(olsDoidUrl)
  assert.equal(new URL(olsDoidUrl).searchParams.get('q'), 'back pain')

  const conditionsUrl = seenUrls.find((url) => url.includes('/conditions/'))
  assert.ok(conditionsUrl)
  assert.equal(new URL(conditionsUrl).searchParams.get('cf'), 'key_id')

  const hpoUrl = seenUrls.find((url) => url.includes('/hpo/'))
  assert.ok(hpoUrl)
  assert.equal(new URL(hpoUrl).searchParams.get('cf'), 'id')

  // Case-insensitive duplicate input terms must collapse to a single four-source lookup.
  assert.equal(seenUrls.length, 4)

  seenUrls.length = 0
  await anatomyStructureLookup(['x'.repeat(400)])
  assert.equal(seenUrls.length, 2)
  for (const url of seenUrls) {
    const q = new URL(url).searchParams.get('q') ?? ''
    assert.equal(q.length, 160, 'upstream ontology query must be bounded')
  }

  console.log('Anatomy ontology provenance and query bounds verified.')
} finally {
  globalThis.fetch = originalFetch
}
