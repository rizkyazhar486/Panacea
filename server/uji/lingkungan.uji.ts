import { cariPangan } from '../src/lingkungan.ts'

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

await denganFetchPalsu(async (input, init) => {
  const url = new URL(String(input))
  ok('pencarian memakai endpoint Open Food Facts', url.hostname === 'world.openfoodfacts.org')
  ok('query dirapikan sebelum dikirim', url.searchParams.get('search_terms') === 'nasi goreng', url.searchParams.get('search_terms') ?? '')
  ok('jumlah hasil upstream dibatasi delapan', url.searchParams.get('page_size') === '8')
  ok('payload dibatasi ke field yang dipakai adapter', (url.searchParams.get('fields') ?? '').includes('nutriments'))
  ok('request mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)

  const headers = new Headers(init?.headers)
  ok('User-Agent mengidentifikasi Panaceamed', (headers.get('User-Agent') ?? '').includes('panaceamed.id'))

  return new Response(JSON.stringify({
    products: [
      {
        code: '8991234567890',
        product_name: 'Nasi Goreng Uji',
        brands: 'Panacea Test, Example',
        nutriments: {
          'energy-kcal_100g': 123.44,
          carbohydrates_100g: 20.04,
          proteins_100g: 5.55,
          fat_100g: -1,
          fiber_100g: '2.26',
          salt_100g: null,
        },
      },
      {
        code: 'missing-energy',
        product_name: 'Tidak lengkap',
        nutriments: { proteins_100g: 10 },
      },
    ],
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const hasil = await cariPangan('  nasi    goreng  ')
  ok('produk tanpa energi tidak diteruskan sebagai referensi lengkap', hasil.length === 1, String(hasil.length))
  ok('energi upstream hanya dibulatkan satu desimal', hasil[0]?.kkal100 === 123.4, String(hasil[0]?.kkal100))
  ok('protein upstream dibulatkan satu desimal', hasil[0]?.protein100 === 5.6, String(hasil[0]?.protein100))
  ok('nilai nutrisi negatif ditolak', hasil[0]?.lemak100 === undefined, String(hasil[0]?.lemak100))
  ok('angka string non-negatif tetap dinormalisasi', hasil[0]?.serat100 === 2.3, String(hasil[0]?.serat100))
  ok('identitas sumber dipertahankan', hasil[0]?.sumber === 'Open Food Facts')
  ok('produk dengan barcode valid membawa URL sumber spesifik', hasil[0]?.sourceUrl === 'https://world.openfoodfacts.org/product/8991234567890')
})

let panjangQuery = 0
await denganFetchPalsu(async (input) => {
  const url = new URL(String(input))
  panjangQuery = (url.searchParams.get('search_terms') ?? '').length
  return new Response(JSON.stringify({ products: [] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}, async () => {
  const hasil = await cariPangan(`query-${'x'.repeat(300)}`)
  ok('query panjang dibatasi 120 karakter', panjangQuery === 120, String(panjangQuery))
  ok('hasil kosong upstream tetap hasil kosong', hasil.length === 0)
})

let panjangKode = 0
await denganFetchPalsu(async (input, init) => {
  const url = new URL(String(input))
  const segmen = url.pathname.split('/').at(-1) ?? ''
  panjangKode = decodeURIComponent(segmen.replace(/\.json$/, '')).length
  ok('barcode lookup juga mempunyai AbortSignal timeout', init?.signal instanceof AbortSignal)
  return new Response(JSON.stringify({
    product: {
      code: '1234567890123',
      product_name: 'Produk Barcode',
      nutriments: { 'energy-kcal_100g': 50 },
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } })
}, async () => {
  const kodePanjang = `  ${'1'.repeat(40)}   ${'2'.repeat(40)}  `
  const hasil = await cariPangan('', kodePanjang)
  ok('kode produk dibersihkan dan dibatasi 64 karakter', panjangKode === 64, String(panjangKode))
  ok('lookup barcode tetap menghasilkan produk upstream', hasil[0]?.nama === 'Produk Barcode')
})

let panggilanKosong = 0
await denganFetchPalsu(async () => {
  panggilanKosong++
  throw new Error('fetch tidak boleh dipanggil untuk input kosong')
}, async () => {
  const hasil = await cariPangan('   ')
  ok('query kosong selesai tanpa network request', hasil.length === 0 && panggilanKosong === 0, String(panggilanKosong))
})

let panggilanBarcodeTidakValid = 0
await denganFetchPalsu(async () => {
  panggilanBarcodeTidakValid++
  throw new Error('fetch tidak boleh dipanggil untuk barcode tidak valid')
}, async () => {
  const hasil = await cariPangan('', '123/../abc')
  ok('barcode non-numerik gagal tertutup sebelum network request', hasil.length === 0 && panggilanBarcodeTidakValid === 0, String(panggilanBarcodeTidakValid))
})

await denganFetchPalsu(async () => new Response(null, { status: 503 }), async () => {
  const hasil = await cariPangan('upstream-503-unik')
  ok('upstream non-OK gagal tertutup tanpa data buatan', hasil.length === 0)
})

console.log(`\nOpen Food Facts adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
