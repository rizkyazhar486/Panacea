import { anatomyOntologyLookup, anatomyStructureLookup } from '../src/anatomyOntology'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

const fixedRetrievedAt = '2026-09-09T12:34:56.000Z'
const fixedClock = () => new Date(fixedRetrievedAt)

// Regression fixture: OLS kosong sehingga penyakit/fenotipe datang dari NLM
// CTSS. Conditions memakai key internal NLM, sedangkan HPO memakai HP CURIE.
{
  const urls: string[] = []
  const fakeFetch: typeof fetch = async (input) => {
    const url = String(input)
    urls.push(url)

    if (url.includes('www.ebi.ac.uk/ols4/api/search')) {
      return jsonResponse({ response: { docs: [] } })
    }
    if (url.includes('/conditions/v3/search')) {
      return jsonResponse([1, ['C0000001'], null, [['Back pain']]])
    }
    if (url.includes('/hpo/v3/search')) {
      return jsonResponse([2, ['HP:0003418', 'not-an-hpo-id'], null, [['Back pain'], ['Invalid phenotype']]])
    }
    return new Response('not found', { status: 404 })
  }

  const result = await anatomyOntologyLookup(['back pain'], fakeFetch, fixedClock)
  const disease = result.diseases[0]
  const phenotype = result.phenotypes[0]

  ok('CTSS conditions tetap masuk bucket disease', result.diseases.length === 1)
  ok('key kondisi NLM tidak dilabeli sebagai DOID', disease?.ontology === 'nlm-conditions', disease?.ontology)
  ok('key kondisi NLM membawa source CTSS', disease?.source === 'nlm-ctss', disease?.source)
  ok('key kondisi NLM membawa identifier system eksplisit',
    disease?.identifierSystem === 'NLM_CONDITIONS_KEY', disease?.identifierSystem)
  ok('key kondisi NLM dipertahankan apa adanya', disease?.id === 'C0000001', disease?.id)
  ok('display-array CTSS dinormalisasi menjadi label tunggal', disease?.label === 'Back pain', disease?.label)
  ok('dataset conditions dipertahankan eksplisit',
    disease?.sourceDataset === 'nlm-clinical-tables:conditions', disease?.sourceDataset)
  ok('retrieval timestamp conditions deterministik', disease?.retrievedAt === fixedRetrievedAt, disease?.retrievedAt)
  ok('provenance URL conditions dipertahankan', disease?.sourceUrl.includes('/conditions/v3/search') === true, disease?.sourceUrl)

  ok('HPO CTSS tetap berada di bucket phenotype', result.phenotypes.length === 1)
  ok('HPO CTSS tetap memakai namespace HP', phenotype?.ontology === 'hp', phenotype?.ontology)
  ok('HPO CTSS membawa identifier system HP', phenotype?.identifierSystem === 'HP', phenotype?.identifierSystem)
  ok('HPO CTSS mempertahankan CURIE HP', phenotype?.id === 'HP:0003418', phenotype?.id)
  ok('HPO malformed tidak dipalsukan sebagai HP', !result.phenotypes.some((term) => term.id === 'not-an-hpo-id'))
  ok('dataset HPO dipertahankan eksplisit',
    phenotype?.sourceDataset === 'nlm-clinical-tables:hpo', phenotype?.sourceDataset)
  ok('retrieval timestamp HPO sama dalam satu lookup', phenotype?.retrievedAt === fixedRetrievedAt, phenotype?.retrievedAt)
  ok('provenance URL HPO dipertahankan', phenotype?.sourceUrl.includes('/hpo/v3/search') === true, phenotype?.sourceUrl)
  ok('lookup tetap membatasi satu kueri ke empat sumber', urls.length === 4, String(urls.length))

  const conditionUrl = urls.map((url) => new URL(url)).find((url) => url.pathname.includes('/conditions/v3/search'))
  ok('conditions meminta code field key_id secara eksplisit', conditionUrl?.searchParams.get('cf') === 'key_id', conditionUrl?.search)
  ok('conditions meminta display field primary_name', conditionUrl?.searchParams.get('df') === 'primary_name', conditionUrl?.search)

  const hpoUrl = urls.map((url) => new URL(url)).find((url) => url.pathname.includes('/hpo/v3/search'))
  ok('HPO meminta code field id secara eksplisit', hpoUrl?.searchParams.get('cf') === 'id', hpoUrl?.search)
  ok('HPO meminta display field name', hpoUrl?.searchParams.get('df') === 'name', hpoUrl?.search)
}

// OLS anatomy terms juga harus membawa provenance yang dapat dibedakan dari
// CTSS; semantic term tidak boleh disalahartikan sebagai bukti adanya mesh 3D.
{
  const fakeFetch: typeof fetch = async (input) => {
    const url = String(input)
    if (url.includes('ontology=uberon')) {
      return jsonResponse({
        response: {
          docs: [{
            obo_id: 'UBERON:0000948',
            label: 'heart',
            description: ['A muscular organ.'],
            iri: 'http://purl.obolibrary.org/obo/UBERON_0000948',
          }],
        },
      })
    }
    if (url.includes('ontology=fma')) {
      return jsonResponse({ response: { docs: [] } })
    }
    return new Response('not found', { status: 404 })
  }

  const result = await anatomyStructureLookup(['heart'], fakeFetch, fixedClock)
  const term = result[0]
  ok('OLS anatomy term ditemukan', result.length === 1)
  ok('OLS anatomy term membawa source OLS4', term?.source === 'ebi-ols4', term?.source)
  ok('UBERON membawa identifier system UBERON', term?.identifierSystem === 'UBERON', term?.identifierSystem)
  ok('UBERON CURIE dipertahankan', term?.id === 'UBERON:0000948', term?.id)
  ok('OLS dataset context dipertahankan', term?.sourceDataset === 'ols4:uberon', term?.sourceDataset)
  ok('OLS retrieval timestamp dipertahankan', term?.retrievedAt === fixedRetrievedAt, term?.retrievedAt)
  ok('OLS source URL dipertahankan', term?.sourceUrl.includes('www.ebi.ac.uk/ols4/api/search') === true, term?.sourceUrl)
}

// Query panjang tidak boleh diteruskan mentah ke upstream. Ini menjaga request
// bounded dan mencegah cache/log upstream diisi payload arbitrer sangat panjang.
{
  const queryLengths: number[] = []
  const fakeFetch: typeof fetch = async (input) => {
    const url = new URL(String(input))
    queryLengths.push((url.searchParams.get('q') ?? '').length)
    return jsonResponse({ response: { docs: [] } })
  }
  await anatomyStructureLookup([`lung ${'x'.repeat(500)}`], fakeFetch, fixedClock)
  ok('query OLS dibatasi sebelum upstream', queryLengths.length === 2 && queryLengths.every((n) => n <= 160), queryLengths.join(','))
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
