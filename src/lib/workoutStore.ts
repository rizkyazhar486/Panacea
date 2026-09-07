// Penyimpanan latihan hasil impor.
//
// Mengikuti pola healthVitals: satu sumber di localStorage, dengan siaran
// perubahan supaya halaman lain ikut menyegarkan tanpa dimuat ulang. Tidak ada
// yang dikirim ke mana pun.
//
// Digabungkan berdasarkan `id` latihan, bukan ditimpa, karena satu ekspor hanya
// memuat rentang tanggal yang dipilih — mengganti seluruh isi akan menghapus
// riwayat lama setiap kali seseorang mengekspor tujuh hari terakhir.

import { broadcastHealthUpdate } from './profile'
import type { ImportedWorkout, HrNotification } from './workoutImport'

const KEY_W = 'pmd_workouts_v1'
const KEY_N = 'pmd_hr_notifications_v1'

/** Batas jumlah tersimpan — deret per menit membuat tiap sesi cukup besar. */
const MAX_WORKOUTS = 200
const MAX_NOTIFS = 100

// Banyak widget Home membaca riwayat latihan yang sama pada render yang sama.
// Sebelumnya setiap getWorkouts() melakukan localStorage.getItem + JSON.parse +
// validasi seluruh sesi lagi. Dengan sampai 200 sesi dan deret HR per menit,
// pengulangan itu dapat memblokir main thread di iPhone. Cache ini aman karena
// ia selalu dibandingkan dengan string mentah localStorage: perubahan dari
// tab lain atau kode lama otomatis membuat cache tidak cocok dan diparse ulang.
let cachedWorkoutRaw: string | null | undefined
let cachedWorkouts: ImportedWorkout[] | undefined
let cachedNotifRaw: string | null | undefined
let cachedNotifs: HrNotification[] | undefined

/**
 * Benar bila entri ini aman dipakai perhitungan.
 *
 * `hr` dan `pemulihan` WAJIB pada tipenya, dan yang membacanya langsung
 * memanggil `.length` tanpa penjagaan. Isi localStorage tidak dijamin
 * mengikuti tipe itu: ia bisa berasal dari versi aplikasi yang lebih lama,
 * dari impor yang terputus di tengah jalan, atau dari suntingan tangan.
 * Satu entri cacat cukup untuk melempar TypeError dan mengganti SELURUH
 * halaman latihan dengan layar "Something went wrong" — termasuk ratusan sesi
 * lain yang sebetulnya baik-baik saja.
 */
function bentuknyaBenar(w: unknown): w is ImportedWorkout {
  if (!w || typeof w !== 'object') return false
  const x = w as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    typeof x.mulai === 'string' &&
    !Number.isNaN(Date.parse(x.mulai)) &&
    Array.isArray(x.hr) &&
    Array.isArray(x.pemulihan)
  )
}

export function getWorkouts(): ImportedWorkout[] {
  try {
    const raw = localStorage.getItem(KEY_W)
    if (raw === cachedWorkoutRaw && cachedWorkouts) return cachedWorkouts.slice()

    const v = raw ? JSON.parse(raw) : []
    // Yang cacat dibuang, bukan diloloskan: kehilangan satu sesi jauh lebih
    // ringan daripada kehilangan akses ke seluruh halaman.
    const parsed = Array.isArray(v) ? v.filter(bentuknyaBenar) : []
    cachedWorkoutRaw = raw
    cachedWorkouts = parsed
    // Kembalikan salinan array dangkal agar consumer yang melakukan sort/splice
    // tidak dapat merusak urutan cache bersama. Objek sesi sendiri diperlakukan
    // sebagai data baca-saja sebagaimana sebelum optimasi ini.
    return parsed.slice()
  } catch {
    cachedWorkoutRaw = undefined
    cachedWorkouts = undefined
    return []
  }
}

export function getHrNotifications(): HrNotification[] {
  try {
    const raw = localStorage.getItem(KEY_N)
    if (raw === cachedNotifRaw && cachedNotifs) return cachedNotifs.slice()

    const v = raw ? JSON.parse(raw) : []
    const parsed = Array.isArray(v) ? (v as HrNotification[]) : []
    cachedNotifRaw = raw
    cachedNotifs = parsed
    return parsed.slice()
  } catch {
    cachedNotifRaw = undefined
    cachedNotifs = undefined
    return []
  }
}

/** Menggabungkan hasil impor dengan yang sudah tersimpan. Mengembalikan jumlah yang benar-benar baru. */
export function mergeWorkouts(incoming: ImportedWorkout[]): number {
  if (!incoming.length) return 0
  const cur = getWorkouts()
  const byId = new Map(cur.map((w) => [w.id, w]))
  let baru = 0
  for (const w of incoming) {
    if (!byId.has(w.id)) baru++
    byId.set(w.id, w) // impor ulang menyegarkan data sesi yang sama
  }
  const next = [...byId.values()]
    .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
    .slice(0, MAX_WORKOUTS)
  try {
    const raw = JSON.stringify(next)
    localStorage.setItem(KEY_W, raw)
    cachedWorkoutRaw = raw
    cachedWorkouts = next
  } catch { /* kuota penuh — pertahankan cache storage lama */ }
  broadcastHealthUpdate()
  return baru
}

export function mergeHrNotifications(incoming: HrNotification[]): number {
  if (!incoming.length) return 0
  const cur = getHrNotifications()
  const key = (n: HrNotification) => `${n.mulai}|${n.jenis}`
  const byKey = new Map(cur.map((n) => [key(n), n]))
  let baru = 0
  for (const n of incoming) {
    if (!byKey.has(key(n))) baru++
    byKey.set(key(n), n)
  }
  const next = [...byKey.values()]
    .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
    .slice(0, MAX_NOTIFS)
  try {
    const raw = JSON.stringify(next)
    localStorage.setItem(KEY_N, raw)
    cachedNotifRaw = raw
    cachedNotifs = next
  } catch { /* kuota penuh — pertahankan cache storage lama */ }
  broadcastHealthUpdate()
  return baru
}

export function clearWorkouts() {
  try { localStorage.removeItem(KEY_W); localStorage.removeItem(KEY_N) } catch { /* abaikan */ }
  cachedWorkoutRaw = null
  cachedWorkouts = []
  cachedNotifRaw = null
  cachedNotifs = []
  broadcastHealthUpdate()
}
