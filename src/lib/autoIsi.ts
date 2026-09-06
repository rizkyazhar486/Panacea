import { api, backendEnabled } from './api'
import { mergeVitals } from './healthVitals'
import { getDemoTersimpan, setDemo, mergeHealthCache } from './profile'
import { nilaiWajar, saringProfil, KE_DEMO } from './autoIsiFilter'
import { parseWorkouts, parseHrNotifications } from './workoutImport'
import { mergeWorkouts, mergeHrNotifications } from './workoutStore'

// ─────────────────────────────────────────────────────────────────────────────
// Auto-isi lintas fitur.
//
// Tujuan modul ini bukan sekadar "fetch sekali saat login". Data wearable tiba
// secara asinkron melalui webhook, sehingga respons kosong sesaat TIDAK berarti
// pengguna memang tidak punya data. Versi lama menandai sinkronisasi sebagai
// selesai tepat setelah GET /health-profile berhasil, bahkan bila profilnya
// kosong. Akibatnya satu respons kosong dapat membuat seluruh sesi berhenti
// mencoba lagi.
//
// Prinsip baru:
//   1. EMPTY IS NOT DELETE — respons kosong tidak pernah menghapus nilai lokal.
//   2. RETRY TRANSIENT FAILURES — fetch otomatis dicoba ulang dengan backoff.
//   3. REHYDRATE EVERYTHING — profil, workouts, dan HR notifications ditarik
//      dari server; bukan profil saja.
//   4. STALE-WHILE-REVALIDATE — nilai terakhir di localStorage tetap tampil
//      saat backend lambat/kosong, lalu disegarkan ketika data benar-benar ada.
//   5. EVENTUAL CONSISTENCY — saat app kembali fokus/online dan secara periodik
//      selama terbuka, sinkronisasi dijalankan ulang.
// ─────────────────────────────────────────────────────────────────────────────

export interface AutoSyncStatus {
  state: 'idle' | 'syncing' | 'ok' | 'partial' | 'offline'
  lastAttempt?: string
  lastSuccess?: string
  profileFields: number
  workoutsPulled: number
  notificationsPulled: number
  errors: string[]
}

const STATUS_KEY = 'pmd_auto_sync_status_v2'
const HEALTH_PROFILE_CACHE_KEY = 'pmd_health_profile'
const PERIODIC_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10_000

let sudahJalan = false
let pemantauTerpasang = false
let sedangJalan: Promise<number> | null = null

function bacaStatus(): AutoSyncStatus {
  const fallback: AutoSyncStatus = {
    state: 'idle', profileFields: 0, workoutsPulled: 0, notificationsPulled: 0, errors: [],
  }
  try {
    const raw = localStorage.getItem(STATUS_KEY)
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<AutoSyncStatus>) } : fallback
  } catch {
    return fallback
  }
}

function tulisStatus(patch: Partial<AutoSyncStatus>): AutoSyncStatus {
  const next = { ...bacaStatus(), ...patch }
  try { localStorage.setItem(STATUS_KEY, JSON.stringify(next)) } catch { /* storage penuh / private mode */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('panacea:auto-sync', { detail: next }))
  return next
}

export function getAutoSyncStatus(): AutoSyncStatus {
  return bacaStatus()
}

function tunggu(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function denganBatasWaktu<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('sync_timeout')), ms)),
  ])
}

async function cobaUlang<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let terakhir: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await denganBatasWaktu(fn())
    } catch (e) {
      terakhir = e
      if (i < attempts - 1) await tunggu(350 * (2 ** i))
    }
  }
  throw terakhir instanceof Error ? terakhir : new Error('sync_failed')
}

/**
 * Profil dapat berhasil secara HTTP namun kosong ketika webhook belum selesai
 * menulis atau storage backend baru bangun. Kosong dianggap "belum ada jawaban"
 * dan dicoba lagi; tidak pernah dianggap perintah untuk mengosongkan layar.
 */
async function tarikProfilDenganRetry(): Promise<Record<string, unknown>> {
  let lastEmpty: Record<string, unknown> = {}
  let lastError: unknown
  for (let i = 0; i < 3; i++) {
    try {
      const p = await denganBatasWaktu(api.getHealthProfile()) as Record<string, unknown>
      if (p && typeof p === 'object') {
        lastEmpty = p
        if (Object.keys(saringProfil(p)).length > 0) return p
      }
    } catch (e) {
      lastError = e
    }
    if (i < 2) await tunggu(400 * (2 ** i))
  }
  // Bila setidaknya satu permintaan berhasil tetapi memang kosong, kembalikan
  // objek kosong. Jika semuanya gagal, biarkan pemanggil mencatat kegagalan.
  if (Object.keys(lastEmpty).length > 0 || !lastError) return lastEmpty
  throw lastError
}

/**
 * HealthProfile mempunyai cache lokalnya sendiri. Sinkronisasi otomatis lama
 * hanya menulis ke healthVitals, sehingga halaman /health-data dapat kembali
 * kosong saat server sedang gagal walaupun dashboard masih punya angka lama.
 * Simpan hanya snapshot server yang bermakna, dan jangan menimpa cache lokal
 * yang memiliki timestamp lebih baru.
 */
function simpanSnapshotProfilLokal(profil: Record<string, unknown>) {
  try {
    const current = JSON.parse(localStorage.getItem(HEALTH_PROFILE_CACHE_KEY) || '{}') as Record<string, unknown>
    const remoteStamp = String(profil.lastDeviceSyncAt ?? profil.updatedAt ?? '')
    const localStamp = String(current.lastDeviceSyncAt ?? current.updatedAt ?? '')
    const remoteTime = Date.parse(remoteStamp)
    const localTime = Date.parse(localStamp)
    if (!Number.isNaN(remoteTime) && !Number.isNaN(localTime) && remoteTime < localTime) return
    localStorage.setItem(HEALTH_PROFILE_CACHE_KEY, JSON.stringify({ ...current, ...profil }))
  } catch { /* cache optional; never block sync */ }
}

function terapkanProfil(profil: Record<string, unknown>): number {
  const bersih = saringProfil(profil)
  const jumlah = Object.keys(bersih).length
  if (!jumlah) return 0

  const sumber = typeof profil.deviceSyncSource === 'string' ? profil.deviceSyncSource : 'Perangkat'
  const kapan = typeof profil.lastDeviceSyncAt === 'string' ? profil.lastDeviceSyncAt : undefined

  // mergeVitals tidak menerima nol/undefined sehingga profil parsial tidak dapat
  // menghapus last-known-good values yang sudah tersimpan di browser.
  mergeVitals({ ...bersih, source: sumber, measuredAt: kapan })
  mergeHealthCache(bersih)
  simpanSnapshotProfilLokal(profil)

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

/**
 * Data workout dari webhook disimpan server dalam bentuk exporter asli. Kita
 * bungkus kembali ke {data:{workouts}} agar parser manual yang sudah teruji bisa
 * dipakai ulang; tidak ada format kedua yang perlu dipelihara.
 */
async function tarikWorkoutDanNotifikasi(): Promise<{
  workoutsPulled: number
  notificationsPulled: number
  errors: string[]
}> {
  const errors: string[] = []
  let workoutsPulled = 0
  let notificationsPulled = 0

  const [w, n] = await Promise.allSettled([
    cobaUlang(() => api.deviceWorkouts(), 2),
    cobaUlang(() => api.deviceHrNotifications(), 2),
  ])

  if (w.status === 'fulfilled') {
    workoutsPulled = w.value.count ?? w.value.workouts.length
    if (w.value.workouts.length) {
      const parsed = parseWorkouts(JSON.stringify({ data: { workouts: w.value.workouts } }))
      mergeWorkouts(parsed)
    }
  } else {
    errors.push(`workouts: ${String((w.reason as Error)?.message ?? 'unavailable')}`)
  }

  if (n.status === 'fulfilled') {
    notificationsPulled = n.value.count ?? n.value.notifications.length
    if (n.value.notifications.length) {
      const parsed = parseHrNotifications(JSON.stringify({ data: { heartRateNotifications: n.value.notifications } }))
      mergeHrNotifications(parsed)
    }
  } else {
    errors.push(`hr-notifications: ${String((n.reason as Error)?.message ?? 'unavailable')}`)
  }

  return { workoutsPulled, notificationsPulled, errors }
}

function pasangPemantau() {
  if (pemantauTerpasang || typeof window === 'undefined') return
  pemantauTerpasang = true

  const segarkan = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return
    void autoIsiDariPerangkat(true)
  }

  window.addEventListener('online', segarkan)
  window.addEventListener('focus', segarkan)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') segarkan()
    })
  }
  window.setInterval(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') segarkan()
  }, PERIODIC_MS)
}

/**
 * Tarik data automation dari server dan sebarkan ke semua store lokal.
 *
 * @param paksa jalankan lagi meskipun satu sinkronisasi sukses sudah terjadi
 *              pada sesi ini. Pemantau internal memakai mode ini saat focus,
 *              online, dan interval periodik.
 */
export async function autoIsiDariPerangkat(paksa = false): Promise<number> {
  if (!backendEnabled) return 0
  pasangPemantau()

  // Jangan membuat beberapa request identik saat focus + online + interval
  // kebetulan berimpit.
  if (sedangJalan) return sedangJalan
  if (sudahJalan && !paksa) return 0

  sedangJalan = (async () => {
    const attemptAt = new Date().toISOString()
    tulisStatus({ state: 'syncing', lastAttempt: attemptAt, errors: [] })

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      tulisStatus({ state: 'offline', lastAttempt: attemptAt })
      return 0
    }

    const errors: string[] = []
    let jumlah = 0
    let profileMeaningful = false

    try {
      const profil = await tarikProfilDenganRetry()
      jumlah = terapkanProfil(profil)
      profileMeaningful = jumlah > 0
      // Hanya data bermakna yang menutup initial-sync gate. Respons HTTP 200
      // dengan {} tidak lagi membuat seluruh sesi berhenti mencoba.
      if (profileMeaningful) sudahJalan = true
    } catch (e) {
      errors.push(`profile: ${String((e as Error)?.message ?? 'unavailable')}`)
    }

    const sekunder = await tarikWorkoutDanNotifikasi()
    errors.push(...sekunder.errors)

    const adaData = profileMeaningful || sekunder.workoutsPulled > 0 || sekunder.notificationsPulled > 0
    const now = new Date().toISOString()
    tulisStatus({
      state: errors.length ? (adaData ? 'partial' : 'offline') : 'ok',
      lastAttempt: attemptAt,
      lastSuccess: adaData ? now : bacaStatus().lastSuccess,
      profileFields: jumlah,
      workoutsPulled: sekunder.workoutsPulled,
      notificationsPulled: sekunder.notificationsPulled,
      errors,
    })

    // Bila server menjawab kosong total, sengaja biarkan sudahJalan=false agar
    // panggilan biasa berikutnya juga masih boleh mencoba tanpa menunggu timer.
    return jumlah
  })().finally(() => {
    sedangJalan = null
  })

  return sedangJalan
}

/** Dipanggil setelah unggah/sinkronisasi manual agar tidak perlu memuat ulang. */
export function segarkanAutoIsi(): Promise<number> {
  return autoIsiDariPerangkat(true)
}
