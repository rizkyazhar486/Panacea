import { anatomyOntologyLookup, anatomyStructureLookup } from '../src/anatomyOntology.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const fetchAsli = globalThis.fetch
const urls: string[] = []

globalThis.fetch = async (input, init) => {
  const url = new URL(String(input))
  urls.push(url.toString())
  ok('setiap ontology request mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)

  if (url.hostname === 'www.ebi.ac.uk') {
    const ontology = url.searchParams.get('ontology')
    const q = url.searchParams.get('q') ?? ''
    ok('query OLS4 dibatasi 160 karakter', q.length <= 160, String(q.length))
    ok('rows OLS4 dibatasi', Number(url.searchParams.get('rows')) >= 1 && Number(url.searchParams.get('rows')) <= 10)

    const docs = ontology === 'doid'
      ? [{ obo_id: 'DOID:9351', label: 'diabetes mellitus', description: ['A disease has_symptom hyperglycemia.'], iri: 'http://purl.obolibrary.org/obo/DOID_9351' }]
      : ontology === 'hp'
        ? [{ obo_id: 'HP:0003074', label: 'hyperglycemia', description: ['Elevated blood glucose.'], iri: 'http://purl.obolibrary.org/obo/HP_0003074' }]
        : ontology === 'uberon'
          ? [{ obo_id: 'UBERON:0001264', label: 'pancreas', description: ['An organ.'], iri: 'http://purl.obolibrary.org/obo/UBERON_0001264' }]
          : [{ obo_id: 'FMA:7198', label: 'pancreas', description: ['Organ structure.'], iri: 'http://purl.org/sig/ont/fma/fma7198' }]

    return new Response(JSON.stringify({ response: { docs } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (url.hostname === 'clinicaltables.nlm.nih.gov') {
    const isHpo = url.pathname.includes('/hpo/')
    if (isHpo) {
      return new Response(JSON.stringify([2, ['HP:0003074', 'not-an-hp-id'], null, ['hyperglycemia', 'invalid phenotype']]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response(JSON.stringify([1, ['C0011849'], null, ['diabetes mellitus']]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  throw new Error(`Unexpected upstream URL: ${url}`)
}

try {
  const result = await anatomyOntologyLookup(['  diabetes\u0000   mellitus  ', 'x'.repeat(400)])
  const disease = result.diseases.find((term) => term.label === 'diabetes mellitus')
  const phenotype = result.phenotypes.find((term) => term.label === 'hyperglycemia')

  // OLS4 wins the duplicate label because it carries a real DOID; the NLM
  // Conditions duplicate must never replace it with a key_id pretending to be DOID.
  ok('duplicate disease prefers true OLS4 DOID', disease?.id === 'DOID:9351', disease?.id)
  ok('OLS4 disease source is explicit', disease?.source === 'ols4')
  ok('OLS4 disease identifier system is DOID', disease?.identifierSystem === 'doid')
  ok('OLS4 source URL is retained', Boolean(disease?.sourceUrl?.includes('ebi.ac.uk/ols4/api/search')))

  ok('phenotype keeps genuine HPO CURIE', phenotype?.id === 'HP:0003074', phenotype?.id)
  ok('phenotype identifier system is HP', phenotype?.identifierSystem === 'hp')

  const nlmCalls = urls.filter((value) => value.includes('clinicaltables.nlm.nih.gov'))
  ok('CTSS conditions and HPO are both queried', nlmCalls.length >= 2, String(nlmCalls.length))

  // Query a label that only CTSS returns so the NLM condition row survives dedupe.
  urls.length = 0
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input))
    urls.push(url.toString())
    ok('second-pass request keeps AbortSignal', init?.signal instanceof AbortSignal)
    if (url.hostname === 'www.ebi.ac.uk') {
      return new Response(JSON.stringify({ response: { docs: [] } }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    if (url.pathname.includes('/conditions/')) {
      return new Response(JSON.stringify([1, ['C0011849'], null, ['diabetes mellitus']]), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    return new Response(JSON.stringify([2, ['HP:0003074', 'bad-id'], null, ['hyperglycemia', 'invalid phenotype']]), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  const nlmOnly = await anatomyOntologyLookup(['diabetes mellitus'])
  const nlmDisease = nlmOnly.diseases[0]
  ok('NLM Conditions key_id is explicitly namespaced', nlmDisease?.id === 'NLM-CONDITIONS:C0011849', nlmDisease?.id)
  ok('NLM Conditions is not labelled as DOID identifier system', nlmDisease?.identifierSystem === 'nlm-conditions', nlmDisease?.identifierSystem)
  ok('NLM Conditions source is explicit', nlmDisease?.source === 'nlm-ctss')
  ok('NLM Conditions source URL is retained', Boolean(nlmDisease?.sourceUrl?.includes('/conditions/v3/search')))
  ok('malformed non-HP identifier is rejected', nlmOnly.phenotypes.every((term) => /^HP:\d+$/i.test(term.id)))

  // Structure lookup must carry the same provenance contract.
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input))
    ok('structure request keeps AbortSignal', init?.signal instanceof AbortSignal)
    const ontology = url.searchParams.get('ontology')
    const docs = ontology === 'uberon'
      ? [{ obo_id: 'UBERON:0001264', label: 'pancreas', description: ['An organ.'], iri: 'http://purl.obolibrary.org/obo/UBERON_0001264' }]
      : [{ obo_id: 'FMA:7198', label: 'pancreas', description: ['Organ structure.'], iri: 'http://purl.org/sig/ont/fma/fma7198' }]
    return new Response(JSON.stringify({ response: { docs } }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const structures = await anatomyStructureLookup(['pancreas'])
  ok('structure provenance identifies OLS4', structures.every((term) => term.source === 'ols4'))
  ok('structure identifiers preserve ontology namespace', structures.every((term) => ['uberon', 'fma'].includes(term.identifierSystem)))
} finally {
  globalThis.fetch = fetchAsli
}

console.log(`\nOntology adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
