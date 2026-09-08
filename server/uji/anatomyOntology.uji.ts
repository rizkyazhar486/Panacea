import assert from 'node:assert/strict'
import { anatomyOntologyLookup, anatomyStructureLookup } from '../src/anatomyOntology.js'

const originalFetch = globalThis.fetch
const seenUrls: string[] = []

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

try {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    const url = String(input)
    seenUrls.push(url)
    const parsed = new URL(url)

    if (parsed.hostname === 'www.ebi.ac.uk' && parsed.pathname.includes('/ols4/api/search')) {
      const ontology = parsed.searchParams.get('ontology')
      if (ontology === 'doid') {
        return response({ response: { docs: [{
          obo_id: 'DOID:7',
          label: 'Lung disease',
          description: ['A disease located_in lung.'],
          iri: 'http://purl.obolibrary.org/obo/DOID_7',
        }] } })
      }
      if (ontology === 'hp') {
        return response({ response: { docs: [{
          obo_id: 'HP:0002088',
          label: 'Abnormal lung morphology',
          description: ['An abnormality of the lung.'],
          iri: 'http://purl.obolibrary.org/obo/HP_0002088',
        }] } })
      }
      if (ontology === 'uberon') {
        return response({ response: { docs: [{
          obo_id: 'UBERON:0002048',
          label: 'lung',
          description: ['Respiratory organ.'],
          iri: 'http://purl.obolibrary.org/obo/UBERON_0002048',
        }] } })
      }
      if (ontology === 'fma') {
        return response({ response: { docs: [{
          obo_id: 'FMA:7195',
          label: 'Lung',
          description: ['Organ of respiratory system.'],
          iri: 'http://purl.org/sig/ont/fma/fma7195',
        }] } })
      }
    }

    if (parsed.hostname === 'clinicaltables.nlm.nih.gov' && parsed.pathname.includes('/conditions/')) {
      // `key-42` adalah key_id internal NLM Conditions, bukan DOID.
      return response([1, ['key-42'], null, ['Lung condition']])
    }

    if (parsed.hostname === 'clinicaltables.nlm.nih.gov' && parsed.pathname.includes('/hpo/')) {
      return response([2, ['HP:0002088', 'not-an-hpo-id'], null, ['Lung phenotype', 'Invalid phenotype']])
    }

    throw new Error(`Unexpected test URL: ${url}`)
  }) as typeof fetch

  const result = await anatomyOntologyLookup(['  lung   '])

  const doid = result.diseases.find((term) => term.id === 'DOID:7')
  assert.ok(doid, 'OLS4 DOID result should remain available')
  assert.equal(doid.ontology, 'doid')
  assert.equal(doid.idSystem, 'DOID')
  assert.equal(doid.source, 'ols4')
  assert.match(doid.sourceUrl, /www\.ebi\.ac\.uk\/ols4\/api\/search/)
  assert.match(doid.description, /located in lung/i)

  const nlmCondition = result.diseases.find((term) => term.id === 'key-42')
  assert.ok(nlmCondition, 'NLM Conditions result should remain in the disease bucket')
  assert.equal(nlmCondition.ontology, 'nlm-condition')
  assert.equal(nlmCondition.idSystem, 'NLM_CONDITION_KEY')
  assert.equal(nlmCondition.source, 'nlm-ctss')
  assert.doesNotMatch(nlmCondition.id, /^DOID:/i)
  assert.match(nlmCondition.sourceUrl, /clinicaltables\.nlm\.nih\.gov\/api\/conditions/)

  const hpo = result.phenotypes.find((term) => term.source === 'nlm-ctss')
  assert.ok(hpo, 'NLM HPO result should remain available')
  assert.equal(hpo.id, 'HP:0002088')
  assert.equal(hpo.ontology, 'hp')
  assert.equal(hpo.idSystem, 'HP')
  assert.equal(result.phenotypes.some((term) => term.id === 'not-an-hpo-id'), false,
    'Malformed upstream HPO identifiers must be dropped instead of mislabeled as HP')

  const longQuery = `lung ${'x'.repeat(300)}`
  await anatomyStructureLookup([longQuery])
  const structureUrls = seenUrls
    .map((url) => new URL(url))
    .filter((url) => url.hostname === 'www.ebi.ac.uk' && ['uberon', 'fma'].includes(url.searchParams.get('ontology') ?? ''))
    .slice(-2)
  assert.equal(structureUrls.length, 2)
  for (const url of structureUrls) {
    assert.ok((url.searchParams.get('q') ?? '').length <= 160, 'Ontology query must be bounded before upstream request')
    assert.equal(url.searchParams.get('rows'), '4')
  }

  const structures = await anatomyStructureLookup(['lung'])
  assert.ok(structures.some((term) => term.idSystem === 'UBERON'))
  assert.ok(structures.some((term) => term.idSystem === 'FMA'))
  assert.ok(structures.every((term) => term.source === 'ols4'))

  console.log('Anatomy ontology provenance regression passed.')
} finally {
  globalThis.fetch = originalFetch
}
