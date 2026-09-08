import { findRelatedDrugs, normalizeDrugName } from '../src/rxnorm.ts'

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
  ok(`request ${panggilan} mempunyai AbortSignal timeout`, init?.signal instanceof AbortSignal)

  if (panggilan === 1) {
    ok('nama obat dinormalisasi sebelum resolve RxCUI', url.searchParams.get('name') === 'metformin XR')
    ok('mode RxNorm search dipertahankan', url.searchParams.get('search') === '1')
    return new Response(JSON.stringify({ idGroup: { rxnormId: ['invalid-id', '860975'] } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  ok('hanya RxCUI numerik dipakai pada path request kedua', url.pathname.endsWith('/rxcui/860975/related.json'), url.pathname)
  ok('hanya term type SCD/SBD diminta', url.searchParams.get('tty') === 'SCD SBD')
  return new Response(JSON.stringify({
    relatedGroup: {
      conceptGroup: [
        {
          tty: 'SCD',
          conceptProperties: [
            { name: 'Metformin 500 MG Oral Tablet' },
            { name: '   ' },
          ],
        },
        {
          tty: 'SBD',
          conceptProperties: [
            { name: 'metformin 500 mg oral tablet' },
            { name: 'Glucophage 500 MG Oral Tablet' },
          ],
        },
      ],
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await findRelatedDrugs('   metformin\n\tXR   ')
  ok('hasil kosong dibuang dan nama dinormalisasi', hasil.every((item) => item.name.trim().length > 0))
  ok('duplikat case-insensitive dibuang', hasil.length === 2, String(hasil.length))
  ok('nama branded tetap tersedia', hasil.some((item) => item.name === 'Glucophage 500 MG Oral Tablet'))
  ok('term type sumber dipertahankan', hasil.some((item) => item.tty === 'SBD'))
})

let panjangQuery = 0
await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  panjangQuery = (url.searchParams.get('name') ?? '').length
  return new Response(JSON.stringify({ idGroup: { rxnormId: [] } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}, async () => {
  const hasil = await findRelatedDrugs('x'.repeat(400))
  ok('query panjang dibatasi 160 karakter', panjangQuery === 160, String(panjangQuery))
  ok('RxCUI kosong menghasilkan array kosong', hasil.length === 0)
})

let malformedCalls = 0
await denganFetchPalsu(async () => {
  malformedCalls++
  return new Response(JSON.stringify({ idGroup: { rxnormId: ['../bad', 'ABC123'] } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}, async () => {
  const hasil = await findRelatedDrugs('aspirin')
  ok('RxCUI malformed tidak diteruskan ke request kedua', malformedCalls === 1, String(malformedCalls))
  ok('RxCUI malformed menghasilkan array kosong', hasil.length === 0)
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  let pesan = ''
  try {
    await findRelatedDrugs('atorvastatin')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('failure resolve RxCUI tidak disamarkan sebagai hasil kosong', pesan === 'rxnorm_rxcui_503', pesan)
})

let secondCall = 0
await denganFetchPalsu(async () => {
  secondCall++
  if (secondCall === 1) {
    return new Response(JSON.stringify({ idGroup: { rxnormId: ['12345'] } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(null, { status: 502 })
}, async () => {
  let pesan = ''
  try {
    await findRelatedDrugs('amlodipine')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('failure related-concepts tidak disamarkan', pesan === 'rxnorm_related_502', pesan)
})

let normalizeCalls = 0
await denganFetchPalsu(async (input, init) => {
  normalizeCalls++
  const url = new URL(String(input))
  ok(`normalization request ${normalizeCalls} mempunyai timeout`, init?.signal instanceof AbortSignal)
  if (normalizeCalls === 1) {
    ok('approximate term query dibersihkan', url.pathname.endsWith('/approximateTerm.json') && url.searchParams.get('term') === 'Glucophge XR')
    ok('approximate candidate dibatasi', url.searchParams.get('maxEntries') === '5')
    return new Response(JSON.stringify({ approximateGroup: { candidate: [{ rxcui: '../bad' }, { rxcui: '860975' }] } }), { status: 200 })
  }
  ok('hanya RxCUI numerik dipakai untuk property lookup', url.pathname.endsWith('/rxcui/860975/property.json'), url.pathname)
  ok('property RxNorm Name diminta', url.searchParams.get('propName') === 'RxNorm Name')
  return new Response(JSON.stringify({ propConceptGroup: { propConcept: [{ propValue: '  metformin   hydrochloride  ' }] } }), { status: 200 })
}, async () => {
  const nama = await normalizeDrugName('  Glucophge<> XR  ')
  ok('canonical RxNorm name dinormalisasi', nama === 'metformin hydrochloride', nama ?? '')
  ok('normalization membutuhkan dua request', normalizeCalls === 2, String(normalizeCalls))
})

let malformedNormalizeCalls = 0
await denganFetchPalsu(async () => {
  malformedNormalizeCalls++
  return new Response(JSON.stringify({ approximateGroup: { candidate: [{ rxcui: 'ABC123' }] } }), { status: 200 })
}, async () => {
  const nama = await normalizeDrugName('bad candidate')
  ok('malformed approximate RxCUI tidak diteruskan', malformedNormalizeCalls === 1, String(malformedNormalizeCalls))
  ok('malformed approximate RxCUI menghasilkan null', nama === null)
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  let pesan = ''
  try {
    await normalizeDrugName('glucophage')
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error)
  }
  ok('failure approximate-term tidak disamarkan', pesan === 'rxnorm_approximate_503', pesan)
})

await denganFetchPalsu(async () => {
  throw new Error('fetch tidak boleh dipanggil untuk query kosong')
}, async () => {
  const hasil = await findRelatedDrugs('  < > \u0001 \u0002  ')
  const nama = await normalizeDrugName('  < > \u0001 \u0002  ')
  ok('query kosong related lookup selesai tanpa network request', hasil.length === 0)
  ok('query kosong normalization selesai tanpa network request', nama === null)
})

console.log(`\nRxNorm adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
