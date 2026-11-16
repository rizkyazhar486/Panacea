/**
 * Whole-System Same-Owner Local Recovery Engine covering:
 *  1. Personal & Wearable Datas (`pmd_vitals_scope_v1:*`, `pmd_health_profile`, `pm_bodycomp_v1`, `pmd_profile`, `patient`)
 *  2. Longitudinal History Logs (`pmd_riwayat_vitals_scope_v1:*`, `pmd_lab_scope_v1:*`, `pmd_workouts_v1:scope_v1:*`, `pmd_hr_notifications_v1:scope_v1:*`, `sleepLogs`)
 *  3. Connected & Synced Devices (`panacea.connected_devices.v1`, `vitals.source`, `healthCache.deviceSyncSource`)
 *
 * Security & privacy invariants:
 * - Foreign-owned envelopes (records carrying an `ownerAccountId` or email
 *   belonging to a different user) are strictly rejected and never adopted.
 * - Unfilled neutral calculator defaults are never promoted as measurements.
 */

import { getVitals, mergeVitals, type Vitals } from '../../lib/healthVitals.ts'
import { getHealthCache, mergeDemoStored, mergeHealthCache } from '../../lib/profile.ts'
import { getHrNotifications, getWorkouts, mergeHrNotifications, mergeWorkouts } from '../../lib/workoutStore.ts'
import { listSavedDevices, recordConnectedDevice } from '../devices/index.ts'
import { readUnifiedLocalVitals, resolveAutoResumeAccount } from './bootVitals.ts'
import type { Account, Patient, SleepLog, VitalSign } from '../../lib/types.ts'

export { readUnifiedLocalVitals, resolveAutoResumeAccount }

const VITALS_SCOPE_PREFIX = 'pmd_vitals_scope_v1:'
const HISTORY_SCOPE_PREFIX = 'pmd_riwayat_vitals_scope_v1:'
const LAB_SCOPE_PREFIX = 'pmd_lab_scope_v1:'
const WORKOUT_SCOPE_PREFIX = 'pmd_workouts_v1:scope_v1:'
const HR_NOTIF_SCOPE_PREFIX = 'pmd_hr_notifications_v1:scope_v1:'

function posNum(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function accountToken(id: string, patientId: string): string {
  return encodeURIComponent(JSON.stringify([id.trim(), patientId.trim()]))
}

function isSameEmailOwnedKey(key: string, targetKey: string, encodedEmail: string, legacySelfSlug = ''): boolean {
  if (key === targetKey) return false
  if (encodedEmail) {
    if (key.includes(encodedEmail)) return true
    const doubleEncoded = encodeURIComponent(encodedEmail)
    if (doubleEncoded && key.includes(doubleEncoded)) return true
  }
  if (legacySelfSlug && key.includes(legacySelfSlug)) return true
  return false
}

function legacySlugFromEmail(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/gi, '').slice(0, 16)
  return clean ? `self-${clean}` : ''
}

function belongsToSameEmailOwner(ownerAccountId: unknown, encodedEmail: string, currentId: string): boolean {
  if (typeof ownerAccountId !== 'string' || !ownerAccountId.trim()) return true
  if (ownerAccountId === currentId) return true
  return Boolean(encodedEmail && ownerAccountId.includes(encodedEmail))
}

export interface RecoverySummary {
  readonly mergedFieldsCount: number
  readonly historyDaysRecovered: number
  readonly labsRecovered: number
  readonly workoutsRecovered: number
  readonly devicesDiscovered: number
  readonly sourceKeys: readonly string[]
}

/**
 * Recover same-email daily vitals history logs (`pmd_riwayat_vitals_scope_v1:*`)
 * into the active account's scoped history envelope.
 */
function recoverSameEmailHistoryLogs(
  accountId: string,
  patientId: string,
  encodedEmail: string,
  legacySlug: string,
  token: string,
  adoptLegacy: boolean,
  adoptAllOwner: boolean,
  sourceKeys: string[],
): number {
  const targetKey = `${HISTORY_SCOPE_PREFIX}${token}`
  const existingEnv = (() => {
    try {
      return JSON.parse(localStorage.getItem(targetKey) || 'null') as { version?: number; history?: { tanggal: string; nilai: Record<string, number> }[] } | null
    } catch { return null }
  })()
  const byDay = new Map<string, { tanggal: string; nilai: Record<string, number> }>()
  for (const row of existingEnv?.history ?? []) {
    if (row && typeof row.tanggal === 'string' && row.nilai && typeof row.nilai === 'object') {
      byDay.set(row.tanggal, { tanggal: row.tanggal, nilai: { ...row.nilai } })
    }
  }
  const initialCount = byDay.size
  let recoveredDays = 0

  const mergeRows = (rows: unknown[], label: string) => {
    let touched = false
    for (const r of rows) {
      const row = r as { tanggal?: string; nilai?: Record<string, unknown> } | null
      if (!row || typeof row.tanggal !== 'string' || !row.nilai || typeof row.nilai !== 'object') continue
      const cleanNilai: Record<string, number> = {}
      for (const [mk, mv] of Object.entries(row.nilai)) {
        if (typeof mv === 'number' && Number.isFinite(mv) && mv > 0) cleanNilai[mk] = mv
      }
      if (!Object.keys(cleanNilai).length) continue
      const prev = byDay.get(row.tanggal)
      if (!prev) {
        byDay.set(row.tanggal, { tanggal: row.tanggal, nilai: cleanNilai })
        recoveredDays += 1
        touched = true
      } else {
        for (const [mk, mv] of Object.entries(cleanNilai)) {
          if (prev.nilai[mk] === undefined) {
            prev.nilai[mk] = mv
            touched = true
          }
        }
      }
    }
    if (touched) sourceKeys.push(label)
  }

  try {
    // Reconcile 90-day dated snapshots from `pmd_health_profile.history[]` silently into history store.
    const hpRaw = JSON.parse(localStorage.getItem('pmd_health_profile') || 'null') as {
      history?: { date?: string; vo2max?: number; restingHr?: number; hrvMs?: number; recoveryPct?: number; sleepH?: number }[]
    } | null
    if (hpRaw && Array.isArray(hpRaw.history) && hpRaw.history.length) {
      const converted = hpRaw.history
        .filter((s) => s && typeof s.date === 'string')
        .map((s) => ({ tanggal: s.date, nilai: { vo2max: s.vo2max, restingHr: s.restingHr, hrvMs: s.hrvMs, recoveryPct: s.recoveryPct, sleepH: s.sleepH } }))
      mergeRows(converted, 'pmd_health_profile.history')
    }
    if (adoptLegacy) {
      const leg = JSON.parse(localStorage.getItem('pmd_riwayat_vitals_v1') || 'null')
      if (Array.isArray(leg)) mergeRows(leg, 'pmd_riwayat_vitals_v1')
    }
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(HISTORY_SCOPE_PREFIX) || key === targetKey) continue
      const sameEmail = isSameEmailOwnedKey(key, targetKey, encodedEmail, legacySlug)
      const isAnon = adoptLegacy && key === `${HISTORY_SCOPE_PREFIX}anonymous`
      if (!adoptAllOwner && !sameEmail && !isAnon) continue
      const parsed = JSON.parse(localStorage.getItem(key) || 'null') as { ownerAccountId?: string; history?: unknown[] } | null
      if (!parsed || !Array.isArray(parsed.history)) continue
      if (!adoptAllOwner && !isAnon && !belongsToSameEmailOwner(parsed.ownerAccountId, encodedEmail, accountId)) continue
      mergeRows(parsed.history, key)
    }
  } catch { /* ignore */ }

  if (byDay.size > initialCount || recoveredDays > 0) {
    const mergedHistory = Array.from(byDay.values()).sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
    try {
      localStorage.setItem(
        targetKey,
        JSON.stringify({ version: 1, history: mergedHistory, ownerAccountId: accountId, subjectId: patientId }),
      )
    } catch { /* ignore quota */ }
  }
  return recoveredDays
}

/**
 * Recover same-email lab logs (`pmd_lab_scope_v1:*`) into active account scope.
 */
function recoverSameEmailLabLogs(
  accountId: string,
  patientId: string,
  encodedEmail: string,
  legacySlug: string,
  token: string,
  adoptLegacy: boolean,
  adoptAllOwner: boolean,
  sourceKeys: string[],
): number {
  const targetKey = `${LAB_SCOPE_PREFIX}${token}`
  let recoveredCount = 0
  let targetLog: Record<string, { tanggal: string; nilai: number }[]> = {}
  let targetUpdatedAt: string | null = null
  try {
    const existing = JSON.parse(localStorage.getItem(targetKey) || 'null') as { log?: Record<string, { tanggal: string; nilai: number }[]>; diperbaruiPada?: string } | null
    if (existing?.log && typeof existing.log === 'object') targetLog = { ...existing.log }
    targetUpdatedAt = existing?.diperbaruiPada ?? null
  } catch { /* ignore */ }

  const mergeLogMap = (logObj: Record<string, unknown>, label: string) => {
    let touched = false
    for (const [marker, list] of Object.entries(logObj)) {
      if (!Array.isArray(list)) continue
      const dest = [...(targetLog[marker] ?? [])]
      for (const item of list) {
        if (!item || typeof item.tanggal !== 'string' || typeof item.nilai !== 'number' || !Number.isFinite(item.nilai)) continue
        if (!dest.some((d) => d.tanggal === item.tanggal && d.nilai === item.nilai)) {
          dest.push({ tanggal: item.tanggal, nilai: item.nilai })
          recoveredCount += 1
          touched = true
        }
      }
      if (dest.length) targetLog[marker] = dest.sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
    }
    if (touched) sourceKeys.push(label)
  }

  try {
    if (adoptLegacy) {
      const leg = JSON.parse(localStorage.getItem('pmd_lab_v1') || 'null') as Record<string, unknown> | null
      if (leg && typeof leg === 'object' && !Array.isArray(leg)) mergeLogMap(leg, 'pmd_lab_v1')
    }
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(LAB_SCOPE_PREFIX) || key === targetKey) continue
      const sameEmail = isSameEmailOwnedKey(key, targetKey, encodedEmail, legacySlug)
      const isAnon = adoptLegacy && key === `${LAB_SCOPE_PREFIX}anonymous`
      if (!adoptAllOwner && !sameEmail && !isAnon) continue
      const parsed = JSON.parse(localStorage.getItem(key) || 'null') as { ownerAccountId?: string; log?: Record<string, unknown> } | null
      if (!parsed || !parsed.log || typeof parsed.log !== 'object') continue
      if (!adoptAllOwner && !isAnon && !belongsToSameEmailOwner(parsed.ownerAccountId, encodedEmail, accountId)) continue
      mergeLogMap(parsed.log, key)
    }
  } catch { /* ignore */ }

  if (recoveredCount > 0) {
    try {
      localStorage.setItem(
        targetKey,
        JSON.stringify({
          ownerAccountId: accountId,
          subjectId: patientId,
          log: targetLog,
          diperbaruiPada: targetUpdatedAt ?? new Date().toISOString(),
        }),
      )
    } catch { /* ignore */ }
  }
  return recoveredCount
}

/**
 * Recover same-email (plus unowned legacy when opted in / owner) workouts and HR notification logs cleanly.
 */
function recoverSameEmailWorkoutLogs(
  accountId: string,
  encodedEmail: string,
  legacySlug: string,
  token: string,
  adoptLegacy: boolean,
  adoptAllOwner: boolean,
  sourceKeys: string[],
): number {
  let recovered = 0
  const targetWorkoutKey = `${WORKOUT_SCOPE_PREFIX}${token}`
  const targetNotifKey = `${HR_NOTIF_SCOPE_PREFIX}${token}`

  try {
    if (adoptLegacy) {
      const legW = JSON.parse(localStorage.getItem('pmd_workouts_v1') || 'null')
      if (Array.isArray(legW) && legW.length) {
        const added = mergeWorkouts(legW as never)
        if (added > 0) { recovered += added; sourceKeys.push('pmd_workouts_v1') }
      }
      const legN = JSON.parse(localStorage.getItem('pmd_hr_notifications_v1') || 'null')
      if (Array.isArray(legN) && legN.length) {
        const added = mergeHrNotifications(legN as never)
        if (added > 0) { recovered += added; sourceKeys.push('pmd_hr_notifications_v1') }
      }
    }
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.startsWith(WORKOUT_SCOPE_PREFIX) && key !== targetWorkoutKey) {
        const sameEmail = isSameEmailOwnedKey(key, targetWorkoutKey, encodedEmail, legacySlug)
        if (!adoptAllOwner && !sameEmail) continue
        const parsed = JSON.parse(localStorage.getItem(key) || 'null') as { ownerAccountId?: string; items?: unknown[] } | unknown[] | null
        const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : null)
        const owner = !Array.isArray(parsed) && parsed ? parsed.ownerAccountId : undefined
        if (items && (adoptAllOwner || belongsToSameEmailOwner(owner, encodedEmail, accountId))) {
          const added = mergeWorkouts(items as never)
          if (added > 0) { recovered += added; sourceKeys.push(key) }
        }
      }
      if (key.startsWith(HR_NOTIF_SCOPE_PREFIX) && key !== targetNotifKey) {
        const sameEmail = isSameEmailOwnedKey(key, targetNotifKey, encodedEmail, legacySlug)
        if (!adoptAllOwner && !sameEmail) continue
        const parsed = JSON.parse(localStorage.getItem(key) || 'null') as { ownerAccountId?: string; items?: unknown[] } | unknown[] | null
        const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : null)
        const owner = !Array.isArray(parsed) && parsed ? parsed.ownerAccountId : undefined
        if (items && (adoptAllOwner || belongsToSameEmailOwner(owner, encodedEmail, accountId))) {
          const added = mergeHrNotifications(items as never)
          if (added > 0) { recovered += added; sourceKeys.push(key) }
        }
      }
    }
  } catch { /* ignore */ }

  return recovered
}

/**
 * Recover and consolidate the signed-in user's historical `localStorage`
 * datas, longitudinal logs, labs, workouts, and connected devices.
 */
export function recoverSameUserVitalsIntoScope(
  account: Account | null | undefined,
  options?: {
    readonly patient?: Patient | null
    readonly patientVitals?: readonly VitalSign[]
    readonly sleepLogs?: readonly SleepLog[]
    readonly adoptUnownedLegacy?: boolean
    readonly adoptAllOwnerDeviceBuckets?: boolean
  },
): RecoverySummary {
  if (!account?.id?.trim() || !account?.patientId?.trim() || typeof localStorage === 'undefined') {
    return {
      mergedFieldsCount: 0,
      historyDaysRecovered: 0,
      labsRecovered: 0,
      workoutsRecovered: 0,
      devicesDiscovered: 0,
      sourceKeys: [],
    }
  }

  const accountId = account.id.trim()
  const patientId = account.patientId.trim()
  const email = account.email?.trim().toLowerCase() ?? ''
  const encodedEmail = email ? encodeURIComponent(email) : ''
  const legacySlug = email ? legacySlugFromEmail(email) : ''
  const adoptLegacy = Boolean(options?.adoptUnownedLegacy || account.isOwner)
  const adoptAllOwner = Boolean(options?.adoptAllOwnerDeviceBuckets && account.isOwner)
  const token = accountToken(accountId, patientId)
  const targetKey = `${VITALS_SCOPE_PREFIX}${token}`
  const sourceKeys: string[] = []
  const collected: Vitals = {}

  const acceptFrom = (src: Record<string, unknown>, label: string) => {
    let added = false
    for (const [k, v] of Object.entries(src)) {
      if (k === 'subjectId' || k === 'ownerAccountId' || k === 'syncedAt' || k === 'measuredAt') continue
      if (typeof v === 'number' && Number.isFinite(v) && v > 0 && collected[k] === undefined) {
        collected[k] = v
        added = true
      } else if (typeof v === 'string' && v.trim() && collected[k] === undefined) {
        collected[k] = v.trim()
        added = true
      }
    }
    if (added) sourceKeys.push(label)
  }

  // 1. Adopt same-email / legacy-slug scoped vitals (plus unowned legacy `pmd_vitals_v1` / all owner device buckets when explicit).
  try {
    if (adoptLegacy) {
      const legV = JSON.parse(localStorage.getItem('pmd_vitals_v1') || 'null') as Record<string, unknown> | null
      if (legV && typeof legV === 'object' && !Array.isArray(legV)) {
        if (adoptAllOwner || belongsToSameEmailOwner(legV.ownerAccountId, encodedEmail, accountId)) {
          acceptFrom(legV, 'pmd_vitals_v1')
        }
      }
    }
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(VITALS_SCOPE_PREFIX) || key === targetKey) continue
      const sameEmail = isSameEmailOwnedKey(key, targetKey, encodedEmail, legacySlug)
      if (!adoptAllOwner && !sameEmail) continue
      const parsed = JSON.parse(localStorage.getItem(key) || 'null') as Record<string, unknown> | null
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue
      if (!adoptAllOwner && !belongsToSameEmailOwner(parsed.ownerAccountId, encodedEmail, accountId)) continue
      acceptFrom(parsed, key)
    }
  } catch { /* ignore */ }

  // 2. Adopt recorded Health Profile, Body Composition & clinical snapshot fields.
  const unified = readUnifiedLocalVitals(account, options)
  const existingScoped = getVitals(account)
  let deltaCount = 0
  const toWrite: Vitals = { ...collected }
  for (const [k, v] of Object.entries(unified)) {
    if (k === 'subjectId' || k === 'ownerAccountId') continue
    if (toWrite[k] === undefined) toWrite[k] = v
  }
  for (const [k, v] of Object.entries(toWrite)) {
    if (k === 'subjectId' || k === 'ownerAccountId' || k === 'source' || k === 'syncedAt' || k === 'measuredAt') continue
    if (v !== undefined && existingScoped[k] === undefined) deltaCount += 1
  }

  if (Object.keys(toWrite).length > 0) {
    mergeVitals(toWrite)
    mergeHealthCache(toWrite)
    mergeDemoStored({
      weightKg: posNum(toWrite.weightKg),
      heightCm: posNum(toWrite.heightCm),
      vo2max: posNum(toWrite.vo2max),
      restingHr: posNum(toWrite.restingHr),
      hrvMs: posNum(toWrite.hrvMs),
      sleepH: posNum(toWrite.sleepH),
    }, 'local-recovery')
  }

  // 3. Recover daily vitals history logs, lab logs & workouts.
  const historyDaysRecovered = encodedEmail || adoptLegacy || adoptAllOwner
    ? recoverSameEmailHistoryLogs(accountId, patientId, encodedEmail, legacySlug, token, adoptLegacy, adoptAllOwner, sourceKeys)
    : 0
  const labsRecovered = encodedEmail || adoptLegacy || adoptAllOwner
    ? recoverSameEmailLabLogs(accountId, patientId, encodedEmail, legacySlug, token, adoptLegacy, adoptAllOwner, sourceKeys)
    : 0
  const workoutsRecovered = encodedEmail || adoptLegacy || adoptAllOwner
    ? recoverSameEmailWorkoutLogs(accountId, encodedEmail, legacySlug, token, adoptLegacy, adoptAllOwner, sourceKeys)
    : 0

  // 4. Register recovered connected/synced devices + `pmd_auto_sync_status_v2` into deviceRegistry.
  const srcName = typeof toWrite.source === 'string' ? toWrite.source.trim() : ''
  if (srcName && !/^(manual|health data)$/i.test(srcName)) {
    recordConnectedDevice({
      id: `sync:${srcName.toLowerCase()}`,
      name: srcName,
      transport: 'health_sync',
      ownerEmail: email || undefined,
      lastMetrics: Object.keys(toWrite).filter((k) => typeof toWrite[k] === 'number').slice(0, 6),
    })
  }
  try {
    const syncSt = JSON.parse(localStorage.getItem('pmd_auto_sync_status_v2') || 'null') as {
      lastSuccess?: string; profileFields?: number; workoutsPulled?: number
    } | null
    if (syncSt && (syncSt.lastSuccess || (syncSt.profileFields ?? 0) > 0 || (syncSt.workoutsPulled ?? 0) > 0)) {
      recordConnectedDevice({
        id: 'sync:auto-health-bridge',
        name: 'Auto Health / Wearable Bridge',
        transport: 'webhook',
        lastConnectedAt: syncSt.lastSuccess,
        ownerEmail: email || undefined,
      })
    }
  } catch { /* ignore */ }
  for (const w of getWorkouts()) {
    const devName = typeof (w as { sourceName?: unknown }).sourceName === 'string'
      ? String((w as { sourceName?: string }).sourceName).trim()
      : ''
    if (devName) {
      recordConnectedDevice({
        id: `workout:${devName.toLowerCase()}`,
        name: devName,
        transport: 'file_import',
        ownerEmail: email || undefined,
      })
    }
  }

  if (posNum(toWrite.weightKg) || posNum(toWrite.restingHr)) sourceKeys.push('unified-profile')
  const devicesDiscovered = listSavedDevices(email || undefined).length

  return {
    mergedFieldsCount: deltaCount,
    historyDaysRecovered,
    labsRecovered,
    workoutsRecovered,
    devicesDiscovered,
    sourceKeys: [...new Set(sourceKeys)],
  }
}

/**
 * Explicit owner-triggered full local bucket adoption across legacy unowned
 * keys and earlier same-device session buckets (gated strictly to `account.isOwner`).
 */
export function adoptAllDeviceLocalBuckets(
  account: Account | null | undefined,
  options?: { readonly patient?: Patient | null; readonly patientVitals?: readonly VitalSign[]; readonly sleepLogs?: readonly SleepLog[] },
): RecoverySummary {
  return recoverSameUserVitalsIntoScope(account, {
    ...options,
    adoptUnownedLegacy: true,
    adoptAllOwnerDeviceBuckets: Boolean(account?.isOwner),
  })
}

export interface FullLocalVaultBackup {
  readonly schema: 'panacea_vault_backup_v1'
  readonly exportedAt: string
  readonly email: string
  readonly vitals: Vitals
  readonly workouts: ReturnType<typeof getWorkouts>
  readonly hrNotifications: ReturnType<typeof getHrNotifications>
  readonly devices: ReturnType<typeof listSavedDevices>
  readonly healthProfile: Record<string, unknown>
}

export function exportFullLocalVault(account: Account | null | undefined): FullLocalVaultBackup | null {
  if (!account?.email) return null
  const email = account.email.trim().toLowerCase()
  return {
    schema: 'panacea_vault_backup_v1',
    exportedAt: new Date().toISOString(),
    email,
    vitals: getVitals(account),
    workouts: getWorkouts(),
    hrNotifications: getHrNotifications(),
    devices: listSavedDevices(email),
    healthProfile: getHealthCache(),
  }
}

export function restoreFullLocalVault(
  rawJson: string,
  account: Account | null | undefined,
): { readonly ok: boolean; readonly message: string } {
  if (!account?.id?.trim() || !account?.patientId?.trim()) {
    return { ok: false, message: 'Sign in before restoring a backup vault.' }
  }
  try {
    const parsed = JSON.parse(rawJson) as Partial<FullLocalVaultBackup>
    if (!parsed || parsed.schema !== 'panacea_vault_backup_v1') {
      return { ok: false, message: 'Unrecognized backup file format (expected panacea_vault_backup_v1).' }
    }
    const email = account.email.trim().toLowerCase()
    if (parsed.email && parsed.email.toLowerCase() !== email) {
      return { ok: false, message: `Backup belongs to ${parsed.email}, not the currently signed-in account (${email}).` }
    }
    if (parsed.vitals && typeof parsed.vitals === 'object') mergeVitals(parsed.vitals)
    if (parsed.healthProfile && typeof parsed.healthProfile === 'object') mergeHealthCache(parsed.healthProfile)
    if (Array.isArray(parsed.workouts) && parsed.workouts.length) mergeWorkouts(parsed.workouts)
    if (Array.isArray(parsed.hrNotifications) && parsed.hrNotifications.length) mergeHrNotifications(parsed.hrNotifications)
    if (Array.isArray(parsed.devices)) {
      for (const dev of parsed.devices) {
        if (dev && typeof dev.name === 'string') recordConnectedDevice({ ...dev, ownerEmail: email })
      }
    }
    return { ok: true, message: 'Vault restored: datas, workout/HR logs, and connected devices merged safely.' }
  } catch {
    return { ok: false, message: 'Could not parse backup JSON.' }
  }
}
