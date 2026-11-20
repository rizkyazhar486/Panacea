/**
 * Lightweight boot-path identity & unified local vitals helpers.
 *
 * Kept dependency-minimal (zero WebAuthn/TOTP/BLE/device-registry imports) so
 * initial app boot and reactive longitudinal state read all recorded metrics
 * without inflating the entry bundle.
 */

import { getVitals, type Vitals } from '../../lib/healthVitals.ts'
import { getDemoTersimpan, getHealthCache } from '../../lib/profile.ts'
import type { Account, Patient, ProfileEdit, Role, SleepLog, VitalSign } from '../../lib/types.ts'

export const PASSKEY_STORAGE_KEY = 'panacea.passkeys.v1'
export const TOTP_STORAGE_KEY = 'panacea.totp.v1'
export const REMEMBERED_ACCOUNTS_KEY = 'panacea.remembered_accounts.v1'

const BODYCOMP_KEY = 'pm_bodycomp_v1'

export interface RememberedProfile {
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly patientId?: string
  readonly lastLoginAt: string
}

function posNum(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

export function readJsonArray<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function writeJsonArray(key: string, items: unknown[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    /* ignore storage quota failures */
  }
}

export function rememberAccountProfile(account: Pick<Account, 'email' | 'name' | 'role' | 'patientId'>): void {
  const email = account.email?.trim().toLowerCase()
  if (!email) return
  const nextEntry: RememberedProfile = {
    email,
    name: account.name?.trim() || email.split('@')[0],
    role: account.role,
    patientId: account.patientId,
    lastLoginAt: new Date().toISOString(),
  }
  const existing = readJsonArray<RememberedProfile>(REMEMBERED_ACCOUNTS_KEY).filter(
    (entry) => entry?.email?.toLowerCase() !== email,
  )
  writeJsonArray(REMEMBERED_ACCOUNTS_KEY, [nextEntry, ...existing].slice(0, 10))
}

/**
 * Discover existing profiles saved in this browser (`panacea.remembered_accounts.v1`,
 * bound Passkeys, TOTP enrollments, and clinical profiles) for fast 1-tap return.
 */
export function listRememberedAccounts(options?: {
  readonly profiles?: Readonly<Record<string, ProfileEdit>>
  readonly patients?: readonly Patient[]
  readonly ownerEmail?: string
}): RememberedProfile[] {
  const seen = new Map<string, RememberedProfile>()
  const put = (p: RememberedProfile) => {
    const email = p.email?.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    if (!seen.has(email)) seen.set(email, { ...p, email })
  }

  for (const r of readJsonArray<RememberedProfile>(REMEMBERED_ACCOUNTS_KEY)) put(r)
  for (const pk of readJsonArray<{ email: string; name: string; role: Role; createdAt: string; lastUsedAt?: string }>(PASSKEY_STORAGE_KEY)) {
    put({ email: pk.email, name: pk.name, role: pk.role, lastLoginAt: pk.lastUsedAt ?? pk.createdAt })
  }
  for (const totp of readJsonArray<{ email: string; name: string; role: Role; enabledAt: string }>(TOTP_STORAGE_KEY)) {
    if (totp?.email) put({ email: totp.email, name: totp.name, role: totp.role, lastLoginAt: totp.enabledAt })
  }
  if (options?.profiles) {
    for (const email of Object.keys(options.profiles)) {
      put({ email, name: email.split('@')[0], role: email.toLowerCase() === options.ownerEmail?.toLowerCase() ? 'owner' : 'pasien', lastLoginAt: new Date(0).toISOString() })
    }
  }
  // No identity is invented here: only accounts actually stored on this device are offered for 1-tap return.
  return [...seen.values()].sort((a, b) => (a.lastLoginAt < b.lastLoginAt ? 1 : -1))
}

/** Read positive filled metrics from `pm_bodycomp_v1` without pulling defaults. */
export function readBodyCompFilled(): Partial<Vitals> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(BODYCOMP_KEY) || 'null') as Record<string, unknown> | null
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: Partial<Vitals> = {}
    const w = posNum(raw.w)
    const h = posNum(raw.h)
    const rhr = posNum(raw.rhr)
    const hrv = posNum(raw.hrv)
    const vo2 = posNum(raw.vo2)
    const sleepH = posNum(raw.sleepH)
    const smm = posNum(raw.smm)
    const bfm = posNum(raw.bfm)
    if (w !== undefined) out.weightKg = w
    if (h !== undefined) out.heightCm = h
    if (rhr !== undefined) out.restingHr = rhr
    if (hrv !== undefined) out.hrvMs = hrv
    if (vo2 !== undefined) out.vo2max = vo2
    if (sleepH !== undefined) out.sleepH = sleepH
    const remH = posNum(raw.remH)
    const deepH = posNum(raw.deepH)
    if (remH !== undefined) out.sleepRemH = remH
    if (deepH !== undefined) out.sleepDeepH = deepH
    if (smm !== undefined) out.skeletalMuscleKg = smm
    if (bfm !== undefined && w !== undefined) {
      out.bodyFatPct = Number(((bfm / w) * 100).toFixed(1))
    }
    return out
  } catch {
    return {}
  }
}

/** Extract positive finite biometric metrics saved in `pmd_health_profile`. */
export function readPositiveHealthProfileCache(): Partial<Vitals> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const hc = getHealthCache()
    const out: Partial<Vitals> = {}
    const numericKeys: (keyof Vitals)[] = [
      'weightKg', 'heightCm', 'bodyFatPct', 'vo2max', 'restingHr',
      'hrvMs', 'recoveryPct', 'strain', 'sleepH', 'steps', 'activeKcal',
    ]
    for (const k of numericKeys) {
      const val = posNum(hc[k])
      if (val !== undefined) out[k] = val
    }
    const smm = posNum(hc.muscleMassKg) ?? posNum(hc.skeletalMuscleKg)
    if (smm !== undefined) out.skeletalMuscleKg = smm
    const remH = posNum(hc.remH) ?? posNum(hc.sleepRemH)
    const deepH = posNum(hc.deepH) ?? posNum(hc.sleepDeepH)
    if (remH !== undefined) out.sleepRemH = remH
    if (deepH !== undefined) out.sleepDeepH = deepH
    if (typeof hc.bloodPressure === 'string' && /^\d{2,3}\/\d{2,3}$/.test(hc.bloodPressure.trim())) {
      const [sys, dia] = hc.bloodPressure.trim().split('/').map(Number)
      if (sys > 40 && dia > 20) {
        out.systolic = sys
        out.diastolic = dia
      }
    }
    if (typeof hc.deviceSyncSource === 'string' && hc.deviceSyncSource.trim()) {
      out.source = hc.deviceSyncSource.trim()
    } else if (typeof hc.source === 'string' && hc.source.trim()) {
      out.source = hc.source.trim()
    }
    return out
  } catch {
    return {}
  }
}

/**
 * Aggregate all actually recorded personal & device-synced telemetry across local caches
 * without inventing synthetic defaults for unmeasured channels.
 */
export function readUnifiedLocalVitals(
  account: Account | null | undefined,
  options?: {
    readonly patient?: Patient | null
    readonly patientVitals?: readonly VitalSign[]
    readonly sleepLogs?: readonly SleepLog[]
  },
): Vitals {
  const scoped = getVitals(account ?? null)
  const hc = readPositiveHealthProfileCache()
  const bc = readBodyCompFilled()
  const demo = getDemoTersimpan()

  const latestPatientVital = options?.patientVitals?.length
    ? [...options.patientVitals].sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))[0]
    : undefined
  const latestSleep = options?.sleepLogs?.length
    ? [...options.sleepLogs].filter((s) => posNum(s.hours) !== undefined).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    : undefined

  const merged: Vitals = {}
  const apply = (src: Partial<Vitals>) => {
    for (const [k, v] of Object.entries(src)) {
      if (v === undefined || merged[k] !== undefined) continue
      if (typeof v === 'number' && (!Number.isFinite(v) || v <= 0) && k !== 'steps') continue
      if (typeof v === 'number' && v < 0) continue
      merged[k] = v
    }
  }

  apply(scoped)
  apply(hc)
  apply(bc)
  apply({
    weightKg: posNum(demo.weightKg),
    heightCm: posNum(demo.heightCm),
    vo2max: posNum(demo.vo2max),
    restingHr: posNum(demo.restingHr),
    hrvMs: posNum(demo.hrvMs),
    sleepH: posNum(demo.sleepH),
  })
  if (latestSleep && posNum(latestSleep.hours) !== undefined) {
    apply({ sleepH: latestSleep.hours })
  }
  if (latestPatientVital) {
    apply({
      heartRate: posNum(latestPatientVital.heartRate),
      restingHr: posNum(latestPatientVital.heartRate),
      systolic: posNum(latestPatientVital.systolic),
      diastolic: posNum(latestPatientVital.diastolic),
      spo2Pct: posNum(latestPatientVital.spo2),
      respRate: posNum(latestPatientVital.respRate),
      bodyTempC: posNum(latestPatientVital.tempC),
    })
  }
  if (options?.patient) {
    apply({
      heightCm: posNum(options.patient.heightCm),
      weightKg: posNum(options.patient.weightKg),
    })
  }
  return merged
}

const EXPLICIT_LOGOUT_KEY = 'panacea.explicit_logout.v1'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Roles a browser-stored (self-asserted) record may carry. Owner/admin power is never read from storage. */
const STORED_ROLES: readonly Role[] = ['pasien', 'dokter', 'perawat']

/** A role read from browser storage is self-asserted: owner only for the owner's own email, otherwise a plain role or `pasien`. */
export function clampStoredRole(role: unknown, email: string, ownerEmail: string): Role {
  if (email.trim().toLowerCase() === ownerEmail.trim().toLowerCase()) return 'owner'
  return STORED_ROLES.includes(role as Role) ? (role as Role) : 'pasien'
}

/**
 * Adopt the identity a previous visit left in this browser (`pmd_profile`) when the 7-day session lapsed.
 * Fail closed: without a stored, well-formed email nobody is adopted (the login screen shows instead), and an
 * explicit logout is respected. The owner identity is never used as a default.
 */
export function resolveLegacySessionAccount(ownerEmail: string, nowIso: string = new Date().toISOString()): Account | null {
  if (typeof localStorage === 'undefined') return null
  try {
    if (localStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1') return null
    const used =
      Boolean(localStorage.getItem('pmd_health_profile')) ||
      Boolean(localStorage.getItem(BODYCOMP_KEY)) ||
      localStorage.getItem('panacea_onboarded_v1') === '1'
    if (!used) return null
    let stored: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(localStorage.getItem('pmd_profile') || '{}')
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) stored = parsed as Record<string, unknown>
    } catch { /* unreadable profile = no identity */ }
    const email = typeof stored.email === 'string' ? stored.email.trim().toLowerCase() : ''
    if (!EMAIL_RE.test(email)) return null
    const isOwner = email === ownerEmail.trim().toLowerCase()
    const name = typeof stored.name === 'string' && stored.name.trim() ? stored.name.trim().slice(0, 80) : email.split('@')[0]
    return {
      id: `local:${encodeURIComponent(email)}`,
      email,
      name,
      role: clampStoredRole(stored.role, email, ownerEmail),
      isOwner,
      isSubscriber: isOwner,
      loggedAt: nowIso,
      patientId: `self-u-local%3A${encodeURIComponent(email)}`,
      consentAt: nowIso,
    }
  } catch {
    return null
  }
}

export function resolveAutoResumeAccount(options: {
  readonly ownerEmail: string
  readonly profiles?: Readonly<Record<string, ProfileEdit>>
  readonly patients?: readonly Patient[]
}): Account | null {
  if (typeof localStorage === 'undefined') return null
  try {
    if (localStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1') return null
    const onboarded = Boolean(localStorage.getItem('panacea_onboarded_v1'))
    const hasHp = Boolean(localStorage.getItem('pmd_health_profile') && localStorage.getItem('pmd_health_profile') !== '{}')
    const hasBc = Boolean(localStorage.getItem('pm_bodycomp_v1'))
    const hasSync = Boolean(localStorage.getItem('pmd_auto_sync_status_v2'))
    if (!onboarded && !hasHp) return null
    if (!hasHp && !hasBc && !hasSync) return null

    const remembered = listRememberedAccounts({
      profiles: options.profiles,
      patients: options.patients,
      ownerEmail: options.ownerEmail,
    })
    const primary = remembered[0]
    // Fail closed: with no stored account there is nobody to resume. Never fall back to the owner identity.
    if (!primary) return null
    const email = primary.email.trim().toLowerCase()
    const id = `local:${encodeURIComponent(email)}`
    const isOwner = email === options.ownerEmail.trim().toLowerCase()
    const role = clampStoredRole(primary.role, email, options.ownerEmail)
    return {
      id,
      email,
      name: primary.name || email.split('@')[0],
      role,
      patientId: primary.patientId || `self-u-${id}`,
      isOwner,
      isSubscriber: isOwner,
      loggedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}
