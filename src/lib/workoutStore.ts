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
import type { ImportedWorkout, HrNotification, HrPoint } from './workoutImport'

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

function angkaHingga(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function angkaPositif(v: unknown): number | undefined {
  const n = angkaHingga(v)
  return n !== undefined && n > 0 ? n : undefined
}

function titikHr(v: unknown): HrPoint | null {
  if (!v || typeof v !== 'object') return null
  const x = v as Record<string, unknown>
  const t = angkaHingga(x.t)
  const bpm = angkaPositif(x.bpm)
  if (t === undefined || t < 0 || bpm === undefined) return null
  return { t, bpm }
}

/**
 * Menormalkan satu sesi dari batas runtime yang tidak terpercaya.
 *
 * TypeScript hanya melindungi kode saat build; isi localStorage tetap dapat
 * berasal dari versi lama, impor terputus, atau data yang disunting tangan.
 * Satu `null` di hr[] cukup untuk membuat consumer yang membaca `p.bpm` crash.
 * Karena itu titik sensor yang rusak dibuang per titik, bukan membuang seluruh
 * sesi. Nilai optional yang bukan angka finite juga dihilangkan supaya `NaN`
 * tidak merambat ke chart atau agregasi.
 */
function normalisasiWorkout(w: unknown): ImportedWorkout | null {
  if (!w || typeof w !== 'object') return null
  const x = w as Record<string, unknown>
  if (typeof x.id !== 'string' || !x.id.trim()) return null
  if (typeof x.mulai !== 'string' || Number.isNaN(Date.parse(x.mulai))) return null

  const durasi = angkaHingga(x.durasi)
  const hasil: ImportedWorkout = {
    id: x.id,
    nama: typeof x.nama === 'string' ? x.nama : '',
    mulai: x.mulai,
    // Fallback ini hanya menjaga bentuk data; durasi tidak dihitung ulang dari
    // waktu selesai sehingga kita tidak menciptakan lama sesi palsu.
    selesai: typeof x.selesai === 'string' ? x.selesai : x.mulai,
    durasi: durasi !== undefined && durasi >= 0 ? durasi : 0,
    hr: (Array.isArray(x.hr) ? x.hr : [])
      .map(titikHr)
      .filter((p): p is HrPoint => p !== null)
      .sort((a, b) => a.t - b.t),
    pemulihan: (Array.isArray(x.pemulihan) ? x.pemulihan : [])
      .map(titikHr)
      .filter((p): p is HrPoint => p !== null)
      .sort((a, b) => a.t - b.t),
  }

  const jarakKm = angkaPositif(x.jarakKm)
  const kcal = angkaHingga(x.kcal)
  const avgHr = angkaPositif(x.avgHr)
  const maxHr = angkaPositif(x.maxHr)
  const minHr = angkaPositif(x.minHr)
  const kecepatanKmh = angkaPositif(x.kecepatanKmh)
  const paceSec = angkaPositif(x.paceSec)
  const kadens = angkaPositif(x.kadens)
  const langkah = angkaHingga(x.langkah)
  const hrr1 = angkaPositif(x.hrr1)
  const rpe = angkaHingga(x.rpe)

  if (jarakKm !== undefined) hasil.jarakKm = jarakKm
  if (kcal !== undefined && kcal >= 0) hasil.kcal = kcal
  if (avgHr !== undefined) hasil.avgHr = avgHr
  if (maxHr !== undefined) hasil.maxHr = maxHr
  if (minHr !== undefined) hasil.minHr = minHr
  if (kecepatanKmh !== undefined) hasil.kecepatanKmh = kecepatanKmh
  if (paceSec !== undefined) hasil.paceSec = paceSec
  if (kadens !== undefined) hasil.kadens = kadens
  if (langkah !== undefined && langkah >= 0) hasil.langkah = langkah
  if (typeof x.diDalamRuangan === 'boolean') hasil.diDalamRuangan = x.diDalamRuangan
  if (hrr1 !== undefined) hasil.hrr1 = hrr1
  if (rpe !== undefined && rpe >= 1 && rpe <= 10) hasil.rpe = rpe

  return hasil
}

export function getWorkouts(): ImportedWorkout[] {
  try {
    const raw = localStorage.getItem(KEY_W)
    if (raw === cachedWorkoutRaw && cachedWorkouts) return cachedWorkouts.slice()

    const v = raw ? JSON.parse(raw) : []
    const parsed = Array.isArray(v)
      ? v.map(normalisasiWorkout).filter((w): w is ImportedWorkout => w !== null)
      : []
    cachedWorkoutRaw = raw
    cachedWorkouts = parsed
    // Kembalikan salinan array dangkal agar consumer yang melakukan sort/splice
    // tidak dapat merusak urutan cache bersama. normalisasiWorkout sudah membuat
    // larik HR/pemulihan baru sehingga cache tidak berbagi larik mentah storage.
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
  const aman = incoming
    .map(normalisasiWorkout)
    .filter((w): w is ImportedWorkout => w !== null)
  if (!aman.length) return 0

  const cur = getWorkouts()
  const byId = new Map(cur.map((w) => [w.id, w]))
  let baru = 0
  for (const w of aman) {
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
