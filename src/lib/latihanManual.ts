import { mergeWorkouts } from './workoutStore'
import type { ImportedWorkout } from './workoutImport'

// ─────────────────────────────────────────────────────────────────────────────
// Mencatat satu sesi latihan dengan tangan.
//
// MENGAPA PERLU. Seluruh angka latihan di aplikasi ini — kebugaran, kelelahan,
// kesegaran, ramalan — dihitung dari daftar sesi yang selama ini HANYA dapat
// diisi lewat sinkronisasi perangkat. Siapa pun yang tidak memakai jam tangan
// pintar, atau yang jamnya gagal tersinkron, melihat seluruh halaman latihan
// kosong tanpa satu pun jalan mengisinya. Fitur yang hanya bisa dipakai oleh
// pemilik perangkat tertentu bukan fitur bagi kebanyakan orang.
//
// SESI TANGAN DITANDAI, DAN TANDANYA TIDAK PERNAH DIHAPUS. Sesi tercatat tangan
// tidak memiliki deret denyut jantung, sehingga upaya relatifnya harus ditaksir
// dari lama dan berat yang dirasakan, bukan diukur. Menyamarkan keduanya akan
// membuat kartu kebugaran menampilkan angka yang tampak sama telitinya padahal
// asalnya berbeda — persis kekeliruan yang dibongkar oleh seluruh bagian
// "tingkat keyakinan" di aplikasi ini.
//
// DENYUT TIDAK PERNAH DIKARANG. Satu-satunya cara mengisi hr[] tanpa alat ukur
// adalah menebaknya dari RPE, dan tebakan yang disimpan dalam bentuk yang sama
// dengan hasil ukur akan diperlakukan sebagai hasil ukur oleh setiap perhitungan
// sesudahnya. Deretnya dibiarkan KOSONG, dan model yang membutuhkannya akan
// berkata datanya tidak ada — yang memang benar.
// ─────────────────────────────────────────────────────────────────────────────

/** Penanda pada id, supaya sesi tangan selalu dapat dikenali kembali. */
export const AWALAN_TANGAN = 'tangan-'

export function sesiTangan(id: string): boolean {
  return id.startsWith(AWALAN_TANGAN)
}

export interface MasukanLatihan {
  nama: string
  /** Tanggal setempat, YYYY-MM-DD. */
  tanggal: string
  /** Menit. */
  menit: number
  /** Berat yang dirasakan, skala Borg CR10 (1-10). */
  rpe: number
  jarakKm?: number
}

/**
 * Perkiraan kalori dari MET dan lama sesi.
 *
 * Sengaja TIDAK dihitung di sini. Kalori memerlukan berat badan dan nilai MET
 * per jenis kegiatan, dan keduanya adalah taksiran bertingkat: taksiran MET di
 * atas taksiran berat di atas lama yang dilaporkan sendiri. Angka yang lahir
 * dari tiga taksiran bertumpuk tidak layak dipajang bersama angka terukur.
 */

export function catatLatihanTangan(m: MasukanLatihan): ImportedWorkout | null {
  const nama = m.nama.trim() || 'Latihan'
  const menit = Math.round(m.menit)
  if (!Number.isFinite(menit) || menit <= 0 || menit > 24 * 60) return null
  const rpe = Math.min(10, Math.max(1, Math.round(m.rpe)))

  // Tengah hari dipilih sebagai jam mulai bila hanya tanggalnya yang diketahui:
  // ia tidak pernah melewati batas hari saat sesi panjang ditambahkan, sehingga
  // sesi tidak pernah pindah tanggal karena pembulatan jam.
  const mulai = new Date(`${m.tanggal}T12:00:00`)
  if (Number.isNaN(mulai.getTime())) return null
  const selesai = new Date(mulai.getTime() + menit * 60_000)

  const durasi = menit * 60
  const jarak = Number.isFinite(m.jarakKm as number) && (m.jarakKm as number) > 0 ? m.jarakKm : undefined

  const w: ImportedWorkout = {
    // Satu sesi per tanggal per nama: mencatat ulang memperbaiki, bukan
    // menggandakan. Tanpa ini, menekan simpan dua kali melipatgandakan beban
    // latihan hari itu dan seluruh kurva kebugaran ikut keliru.
    id: `${AWALAN_TANGAN}${m.tanggal}-${nama.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    nama,
    mulai: mulai.toISOString(),
    selesai: selesai.toISOString(),
    durasi,
    jarakKm: jarak,
    kecepatanKmh: jarak ? Math.round((jarak / (durasi / 3600)) * 10) / 10 : undefined,
    paceSec: jarak ? Math.round(durasi / jarak) : undefined,
    // Kosong dengan sengaja — lihat catatan di kepala berkas.
    hr: [],
    pemulihan: [],
    rpe,
  }

  mergeWorkouts([w])
  return w
}
