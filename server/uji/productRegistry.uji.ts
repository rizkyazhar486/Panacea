import { cleanProductQuery, resolveProductRegistry } from '../src/productRegistry.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('query dibersihkan', cleanProductQuery('  <Glucophage>\n XR  ') === 'Glucophage XR')
ok('query dibatasi 160 karakter', cleanProductQuery('x'.repeat(300)).length === 160)

const fetchAsli = globalThis.fetch
let panggilan = 0
globalThis.fetch = async (input) => {
  panggilan++
  const url = new URL(String(input))

  if (url.pathname.endsWith('/approximateTerm.json')) {
    return new Response(JSON.stringify({ approximateGroup: { candidate: [{ rxcui: '860975' }] } }), { status: 200 })
  }
  if (url.pathname.endsWith('/rxcui/860975/property.json')) {
    return new Response(JSON.stringify({ propConceptGroup: { propConcept: [{ propValue: 'metformin hydrochloride' }] } }), { status: 200 })
  }
  if (url.pathname.endsWith('/rxcui.json')) {
    return new Response(JSON.stringify({ idGroup: { rxnormId: ['860975'] } }), { status: 200 })
  }
  if (url.pathname.endsWith('/rxcui/860975/related.json')) {
    return new Response(JSON.stringify({
      relatedGroup: { conceptGroup: [
        { tty: 'SCD', conceptProperties: [{ name: 'Metformin 500 MG Oral Tablet' }] },
        { tty: 'SBD', conceptProperties: [{ name: 'Glucophage 500 MG Oral Tablet' }] },
      ] },
    }), { status: 200 })
  }
  if (url.hostname.includes('open.fda.gov')) {
    return new Response(JSON.stringify({ results: [] }), { status: 200 })
  }

  throw new Error(`unexpected fetch: ${url.toString()}`)
}

try {
  const hasil = await resolveProductRegistry(' Glucophage XR ')
  ok('nama canonical RxNorm dipertahankan', hasil.normalizedName === 'metformin hydrochloride', hasil.normalizedName ?? '')
  ok('related product dibatasi dan tersedia', hasil.relatedProducts.length === 2, String(hasil.relatedProducts.length))
  ok('brand dan generic term type dipertahankan', hasil.relatedProducts.some((item) => item.tty === 'SBD') && hasil.relatedProducts.some((item) => item.tty === 'SCD'))
  ok('RxNorm provenance tersedia', hasil.sources.some((source) => source.id === 'rxnorm'))
  ok('ATC tidak ditebak dari brand/free text', hasil.atcStatus === 'unmapped' && hasil.atcCode === null)
  ok('network dipakai hanya untuk resolver canonical', panggilan >= 4)
} finally {
  globalThis.fetch = fetchAsli
}

let networkKosong = 0
globalThis.fetch = async () => {
  networkKosong++
  throw new Error('network tidak boleh dipanggil')
}
try {
  const kosong = await resolveProductRegistry(' <> \u0001 ')
  ok('query kosong fail closed', kosong.query === '' && kosong.relatedProducts.length === 0 && kosong.label === null)
  ok('query kosong tanpa network', networkKosong === 0, String(networkKosong))
} finally {
  globalThis.fetch = fetchAsli
}

console.log(`\nProduct registry: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
