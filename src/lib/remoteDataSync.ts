import { api, backendEnabled } from './api'
import { mergeVitals, type Vitals } from './healthVitals'
import { mergeDemoStored, mergeHealthCache, type Demo } from './profile'
import { parseHrNotifications, parseWorkouts } from './workoutImport'
import { mergeHrNotifications, mergeWorkouts } from './workoutStore'
import { publishDataUpdate } from './dataSync'

const META_KEY = 'pmd_data_sync_meta_v1'
const MIN_SYNC_GAP_MS = 60_000

export interface DataSyncMeta {
  lastAttemptAt?: string
  lastSuccessAt?: string
  reason?: string
  profile?: boolean
  workouts?: number
  notifications?: number
}

let activeSync: Promise<DataSyncMeta> | null = null
let lastAttemptMs = 0

function positive(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined
}

function text(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function readMeta(): DataSyncMeta {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') as DataSyncMeta } catch { return {} }
}

function writeMeta(meta: DataSyncMeta): void {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch { /* storage unavailable */ }
}

export function getDataSyncMeta(): DataSyncMeta {
  return { ...readMeta() }
}

function remoteProfileToVitals(remote: Record<string, unknown>): Vitals {
  const out: Vitals = {}
  const map: Record<string, keyof Vitals> = {
    weightKg: 'weightKg',
    heightCm: 'heightCm',
    bodyFatPct: 'bodyFatPct',
    vo2max: 'vo2max',
    restingHr: 'restingHr',
    hrvMs: 'hrvMs',
    recoveryPct: 'recoveryPct',
    strain: 'strain',
    sleepH: 'sleepH',
    remH: 'sleepRemH',
    deepH: 'sleepDeepH',
    steps: 'steps',
    activeKcal: 'activeKcal',
  }
  for (const [remoteKey, vitalKey] of Object.entries(map)) {
    const n = positive(remote[remoteKey])
    if (n !== undefined) (out as Record<string, unknown>)[vitalKey] = n
  }

  // The Health Profile stores blood pressure as one human-editable string.
  // Split it only when both numbers are explicitly present and positive.
  const bp = text(remote.bloodPressure)?.match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/)
  if (bp) {
    const systolic = Number(bp[1])
    const diastolic = Number(bp[2])
    if (systolic > 0 && diastolic > 0) {
      out.systolic = systolic
      out.diastolic = diastolic
    }
  }

  const source = text(remote.deviceSyncSource) ?? text(remote.source)
  const measuredAt = text(remote.lastDeviceSyncAt) ?? text(remote.updatedAt)
  if (source) out.source = source
  if (measuredAt && !Number.isNaN(Date.parse(measuredAt))) out.measuredAt = measuredAt
  return out
}

function remoteProfileToDemo(remote: Record<string, unknown>): Partial<Demo> {
  const out: Partial<Demo> = {}
  const age = positive(remote.age)
  const weightKg = positive(remote.weightKg)
  const heightCm = positive(remote.heightCm)
  const vo2max = positive(remote.vo2max)
  const restingHr = positive(remote.restingHr)
  const hrvMs = positive(remote.hrvMs)
  const sleepH = positive(remote.sleepH)
  if (age !== undefined) out.age = age
  if (remote.sex === 'M' || remote.sex === 'F') out.sex = remote.sex
  if (weightKg !== undefined) out.weightKg = weightKg
  if (heightCm !== undefined) out.heightCm = heightCm
  if (vo2max !== undefined) out.vo2max = vo2max
  if (restingHr !== undefined) out.restingHr = restingHr
  if (hrvMs !== undefined) out.hrvMs = hrvMs
  if (sleepH !== undefined) out.sleepH = sleepH
  return out
}

/**
 * Pull every server-backed health stream that already has a public frontend API.
 * One in-flight promise is shared across StrictMode mounts/focus events, and
 * routine triggers are throttled to once per minute. No background polling.
 */
export function syncRemoteHealthData(reason = 'automatic', force = false): Promise<DataSyncMeta> {
  if (!backendEnabled) return Promise.resolve(getDataSyncMeta())
  if (activeSync) return activeSync
  const now = Date.now()
  if (!force && now - lastAttemptMs < MIN_SYNC_GAP_MS) return Promise.resolve(getDataSyncMeta())
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve(getDataSyncMeta())

  lastAttemptMs = now
  const started = new Date(now).toISOString()
  writeMeta({ ...readMeta(), lastAttemptAt: started, reason })

  activeSync = (async () => {
    const [profileResult, workoutsResult, notificationsResult] = await Promise.allSettled([
      api.getHealthProfile(),
      api.deviceWorkouts(),
      api.deviceHrNotifications(),
    ])

    let profile = false
    let workouts = 0
    let notifications = 0

    if (profileResult.status === 'fulfilled' && profileResult.value && typeof profileResult.value === 'object') {
      const remote = profileResult.value as Record<string, unknown>
      if (Object.keys(remote).length) {
        profile = true
        mergeHealthCache(remote)
        mergeVitals(remoteProfileToVitals(remote))
        mergeDemoStored(remoteProfileToDemo(remote), 'remote-profile')
      }
    }

    if (workoutsResult.status === 'fulfilled' && Array.isArray(workoutsResult.value.workouts)) {
      const parsed = parseWorkouts(JSON.stringify({ data: { workouts: workoutsResult.value.workouts } }))
      if (parsed.length) {
        mergeWorkouts(parsed)
        workouts = parsed.length
      }
    }

    if (notificationsResult.status === 'fulfilled' && Array.isArray(notificationsResult.value.notifications)) {
      const parsed = parseHrNotifications(JSON.stringify({ data: { heartRateNotifications: notificationsResult.value.notifications } }))
      if (parsed.length) {
        mergeHrNotifications(parsed)
        notifications = parsed.length
      }
    }

    const anySuccess = profileResult.status === 'fulfilled' || workoutsResult.status === 'fulfilled' || notificationsResult.status === 'fulfilled'
    const meta: DataSyncMeta = {
      ...readMeta(),
      lastAttemptAt: started,
      ...(anySuccess ? { lastSuccessAt: new Date().toISOString() } : {}),
      reason,
      profile,
      workouts,
      notifications,
    }
    writeMeta(meta)
    if (anySuccess) publishDataUpdate(['health', 'profile', 'workouts', 'hr-notifications'], `remote-sync:${reason}`)
    return meta
  })().finally(() => { activeSync = null })

  return activeSync
}
