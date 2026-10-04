// Single source of truth for device-derived vitals.
//
// Why this exists: imported Apple Watch / wearable data used to land only in
// the Health Profile page's own local state. Every other page — Vita Pulse, the
// calculators, the dashboards — started from hardcoded defaults (weight 70,
// height 170, HR 72, SpO2 98), so a user who had just synced their watch still
// saw a stranger's numbers everywhere else. That is the "data doesn't
// synchronize across the website" problem.
//
// Everything a device gives us is written here once, and pages subscribe. Data
// stays on the device (localStorage); nothing is uploaded by this module.

import { broadcastHealthUpdate } from './profile'

export interface Vitals {
  // Katalog metrik server kini memuat 113 entri; menuliskannya satu per satu di
  // sini berarti metrik baru diam-diam terbuang saat disalurkan ke halaman lain.
  [kunci: string]: number | string | undefined
  // Body
  weightKg?: number
  heightCm?: number
  bodyFatPct?: number
  leanMassKg?: number
  // Cardiorespiratory
  heartRate?: number
  restingHr?: number
  hrvMs?: number
  vo2max?: number
  spo2Pct?: number
  respRate?: number
  systolic?: number
  diastolic?: number
  bodyTempC?: number
  // Activity & recovery
  steps?: number
  activeKcal?: number
  exerciseMin?: number
  distanceKm?: number
  sleepH?: number
  sleepDeepH?: number
  sleepRemH?: number
  sleepCoreH?: number
  sleepAwakeH?: number
  recoveryPct?: number
  strain?: number
  basalKcal?: number
  flightsClimbed?: number
  standHours?: number
  daylightMin?: number
  cardioRecoveryBpm?: number
  // Body composition from InBody / smart scales
  bmi?: number
  bmrKcal?: number
  skeletalMuscleKg?: number
  bodyWaterL?: number
  visceralFatLevel?: number
  waistHipRatio?: number
  bodyWaterPct?: number
  proteinPct?: number
  bonePct?: number
  /** Kapasitas cadangan otot — skor timbangan BIA, bukan satuan fisik. */
  muscleReserveCapacity?: number
  /** Garam anorganik (mineral tubuh) dalam kg. */
  inorganicSaltKg?: number
  /** Somatotipe sebagai label, mis. "Standard". */
  somatotype?: string
  /** Skor tubuh gabungan 0-100 dari aplikasi timbangan. */
  bodyScore?: number
  /** Otot rangka sebagai persen massa tubuh. */
  skeletalMusclePct?: number
  musclePct?: number
  subcutaneousFatKg?: number
  boneMassKg?: number
  bodyAge?: number
  amrKcal?: number
  visceralFatIndex?: number
  // Gait quality
  walkingSpeedKmh?: number
  walkingAsymmetryPct?: number
  walkingDoubleSupportPct?: number
  walkingStepLengthCm?: number
  stairSpeedUpMs?: number
  stairSpeedDownMs?: number
  sixMinWalkM?: number
  // Running form
  runningPowerW?: number
  runningSpeedKmh?: number
  runningStrideLengthM?: number
  runningGroundContactMs?: number
  runningVerticalOscCm?: number
  // Hearing exposure
  audioExposureDb?: number
  headphoneAudioDb?: number
  // Provenance — shown in the UI so a user always knows where a number came
  // from and how old it is, rather than seeing an unexplained prefilled field.
  /** Local snapshot ownership; never inferred from the selected clinical patient. */
  subjectId?: string
  ownerAccountId?: string
  source?: string
  measuredAt?: string
  syncedAt?: string
}

const KEY = 'pmd_vitals_v1'

// Home and its widgets read the same current vitals many times. Keep one parsed
// snapshot while the underlying localStorage string is unchanged; another tab
// or an older code path still invalidates naturally because raw strings differ.
let cachedRaw: string | null | undefined
let cachedVitals: Vitals | undefined

export function getVitals(): Vitals {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === cachedRaw && cachedVitals) return { ...cachedVitals }
    const parsed = raw ? (JSON.parse(raw) as Vitals) : {}
    cachedRaw = raw
    cachedVitals = parsed
    return { ...parsed }
  } catch {
    cachedRaw = undefined
    cachedVitals = undefined
    return {}
  }
}

/**
 * Merges newly received vitals in. Only finite positive numbers are accepted,
 * so a partial export never wipes previously known good values with undefined.
 */
export function mergeVitals(patch: Vitals): Vitals {
  const clean: Vitals = {}
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'subjectId' || k === 'ownerAccountId') continue
    if (typeof v === 'number') {
      if (Number.isFinite(v) && v > 0) (clean as Record<string, unknown>)[k] = v
    } else if (typeof v === 'string' && v) {
      (clean as Record<string, unknown>)[k] = v
    }
  }
  if (!Object.keys(clean).length) return getVitals()

  // An import belongs to the remembered self account, never the active clinic patient.
  let subjectId: string | undefined
  let ownerAccountId: string | undefined
  try {
    const session = JSON.parse(localStorage.getItem('panaceamed.session.v1') || 'null')
    const age = Date.now() - session?.loginAt
    if (typeof session?.loginAt === 'number' && Number.isFinite(age) && age >= 0 && age <= 7 * 86400000 &&
      typeof session?.account?.id === 'string' && session.account.id.trim() &&
      typeof session?.account?.patientId === 'string' && session.account.patientId.trim()) {
      ownerAccountId = session.account.id
      subjectId = session.account.patientId
    }
  } catch { /* Unbound data cannot authorize a patient projection. */ }
  const previous = getVitals()
  const sameOwner = previous.subjectId === subjectId && previous.ownerAccountId === ownerAccountId
  const next: Vitals = { ...(sameOwner ? previous : {}), ...clean, subjectId, ownerAccountId, syncedAt: new Date().toISOString() }
  try {
    const raw = JSON.stringify(next)
    localStorage.setItem(KEY, raw)
    cachedRaw = raw
    cachedVitals = next
  } catch { /* ignore; leave cache aligned with persisted storage */ }
  /*
   * Riwayat dicatat DI SINI, bukan di pemanggilnya. mergeVitals adalah
   * satu-satunya jalan masuk angka tubuh ke dalam aplikasi; menaruh pencatatan
   * di tempat lain berarti ada jalur penyaluran data yang lolos tanpa tercatat,
   * dan riwayat yang berlubang menghasilkan rentang pribadi yang keliru tanpa
   * ada yang menyadarinya.
   *
   * Impor dinamis supaya berkas ini tidak saling mengimpor dengan riwayatVitals.
   */
  import('./riwayatVitals').then((m) => m.catatRiwayat(next)).catch(() => { /* abaikan */ })
  broadcastHealthUpdate()
  return next
}

export function clearVitals(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  cachedRaw = null
  cachedVitals = {}
  broadcastHealthUpdate()
}

/** Human-readable age of the reading, for the "from your Apple Watch" badge. */
export function vitalsAge(v: Vitals): string | null {
  const iso = v.measuredAt ?? v.syncedAt
  if (!iso) return null
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const s = Math.floor((Date.now() - t) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}