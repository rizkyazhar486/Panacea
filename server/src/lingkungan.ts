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
// Open-Meteo dipilih karena bebas kunci API dan gratis untuk pemakaian tidak
// komersial dengan atribusi — sumbernya disebut di widgetnya.
//
// TIDAK ADA ANGKA CADANGAN. Bila layanannya tidak menjawab, yang dikembalikan
// adalah galat, dan widgetnya menyatakan tidak ada data. Kualitas udara yang
// dikarang jauh lebih berbahaya daripada kolom kosong.
// ─────────────────────────────────────────────────────────────────────────────

const SINGGAH_MS = 60 * 60_000
const LINGKUNGAN_TIMEOUT_MS = 8_000

type FetchLike = typeof fetch

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
  const text = value.trim()
  return text ? text.slice(0, max) : undefined
}

async function jsonJikaOk<T>(result: PromiseSettledResult<Response>): Promise<T | null> {
  if (result.status !== 'fulfilled' || !result.value.ok) return null
  try {
    return (await result.value.json()) as T
  } catch {
    return null
  }
}

export async function lingkunganKota(namaKota: string, fetchImpl: FetchLike = fetch): Promise<Lingkungan> {
  const kota = kotaDariTeks(namaKota)
  if (!kota) return { kota: namaKota, sumber: 'Open-Meteo', error: 'kota_tidak_dikenal' }

  const bolehCache = fetchImpl === fetch
  const hit = bolehCache ? singgahan.get(kota.id) : undefined
  if (hit && Date.now() - hit.at < SINGGAH_MS) return hit.data

  const dasar = { kota: kota.nama, sumber: 'Open-Meteo' }
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${kota.lat}&longitude=${kota.lon}&current=european_aqi,pm2_5,pm10&timezone=auto`
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${kota.lat}&longitude=${kota.lon}&current=uv_index,temperature_2m,apparent_temperature,relative_humidity_2m&daily=uv_index_max,sunrise,sunset&timezone=auto&forecast_days=1`

  const responses = await Promise.allSettled([
    fetchImpl(airUrl, { signal: AbortSignal.timeout(LINGKUNGAN_TIMEOUT_MS) }),
    fetchImpl(weatherUrl, { signal: AbortSignal.timeout(LINGKUNGAN_TIMEOUT_MS) }),
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
    const semuaGagalJaringan = responses.every((response) => response.status === 'rejected')
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
  /** Halaman sumber produk, bila barcode upstream valid tersedia. */
  sourceUrl?: string
}

const singgahPangan = new Map<string, { at: number; data: Pangan[] }>()
const PANGAN_SINGGAH_MS = 24 * 60 * 60_000
const PANGAN_QUERY_MAX = 120
const PANGAN_KODE_MAX = 64
const PANGAN_TIMEOUT_MS = 8_000
const PANGAN_USER_AGENT = 'Panaceamed/1.0 (https://panaceamed.id; nutrition-reference)'

function normPanganQuery(q: string): string {
  return String(q ?? '').trim().replace(/\s+/g, ' ').slice(0, PANGAN_QUERY_MAX)
}

function normPanganKode(kode?: string): string {
  const normalized = String(kode ?? '').trim().replace(/\s+/g, '').slice(0, PANGAN_KODE_MAX)
  return /^\d{4,64}$/.test(normalized) ? normalized : ''
}

function keAngka(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : undefined
}

function keProduk(p: Record<string, unknown>): Pangan | null {
  const productNameId = typeof p.product_name_id === 'string' ? p.product_name_id : ''
  const productName = typeof p.product_name === 'string' ? p.product_name : ''
  const nama = (productNameId || productName).trim()
  if (!nama) return null

  const nutriments = p.nutriments && typeof p.nutriments === 'object'
    ? p.nutriments as Record<string, unknown>
    : {}
  const kode = typeof p.code === 'string' && /^\d{4,64}$/.test(p.code.trim()) ? p.code.trim() : undefined
  const brands = typeof p.brands === 'string' ? p.brands : ''

  return {
    kode,
    nama: nama.slice(0, 80),
    merek: brands ? brands.split(',')[0].trim().slice(0, 40) || undefined : undefined,
    kkal100: keAngka(nutriments['energy-kcal_100g']),
    karbo100: keAngka(nutriments.carbohydrates_100g),
    protein100: keAngka(nutriments.proteins_100g),
    lemak100: keAngka(nutriments.fat_100g),
    serat100: keAngka(nutriments.fiber_100g),
    garam100: keAngka(nutriments.salt_100g),
    sumber: 'Open Food Facts',
    sourceUrl: kode ? `https://world.openfoodfacts.org/product/${encodeURIComponent(kode)}` : undefined,
  }
}

export async function cariPangan(q: string, kode?: string, fetchImpl: FetchLike = fetch): Promise<Pangan[]> {
  const query = normPanganQuery(q)
  const kodeAman = normPanganKode(kode)
  if (kode && !kodeAman) return []
  if (!kodeAman && !query) return []

  const kunci = kodeAman ? `k:${kodeAman}` : `q:${query.toLowerCase()}`
  const bolehCache = fetchImpl === fetch
  const hit = bolehCache ? singgahPangan.get(kunci) : undefined
  if (hit && Date.now() - hit.at < PANGAN_SINGGAH_MS) return hit.data

  try {
    const url = kodeAman
      ? `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(kodeAman)}.json?fields=code,product_name,product_name_id,brands,nutriments`
      : `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=code,product_name,product_name_id,brands,nutriments`
    const response = await fetchImpl(url, {
      headers: { 'User-Agent': PANGAN_USER_AGENT },
      signal: AbortSignal.timeout(PANGAN_TIMEOUT_MS),
    })
    if (!response.ok) return []

    const json = (await response.json()) as { product?: Record<string, unknown>; products?: Record<string, unknown>[] }
    const source = kodeAman ? [json.product ?? {}] : (Array.isArray(json.products) ? json.products : [])
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
