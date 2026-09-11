import { kotaDariTeks } from './kota.js'

// ─────────────────────────────────────────────────────────────────────────────
// Udara dan sinar ultraviolet di kota pengguna — dari Open-Meteo.
//
// MENGAPA LEWAT SERVER, BUKAN LANGSUNG DARI PERAMBAN. Dua alasan, dan yang
// kedua yang menentukan:
//   1. Singgahan. Seratus pemakai di Jakarta cukup satu permintaan per jam,
//      bukan seratus permintaan tiap kali beranda dibuka.
//   2. Letak. Permintaan dari peramban akan membawa alamat IP tiap pemakai ke
//      layanan pihak ketiga. Lewat server, yang dikirim hanya titik PUSAT KOTA
//      yang sudah dipilih sendiri pemakainya — tidak ada koordinat rumah, tidak
//      ada GPS, sejalan dengan keputusan yang sudah berlaku di kota.ts.
//
// TIDAK ADA ANGKA CADANGAN. Bila layanannya tidak menjawab, yang dikembalikan
// adalah galat, dan widgetnya menyatakan tidak ada data. Kualitas udara yang
// dikarang jauh lebih berbahaya daripada kolom kosong.
//
// BATAS LISENSI/SERVICE: endpoint publik Open-Meteo hanya boleh dipakai untuk
// non-commercial use. Produksi komersial harus memakai customer endpoint + API
// key, atau endpoint self-hosted yang dikonfigurasi eksplisit. Dengan demikian
// deployment tidak pernah diam-diam memakai free tier yang tidak sesuai terms.
// ─────────────────────────────────────────────────────────────────────────────

const SINGGAH_MS = 60 * 60_000
const UPSTREAM_TIMEOUT_MS = 8_000
const MAX_FOOD_QUERY_LENGTH = 120
const MAX_BARCODE_LENGTH = 64
const OPEN_METEO_FREE_FORECAST_BASE = 'https://api.open-meteo.com'
const OPEN_METEO_FREE_AIR_BASE = 'https://air-quality-api.open-meteo.com'
const OPEN_METEO_CUSTOMER_FORECAST_BASE = 'https://customer-api.open-meteo.com'
const OPEN_METEO_CUSTOMER_AIR_BASE = 'https://customer-air-quality-api.open-meteo.com'

type FetchLike = typeof fetch
type EnvLike = Record<string, string | undefined>

interface OpenMeteoAccess {
  allowed: boolean
  forecastBase: string
  airBase: string
  apiKey?: string
  error?: 'lisensi_open_meteo_belum_dikonfigurasi' | 'konfigurasi_open_meteo_tidak_valid'
}

function normalizeBaseUrl(value?: string): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.toString().replace(/\/+$/, '')
  } catch {
    return undefined
  }
}

function envTrue(value?: string): boolean {
  return value?.trim().toLowerCase() === 'true'
}

export function resolveOpenMeteoAccess(env: EnvLike = process.env): OpenMeteoAccess {
  const apiKey = env.OPEN_METEO_API_KEY?.trim() || undefined
  const rawForecastBase = env.OPEN_METEO_FORECAST_BASE_URL?.trim()
  const rawAirBase = env.OPEN_METEO_AIR_QUALITY_BASE_URL?.trim()
  const customForecastBase = normalizeBaseUrl(rawForecastBase)
  const customAirBase = normalizeBaseUrl(rawAirBase)

  if ((rawForecastBase && !customForecastBase) || (rawAirBase && !customAirBase)) {
    return {
      allowed: false,
      forecastBase: OPEN_METEO_FREE_FORECAST_BASE,
      airBase: OPEN_METEO_FREE_AIR_BASE,
      error: 'konfigurasi_open_meteo_tidak_valid',
    }
  }

  // Custom/self-hosted endpoints must be configured as a pair because this
  // adapter always requests forecast AND air-quality data. Mixing one custom
  // endpoint with one free endpoint would silently reintroduce a licensing gap.
  if (Boolean(customForecastBase) !== Boolean(customAirBase)) {
    return {
      allowed: false,
      forecastBase: customForecastBase ?? OPEN_METEO_FREE_FORECAST_BASE,
      airBase: customAirBase ?? OPEN_METEO_FREE_AIR_BASE,
      error: 'konfigurasi_open_meteo_tidak_valid',
    }
  }

  if (customForecastBase && customAirBase) {
    return {
      allowed: true,
      forecastBase: customForecastBase,
      airBase: customAirBase,
      apiKey,
    }
  }

  if (apiKey) {
    return {
      allowed: true,
      forecastBase: OPEN_METEO_CUSTOMER_FORECAST_BASE,
      airBase: OPEN_METEO_CUSTOMER_AIR_BASE,
      apiKey,
    }
  }

  // Local/test development may evaluate against the free endpoint. A deployed
  // non-commercial instance can opt in explicitly. Production without an
  // explicit licence-compatible mode fails closed before any network request.
  if (env.NODE_ENV !== 'production' || envTrue(env.OPEN_METEO_ALLOW_FREE_NONCOMMERCIAL)) {
    return {
      allowed: true,
      forecastBase: OPEN_METEO_FREE_FORECAST_BASE,
      airBase: OPEN_METEO_FREE_AIR_BASE,
    }
  }

  return {
    allowed: false,
    forecastBase: OPEN_METEO_FREE_FORECAST_BASE,
    airBase: OPEN_METEO_FREE_AIR_BASE,
    error: 'lisensi_open_meteo_belum_dikonfigurasi',
  }
}

function openMeteoUrl(base: string, path: string, params: Record<string, string | number>, apiKey?: string): string {
  const url = new URL(path, `${base}/`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  if (apiKey) url.searchParams.set('apikey', apiKey)
  return url.toString()
}

export interface Lingkungan {
  kota: string
  /** European AQI dari Open-Meteo; skalanya 0-100+ (makin kecil makin bersih). */
  aqi?: number
  pm25?: number
  pm10?: number
  /** Indeks UV saat ini dan puncaknya hari ini. */
  uv?: number
  uvMaks?: number
  /** Suhu udara dan suhu yang DIRASAKAN (memperhitungkan lembap dan angin). */
  suhuC?: number
  terasaC?: number
  lembapPct?: number
  /** Matahari terbit dan terbenam, untuk menentukan jendela cahaya pagi. */
  terbit?: string
  terbenam?: string
  sumber: string
  error?: string
}

const singgahan = new Map<string, { at: number; data: Lingkungan }>()

function angkaTerbatas(value: unknown, min: number, max: number): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined
}

function teksPendek(value: unknown, max = 64): string | undefined {
  if (typeof value !== 'string') return undefined
  const s = value.trim()
  return s ? s.slice(0, max) : undefined
}

async function jsonJikaOk<T>(result: PromiseSettledResult<Response>): Promise<T | null> {
  if (result.status !== 'fulfilled' || !result.value.ok) return null
  try {
    return (await result.value.json()) as T
  } catch {
    return null
  }
}

export async function lingkunganKota(
  namaKota: string,
  fetchImpl: FetchLike = fetch,
  env: EnvLike = process.env,
): Promise<Lingkungan> {
  const kota = kotaDariTeks(namaKota)
  if (!kota) return { kota: namaKota, sumber: 'Open-Meteo', error: 'kota_tidak_dikenal' }

  const access = resolveOpenMeteoAccess(env)
  if (!access.allowed) {
    return { kota: kota.nama, sumber: 'Open-Meteo', error: access.error ?? 'konfigurasi_open_meteo_tidak_valid' }
  }

  // Test/mocked fetch tidak memakai cache global agar fixture deterministik dan
  // tidak saling mengotori. Produksi tetap memakai cache bersama satu jam.
  const bolehCache = fetchImpl === fetch
  const hit = bolehCache ? singgahan.get(kota.id) : undefined
  if (hit && Date.now() - hit.at < SINGGAH_MS) return hit.data

  const dasar = { kota: kota.nama, sumber: 'Open-Meteo' }
  const airUrl = openMeteoUrl(access.airBase, '/v1/air-quality', {
    latitude: kota.lat,
    longitude: kota.lon,
    current: 'european_aqi,pm2_5,pm10',
    timezone: 'auto',
  }, access.apiKey)
  const weatherUrl = openMeteoUrl(access.forecastBase, '/v1/forecast', {
    latitude: kota.lat,
    longitude: kota.lon,
    current: 'uv_index,temperature_2m,apparent_temperature,relative_humidity_2m',
    daily: 'uv_index_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: 1,
  }, access.apiKey)

  const responses = await Promise.allSettled([
    fetchImpl(airUrl, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
    fetchImpl(weatherUrl, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
  ])

  const udara = await jsonJikaOk<{ current?: { european_aqi?: unknown; pm2_5?: unknown; pm10?: unknown } }>(responses[0])
  const cuaca = await jsonJikaOk<{
    current?: { uv_index?: unknown; temperature_2m?: unknown; apparent_temperature?: unknown; relative_humidity_2m?: unknown }
    daily?: { uv_index_max?: unknown[]; sunrise?: unknown[]; sunset?: unknown[] }
  }>(responses[1])

  const hasil: Lingkungan = { ...dasar }
  if (udara) {
    hasil.aqi = angkaTerbatas(udara.current?.european_aqi, 0, 1_000)
    hasil.pm25 = angkaTerbatas(udara.current?.pm2_5, 0, 5_000)
    hasil.pm10 = angkaTerbatas(udara.current?.pm10, 0, 5_000)
  }
  if (cuaca) {
    hasil.uv = angkaTerbatas(cuaca.current?.uv_index, 0, 30)
    hasil.uvMaks = angkaTerbatas(cuaca.daily?.uv_index_max?.[0], 0, 30)
    hasil.suhuC = angkaTerbatas(cuaca.current?.temperature_2m, -100, 100)
    hasil.terasaC = angkaTerbatas(cuaca.current?.apparent_temperature, -100, 100)
    hasil.lembapPct = angkaTerbatas(cuaca.current?.relative_humidity_2m, 0, 100)
    hasil.terbit = teksPendek(cuaca.daily?.sunrise?.[0])
    hasil.terbenam = teksPendek(cuaca.daily?.sunset?.[0])
  }

  if (hasil.aqi == null && hasil.uv == null && hasil.suhuC == null) {
    const semuaGagalJaringan = responses.every((r) => r.status === 'rejected')
    return { ...dasar, error: semuaGagalJaringan ? 'gagal_menghubungi' : 'tidak_terjawab' }
  }

  if (bolehCache) singgahan.set(kota.id, { at: Date.now(), data: hasil })
  return hasil
}

// ─────────────────────────────────────────────────────────────────────────────
// Open Food Facts — basis data pangan terbuka, tanpa kunci API.
//
// LEWAT SERVER, dengan alasan yang sama seperti cuaca: satu singgahan bersama,
// dan alamat IP pemakainya tidak dikirim ke pihak ketiga setiap kali ia mencari
// sebungkus mi instan.
//
// YANG DIKEMBALIKAN HANYA PER 100 GRAM, apa adanya dari sumbernya. Aplikasi ini
// TIDAK mengalikannya menjadi "satu porsi" sendiri.
// ─────────────────────────────────────────────────────────────────────────────

export interface Pangan {
  kode?: string
  nama: string
  merek?: string
  kkal100?: number
  karbo100?: number
  protein100?: number
  lemak100?: number
  serat100?: number
  garam100?: number
  sumber: string
  /** Halaman sumber produk, bila barcode tersedia. */
  sourceUrl?: string
}

const singgahPangan = new Map<string, { at: number; data: Pangan[] }>()
const PANGAN_SINGGAH_MS = 24 * 60 * 60_000

function normalizeFoodQuery(q: string): string {
  return q.replace(/\s+/g, ' ').trim().slice(0, MAX_FOOD_QUERY_LENGTH)
}

function normalizeBarcode(code?: string): string {
  if (!code) return ''
  const normalized = code.replace(/\s+/g, '').slice(0, MAX_BARCODE_LENGTH)
  return /^\d{4,64}$/.test(normalized) ? normalized : ''
}

function keAngka(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : undefined
}

function keProduk(p: Record<string, unknown>): Pangan | null {
  const productNameId = typeof p.product_name_id === 'string' ? p.product_name_id : ''
  const productName = typeof p.product_name === 'string' ? p.product_name : ''
  const n = (productNameId || productName).trim()
  if (!n) return null

  const g = p.nutriments && typeof p.nutriments === 'object'
    ? p.nutriments as Record<string, unknown>
    : {}
  const code = typeof p.code === 'string' && /^\d{4,64}$/.test(p.code.trim()) ? p.code.trim() : undefined
  const brands = typeof p.brands === 'string' ? p.brands : ''

  return {
    kode: code,
    nama: n.slice(0, 80),
    merek: brands ? brands.split(',')[0].trim().slice(0, 40) || undefined : undefined,
    kkal100: keAngka(g['energy-kcal_100g']),
    karbo100: keAngka(g.carbohydrates_100g),
    protein100: keAngka(g.proteins_100g),
    lemak100: keAngka(g.fat_100g),
    serat100: keAngka(g.fiber_100g),
    garam100: keAngka(g.salt_100g),
    sumber: 'Open Food Facts',
    sourceUrl: code ? `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}` : undefined,
  }
}

export async function cariPangan(q: string, kode?: string, fetchImpl: FetchLike = fetch): Promise<Pangan[]> {
  const normalizedCode = normalizeBarcode(kode)
  const normalizedQuery = normalizeFoodQuery(q)
  if (kode && !normalizedCode) return []
  if (!normalizedCode && !normalizedQuery) return []

  const kunci = normalizedCode ? `k:${normalizedCode}` : `q:${normalizedQuery.toLowerCase()}`
  const bolehCache = fetchImpl === fetch
  const hit = bolehCache ? singgahPangan.get(kunci) : undefined
  if (hit && Date.now() - hit.at < PANGAN_SINGGAH_MS) return hit.data

  try {
    const url = normalizedCode
      ? `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(normalizedCode)}.json?fields=code,product_name,product_name_id,brands,nutriments`
      : `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(normalizedQuery)}&search_simple=1&action=process&json=1&page_size=8&fields=code,product_name,product_name_id,brands,nutriments`
    const r = await fetchImpl(url, {
      headers: { 'User-Agent': 'Panaceamed/1.0 (kontak lewat aplikasi)' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
    if (!r.ok) return []
    const j = (await r.json()) as { product?: Record<string, unknown>; products?: Record<string, unknown>[] }
    const source = normalizedCode
      ? [j.product ?? {}]
      : (Array.isArray(j.products) ? j.products : [])
    const daftar = source
      .map(keProduk)
      .filter((p): p is Pangan => p !== null && p.kkal100 != null)
      .slice(0, 8)
    if (bolehCache) singgahPangan.set(kunci, { at: Date.now(), data: daftar })
    return daftar
  } catch {
    return []
  }
}
