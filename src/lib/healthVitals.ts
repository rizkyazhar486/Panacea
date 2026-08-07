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
  source?: string
  measuredAt?: string
  syncedAt?: string
}

const KEY = 'pmd_vitals_v1'

export function getVitals(): Vitals {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Vitals) : {}
  } catch {
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
    if (typeof v === 'number') {
      if (Number.isFinite(v) && v > 0) (clean as Record<string, unknown>)[k] = v
    } else if (typeof v === 'string' && v) {
      (clean as Record<string, unknown>)[k] = v
    }
  }
  if (!Object.keys(clean).length) return getVitals()

  const next: Vitals = { ...getVitals(), ...clean, syncedAt: new Date().toISOString() }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  broadcastHealthUpdate()
  return next
}

export function clearVitals(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
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
