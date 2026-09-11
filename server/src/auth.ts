import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { config, features } from './config.js'
import { upsertUser, getUser, getUserByEmail, getSettings, type Role, type User } from './store.js'
import { sendWelcome } from './email.js'
import { effectiveRoleForRequest, roleForLogin } from './accessControl.js'

const googleClient = new OAuth2Client(config.googleClientId)
const COOKIE = 'pmd_session'
const SESSION_COOKIE_ATTRIBUTES = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSecure ? 'none' : 'lax',
  path: '/',
} as const

function issueToken(userId: string): string {
  return jwt.sign({ uid: userId }, config.jwtSecret, { expiresIn: '7d' })
}

export function setSession(res: Response, userId: string): string {
  const token = issueToken(userId)
  res.cookie(COOKIE, token, {
    ...SESSION_COOKIE_ATTRIBUTES,
    maxAge: 7 * 24 * 3600 * 1000,
  })
  return token
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, SESSION_COOKIE_ATTRIBUTES)
}

export function currentUser(req: Request): User | undefined {
  const auth = req.headers.authorization
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
  const token = bearer || req.cookies?.[COOKIE]
  if (!token) return undefined
  try {
    const { uid } = jwt.verify(token, config.jwtSecret) as { uid: string }
    return getUser(uid)
  } catch {
    return undefined
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const u = currentUser(req)
  if (!u) return res.status(401).json({ error: 'unauthorized' })

  const allowOnboardingRole = req.method === 'POST' && req.path === '/api/applications'
  const effectiveRole = effectiveRoleForRequest(
    u,
    getSettings(u.id),
    config.ownerEmail,
    allowOnboardingRole,
  )
  const effectiveUser = effectiveRole === u.role ? u : { ...u, role: effectiveRole }
  ;(req as Request & { user: User }).user = effectiveUser
  next()
}

export const devLoginEnabled = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_LOGIN === 'true'

export async function googleLogin(req: Request, res: Response) {
  const { credential, role } = req.body as { credential?: string; role?: Role }
  if (!features.googleLive) {
    return res.status(400).json({ error: 'google_not_configured', hint: 'Set GOOGLE_CLIENT_ID or use an enabled development login only in local development.' })
  }
  if (!credential) return res.status(400).json({ error: 'missing_credential' })
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId })
    const payload = ticket.getPayload()
    if (!payload?.email) return res.status(401).json({ error: 'invalid_token' })

    const email = payload.email.trim().toLowerCase()
    const existing = getUserByEmail(email)
    const isNew = !existing
    const user = upsertUser(
      email,
      payload.name || existing?.name || email,
      roleForLogin(existing, role),
      payload.picture,
    )
    if (isNew) sendWelcome(user.email, user.name, user.role).catch(() => {})
    const token = setSession(res, user.id)
    res.json({ user, token, live: true })
  } catch {
    res.status(401).json({ error: 'verification_failed' })
  }
}

export function devLogin(req: Request, res: Response) {
  if (!devLoginEnabled) return res.status(404).json({ error: 'dev_login_disabled' })

  const { email, name, role } = req.body as { email?: string; name?: string; role?: Role }
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return res.status(400).json({ error: 'missing_email' })

  const existing = getUserByEmail(normalizedEmail)
  const isNew = !existing
  const user = upsertUser(
    normalizedEmail,
    String(name || '').trim() || existing?.name || normalizedEmail,
    roleForLogin(existing, role),
  )
  if (isNew) sendWelcome(user.email, user.name, user.role).catch(() => {})
  const token = setSession(res, user.id)
  res.json({ user, token, live: false })
}
