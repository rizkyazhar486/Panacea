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

const LABEL_NOTIF: Record<HrNotification['jenis'], string> = {
  tinggi: 'High heart rate while inactive',
  rendah: 'Denyut rendah',
  iramaTidakTeratur: 'Irregular rhythm',
  lain: 'Heart-rate alert',
}

function jenisNotif(v: unknown): HrNotification['jenis'] {
  return v === 'tinggi' || v === 'rendah' || v === 'iramaTidakTeratur' || v === 'lain'
    ? v
    : 'lain'
}

/**
 * Menormalkan satu notifikasi denyut dari localStorage/import runtime.
 * Event tanpa waktu yang dapat dibaca tidak aman untuk timeline dan dibuang.
 * Field angka optional yang cacat dihilangkan; jumlah sampel yang cacat menjadi
 * nol agar tidak berubah menjadi NaN atau angka presisi palsu di consumer.
 */
function normalisasiNotif(v: unknown): HrNotification | null {
  if (!v || typeof v !== 'object') return null
  const x = v as Record<string, unknown>
  if (typeof x.mulai !== 'string' || !x.mulai.trim() || Number.isNaN(Date.parse(x.mulai))) return null

  const jenis = jenisNotif(x.jenis)
  const label = typeof x.label === 'string' && x.label.trim()
    ? x.label.trim()
    : LABEL_NOTIF[jenis]
  const ambang = angkaPositif(x.ambang)
  const puncakBpm = angkaPositif(x.puncakBpm)
  const sampel = typeof x.sampel === 'number' && Number.isInteger(x.sampel) && x.sampel >= 0
    ? x.sampel
    : 0

  const hasil: HrNotification = {
    jenis,
    label,
    mulai: x.mulai,
    sampel,
  }
  if (ambang !== undefined) hasil.ambang = ambang
  if (puncakBpm !== undefined) hasil.puncakBpm = puncakBpm
  return hasil
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
  if (typeof x.mulai !== 'string' || !x.mulai.trim()) return null
  const mulaiTs = Date.parse(x.mulai)
  if (Number.isNaN(mulaiTs)) return null

  const durasi = angkaHingga(x.durasi)
  const selesaiTs = typeof x.selesai === 'string' ? Date.parse(x.selesai) : NaN
  const selesai = !Number.isNaN(selesaiTs) && selesaiTs >= mulaiTs && typeof x.selesai === 'string'
    ? x.selesai
    : x.mulai
  const hr = (Array.isArray(x.hr) ? x.hr : [])
    .map(titikHr)
    .filter((p): p is HrPoint => p !== null)
    .sort((a, b) => a.t - b.t)
  const pemulihan = (Array.isArray(x.pemulihan) ? x.pemulihan : [])
    .map(titikHr)
    .filter((p): p is HrPoint => p !== null)
    .sort((a, b) => a.t - b.t)

  const hasil: ImportedWorkout = {
    id: x.id,
    nama: typeof x.nama === 'string' ? x.nama : '',
    mulai: x.mulai,
    // Waktu selesai invalid dinetralkan ke waktu mulai. Durasi tetap berasal
    // dari field durasi sendiri; kita tidak mengarang durasi dari timestamp.
    selesai,
    durasi: durasi !== undefined && durasi >= 0 ? durasi : 0,
    hr,
    pemulihan,
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
  // HRR1 hanya dipertahankan jika cache juga menyimpan bukti waktu sekitar
  // menit pertama. Ini membersihkan nilai lama yang dibuat dengan fallback
  // recovery yang sudah tidak digunakan importer baru.
  if (hrr1 !== undefined && pemulihan.some((p) => p.t >= 45 && p.t <= 75)) hasil.hrr1 = hrr1
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
    const parsed = Array.isArray(v)
      ? v.map(normalisasiNotif).filter((n): n is HrNotification => n !== null)
      : []
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
  const aman = incoming
    .map(normalisasiNotif)
    .filter((n): n is HrNotification => n !== null)
  if (!aman.length) return 0

  const cur = getHrNotifications()
  const key = (n: HrNotification) => `${n.mulai}|${n.jenis}`
  const byKey = new Map(cur.map((n) => [key(n), n]))
  let baru = 0
  for (const n of aman) {
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
