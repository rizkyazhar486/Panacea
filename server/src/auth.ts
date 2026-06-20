import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { config, features } from './config.js'
import { upsertUser, getUser, userExistsByEmail, type Role, type User } from './store.js'
import { sendWelcome } from './email.js'

const googleClient = new OAuth2Client(config.googleClientId)
const COOKIE = 'pmd_session'

function issueToken(userId: string): string {
  return jwt.sign({ uid: userId }, config.jwtSecret, { expiresIn: '7d' })
}

// Set the session cookie AND return the token so it can also be sent in the
// response body for Bearer auth (robust to third-party cookie blocking when the
// frontend and backend are on different domains).
export function setSession(res: Response, userId: string): string {
  const token = issueToken(userId)
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 3600 * 1000,
  })
  return token
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE)
}

// Accept the session from a Bearer token (preferred, cross-domain safe) or the
// cookie (same-site).
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
    const token = setSession(res, user.id)
    res.json({ user, token, live: true })
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
  const token = setSession(res, user.id)
  res.json({ user, token, live: false })
}
