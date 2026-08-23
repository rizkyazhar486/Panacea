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
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${kota.lat}&longitude=${kota.lon}&current=uv_index&daily=uv_index_max&timezone=auto&forecast_days=1`),
    ])

    const hasil: Lingkungan = { ...dasar }
    if (udara.ok) {
      const j = (await udara.json()) as { current?: { european_aqi?: number; pm2_5?: number; pm10?: number } }
      hasil.aqi = j.current?.european_aqi
      hasil.pm25 = j.current?.pm2_5
      hasil.pm10 = j.current?.pm10
    }
    if (uv.ok) {
      const j = (await uv.json()) as { current?: { uv_index?: number }; daily?: { uv_index_max?: number[] } }
      hasil.uv = j.current?.uv_index
      hasil.uvMaks = j.daily?.uv_index_max?.[0]
    }

    if (hasil.aqi == null && hasil.uv == null) return { ...dasar, error: 'tidak_terjawab' }
    singgahan.set(kota.id, { at: Date.now(), data: hasil })
    return hasil
  } catch {
    return { ...dasar, error: 'gagal_menghubungi' }
  }
}
