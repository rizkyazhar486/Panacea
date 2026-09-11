// Masuk lewat kode sekali pakai yang dikirim ke SUREL. Gratis.
// Nomor telepon di Connect hanya untuk deteksi akun ganda; OTP login hanya lewat email.
import { randomInt } from 'node:crypto'
import type { Request, Response } from 'express'
import { upsertUser, getUserByEmail, type Role } from './store.js'
import { setSession } from './auth.js'
import { sendWelcome, sendOtpCode } from './email.js'
import { roleForLogin } from './accessControl.js'

export const emailOtpLive = Boolean(process.env.RESEND_API_KEY)

const OTP_TTL_MS = 10 * 60_000
const OTP_RESEND_COOLDOWN_MS = 30_000
const OTP_MAX_TRIES = 5

const emailCodes = new Map<string, { code: string; expires: number; tries: number }>()
const emailLastStart = new Map<string, number>()
const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

function pruneOtpState(now: number) {
  for (const [email, rec] of emailCodes) {
    if (rec.expires <= now) emailCodes.delete(email)
  }
  for (const [email, startedAt] of emailLastStart) {
    if (now - startedAt > OTP_TTL_MS) emailLastStart.delete(email)
  }
}

export async function emailOtpStart(req: Request, res: Response) {
  if (!emailOtpLive) return res.status(503).json({ error: 'otp_not_configured' })
  const email = String((req.body as any)?.email || '').trim().toLowerCase()
  if (!isEmail(email)) return res.status(400).json({ error: 'bad_email' })

  const now = Date.now()
  pruneOtpState(now)
  if (now - (emailLastStart.get(email) ?? 0) < OTP_RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'too_soon' })
  }

  const code = String(randomInt(100000, 1_000_000))
  emailLastStart.set(email, now)
  emailCodes.set(email, { code, expires: now + OTP_TTL_MS, tries: 0 })

  let sent = false
  try {
    sent = await sendOtpCode(email, code)
  } catch {
    sent = false
  }
  if (!sent) {
    emailCodes.delete(email)
    emailLastStart.delete(email)
    return res.status(502).json({ error: 'otp_send_failed' })
  }

  res.json({ ok: true, email })
}

export async function emailOtpVerify(req: Request, res: Response) {
  if (!emailOtpLive) return res.status(503).json({ error: 'otp_not_configured' })
  const b = req.body as { email?: string; code?: string; name?: string; role?: Role }
  const email = String(b.email || '').trim().toLowerCase()
  const code = String(b.code || '').trim()
  if (!isEmail(email) || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'bad_input' })

  const now = Date.now()
  pruneOtpState(now)
  const rec = emailCodes.get(email)
  if (!rec) return res.status(401).json({ error: 'otp_expired' })

  rec.tries += 1
  if (rec.code !== code) {
    if (rec.tries >= OTP_MAX_TRIES) {
      emailCodes.delete(email)
      return res.status(429).json({ error: 'too_many_tries' })
    }
    return res.status(401).json({ error: 'otp_invalid' })
  }

  emailCodes.delete(email)
  const existing = getUserByEmail(email)
  const isNew = !existing
  const user = upsertUser(
    email,
    b.name?.trim() || existing?.name || email,
    roleForLogin(existing, b.role),
  )
  if (isNew) sendWelcome(user.email, user.name, user.role).catch(() => {})
  const token = setSession(res, user.id)
  res.json({ user, token, live: true })
}
