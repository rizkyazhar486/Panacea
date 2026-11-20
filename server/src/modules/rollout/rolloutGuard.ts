import type { Request, Response, NextFunction } from 'express'

export type RolloutStage = 'stage-50' | 'stage-200' | 'stage-1000' | 'open'

export interface RolloutConfig {
  stage: RolloutStage
  maxAccounts: number // 0 = unlimited
  signupKillSwitch: boolean
  readOnlyMode: boolean
  updatedAt: string | null
}

const STAGE_CAPS: Record<RolloutStage, number> = {
  'stage-50': 50,
  'stage-200': 200,
  'stage-1000': 1000,
  open: 0,
}

function parseStage(raw: string | undefined): RolloutStage {
  const norm = String(raw || '').trim().toLowerCase()
  if (norm === 'stage-50' || norm === 'stage-200' || norm === 'stage-1000' || norm === 'open') return norm
  return 'open'
}

function parseBool(raw: string | undefined): boolean {
  const norm = String(raw || '').trim().toLowerCase()
  return norm === 'true' || norm === '1'
}

function loadFromEnv(): RolloutConfig {
  const stage = parseStage(process.env.PANACEA_ROLLOUT_STAGE)
  const capRaw = process.env.PANACEA_MAX_ACCOUNTS
  const capNum = capRaw !== undefined && capRaw !== '' ? Number(capRaw) : NaN
  const maxAccounts = Number.isInteger(capNum) && capNum >= 0 ? capNum : STAGE_CAPS[stage]
  return {
    stage,
    maxAccounts,
    signupKillSwitch: parseBool(process.env.PANACEA_SIGNUP_KILL_SWITCH),
    readOnlyMode: parseBool(process.env.PANACEA_READONLY_MODE),
    updatedAt: null,
  }
}

let currentConfig: RolloutConfig = loadFromEnv()

export function getRolloutConfig(): RolloutConfig {
  return { ...currentConfig }
}

export function resetRolloutConfigFromEnv(): RolloutConfig {
  currentConfig = loadFromEnv()
  return getRolloutConfig()
}

/** Restores persisted owner rollout overrides after boot/restart when valid. */
export function hydrateRolloutConfig(saved: unknown): RolloutConfig {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return getRolloutConfig()
  const s = saved as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  if (s.stage === 'stage-50' || s.stage === 'stage-200' || s.stage === 'stage-1000' || s.stage === 'open') patch.stage = s.stage
  if (typeof s.maxAccounts === 'number' && Number.isInteger(s.maxAccounts) && s.maxAccounts >= 0 && s.maxAccounts <= 1_000_000) {
    patch.maxAccounts = s.maxAccounts
  }
  if (typeof s.signupKillSwitch === 'boolean') patch.signupKillSwitch = s.signupKillSwitch
  if (typeof s.readOnlyMode === 'boolean') patch.readOnlyMode = s.readOnlyMode
  if (Object.keys(patch).length > 0) updateRolloutConfig(patch)
  if (typeof s.updatedAt === 'string' && !Number.isNaN(Date.parse(s.updatedAt))) {
    currentConfig = { ...currentConfig, updatedAt: s.updatedAt }
  }
  return getRolloutConfig()
}

export function updateRolloutConfig(patch: {
  stage?: unknown
  maxAccounts?: unknown
  signupKillSwitch?: unknown
  readOnlyMode?: unknown
}): { ok: true; config: RolloutConfig } | { ok: false; error: string } {
  let nextStage = currentConfig.stage
  let nextCap = currentConfig.maxAccounts
  if (patch.stage !== undefined) {
    const raw = String(patch.stage)
    if (raw !== 'stage-50' && raw !== 'stage-200' && raw !== 'stage-1000' && raw !== 'open') {
      return { ok: false, error: 'invalid_stage' }
    }
    nextStage = raw
    nextCap = STAGE_CAPS[nextStage]
  }
  if (patch.maxAccounts !== undefined) {
    if (typeof patch.maxAccounts !== 'number' || !Number.isInteger(patch.maxAccounts) || patch.maxAccounts < 0 || patch.maxAccounts > 1_000_000) {
      return { ok: false, error: 'invalid_max_accounts' }
    }
    nextCap = patch.maxAccounts
  }
  const nextSignupKill = patch.signupKillSwitch === undefined
    ? currentConfig.signupKillSwitch
    : Boolean(patch.signupKillSwitch)
  const nextReadOnly = patch.readOnlyMode === undefined
    ? currentConfig.readOnlyMode
    : Boolean(patch.readOnlyMode)

  currentConfig = {
    stage: nextStage,
    maxAccounts: nextCap,
    signupKillSwitch: nextSignupKill,
    readOnlyMode: nextReadOnly,
    updatedAt: new Date().toISOString(),
  }
  return { ok: true, config: getRolloutConfig() }
}

export function checkNewAccountAllowed(input: {
  isExistingUser: boolean
  isOwnerEmail: boolean
  currentUserCount: number
}): { allowed: true } | { allowed: false; status: 503; error: string } {
  if (input.isExistingUser || input.isOwnerEmail) return { allowed: true }
  if (currentConfig.readOnlyMode) return { allowed: false, status: 503, error: 'service_read_only' }
  if (currentConfig.signupKillSwitch) return { allowed: false, status: 503, error: 'signup_paused' }
  if (currentConfig.maxAccounts > 0 && input.currentUserCount >= currentConfig.maxAccounts) {
    return { allowed: false, status: 503, error: 'beta_capacity_reached' }
  }
  return { allowed: true }
}

const READ_ONLY_EXEMPT_PATHS = new Set([
  '/api/auth/google',
  '/api/auth/dev-login',
  '/api/auth/otp/email/start',
  '/api/auth/otp/email/verify',
  '/api/auth/logout',
  '/api/owner/rollout',
])

export function enforceReadOnlyMode(req: Request, res: Response, next: NextFunction): void {
  if (!currentConfig.readOnlyMode) return next()
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next()
  if (!req.path.startsWith('/api/')) return next()
  if (READ_ONLY_EXEMPT_PATHS.has(req.path)) return next()
  res.status(503).json({ error: 'service_read_only' })
}
