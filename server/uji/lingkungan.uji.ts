import assert from 'node:assert/strict'
import { cariPangan, lingkunganKota } from '../src/lingkungan'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Open-Meteo: dua upstream berhasil, setiap request membawa timeout signal,
// dan nilai di luar rentang wajar tidak diteruskan ke UI sebagai fakta.
{
  const urls: string[] = []
  let sawSignal = 0
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    urls.push(url)
    if (init?.signal) sawSignal++

    if (url.includes('air-quality-api.open-meteo.com')) {
      return jsonResponse({ current: { european_aqi: 42, pm2_5: 12.34, pm10: 25.5 } })
    }
    if (url.includes('api.open-meteo.com/v1/forecast')) {
      return jsonResponse({
        current: {
          uv_index: 7.2,
          temperature_2m: 31.5,
          apparent_temperature: 36.1,
          relative_humidity_2m: 72,
        },
        daily: {
          uv_index_max: [9.1],
          sunrise: ['2026-09-08T05:47'],
          sunset: ['2026-09-08T17:52'],
        },
      })
    }
    return new Response('not found', { status: 404 })
  }

  const result = await lingkunganKota('Jakarta', fakeFetch)
  assert.equal(urls.length, 2)
  assert.equal(sawSignal, 2)
  assert.equal(result.kota, 'Jakarta')
  assert.equal(result.sumber, 'Open-Meteo')
  assert.equal(result.aqi, 42)
  assert.equal(result.pm25, 12.34)
  assert.equal(result.uv, 7.2)
  assert.equal(result.suhuC, 31.5)
  assert.equal(result.terasaC, 36.1)
  assert.equal(result.lembapPct, 72)
  assert.equal(result.error, undefined)
}

// Satu upstream boleh gagal tanpa membuang data valid dari upstream lain.
{
  const fakeFetch: typeof fetch = async (input) => {
    const url = String(input)
    if (url.includes('air-quality-api.open-meteo.com')) throw new Error('air upstream down')
    return jsonResponse({
      current: {
        uv_index: 4,
        temperature_2m: 26,
        apparent_temperature: 28,
        relative_humidity_2m: 80,
      },
      daily: { uv_index_max: [6], sunrise: ['2026-09-08T05:40'], sunset: ['2026-09-08T17:45'] },
    })
  }

  const result = await lingkunganKota('Bandung', fakeFetch)
  assert.equal(result.aqi, undefined)
  assert.equal(result.suhuC, 26)
  assert.equal(result.uv, 4)
  assert.equal(result.error, undefined)
}

// Bila kedua network call benar-benar gagal, jangan mengarang angka cadangan.
{
  let calls = 0
  const fakeFetch: typeof fetch = async () => {
    calls++
    throw new Error('offline')
  }
  const result = await lingkunganKota('Surabaya', fakeFetch)
  assert.equal(calls, 2)
  assert.equal(result.error, 'gagal_menghubungi')
  assert.equal(result.aqi, undefined)
  assert.equal(result.suhuC, undefined)
}

// Kota tak dikenal fail-closed dan tidak menyentuh upstream.
{
  let calls = 0
  const fakeFetch: typeof fetch = async () => {
    calls++
    return jsonResponse({})
  }
  const result = await lingkunganKota('Kota yang tidak ada', fakeFetch)
  assert.equal(calls, 0)
  assert.equal(result.error, 'kota_tidak_dikenal')
}

// Open Food Facts search: query dibatasi, timeout signal terpasang, data per
// 100 g dipertahankan, nilai negatif dibuang, dan provenance produk tersedia.
{
  let observedQuery = ''
  let sawSignal = false
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input))
    observedQuery = url.searchParams.get('search_terms') ?? ''
    sawSignal = Boolean(init?.signal)
    return jsonResponse({
      products: Array.from({ length: 10 }, (_, i) => ({
        code: `89900000000${String(i).padStart(2, '0')}`,
        product_name: `Produk ${i}`,
        brands: 'Merek A, Merek B',
        nutriments: {
          'energy-kcal_100g': 100 + i,
          carbohydrates_100g: 20,
          proteins_100g: 5,
          fat_100g: i === 0 ? -1 : 3,
          fiber_100g: 2,
          salt_100g: 0.5,
        },
      })),
    })
  }

  const result = await cariPangan(`  nasi    ${'x'.repeat(500)}  `, undefined, fakeFetch)
  assert.ok(observedQuery.length <= 120)
  assert.ok(observedQuery.startsWith('nasi '))
  assert.equal(sawSignal, true)
  assert.equal(result.length, 8)
  assert.equal(result[0].nama, 'Produk 0')
  assert.equal(result[0].merek, 'Merek A')
  assert.equal(result[0].kkal100, 100)
  assert.equal(result[0].lemak100, undefined)
  assert.match(result[0].sourceUrl ?? '', /^https:\/\/world\.openfoodfacts\.org\/product\/899/)
}

// Barcode input harus berupa identifier numerik bounded; path-like input tidak
// boleh pernah menjadi bagian URL upstream.
{
  let calls = 0
  const fakeFetch: typeof fetch = async () => {
    calls++
    return jsonResponse({})
  }
  assert.deepEqual(await cariPangan('', '123/../abc', fakeFetch), [])
  assert.equal(calls, 0)
}

// Barcode dengan spasi dinormalisasi sebelum request dan response mempertahankan
// kode serta halaman sumber kanonik.
{
  let requestedPath = ''
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input))
    requestedPath = url.pathname
    assert.ok(init?.signal)
    return jsonResponse({
      product: {
        code: '8991234567890',
        product_name: 'Contoh pangan',
        brands: 'Panacea Test',
        nutriments: { 'energy-kcal_100g': 250.04, proteins_100g: 8.06 },
      },
    })
  }

  const result = await cariPangan('', '899 1234 5678 90', fakeFetch)
  assert.match(requestedPath, /\/api\/v2\/product\/8991234567890\.json$/)
  assert.equal(result.length, 1)
  assert.equal(result[0].kode, '8991234567890')
  assert.equal(result[0].kkal100, 250)
  assert.equal(result[0].protein100, 8.1)
  assert.equal(result[0].sourceUrl, 'https://world.openfoodfacts.org/product/8991234567890')
}

// HTTP failure tetap fail-closed sebagai hasil kosong, bukan data sintetis.
{
  const fakeFetch: typeof fetch = async () => new Response('upstream failure', { status: 503 })
  assert.deepEqual(await cariPangan('tempe', undefined, fakeFetch), [])
}

console.log('Environment and food upstream adapters verified.')
