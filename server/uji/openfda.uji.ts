import { lookupDrug } from '../src/openfda.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const fetchAsli = globalThis.fetch

async function denganFetchPalsu(
  fn: typeof fetch,
  run: () => Promise<void>,
) {
  globalThis.fetch = fn
  try {
    await run()
  } finally {
    globalThis.fetch = fetchAsli
  }
}

let panggilan = 0
await denganFetchPalsu(async (input, init) => {
  panggilan++
  const url = new URL(String(input))
  const search = url.searchParams.get('search') ?? ''
  ok('request openFDA mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)
  ok('payload upstream dibatasi satu label', url.searchParams.get('limit') === '1')

  if (panggilan === 1) {
    ok('lookup pertama memakai brand name', search === 'openfda.brand_name:"metformin XR"', search)
    return new Response(null, { status: 404 })
  }

  ok('404 brand berlanjut ke generic fallback', search === 'openfda.generic_name:"metformin XR"', search)
  return new Response(JSON.stringify({
    results: [{
      id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      set_id: '12345678-ABCD-4321-9876-ABCDEF123456',
      openfda: {
        brand_name: ['Example Brand'],
        generic_name: ['metformin hydrochloride'],
        manufacturer_name: ['Example Manufacturer'],
      },
      purpose: ['Antihyperglycemic'],
      indications_and_usage: ['Used as described in the official structured product label.'],
      mechanism_of_action: ['Decreases hepatic glucose production and improves insulin sensitivity.'],
      warnings: ['Official warning text'],
      dosage_and_administration: ['Official dosage text'],
      adverse_reactions: ['Official adverse reaction text'],
    }],
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await lookupDrug('  metformin:\"XR\" < >  ')
  ok('brand dan generic dinormalisasi dari label', hasil?.brand === 'Example Brand' && hasil.generic === 'metformin hydrochloride')
  ok('manufacturer dipertahankan', hasil?.manufacturer === 'Example Manufacturer')
  ok('purpose dipertahankan', hasil?.purpose === 'Antihyperglycemic')
  ok('mechanism of action dipertahankan dari label', hasil?.mechanism === 'Decreases hepatic glucose production and improves insulin sensitivity.', hasil?.mechanism)
  ok('SPL set_id valid dinormalisasi sebagai source identity', hasil?.labelId === '12345678-abcd-4321-9876-abcdef123456', hasil?.labelId)
  const sourceUrl = hasil?.sourceUrl ? new URL(hasil.sourceUrl) : null
  ok('source URL menunjuk exact canonical set_id', sourceUrl?.searchParams.get('search') === 'set_id:"12345678-abcd-4321-9876-abcdef123456"')
  ok('source URL tidak pernah membawa API key', sourceUrl?.searchParams.has('api_key') === false)
  ok('brand→generic membutuhkan tepat dua request', panggilan === 2, String(panggilan))
})

await denganFetchPalsu(async () => new Response(JSON.stringify({
  results: [{ id: 'ABCDEF12-3456-4789-8ABC-DEF012345678', openfda: { brand_name: ['Record Only'] } }],
}), { status: 200, headers: { 'content-type': 'application/json' } }), async () => {
  const hasil = await lookupDrug('record only')
  ok('record GUID menjadi fallback identity bila set_id tidak tersedia', hasil?.labelId === 'abcdef12-3456-4789-8abc-def012345678', hasil?.labelId)
  ok('source URL tidak dibuat tanpa set_id yang stabil', hasil?.sourceUrl === undefined)
  ok('mechanism kosong tetap string kosong tanpa fabrikasi', hasil?.mechanism === '')
})

await denganFetchPalsu(async () => new Response(JSON.stringify({
  results: [{
    id: 'fedcba98-7654-4321-8765-abcdefabcdef',
    set_id: 'not-a-canonical-spl-id\" OR openfda.brand_name:*',
    openfda: { brand_name: ['Malformed Set ID'] },
  }],
}), { status: 200, headers: { 'content-type': 'application/json' } }), async () => {
  const hasil = await lookupDrug('malformed set id')
  ok('set_id malformed tidak dipromosikan menjadi stable identity', hasil?.labelId === 'fedcba98-7654-4321-8765-abcdefabcdef', hasil?.labelId)
  ok('set_id malformed tetap boleh fallback ke record GUID yang valid', hasil?.labelId === 'fedcba98-7654-4321-8765-abcdefabcdef')
  ok('set_id malformed tidak boleh menghasilkan provenance URL', hasil?.sourceUrl === undefined, hasil?.sourceUrl)
})

await denganFetchPalsu(async () => new Response(JSON.stringify({
  results: [{
    id: 'malformed-record-id<script>',
    set_id: 'also-not-a-guid',
    openfda: { brand_name: ['Malformed Identities'] },
  }],
}), { status: 200, headers: { 'content-type': 'application/json' } }), async () => {
  const hasil = await lookupDrug('malformed identities')
  ok('record id malformed tidak dipromosikan menjadi source identity', hasil?.labelId === undefined, hasil?.labelId)
  ok('dua identity malformed gagal tertutup tanpa provenance URL', hasil?.sourceUrl === undefined, hasil?.sourceUrl)
})

await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  const search = url.searchParams.get('search') ?? ''
  const nilai = search.match(/:"(.*)"$/)?.[1] ?? ''
  ok('query panjang dibatasi 160 karakter', nilai.length === 160, String(nilai.length))
  return new Response(null, { status: 404 })
}, async () => {
  const hasil = await lookupDrug('x'.repeat(400))
  ok('dua pencarian tanpa kecocokan menghasilkan null', hasil === null)
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  let pesan = ''
  try {
    await lookupDrug('aspirin')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('HTTP upstream failure tidak disamarkan sebagai label kosong', pesan === 'openfda_503', pesan)
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await lookupDrug('  < > : \\ \"  ')
  ok('query yang kosong setelah sanitasi selesai tanpa network request', hasil === null)
})

console.log(`\nopenFDA adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
