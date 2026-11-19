/**
 * Pure deterministic Multi-User Beta Onboarding, Isolation & Funnel Domain Engine.
 *
 * Domain Purity Invariant:
 * - Zero `window`, `document`, `localStorage`, `sessionStorage`, `Date.now()`, `new Date()`,
 *   `Math.random()`, or network calls inside `src/domains/`.
 * - Canonical Founder Identity (`dr. Rizky Muhammad Azrissal` / `rizkyazhar486`) remains
 *   explicitly separated from isolated beta tester accounts (`beta_*`).
 */
import type { Account, Role } from '../../lib/types.ts'

export const FOUNDER_PROFILE_KEY = 'rizkyazhar486'
export const FOUNDER_EMAIL = 'rizkyazhar486@gmail.com'
export const FOUNDER_NAME = 'dr. Rizky Muhammad Azrissal'
export const FOUNDER_MRN = 'PMD-000486'

export const BETA_ROLES = ['patient', 'doctor', 'athlete'] as const
export type BetaRole = (typeof BETA_ROLES)[number]

export const BETA_FUNNEL_STEPS = [
  'landed',
  'onboarded',
  'opened_body_exposure',
  'completed_scan',
  'completed_sync',
  'completed_export',
] as const
export type BetaFunnelStep = (typeof BETA_FUNNEL_STEPS)[number]

export const BETA_FEEDBACK_CATEGORIES = ['bug', 'confusing', 'slow', 'love', 'request'] as const
export type BetaFeedbackCategory = (typeof BETA_FEEDBACK_CATEGORIES)[number]

const PROFILE_KEY_RE = /^beta_[a-z0-9_]{4,40}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PIN6_RE = /^\d{6}$/

function sanitizeSlug(raw: string, maxLen = 20): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
  if (!cleaned) return 'u'
  return cleaned.slice(0, maxLen).replace(/_+$/g, '') || 'u'
}

function normalizeNonceHex(nonceHex: string): string {
  const cleaned = nonceHex.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (cleaned.length >= 6) return cleaned.slice(0, 6)
  return cleaned.padEnd(6, '0')
}

export function deriveBetaProfileKey(input: {
  readonly name: string
  readonly email?: string | null
  readonly role?: BetaRole
  readonly nonceHex: string
}): string {
  const cleanEmail = input.email?.trim().toLowerCase() ?? ''
  if (cleanEmail === FOUNDER_EMAIL) {
    return FOUNDER_PROFILE_KEY
  }
  const baseSource = cleanEmail && cleanEmail.includes('@') ? cleanEmail.split('@')[0] : input.name
  const slug = sanitizeSlug(baseSource, 22)
  const nonce = normalizeNonceHex(input.nonceHex)
  const raw = `beta_${slug}_${nonce}`
  if (raw.length <= 45) return raw
  return `beta_${slug.slice(0, 20)}_${nonce}`
}

export function isBetaProfileKey(key: string): boolean {
  return typeof key === 'string' && PROFILE_KEY_RE.test(key)
}

export function isBetaAccountEmail(email?: string | null): boolean {
  if (typeof email !== 'string') return false
  const clean = email.trim().toLowerCase()
  return clean.startsWith('beta_') || clean.endsWith('@beta.panaceamed.id')
}

export function isBetaAccount(account?: { readonly id?: string; readonly email?: string | null } | null): boolean {
  if (!account) return false
  if (typeof account.id === 'string' && account.id.startsWith('beta:')) return true
  if (typeof account.id === 'string' && account.id.includes('beta_')) return true
  return isBetaAccountEmail(account.email)
}

export function extractProfileKeyFromAccount(
  account?: {
    readonly id?: string
    readonly email?: string | null
    readonly isOwner?: boolean
  } | null,
): string {
  if (!account) return FOUNDER_PROFILE_KEY
  if (typeof account.id === 'string' && account.id.startsWith('beta:')) {
    const key = account.id.slice(5).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
    if (key) return key
  }
  const email = account.email?.trim().toLowerCase() ?? ''
  if (account.isOwner || email === FOUNDER_EMAIL) return FOUNDER_PROFILE_KEY
  if (email.includes('@')) {
    const localPart = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
    if (localPart) return localPart
  }
  return FOUNDER_PROFILE_KEY
}

export function formatMrnForAccount(
  account?: {
    readonly id?: string
    readonly email?: string | null
    readonly isOwner?: boolean
  } | null,
  patientMrn?: string | null,
): string {
  const cleanMrn = patientMrn?.trim()
  if (cleanMrn) return cleanMrn
  const profileKey = extractProfileKeyFromAccount(account)
  if (account?.isOwner || profileKey.toLowerCase() === FOUNDER_PROFILE_KEY) {
    return FOUNDER_MRN
  }
  return `PMD-B-${profileKey.slice(-6).toUpperCase().padStart(6, '0')}`
}

export function formatDisplayNameForAccount(
  account?: {
    readonly id?: string
    readonly name?: string | null
    readonly email?: string | null
    readonly isOwner?: boolean
  } | null,
): string {
  const profileKey = extractProfileKeyFromAccount(account)
  if (account?.isOwner || profileKey.toLowerCase() === FOUNDER_PROFILE_KEY) {
    return FOUNDER_NAME
  }
  return account?.name?.trim() || profileKey
}

export interface BuildIsolatedBetaAccountInput {
  readonly name: string
  readonly role: BetaRole
  readonly email?: string | null
  readonly inviteCode?: string | null
  readonly pin6?: string | null
  readonly nonceHex: string
  readonly nowIso: string
}

export type BuildIsolatedBetaAccountResult =
  | {
      readonly ok: true
      readonly profileKey: string
      readonly betaRole: BetaRole
      readonly mrn: string
      readonly account: Account
      readonly inviteCode?: string
    }
  | {
      readonly ok: false
      readonly error: string
    }

export function buildIsolatedBetaAccount(
  input: BuildIsolatedBetaAccountInput,
): BuildIsolatedBetaAccountResult {
  const cleanName = input.name.trim()
  if (cleanName.length < 2) {
    return { ok: false, error: 'Name must be at least 2 characters.' }
  }
  if (!BETA_ROLES.includes(input.role)) {
    return { ok: false, error: 'Role must be patient, doctor, or athlete.' }
  }
  const cleanPin = input.pin6?.trim() ?? ''
  if (cleanPin && !PIN6_RE.test(cleanPin)) {
    return { ok: false, error: 'PIN must be exactly 6 numeric digits.' }
  }
  const cleanEmail = input.email?.trim().toLowerCase() ?? ''
  if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
    return { ok: false, error: 'Email address format is invalid.' }
  }
  if (cleanEmail === FOUNDER_EMAIL) {
    return { ok: false, error: 'Founder email is reserved; use Founder Demo Mode instead.' }
  }

  const profileKey = deriveBetaProfileKey({
    name: cleanName,
    email: cleanEmail || undefined,
    role: input.role,
    nonceHex: input.nonceHex,
  })
  const accountEmail = cleanEmail || `${profileKey}@beta.panaceamed.id`
  const appRole: Role = input.role === 'doctor' ? 'dokter' : 'pasien'
  const mrn = `PMD-B-${profileKey.slice(-6).toUpperCase().padStart(6, '0')}`
  const cleanInvite = input.inviteCode?.trim().slice(0, 32) || undefined

  const account: Account = {
    id: `beta:${profileKey}`,
    email: accountEmail,
    name: cleanName.slice(0, 64),
    role: appRole,
    isSubscriber: false,
    isOwner: false,
    patientId: `self-u-beta:${profileKey}`,
    loggedAt: input.nowIso,
    occupation: input.role === 'athlete' ? 'Athlete · Beta Cohort' : undefined,
    strStatus: appRole === 'dokter' ? 'pending' : 'none',
    consentAt: input.nowIso,
  }

  return {
    ok: true,
    profileKey,
    betaRole: input.role,
    mrn,
    account,
    inviteCode: cleanInvite,
  }
}

export function buildFounderDemoAccount(nowIso: string): Account {
  return {
    id: `local:${encodeURIComponent(FOUNDER_EMAIL)}`,
    email: FOUNDER_EMAIL,
    name: FOUNDER_NAME,
    role: 'owner',
    isOwner: true,
    isSubscriber: true,
    patientId: `self-u-local:${encodeURIComponent(FOUNDER_EMAIL)}`,
    loggedAt: nowIso,
    strStatus: 'verified',
    consentAt: nowIso,
  }
}

export interface BetaFeedbackRecord {
  readonly feedbackId: string
  readonly profileKey: string
  readonly routeHash: string
  readonly rating1To5: 1 | 2 | 3 | 4 | 5
  readonly category: BetaFeedbackCategory
  readonly note: string
  readonly viewport: string
  readonly userAgentShort: string
  readonly createdAtIso: string
}

export function validateBetaFeedbackInput(input: {
  readonly feedbackId: string
  readonly profileKey: string
  readonly routeHash: string
  readonly rating1To5: number
  readonly category: BetaFeedbackCategory
  readonly note: string
  readonly viewport?: string
  readonly userAgentShort?: string
  readonly nowIso: string
}): { readonly ok: true; readonly record: BetaFeedbackRecord } | { readonly ok: false; readonly error: string } {
  const cleanId = input.feedbackId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  if (!cleanId) return { ok: false, error: 'Missing feedbackId.' }

  const cleanProfile = input.profileKey.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
  if (!cleanProfile) return { ok: false, error: 'Missing profileKey.' }

  if (!Number.isInteger(input.rating1To5) || input.rating1To5 < 1 || input.rating1To5 > 5) {
    return { ok: false, error: 'rating_1_to_5 must be an integer between 1 and 5.' }
  }
  if (!BETA_FEEDBACK_CATEGORIES.includes(input.category)) {
    return { ok: false, error: 'Unsupported feedback category.' }
  }
  const cleanNote = input.note.trim().replace(/\s+/g, ' ').slice(0, 400)
  if (cleanNote.length < 1) {
    return { ok: false, error: 'Please write a short feedback note.' }
  }

  const cleanRoute = (input.routeHash.trim() || '/').slice(0, 80)
  const cleanViewport = (input.viewport?.trim() || 'unknown').slice(0, 32)
  const cleanUa = (input.userAgentShort?.trim() || 'browser').slice(0, 80)

  return {
    ok: true,
    record: {
      feedbackId: cleanId,
      profileKey: cleanProfile,
      routeHash: cleanRoute,
      rating1To5: input.rating1To5 as 1 | 2 | 3 | 4 | 5,
      category: input.category,
      note: cleanNote,
      viewport: cleanViewport,
      userAgentShort: cleanUa,
      createdAtIso: input.nowIso,
    },
  }
}

export interface BetaFunnelEventRecord {
  readonly eventId: string
  readonly profileKey: string
  readonly stepName: BetaFunnelStep
  readonly createdAtIso: string
}

export function validateBetaFunnelEvent(input: {
  readonly eventId: string
  readonly profileKey: string
  readonly stepName: BetaFunnelStep
  readonly nowIso: string
}): { readonly ok: true; readonly event: BetaFunnelEventRecord } | { readonly ok: false; readonly error: string } {
  const cleanId = input.eventId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  const cleanProfile = input.profileKey.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
  if (!cleanId || !cleanProfile) {
    return { ok: false, error: 'Missing eventId or profileKey.' }
  }
  if (!BETA_FUNNEL_STEPS.includes(input.stepName)) {
    return { ok: false, error: 'Unsupported beta funnel step.' }
  }
  return {
    ok: true,
    event: {
      eventId: cleanId,
      profileKey: cleanProfile,
      stepName: input.stepName,
      createdAtIso: input.nowIso,
    },
  }
}

export type FirstRunStepId = 'profile' | 'body_or_scan' | 'sync_or_export'

export interface FirstRunMissionState {
  readonly visible: boolean
  readonly dismissed: boolean
  readonly completedCount: number
  readonly totalSteps: 3
  readonly steps: readonly {
    readonly id: FirstRunStepId
    readonly label: string
    readonly route: string
    readonly done: boolean
  }[]
}

export function computeFirstRunMissionState(
  completedStepIds: readonly string[],
  dismissed: boolean,
): FirstRunMissionState {
  const doneSet = new Set(completedStepIds)
  const steps: readonly {
    readonly id: FirstRunStepId
    readonly label: string
    readonly route: string
    readonly done: boolean
  }[] = [
    { id: 'profile', label: '1. Set Profile', route: '/profile', done: doneSet.has('profile') },
    { id: 'body_or_scan', label: '2. BodyExposure / Scan', route: '/scan', done: doneSet.has('body_or_scan') },
    { id: 'sync_or_export', label: '3. Sync / Export', route: '/sync', done: doneSet.has('sync_or_export') },
  ]
  const completedCount = steps.filter((s) => s.done).length
  return {
    visible: !dismissed && completedCount < 3,
    dismissed,
    completedCount,
    totalSteps: 3,
    steps,
  }
}
