import { anatomyOntologyLookup, anatomyStructureLookup } from '../src/anatomyOntology.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const fetchAsli = globalThis.fetch

async function denganFetchPalsu(fn: typeof fetch, run: () => Promise<void>) {
  globalThis.fetch = fn
  try {
    await run()
  } finally {
    globalThis.fetch = fetchAsli
  }
}

const requestUrls: URL[] = []
await denganFetchPalsu(async (input, init) => {
  const url = new URL(String(input))
  requestUrls.push(url)
  ok('semua ontology request memakai HTTPS', url.protocol === 'https:')
  ok('semua ontology request membawa timeout AbortSignal', init?.signal instanceof AbortSignal)

  if (url.hostname === 'www.ebi.ac.uk') {
    const ontology = url.searchParams.get('ontology')
    const q = url.searchParams.get('q') ?? ''
    ok(`OLS query ${ontology} dibatasi 160 karakter`, q.length <= 160, String(q.length))
    ok(`OLS rows ${ontology} dibatasi`, Number(url.searchParams.get('rows')) <= 10)

    const docs = ontology === 'doid'
      ? [{ obo_id: 'DOID:0050117', label: 'Heart disease', description: ['A disease has_symptom dyspnea.'], iri: 'http://purl.obolibrary.org/obo/DOID_0050117' }]
      : ontology === 'hp'
        ? [{ obo_id: 'HP:0001627', label: 'Abnormal heart morphology', description: ['A phenotypic abnormality.'], iri: 'http://purl.obolibrary.org/obo/HP_0001627' }]
        : ontology === 'uberon'
          ? [{ obo_id: 'UBERON:0000948', label: 'heart', description: ['Muscular organ.'], iri: 'http://purl.obolibrary.org/obo/UBERON_0000948' }]
          : ontology === 'fma'
            ? [{ obo_id: 'FMA:7088', label: 'Heart', description: ['Organ.'], iri: 'https://example.test/fma/7088' }]
            : []
    return new Response(JSON.stringify({ response: { docs } }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  if (url.hostname === 'clinicaltables.nlm.nih.gov') {
    const q = url.searchParams.get('terms') ?? ''
    ok('CTSS query dibatasi 160 karakter', q.length <= 160, String(q.length))
    if (url.pathname.includes('/conditions/')) {
      return new Response(JSON.stringify([
        3,
        ['medlineplus-heart-key', '', 'another-internal-key'],
        null,
        ['Heart condition index', 'Missing identifier row', 'Heart condition secondary'],
      ]), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    if (url.pathname.includes('/hpo/')) {
      return new Response(JSON.stringify([
        2,
        ['HP:0011025', 'NOT-HPO:123'],
        null,
        ['Abnormal heart physiology', 'Invalid HPO row'],
      ]), { status: 200, headers: { 'content-type': 'application/json' } })
    }
  }

  return new Response(null, { status: 404 })
}, async () => {
  const longQuery = `heart ${'x'.repeat(220)}\u0000`
  const hasil = await anatomyOntologyLookup([longQuery])

  const doid = hasil.diseases.find((term) => term.id === 'DOID:0050117')
  ok('DOID dari OLS4 tetap beridentitas DOID', doid?.ontology === 'doid' && doid.idSystem === 'doid')
  ok('DOID menyimpan source OLS4', doid?.source === 'ols4')
  ok('DOID menyimpan source URL', Boolean(doid?.sourceUrl.includes('ebi.ac.uk/ols4/api/search')))
  ok('definisi OLS dirapikan tanpa menjadi confidence', doid?.description.includes('symptoms include dyspnea') === true, doid?.description)

  const nlmDisease = hasil.diseases.find((term) => term.id === 'medlineplus-heart-key')
  ok('NLM conditions TIDAK dilabeli DOID', nlmDisease?.ontology === 'nlm-condition', nlmDisease?.ontology)
  ok('NLM conditions memakai idSystem internal yang eksplisit', nlmDisease?.idSystem === 'nlm-condition-key', nlmDisease?.idSystem)
  ok('NLM conditions menyimpan source CTSS', nlmDisease?.source === 'nlm-ctss')
  ok('NLM conditions menyimpan source URL', Boolean(nlmDisease?.sourceUrl.includes('/conditions/v3/search')))
  ok('baris conditions tanpa identifier tidak dipalsukan', !hasil.diseases.some((term) => term.label === 'Missing identifier row'))

  const nlmHpo = hasil.phenotypes.find((term) => term.id === 'HP:0011025')
  ok('NLM HPO tetap memakai namespace HP', nlmHpo?.ontology === 'hp' && nlmHpo.idSystem === 'hp')
  ok('HPO malformed dibuang', !hasil.phenotypes.some((term) => term.id === 'NOT-HPO:123'))

  const structures = await anatomyStructureLookup(['heart'])
  const uberon = structures.find((term) => term.id === 'UBERON:0000948')
  const fma = structures.find((term) => term.id === 'FMA:7088')
  ok('UBERON membawa provenance OLS4', uberon?.source === 'ols4' && uberon.idSystem === 'uberon')
  ok('FMA membawa provenance OLS4', fma?.source === 'ols4' && fma.idSystem === 'fma')
})

ok('adapter benar-benar menguji kedua provider', requestUrls.some((url) => url.hostname === 'www.ebi.ac.uk') && requestUrls.some((url) => url.hostname === 'clinicaltables.nlm.nih.gov'))

await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  if (url.hostname === 'www.ebi.ac.uk') return new Response(null, { status: 503 })
  if (url.pathname.includes('/conditions/')) {
    return new Response(JSON.stringify([1, ['fallback-key'], null, ['Heart fallback condition']]), { status: 200 })
  }
  if (url.pathname.includes('/hpo/')) return new Response(JSON.stringify([0, [], null, []]), { status: 200 })
  return new Response(null, { status: 404 })
}, async () => {
  const hasil = await anatomyOntologyLookup(['heart'])
  ok('OLS gagal tidak menghapus CTSS disease fallback', hasil.diseases.some((term) => term.id === 'fallback-key'))
  ok('fallback tetap berprovenance NLM, bukan DOID', hasil.diseases.find((term) => term.id === 'fallback-key')?.idSystem === 'nlm-condition-key')
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await anatomyOntologyLookup(['  ', '\u0000\u0001'])
  ok('query kosong selesai tanpa network', hasil.diseases.length === 0 && hasil.phenotypes.length === 0)
})

console.log(`\nAnatomy ontology adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
