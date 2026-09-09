import { lingkunganKota } from '../src/lingkungan.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const TEST_ENV = { NODE_ENV: 'test' }

let panggilan = 0
{
  const fakeFetch: typeof fetch = async (input, init) => {
    panggilan++
    const url = new URL(String(input))
    ok(`request ${panggilan} mempunyai AbortSignal timeout`, init?.signal instanceof AbortSignal)
    ok(`request ${panggilan} memakai pusat kota Jakarta`, url.searchParams.get('latitude') === '-6.21' && url.searchParams.get('longitude') === '106.85')
    ok(`request ${panggilan} meminta timezone lokal`, url.searchParams.get('timezone') === 'auto')

    if (url.hostname === 'air-quality-api.open-meteo.com') {
      ok('request kualitas udara hanya meminta field yang digunakan', url.searchParams.get('current') === 'european_aqi,pm2_5,pm10')
      return new Response(JSON.stringify({
        current: { european_aqi: 42, pm2_5: 12.3, pm10: 21.4 },
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    ok('request prakiraan memakai endpoint Open-Meteo', url.hostname === 'api.open-meteo.com')
    ok('prakiraan dibatasi satu hari', url.searchParams.get('forecast_days') === '1')
    return new Response(JSON.stringify({
      current: {
        uv_index: 4.2,
        temperature_2m: 31.1,
        apparent_temperature: 35.4,
        relative_humidity_2m: 72,
      },
      daily: {
        uv_index_max: [8.1],
        sunrise: ['2026-09-08T05:50'],
        sunset: ['2026-09-08T17:54'],
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  const hasil = await lingkunganKota('Jakarta', fakeFetch, TEST_ENV)
  ok('dua endpoint lingkungan dipanggil', panggilan === 2, String(panggilan))
  ok('identitas kota dan sumber dipertahankan', hasil.kota === 'Jakarta' && hasil.sumber === 'Open-Meteo')
  ok('AQI dan partikulat berasal dari upstream', hasil.aqi === 42 && hasil.pm25 === 12.3 && hasil.pm10 === 21.4)
  ok('UV dan puncak UV berasal dari upstream', hasil.uv === 4.2 && hasil.uvMaks === 8.1)
  ok('suhu dan kelembapan berasal dari upstream', hasil.suhuC === 31.1 && hasil.terasaC === 35.4 && hasil.lembapPct === 72)
  ok('sunrise/sunset dipertahankan tanpa rekayasa', hasil.terbit === '2026-09-08T05:50' && hasil.terbenam === '2026-09-08T17:54')
  ok('hasil upstream valid tidak diberi error', hasil.error === undefined)
}

{
  let panggilanKotaTidakDikenal = 0
  const fakeFetch: typeof fetch = async () => {
    panggilanKotaTidakDikenal++
    throw new Error('fetch tidak boleh dipanggil untuk kota tidak dikenal')
  }
  const hasil = await lingkunganKota('Kota Uji Yang Tidak Ada', fakeFetch, TEST_ENV)
  ok('kota tidak dikenal gagal sebelum network request', hasil.error === 'kota_tidak_dikenal' && panggilanKotaTidakDikenal === 0, String(panggilanKotaTidakDikenal))
}

{
  const fakeFetch: typeof fetch = async () => {
    throw new Error('simulasi upstream putus')
  }
  const hasil = await lingkunganKota('Bandung', fakeFetch, TEST_ENV)
  ok('network failure gagal tertutup tanpa angka lingkungan buatan', hasil.error === 'gagal_menghubungi' && hasil.aqi == null && hasil.uv == null && hasil.suhuC == null)
}

{
  const fakeFetch: typeof fetch = async () => new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
  const hasil = await lingkunganKota('Surabaya', fakeFetch, TEST_ENV)
  ok('payload kosong tidak dianggap observasi valid', hasil.error === 'tidak_terjawab')
}

console.log(`\nOpen-Meteo adapter: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
