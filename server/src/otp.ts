// Phone-number login via SMS OTP, powered by Twilio Verify.
//
// Gated on Twilio credentials (set in the host env, NEVER in code/chat):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
// Without them the endpoints return 503 and the UI shows "belum aktif", so the
// rest of the app keeps working. SMS delivery is billed per message by Twilio.
import type { Request, Response } from 'express'
import { upsertUser, userExistsByEmail, getUserByEmail, type Role } from './store.js'
import { setSession } from './auth.js'
import { sendWelcome, sendOtpCode } from './email.js'

const SID = process.env.TWILIO_ACCOUNT_SID || ''
const TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID || ''

export const otpLive = Boolean(SID && TOKEN && VERIFY_SID)
// Email OTP is FREE (delivered via Resend) — available whenever email is set up.
export const emailOtpLive = Boolean(process.env.RESEND_API_KEY)

function twAuth(): string {
  return 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64')
}

// Normalize an Indonesian phone to E.164 (+62…). Accepts 08xx, 62xx, +62xx.
export function normalizePhone(raw: string): string | null {
  let p = (raw || '').replace(/[\s-]/g, '')
  if (!p) return null
  if (p.startsWith('+')) return /^\+\d{8,15}$/.test(p) ? p : null
  if (p.startsWith('0')) p = '62' + p.slice(1)
  else if (!p.startsWith('62')) p = '62' + p
  return /^\d{9,15}$/.test(p) ? '+' + p : null
}

// Derive a stable pseudo-email so phone users slot into the existing user store.
function phoneEmail(phone: string): string {
  return `${phone.replace(/[^\d]/g, '')}@phone.panaceamed.id`
}

// Rate-limit OTP starts per phone (anti-spam / cost control).
const lastStart = new Map<string, number>()

export async function otpStart(req: Request, res: Response) {
  if (!otpLive) return res.status(503).json({ error: 'otp_not_configured' })
  const phone = normalizePhone(String((req.body as any)?.phone || ''))
  if (!phone) return res.status(400).json({ error: 'bad_phone' })
  const now = Date.now()
  if (now - (lastStart.get(phone) ?? 0) < 30_000) return res.status(429).json({ error: 'too_soon' })
  lastStart.set(phone, now)
  try {
    const r = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`, {
      method: 'POST',
      headers: { Authorization: twAuth(), 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: phone, Channel: 'sms' }),
    })
    if (!r.ok) {
      const d = await r.text()
      return res.status(502).json({ error: 'otp_send_failed', detail: d.slice(0, 200) })
    }
    res.json({ ok: true, phone })
  } catch (e) {
    res.status(502).json({ error: 'otp_send_failed', detail: (e as Error).message })
  }
}

// ── Email OTP (free) ────────────────────────────────────────────────────────
// 6-digit code emailed via Resend, held in-memory with a 10-minute expiry.
const emailCodes = new Map<string, { code: string; expires: number; tries: number }>()
const emailLastStart = new Map<string, number>()
const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

export async function emailOtpStart(req: Request, res: Response) {
  if (!emailOtpLive) return res.status(503).json({ error: 'otp_not_configured' })
  const email = String((req.body as any)?.email || '').trim().toLowerCase()
  if (!isEmail(email)) return res.status(400).json({ error: 'bad_email' })
  const now = Date.now()
  if (now - (emailLastStart.get(email) ?? 0) < 30_000) return res.status(429).json({ error: 'too_soon' })
  emailLastStart.set(email, now)
  const code = String(Math.floor(100000 + Math.random() * 900000))
  emailCodes.set(email, { code, expires: now + 10 * 60_000, tries: 0 })
  const ok = await sendOtpCode(email, code)
  if (!ok) return res.status(502).json({ error: 'otp_send_failed' })
  res.json({ ok: true, email })
}

export async function emailOtpVerify(req: Request, res: Response) {
  if (!emailOtpLive) return res.status(503).json({ error: 'otp_not_configured' })
  const b = req.body as { email?: string; code?: string; name?: string; role?: Role }
  const email = String(b.email || '').trim().toLowerCase()
  const code = String(b.code || '').trim()
  if (!isEmail(email) || !code) return res.status(400).json({ error: 'bad_input' })
  const rec = emailCodes.get(email)
  if (!rec || rec.expires < Date.now()) return res.status(401).json({ error: 'otp_expired' })
  if (rec.tries >= 5) { emailCodes.delete(email); return res.status(429).json({ error: 'too_many_tries' }) }
  rec.tries += 1
  if (rec.code !== code) return res.status(401).json({ error: 'otp_invalid' })
  emailCodes.delete(email)
  const existing = getUserByEmail(email)
  const isNew = !userExistsByEmail(email)
  const user = upsertUser(email, b.name?.trim() || existing?.name || email, (b.role as Role) || existing?.role || 'pasien')
  if (isNew) sendWelcome(user.email, user.name, user.role).catch(() => {})
  const token = setSession(res, user.id)
  res.json({ user, token, live: true })
}

export async function otpVerify(req: Request, res: Response) {
  if (!otpLive) return res.status(503).json({ error: 'otp_not_configured' })
  const b = req.body as { phone?: string; code?: string; name?: string; role?: Role }
  const phone = normalizePhone(String(b.phone || ''))
  const code = String(b.code || '').trim()
  if (!phone || !code) return res.status(400).json({ error: 'bad_input' })
  try {
    const r = await fetch(`https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`, {
      method: 'POST',
      headers: { Authorization: twAuth(), 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: phone, Code: code }),
    })
    const data = (await r.json().catch(() => ({}))) as any
    if (!r.ok || data?.status !== 'approved') {
      return res.status(401).json({ error: 'otp_invalid' })
    }
    const email = phoneEmail(phone)
    const existing = getUserByEmail(email)
    const isNew = !userExistsByEmail(email)
    const user = upsertUser(email, b.name?.trim() || existing?.name || phone, (b.role as Role) || existing?.role || 'pasien')
    if (isNew) sendWelcome(user.email, user.name, user.role).catch(() => {})
    const token = setSession(res, user.id)
    res.json({ user, token, live: true })
  } catch (e) {
    res.status(502).json({ error: 'otp_verify_failed', detail: (e as Error).message })
  }
}
