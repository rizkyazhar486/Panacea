// Masuk lewat kode sekali pakai yang dikirim ke SUREL. Gratis.
//
// SEBELUMNYA ADA JALUR SMS LEWAT TWILIO, DAN IA DICABUT DENGAN SENGAJA.
// Setiap SMS ditagih per pesan, dan biaya itu berjalan diam-diam: satu robot
// yang menekan tombol "kirim kode" berulang kali menghabiskan uang tanpa
// menghasilkan satu pun pengguna. Pemilik aplikasi ini memutuskan tidak
// membayar untuk itu, dan kode yang mati tetapi masih bisa dinyalakan oleh
// satu variabel lingkungan bukanlah keputusan yang benar-benar dijalankan —
// ia hanya keputusan yang ditunda. Maka jalurnya dihapus, bukan dimatikan.
//
// Nomor telepon masih dipakai di Connect, tetapi HANYA untuk mendeteksi akun
// ganda lewat sidik yang tidak dapat dikembalikan — bukan sebagai bukti
// identitas, dan tidak pernah dikirimi pesan. Perapihan nomornya kini tinggal
// di ./telepon.ts supaya modul yang tidak mengirim apa-apa tidak perlu
// mengimpor modul pengiriman.
import type { Request, Response } from 'express'
import { upsertUser, userExistsByEmail, getUserByEmail, type Role } from './store.js'
import { setSession } from './auth.js'
import { sendWelcome, sendOtpCode } from './email.js'

// Kode surel dikirim lewat Resend — tanpa biaya per pesan.
export const emailOtpLive = Boolean(process.env.RESEND_API_KEY)

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
