import {
  extractProfileKeyFromAccount,
  type BetaFeedbackCategory,
  type BetaFunnelStep,
  type FirstRunStepId,
  validateBetaFeedbackInput,
} from '../../domains/beta/index.ts'
import type { Account } from '../../lib/types'

const TOKEN_PREFIX = 'pmd_beta_token_v1:'
const MISSION_PREFIX = 'pmd_beta_mission_v1:'
const FEEDBACK_OUTBOX_PREFIX = 'pmd_beta_feedback_outbox_v1:'
const FUNNEL_SENT_PREFIX = 'pmd_beta_funnel_sent_v1:'

export interface StoredMissionProgress {
  readonly completed: readonly FirstRunStepId[]
  readonly dismissed: boolean
}

export function generateBetaNonceHex(byteLen = 4): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint8Array(byteLen)
      crypto.getRandomValues(buf)
      return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {
    /* ignore */
  }
  return Date.now().toString(16).slice(-6).padStart(6, '0')
}

export function readBetaSessionToken(profileKey: string): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(`${TOKEN_PREFIX}${profileKey}`)
  } catch {
    return null
  }
}

export function writeBetaSessionToken(profileKey: string, token: string): void {
  if (typeof localStorage === 'undefined' || !token.trim()) return
  try {
    localStorage.setItem(`${TOKEN_PREFIX}${profileKey}`, token.trim())
  } catch {
    /* ignore */
  }
}

export function readMissionProgress(profileKey: string): StoredMissionProgress {
  if (typeof localStorage === 'undefined') return { completed: [], dismissed: false }
  try {
    const raw = JSON.parse(localStorage.getItem(`${MISSION_PREFIX}${profileKey}`) || 'null') as {
      completed?: unknown
      dismissed?: unknown
    } | null
    const completed = Array.isArray(raw?.completed)
      ? raw.completed.filter(
          (x): x is FirstRunStepId =>
            x === 'profile' || x === 'body_or_scan' || x === 'sync_or_export',
        )
      : []
    return {
      completed,
      dismissed: raw?.dismissed === true,
    }
  } catch {
    return { completed: [], dismissed: false }
  }
}

export function writeMissionProgress(profileKey: string, next: StoredMissionProgress): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(`${MISSION_PREFIX}${profileKey}`, JSON.stringify(next))
    window.dispatchEvent(new Event('panacea:beta-mission-updated'))
  } catch {
    /* ignore */
  }
}

export function markMissionStep(profileKey: string, stepId: FirstRunStepId): StoredMissionProgress {
  const cur = readMissionProgress(profileKey)
  if (cur.completed.includes(stepId)) return cur
  const next: StoredMissionProgress = {
    completed: [...cur.completed, stepId],
    dismissed: cur.dismissed,
  }
  writeMissionProgress(profileKey, next)
  return next
}

export function setMissionDismissed(profileKey: string, dismissed: boolean): StoredMissionProgress {
  const cur = readMissionProgress(profileKey)
  const next: StoredMissionProgress = { completed: cur.completed, dismissed }
  writeMissionProgress(profileKey, next)
  return next
}

export async function registerBetaSessionEdge(params: {
  readonly profileKey: string
  readonly name: string
  readonly role: string
  readonly inviteCode?: string
  readonly mode?: 'beta_pass' | 'founder_demo'
}): Promise<{ readonly token: string | null; readonly persistenceMode: string }> {
  try {
    if (typeof fetch !== 'function') {
      return { token: null, persistenceMode: 'local_first_sovereign' }
    }
    const controller = new AbortController()
    const timer = typeof window !== 'undefined' ? window.setTimeout(() => controller.abort(), 5000) : null
    const res = await fetch('/api/v1/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Profile-Key': params.profileKey,
      },
      signal: controller.signal,
      body: JSON.stringify(params),
    })
    if (timer !== null) window.clearTimeout(timer)
    if (!res.ok) return { token: null, persistenceMode: 'local_first_sovereign' }
    const data = (await res.json()) as { token?: string | null; persistenceMode?: string }
    const token = typeof data?.token === 'string' && data.token ? data.token : null
    if (token) writeBetaSessionToken(params.profileKey, token)
    return {
      token,
      persistenceMode: typeof data?.persistenceMode === 'string' ? data.persistenceMode : 'local_first_sovereign',
    }
  } catch {
    return { token: null, persistenceMode: 'local_first_sovereign' }
  }
}

async function ensureSessionToken(profileKey: string, account?: Account | null): Promise<string | null> {
  const existing = readBetaSessionToken(profileKey)
  if (existing) return existing
  if (!account) return null
  const isFounder = profileKey === 'rizkyazhar486' || account.isOwner
  const reg = await registerBetaSessionEdge({
    profileKey,
    name: account.name || profileKey,
    role: account.role === 'dokter' ? 'doctor' : 'patient',
    mode: isFounder ? 'founder_demo' : 'beta_pass',
  })
  return reg.token
}

export async function trackBetaFunnelStep(
  account: Account | null | undefined,
  stepName: BetaFunnelStep,
): Promise<void> {
  const profileKey = extractProfileKeyFromAccount(account)
  if (stepName === 'opened_body_exposure' || stepName === 'completed_scan') {
    markMissionStep(profileKey, 'body_or_scan')
  } else if (stepName === 'completed_sync' || stepName === 'completed_export') {
    markMissionStep(profileKey, 'sync_or_export')
  } else if (stepName === 'onboarded') {
    markMissionStep(profileKey, 'profile')
  }

  const dedupeKey = `${FUNNEL_SENT_PREFIX}${profileKey}:${stepName}`
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(dedupeKey) === '1') {
      return
    }
  } catch {
    /* ignore */
  }

  const eventId = `FUN-${profileKey.slice(0, 20)}-${stepName}-${generateBetaNonceHex(2)}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Profile-Key': profileKey,
  }
  const token = await ensureSessionToken(profileKey, account)
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    if (typeof fetch !== 'function') return
    const res = await fetch('/api/v1/feedback', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        kind: 'funnel',
        eventId,
        profileKey,
        stepName,
      }),
    })
    if (res.ok && typeof localStorage !== 'undefined') {
      localStorage.setItem(dedupeKey, '1')
    }
  } catch {
    /* keep offline resilient */
  }
}

export async function submitBetaFeedbackClient(params: {
  readonly account?: Account | null
  readonly routeHash: string
  readonly rating1To5: number
  readonly category: BetaFeedbackCategory
  readonly note: string
}): Promise<{ readonly ok: true; readonly statusMessage: string } | { readonly ok: false; readonly error: string }> {
  const profileKey = extractProfileKeyFromAccount(params.account)
  const feedbackId = `FB-${profileKey.slice(0, 14)}-${generateBetaNonceHex(4)}`
  const viewport =
    typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 72) : 'browser'

  const validated = validateBetaFeedbackInput({
    feedbackId,
    profileKey,
    routeHash: params.routeHash,
    rating1To5: params.rating1To5,
    category: params.category,
    note: params.note,
    viewport,
    userAgentShort: ua,
    nowIso: new Date().toISOString(),
  })
  if (!validated.ok) return { ok: false, error: validated.error }

  const outboxKey = `${FEEDBACK_OUTBOX_PREFIX}${profileKey}`
  const saveOffline = () => {
    try {
      if (typeof localStorage === 'undefined') return
      const cur = JSON.parse(localStorage.getItem(outboxKey) || '[]')
      const list = Array.isArray(cur) ? cur : []
      localStorage.setItem(outboxKey, JSON.stringify([validated.record, ...list].slice(0, 20)))
    } catch {
      /* ignore */
    }
  }

  try {
    const token = await ensureSessionToken(profileKey, params.account)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Profile-Key': profileKey,
    }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch('/api/v1/feedback', {
      method: 'POST',
      headers,
      body: JSON.stringify({ kind: 'feedback', ...validated.record }),
    })
    if (res.ok) {
      const data = (await res.json()) as { mode?: string }
      if (data?.mode === 'neon_rls') {
        return { ok: true, statusMessage: 'Feedback saved to Neon cohort monitor.' }
      }
      saveOffline()
      return { ok: true, statusMessage: 'Feedback saved (Edge local-first).' }
    }
  } catch {
    /* fallback below */
  }

  saveOffline()
  return { ok: true, statusMessage: 'Feedback queued locally for sync.' }
}
