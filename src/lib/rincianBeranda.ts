import { getVitals } from './healthVitals'
import { rentangPribadi, bacaRentang } from './riwayatVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Rincian angka tubuh sebagai BARIS, bukan ubin.
//
// MENGAPA BARIS. Ubin berukuran setengah lebar layar memuat satu angka dengan
// lapang, dan itu tepat untuk empat sampai enam angka utama. Tetapi katalog
// metrik perangkat memuat lebih dari seratus medan, dan menampilkan dua puluh
// di antaranya sebagai ubin berarti dua puluh kotak — sepuluh layar penuh yang
// tidak mungkin dibaca. Baris memuat delapan sampai sepuluh angka dalam satu
// layar, dan itulah bentuk yang dipakai aplikasi kebugaran ketika daftarnya
// memanjang.
//
// URUTANNYA DITETAPKAN, BUKAN MENGIKUTI DATA YANG DATANG. Bila urutan baris
// berubah-ubah menurut medan mana yang kebetulan terisi hari ini, letak sebuah
// angka tidak pernah terhafal dan setiap kali harus dicari ulang. Urutan di
// bawah tetap; yang tidak ada datanya hanya dilewati.
//
// TIDAK ADA PENILAIAN, dan ini melanjutkan aturan yang sama dengan kartu
// pratinjau. Aplikasi yang menjadi rujukan bentuk ini menempelkan panah
// berwarna pada tiap baris — hijau untuk naik, kuning untuk melenceng — seolah
// satu bacaan sudah cukup untuk dinilai. Satu bacaan SpO2 96% pada orang sehat
// dan pada penderita PPOK berarti dua hal yang berbeda sama sekali, dan baris
// selebar ini tidak punya ruang untuk menyebut perbedaannya. Yang ditampilkan:
// nama, angka, satuan, dan umur datanya.
// ─────────────────────────────────────────────────────────────────────────────

export interface BarisRincian {
  kunci: string
  label: string
  nilai: string
  satuan: string
  /** Halaman yang menjelaskan angka ini beserta rentang rujukannya. */
  ke: string
  /**
   * Perbandingan terhadap KEBIASAAN ANDA SENDIRI, bukan terhadap populasi.
   * Kosong bila riwayatnya belum cukup — lihat CUKUP_HARI di riwayatVitals.ts.
   */
  rentang?: { posisi: string; baca: string }
}

/**
 * Medan yang ditampilkan, beserta urutannya.
 *
 * Dikelompokkan menurut cara tubuh bekerja — jantung dan napas, lalu tidur,
 * lalu gerak, lalu ukuran tubuh — bukan menurut abjad, karena angka yang saling
 * menerangkan sebaiknya berdekatan: denyut istirahat dan HRV dibaca bersama,
 * dan tahapan tidur hanya bermakna di sebelah lama tidurnya.
 */
const MEDAN: { kunci: string; label: string; satuan: string; ke: string; bulat?: number }[] = [
  { kunci: 'restingHr', label: 'Resting HR', satuan: 'bpm', ke: '/tubuh' },
  { kunci: 'hrvMs', label: 'HRV', satuan: 'ms', ke: '/tubuh' },
  { kunci: 'spo2Pct', label: 'Oxygen saturation', satuan: '%', ke: '/tubuh' },
  { kunci: 'respRate', label: 'Respiratory rate', satuan: '/min', ke: '/tubuh' },
  { kunci: 'bodyTempC', label: 'Body temperature', satuan: '°C', ke: '/tubuh', bulat: 1 },
  { kunci: 'vo2max', label: 'VO2max', satuan: 'mL/kg/min', ke: '/lab', bulat: 1 },
  { kunci: 'sleepH', label: 'Sleep duration', satuan: 'hrs', ke: '/pola-tidur', bulat: 1 },
  { kunci: 'sleepDeepH', label: 'Deep sleep', satuan: 'hrs', ke: '/pola-tidur', bulat: 1 },
  { kunci: 'sleepRemH', label: 'REM sleep', satuan: 'hrs', ke: '/pola-tidur', bulat: 1 },
  { kunci: 'sleepAwakeH', label: 'Awake during sleep', satuan: 'hrs', ke: '/pola-tidur', bulat: 1 },
  { kunci: 'steps', label: 'Steps', satuan: 'steps', ke: '/latihan' },
  { kunci: 'exerciseMin', label: 'Active minutes', satuan: 'min', ke: '/latihan' },
  { kunci: 'activeKcal', label: 'Active calories', satuan: 'kcal', ke: '/latihan' },
  { kunci: 'distanceKm', label: 'Distance', satuan: 'km', ke: '/latihan', bulat: 1 },
  { kunci: 'weightKg', label: 'Body weight', satuan: 'kg', ke: '/body', bulat: 1 },
  { kunci: 'bodyFatPct', label: 'Body fat', satuan: '%', ke: '/body', bulat: 1 },
  { kunci: 'leanMassKg', label: 'Lean mass', satuan: 'kg', ke: '/body', bulat: 1 },
]

/**
 * Baris rincian dari angka yang BENAR-BENAR ada.
 *
 * Medan yang kosong dilewati, bukan ditampilkan sebagai tanda hubung. Tanda
 * hubung pada dua puluh baris menghasilkan daftar yang tampak berisi padahal
 * tidak memuat satu pun angka, dan itu melanggar aturan pertama kartu
 * pratinjau: yang tidak ada datanya berkata tidak ada, bukan berpura-pura.
 */
export function rincianBeranda(): BarisRincian[] {
  const v = getVitals()
  const keluar: BarisRincian[] = []
  for (const m of MEDAN) {
    const nilai = v[m.kunci]
    if (typeof nilai !== 'number' || !Number.isFinite(nilai) || nilai <= 0) continue
    const bulat = m.bulat ?? 0
    const r = rentangPribadi(m.kunci, nilai)
    keluar.push({
      kunci: m.kunci,
      label: m.label,
      nilai: bulat ? nilai.toFixed(bulat) : String(Math.round(nilai)),
      satuan: m.satuan,
      ke: m.ke,
      ...(r ? { rentang: { posisi: r.posisi, baca: bacaRentang(r, m.satuan, bulat) } } : {}),
    })
  }
  return keluar
}

/** Tekanan darah ditangani terpisah karena satu baris memuat dua angka. */
export function barisTekananDarah(): BarisRincian | null {
  const v = getVitals()
  if (typeof v.systolic !== 'number' || typeof v.diastolic !== 'number') return null
  if (!(v.systolic > 0 && v.diastolic > 0)) return null
  return {
    kunci: 'td',
    label: 'Blood pressure',
    nilai: `${Math.round(v.systolic)}/${Math.round(v.diastolic)}`,
    satuan: 'mmHg',
    ke: '/tubuh',
  }
}
