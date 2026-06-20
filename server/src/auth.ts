import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { config, features } from './config.js'
import { upsertUser, getUser, userExistsByEmail, type Role, type User } from './store.js'
import { sendWelcome } from './email.js'

const googleClient = new OAuth2Client(config.googleClientId)
const COOKIE = 'pmd_session'

function setSession(res: Response, userId: string) {
  const token = jwt.sign({ uid: userId }, config.jwtSecret, { expiresIn: '7d' })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 3600 * 1000,
  })
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE)
}

export function currentUser(req: Request): User | undefined {
  const token = req.cookies?.[COOKIE]
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
  ;(req as Request & { user: User }).user = u
  next()
}

// Real Google sign-in: verify the ID token (credential) from Google Identity Services.
export async function googleLogin(req: Request, res: Response) {
  const { credential, role } = req.body as { credential?: string; role?: Role }
  if (!features.googleLive) {
    return res.status(400).json({ error: 'google_not_configured', hint: 'Set GOOGLE_CLIENT_ID or use /api/auth/dev-login' })
  }
  if (!credential) return res.status(400).json({ error: 'missing_credential' })
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId })
    const payload = ticket.getPayload()
    if (!payload?.email) return res.status(401).json({ error: 'invalid_token' })
    const isNew = !userExistsByEmail(payload.email)
    const user = upsertUser(payload.email, payload.name || payload.email, (role as Role) || 'pasien', payload.picture)
    if (isNew) sendWelcome(user.email, user.name, user.role).catch(() => {})
    setSession(res, user.id)
    res.json({ user, live: true })
  } catch {
    res.status(401).json({ error: 'verification_failed' })
  }
}

// Dev/mock login — always available so the app runs without Google configured.
export function devLogin(req: Request, res: Response) {
  const { email, name, role } = req.body as { email?: string; name?: string; role?: Role }
  if (!email) return res.status(400).json({ error: 'missing_email' })
  const isNew = !userExistsByEmail(email)
  const user = upsertUser(email, name || email, (role as Role) || 'pasien')
  if (isNew) sendWelcome(user.email, user.name, user.role).catch(() => {})
  setSession(res, user.id)
  res.json({ user, live: false })
}
