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
// dikarang jauh lebih berbahaya daripada kolom kosong: orang mengatur apakah
// anaknya boleh bermain di luar berdasarkan angka itu.
// ─────────────────────────────────────────────────────────────────────────────

const SINGGAH_MS = 60 * 60_000

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

export async function lingkunganKota(namaKota: string): Promise<Lingkungan> {
  const kota = kotaDariTeks(namaKota)
  if (!kota) return { kota: namaKota, sumber: 'Open-Meteo', error: 'kota_tidak_dikenal' }

  const hit = singgahan.get(kota.id)
  if (hit && Date.now() - hit.at < SINGGAH_MS) return hit.data

  const dasar = { kota: kota.nama, sumber: 'Open-Meteo' }
  try {
    const [udara, uv] = await Promise.all([
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${kota.lat}&longitude=${kota.lon}&current=european_aqi,pm2_5,pm10&timezone=auto`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${kota.lat}&longitude=${kota.lon}&current=uv_index,temperature_2m,apparent_temperature,relative_humidity_2m&daily=uv_index_max,sunrise,sunset&timezone=auto&forecast_days=1`),
    ])

    const hasil: Lingkungan = { ...dasar }
    if (udara.ok) {
      const j = (await udara.json()) as { current?: { european_aqi?: number; pm2_5?: number; pm10?: number } }
      hasil.aqi = j.current?.european_aqi
      hasil.pm25 = j.current?.pm2_5
      hasil.pm10 = j.current?.pm10
    }
    if (uv.ok) {
      const j = (await uv.json()) as {
        current?: { uv_index?: number; temperature_2m?: number; apparent_temperature?: number; relative_humidity_2m?: number }
        daily?: { uv_index_max?: number[]; sunrise?: string[]; sunset?: string[] }
      }
      hasil.uv = j.current?.uv_index
      hasil.uvMaks = j.daily?.uv_index_max?.[0]
      hasil.suhuC = j.current?.temperature_2m
      // Suhu yang DIRASAKAN, bukan suhu udara: pada kelembapan Indonesia,
      // keringat menguap lebih lambat sehingga 32 °C terasa jauh lebih berat
      // daripada 32 °C di udara kering — dan itulah yang menentukan risiko
      // saat berlatih, bukan angka termometernya.
      hasil.terasaC = j.current?.apparent_temperature
      hasil.lembapPct = j.current?.relative_humidity_2m
      hasil.terbit = j.daily?.sunrise?.[0]
      hasil.terbenam = j.daily?.sunset?.[0]
    }

    if (hasil.aqi == null && hasil.uv == null && hasil.suhuC == null) return { ...dasar, error: 'tidak_terjawab' }
    singgahan.set(kota.id, { at: Date.now(), data: hasil })
    return hasil
  } catch {
    return { ...dasar, error: 'gagal_menghubungi' }
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Open Food Facts — basis data pangan terbuka, tanpa kunci API.
//
// LEWAT SERVER, dengan alasan yang sama seperti cuaca: satu singgahan bersama,
// dan alamat IP pemakainya tidak dikirim ke pihak ketiga setiap kali ia mencari
// sebungkus mi instan.
//
// YANG DIKEMBALIKAN HANYA PER 100 GRAM, apa adanya dari sumbernya. Aplikasi ini
// TIDAK mengalikannya menjadi "satu porsi" sendiri: takaran porsi di kemasan
// Indonesia sering berbeda dari isi bungkusnya, dan menebak porsi berarti
// mengarang angka yang lalu dicatat orang sebagai fakta.
//
// Basis data ini diisi sukarelawan, jadi ada bungkus yang salah atau kosong —
// karena itu nama merek dan kelengkapan datanya ikut dikembalikan supaya
// pemakainya dapat menilai sendiri.
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
}

const singgahPangan = new Map<string, { at: number; data: Pangan[] }>()
const PANGAN_SINGGAH_MS = 24 * 60 * 60_000

function keAngka(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : undefined
}

function keProduk(p: Record<string, any>): Pangan | null {
  const n = p?.product_name_id || p?.product_name || ''
  if (!n) return null
  const g = p?.nutriments ?? {}
  return {
    kode: typeof p.code === 'string' ? p.code : undefined,
    nama: String(n).slice(0, 80),
    merek: typeof p.brands === 'string' ? p.brands.split(',')[0].trim().slice(0, 40) : undefined,
    kkal100: keAngka(g['energy-kcal_100g']),
    karbo100: keAngka(g.carbohydrates_100g),
    protein100: keAngka(g.proteins_100g),
    lemak100: keAngka(g.fat_100g),
    serat100: keAngka(g.fiber_100g),
    garam100: keAngka(g.salt_100g),
    sumber: 'Open Food Facts',
  }
}

export async function cariPangan(q: string, kode?: string): Promise<Pangan[]> {
  const kunci = kode ? `k:${kode}` : `q:${q.toLowerCase()}`
  const hit = singgahPangan.get(kunci)
  if (hit && Date.now() - hit.at < PANGAN_SINGGAH_MS) return hit.data

  try {
    const url = kode
      ? `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(kode)}.json?fields=code,product_name,product_name_id,brands,nutriments`
      : `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=code,product_name,product_name_id,brands,nutriments`
    const r = await fetch(url, { headers: { 'User-Agent': 'Panaceamed/1.0 (kontak lewat aplikasi)' } })
    if (!r.ok) return []
    const j = (await r.json()) as { product?: Record<string, any>; products?: Record<string, any>[] }
    const daftar = (kode ? [j.product ?? {}] : (j.products ?? []))
      .map(keProduk)
      .filter((p): p is Pangan => p !== null && p.kkal100 != null)
      .slice(0, 8)
    singgahPangan.set(kunci, { at: Date.now(), data: daftar })
    return daftar
  } catch {
    return []
  }
}
