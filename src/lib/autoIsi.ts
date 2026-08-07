import { api, backendEnabled } from './api'
import { mergeVitals } from './healthVitals'
import { getDemoTersimpan, setDemo, mergeHealthCache } from './profile'

// ─────────────────────────────────────────────────────────────────────────────
// Auto-isi lintas fitur.
//
// Masalah yang diperbaiki: data perangkat memang sampai ke server dan tersimpan
// di profil kesehatan, tetapi satu-satunya tempat yang MENYALURKANNYA ke
// penyimpanan bersama (`healthVitals`) adalah halaman /health-data. Artinya
// Longevity, Fitness, Kalkulator Klinis dan AI baru melihat angka Anda setelah
// Anda kebetulan membuka halaman itu lebih dulu. Sebelum itu, semuanya memakai
// nilai bawaan — berat 70 kg, tinggi 170 cm, denyut 72 — milik orang lain.
//
// Modul ini menarik profil dari server sekali saat aplikasi dibuka dan
// menyebarkannya ke tempat yang sudah dibaca semua halaman, jadi tidak ada
// halaman yang perlu diubah satu per satu.
//
// Tiga aturan yang menjaga ini tidak merusak data:
//
//   1. TIDAK MENIMPA YANG LEBIH BARU. Nilai yang Anda ketik manual barusan
//      tidak boleh ditimpa oleh sinkronisasi yang lebih tua.
//   2. HANYA ANGKA YANG MASUK AKAL. Nilai nol atau negatif diabaikan, karena
//      "0 kg" dari metrik kosong akan menghapus berat badan yang benar.
//   3. TIDAK PERNAH MENGIRIM. Modul ini hanya membaca dari server dan menulis
//      ke penyimpanan lokal.
// ─────────────────────────────────────────────────────────────────────────────

import { nilaiWajar, saringProfil, KE_DEMO } from './autoIsiFilter'

let sudahJalan = false

/**
 * Tarik profil dari server dan sebarkan.
 *
 * @param paksa jalankan lagi meskipun sudah pernah dijalankan sesi ini
 */
export async function autoIsiDariPerangkat(paksa = false): Promise<number> {
  if (!backendEnabled) return 0
  if (sudahJalan && !paksa) return 0

  let profil: Record<string, unknown>
  try {
    profil = (await api.getHealthProfile()) as Record<string, unknown>
  } catch {
    // Luring atau belum masuk. JANGAN ditandai sudah berjalan: percobaan
    // pertama terjadi sebelum sesi ada, jadi menandainya di sini membuat
    // auto-isi tidak pernah dicoba lagi setelah pengguna masuk.
    return 0
  }
  sudahJalan = true
  if (!profil || typeof profil !== 'object') return 0

  const bersih = saringProfil(profil)
  const jumlah = Object.keys(bersih).length
  if (!jumlah) return 0

  const sumber = typeof profil.deviceSyncSource === 'string' ? profil.deviceSyncSource : 'Perangkat'
  const kapan = typeof profil.lastDeviceSyncAt === 'string' ? profil.lastDeviceSyncAt : undefined

  mergeVitals({ ...bersih, source: sumber, measuredAt: kapan })

  // Penyimpanan ketiga: Longevity, Body Composition dan kalkulator klinis
  // membaca cache Health Profile langsung, bukan lewat healthVitals.
  mergeHealthCache(bersih)

  // Demografi ikut disalin karena kalkulator membacanya lewat getDemo(), bukan
  // lewat vitals. Yang sudah terisi tidak ditimpa: nilai yang diketik pengguna
  // lebih dipercaya daripada turunan perangkat.
  const demo = getDemoTersimpan() as Record<string, unknown>
  const tambahan: Record<string, number> = {}
  for (const k of KE_DEMO) {
    const v = (bersih as Record<string, unknown>)[k]
    const lama = demo[k]
    if (nilaiWajar(k, v) && !(typeof lama === 'number' && lama > 0)) tambahan[k] = v as number
  }
  if (Object.keys(tambahan).length) setDemo(tambahan)

  return jumlah
}

/** Dipanggil setelah unggah/sinkronisasi manual agar tidak perlu memuat ulang. */
export function segarkanAutoIsi(): Promise<number> {
  return autoIsiDariPerangkat(true)
}
