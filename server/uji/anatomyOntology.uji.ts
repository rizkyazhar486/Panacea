import assert from 'node:assert/strict'
import { anatomyOntologyLookup, anatomyStructureLookup } from '../src/anatomyOntology.js'

const originalFetch = globalThis.fetch
const seenUrls: string[] = []

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

try {
  globalThis.fetch = async (input) => {
    const url = String(input)
    seenUrls.push(url)

    if (url.includes('ols4/api/search') && url.includes('ontology=doid')) {
      return jsonResponse({
        response: {
          docs: [{
            obo_id: 'DOID:9351',
            label: 'diabetes mellitus',
            description: ['A disease has_symptom hyperglycemia.'],
            iri: 'http://purl.obolibrary.org/obo/DOID_9351',
          }],
        },
      })
    }

    if (url.includes('ols4/api/search') && url.includes('ontology=hp')) {
      return jsonResponse({
        response: {
          docs: [{
            obo_id: 'HP:0003074',
            label: 'hyperglycemia',
            description: ['Increased blood glucose concentration.'],
            iri: 'http://purl.obolibrary.org/obo/HP_0003074',
          }],
        },
      })
    }

    if (url.includes('/conditions/v3/search')) {
      // `cond-123` represents CTSS conditions key_id. It is intentionally not
      // a Disease Ontology CURIE and must never be promoted to DOID. The label
      // differs from the OLS fixture so the normal label-deduplication path
      // does not hide the provenance assertion this test is intended to make.
      return jsonResponse([1, ['cond-123'], null, ['type 2 diabetes']])
    }

    if (url.includes('/hpo/v3/search')) {
      return jsonResponse([1, ['HP:0003074'], null, ['hyperglycemia']])
    }

    if (url.includes('ols4/api/search') && url.includes('ontology=uberon')) {
      return jsonResponse({
        response: {
          docs: [{
            obo_id: 'UBERON:0002107',
            label: 'liver',
            description: ['A digestive system organ.'],
            iri: 'http://purl.obolibrary.org/obo/UBERON_0002107',
          }],
        },
      })
    }

    if (url.includes('ols4/api/search') && url.includes('ontology=fma')) {
      return jsonResponse({ response: { docs: [] } })
    }

    throw new Error(`Unexpected test URL: ${url}`)
  }

  const result = await anatomyOntologyLookup(['  diabetes   mellitus  '])
  const doid = result.diseases.find((term) => term.id === 'DOID:9351')
  const nlmCondition = result.diseases.find((term) => term.id === 'cond-123')
  const hp = result.phenotypes.find((term) => term.id === 'HP:0003074')

  assert.ok(doid, 'OLS4 DOID result must remain available')
  assert.equal(doid.source, 'ols4')
  assert.equal(doid.idSystem, 'DOID')
  assert.equal(doid.ontology, 'doid')
  assert.match(doid.description, /symptoms include hyperglycemia/i)

  assert.ok(nlmCondition, 'NLM conditions result must remain in disease bucket')
  assert.equal(nlmCondition.source, 'nlm-ctss')
  assert.equal(nlmCondition.idSystem, 'NLM_CONDITIONS')
  assert.equal(nlmCondition.ontology, 'nlm-conditions')
  assert.notEqual(nlmCondition.ontology, 'doid', 'NLM conditions key_id must never masquerade as DOID')
  assert.ok(!/^DOID:/i.test(nlmCondition.id), 'NLM conditions key_id must not be rewritten as a DOID CURIE')

  assert.ok(hp, 'HPO result must remain available')
  assert.equal(hp.idSystem, 'HP')
  assert.ok(['ols4', 'nlm-ctss'].includes(hp.source))

  assert.ok(seenUrls.every((url) => !url.includes('  ')), 'Queries sent upstream must be whitespace-normalized')

  seenUrls.length = 0
  const longQuery = `liver ${'x'.repeat(300)}`
  const structures = await anatomyStructureLookup([longQuery])
  const uberon = structures.find((term) => term.id === 'UBERON:0002107')
  assert.ok(uberon)
  assert.equal(uberon.source, 'ols4')
  assert.equal(uberon.idSystem, 'UBERON')
  for (const rawUrl of seenUrls) {
    const q = new URL(rawUrl).searchParams.get('q') ?? ''
    assert.ok(q.length <= 160, `Ontology query exceeded bound: ${q.length}`)
  }

  // One-source failure must not erase valid output from the parallel source.
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.includes('ols4/api/search')) throw new Error('simulated OLS outage')
    if (url.includes('/conditions/v3/search')) return jsonResponse([1, ['cond-999'], null, ['kidney disease']])
    if (url.includes('/hpo/v3/search')) return jsonResponse([1, ['HP:0000077'], null, ['abnormality of the kidney']])
    throw new Error(`Unexpected fallback URL: ${url}`)
  }

  const fallback = await anatomyOntologyLookup(['kidney'])
  assert.ok(fallback.diseases.some((term) => term.id === 'cond-999' && term.source === 'nlm-ctss'))
  assert.ok(fallback.phenotypes.some((term) => term.id === 'HP:0000077' && term.idSystem === 'HP'))

  console.log('Ontology provenance and fallback boundaries verified.')
} finally {
  globalThis.fetch = originalFetch
}
