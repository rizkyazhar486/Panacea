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
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    seenUrls.push(url)
    assert.ok(init?.signal, `Upstream ontology request must carry a timeout signal: ${url}`)

    if (url.includes('/ols4/api/search')) {
      const parsed = new URL(url)
      const ontology = parsed.searchParams.get('ontology')
      const query = parsed.searchParams.get('q')
      assert.ok((query?.length ?? 0) <= 160, 'OLS4 query must be bounded to 160 characters')
      assert.equal(parsed.searchParams.get('rows'), '4')

      if (ontology === 'uberon') {
        return jsonResponse({
          response: {
            docs: [{ obo_id: 'UBERON:0002113', label: 'kidney', description: ['paired organ'], iri: 'http://purl.obolibrary.org/obo/UBERON_0002113' }],
          },
        })
      }
      if (ontology === 'fma') return jsonResponse({ response: { docs: [] } })

      // Disease/phenotype OLS4 deliberately empty so the NLM fallback records
      // are observable rather than deduplicated behind an OLS result.
      return jsonResponse({ response: { docs: [] } })
    }

    if (url.includes('/conditions/v3/search')) {
      const parsed = new URL(url)
      assert.equal(parsed.searchParams.get('df'), 'primary_name')
      assert.ok((parsed.searchParams.get('terms')?.length ?? 0) <= 160)
      return jsonResponse([1, ['1234567'], null, ['back pain condition']])
    }

    if (url.includes('/hpo/v3/search')) {
      const parsed = new URL(url)
      assert.equal(parsed.searchParams.get('df'), 'name')
      return jsonResponse([1, ['HP:0003418'], null, ['back pain']])
    }

    throw new Error(`Unexpected fetch URL: ${url}`)
  }) as typeof fetch

  const lookup = await anatomyOntologyLookup([`  ${'back pain '.repeat(30)}  `])
  assert.equal(lookup.diseases.length, 1)
  assert.equal(lookup.phenotypes.length, 1)

  const condition = lookup.diseases[0]
  assert.equal(condition.id, '1234567')
  assert.equal(condition.ontology, 'nlm-conditions')
  assert.equal(condition.idSystem, 'NLM_CONDITION_KEY')
  assert.equal(condition.source, 'nlm-clinical-tables')
  assert.ok(!condition.id.startsWith('DOID:'), 'NLM condition key must never masquerade as a DOID')

  const phenotype = lookup.phenotypes[0]
  assert.equal(phenotype.id, 'HP:0003418')
  assert.equal(phenotype.ontology, 'hp')
  assert.equal(phenotype.idSystem, 'HP')
  assert.equal(phenotype.source, 'nlm-clinical-tables')

  const structures = await anatomyStructureLookup(['kidney'])
  assert.equal(structures.length, 1)
  assert.equal(structures[0].id, 'UBERON:0002113')
  assert.equal(structures[0].ontology, 'uberon')
  assert.equal(structures[0].idSystem, 'UBERON')
  assert.equal(structures[0].source, 'ols4')
  assert.equal(structures[0].iri, 'http://purl.obolibrary.org/obo/UBERON_0002113')

  assert.ok(seenUrls.some((url) => url.includes('/conditions/v3/search')))
  assert.ok(seenUrls.some((url) => url.includes('/hpo/v3/search')))
  assert.ok(seenUrls.some((url) => url.includes('ontology=uberon')))

  console.log('Anatomy ontology provenance regression verified.')
} finally {
  globalThis.fetch = originalFetch
}
