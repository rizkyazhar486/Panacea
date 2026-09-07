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
      id: 'record-id-fallback',
      set_id: '12345678-abcd-4321-9876-abcdef123456',
      openfda: {
        brand_name: ['Example Brand'],
        generic_name: ['metformin hydrochloride'],
        manufacturer_name: ['Example Manufacturer'],
      },
      purpose: ['Antihyperglycemic'],
      indications_and_usage: ['Used as described in the official structured product label.'],
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
  ok('SPL set_id diprioritaskan sebagai source identity', hasil?.labelId === '12345678-abcd-4321-9876-abcdef123456', hasil?.labelId)
  const sourceUrl = hasil?.sourceUrl ? new URL(hasil.sourceUrl) : null
  ok('source URL menunjuk exact set_id', sourceUrl?.searchParams.get('search') === 'set_id:"12345678-abcd-4321-9876-abcdef123456"')
  ok('source URL tidak pernah membawa API key', sourceUrl?.searchParams.has('api_key') === false)
  ok('brand→generic membutuhkan tepat dua request', panggilan === 2, String(panggilan))
})

await denganFetchPalsu(async () => new Response(JSON.stringify({
  results: [{ id: 'record-only-id', openfda: { brand_name: ['Record Only'] } }],
}), { status: 200, headers: { 'content-type': 'application/json' } }), async () => {
  const hasil = await lookupDrug('record only')
  ok('record id menjadi fallback identity bila set_id tidak tersedia', hasil?.labelId === 'record-only-id')
  ok('source URL tidak dibuat tanpa set_id yang stabil', hasil?.sourceUrl === undefined)
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
