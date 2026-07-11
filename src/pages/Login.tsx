import { useEffect, useRef, useState } from 'react'
import { useStore, uid, OWNER_EMAIL } from '../lib/store'
import { Wordmark } from '../components/Logo'
import { Button, inputClass } from '../components/ui'
import { IconSun, IconMoon } from '../components/icons'
import { api, backendEnabled, renderGoogleButton, type Health } from '../lib/api'
import { getTheme, toggleTheme, type Theme } from '../lib/theme'
import { ageFromDob } from '../lib/anthro'
import type { Account, Role } from '../lib/types'

const STR_ROLES: Role[] = ['dokter', 'kontributor', 'verifikator']

const ROLES: { id: Role; title: string; desc: string }[] = [
  { id: 'pasien', title: 'Customer / Patient', desc: 'Healthy living dashboard, AI Chatbot, education, nutrition & Longevity, consultations, pharmacy & healthcare facilities' },
  { id: 'dokter', title: 'Doctor', desc: 'AI-EMR, Planning, patient consultations' },
  { id: 'kontributor', title: 'Contributor / Writer', desc: 'Write, edit & upload material to verifiers' },
  { id: 'verifikator', title: 'Verifier', desc: 'AI + Subspecialist/Professor reviews journals' },
  { id: 'admin', title: 'Admin (Support)', desc: 'Handle complaints via AI + humans' },
  { id: 'owner', title: 'Owner', desc: 'View company monetary profit' },
]

/* ── Tiny helpers ────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</label>
      {children}
    </div>
  )
}

function Mini({ label, value, onChange, placeholder, numeric }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-neutral-500">{label}</label>
      <input className={inputClass} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} inputMode={numeric ? 'numeric' : undefined} />
    </div>
  )
}

function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/50">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-neutral-500 hover:text-neutral-700">
        {title}
        <span className="text-[10px] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : '' }}>▼</span>
      </button>
      {open && <div className="space-y-3 border-t border-neutral-100 px-3 py-3">{children}</div>}
    </div>
  )
}

/* ── Main Login ──────────────────────────────────────────── */

export function Login({ onBack }: { onBack?: () => void }) {
  const { login, sendEmail, state } = useStore()
  const [role, setRole] = useState<Role>('pasien')
  const [f, setF] = useState({
    email: '', name: '', sex: 'L' as 'L' | 'P', dob: '',
    nik: '', occupation: '', background: '',
    str: '', gelar: '', keahlian: '', universitas: '',
    tahunLulus: '', spesialis: '', subspesialis: '', pdfName: '',
  })
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [health, setHealth] = useState<Health | null>(null)

  const roleRef = useRef<Role>('pasien')
  const consentRef = useRef(false)
  const gbtn = useRef<HTMLDivElement>(null)

  // Derived flags
  const clinical = STR_ROLES.includes(role)
  const simple = role === 'admin' || role === 'owner'
  const cur = ROLES.find(r => r.id === role)!

  useEffect(() => { roleRef.current = role }, [role])
  useEffect(() => { consentRef.current = consent }, [consent])

  useEffect(() => {
    if (!backendEnabled) return
    api.health().then(setHealth).catch(() => setError('Backend unreachable — local mode.'))
  }, [])

  useEffect(() => {
    if (!health?.googleClientId || !gbtn.current) return
    renderGoogleButton(gbtn.current, health.googleClientId, cred => {
      if (!consentRef.current) { setError('Please agree to the Terms & Privacy Policy.'); return }
      api.googleLogin(cred, roleRef.current)
        .then(a => login({ ...a, isOwner: a.email.toLowerCase() === OWNER_EMAIL, isSubscriber: a.role === 'owner', consentAt: new Date().toISOString(), strStatus: STR_ROLES.includes(a.role) ? 'pending' : 'none' }))
        .catch(() => setError('Google verification failed.'))
    }).catch(() => setError('Failed to load Google Sign-In.'))
  }, [health, login])

  /* shared consent guard for OTP sub-components */
  function consentOk() {
    if (!consent) { setError('Please agree to the Terms & Privacy Policy.'); return false }
    if (clinical && !f.str.trim()) { setError('An STR number is required for this role.'); return false }
    return true
  }

  function finish(acc: Account) {
    login(acc)
    if (backendEnabled && clinical && acc.str) {
      api.saveSettings({ str: acc.str }).catch(() => {})
      api.submitApplication({
        str: acc.str ?? '', gelar: f.gelar.trim(), keahlian: f.keahlian.trim(),
        universitas: f.universitas.trim(), tahunLulus: f.tahunLulus.trim(),
        spesialis: f.spesialis.trim(), subspesialis: f.subspesialis.trim(), pdfName: f.pdfName,
      }).catch(() => {})
    }
    sendEmail({
      id: uid(), to: acc.email,
      subject: 'Welcome to Panaceamed.id',
      body: `Hello ${acc.name}, your account (${acc.role}) is now active.`,
      at: new Date().toISOString(),
    })
  }

  function doLogin() {
    if (!consentOk()) return
    const email = (f.email.trim() || 'user@gmail.com').toLowerCase()
    const isOwner = email === OWNER_EMAIL
    if (role === 'admin' && !isOwner && !state.adminEmails.includes(email)) {
      setError('This email is not yet authorized as Admin.'); return
    }
    const acc: Account = {
      email, name: f.name.trim() || 'Panaceamed User', role,
      isSubscriber: role === 'owner', loggedAt: new Date().toISOString(),
      sex: simple ? undefined : f.sex,
      dob: simple || !f.dob ? undefined : f.dob,
      age: simple || !f.dob ? undefined : ageFromDob(f.dob),
      nik: f.nik.trim() || undefined, occupation: f.occupation.trim() || undefined,
      background: f.background.trim() || undefined,
      str: clinical ? f.str.trim() : undefined,
      keahlian: f.keahlian.trim() || undefined, universitas: f.universitas.trim() || undefined,
      tahunLulus: f.tahunLulus.trim() || undefined,
      spesialis: role === 'kontributor' ? f.spesialis.trim() || undefined : undefined,
      gelar: role === 'kontributor' ? f.gelar.trim() || undefined : undefined,
      subspesialis: role === 'verifikator' ? f.subspesialis.trim() || undefined : undefined,
      strStatus: clinical ? 'pending' : 'none', consentAt: new Date().toISOString(), isOwner,
    }
    if (backendEnabled) {
      api.devLogin(acc.email, acc.name, role)
        .then(a => finish({ ...a, isOwner, isSubscriber: acc.isSubscriber }))
        .catch(() => finish(acc))
      return
    }
    finish(acc)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Brand panel (desktop) ─────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute -left-16 top-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="orb absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-900/30 blur-3xl" style={{ animationDelay: '-8s' }} />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        <div className="relative"><Wordmark size={40} onDark /></div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">
            Longevity Medical-AI{' '}
            <span className="animate-gradient-text bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">Co-Physician</span>
          </h1>
          <p className="mt-3 max-w-md text-white/85">
            AI handles history-taking & education; doctors verify. Tokenized medical records,
            continuous monitoring for healthspan.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Certified AI-EMR', 'Longevity AI', 'Emergency Care', 'Digital Pharmacy'].map(t => (
              <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/70">⚕️ AI supports, but does not replace, licensed clinicians.</p>
      </div>

      {/* ── Form panel ────────────────────────────── */}
      <div className="relative flex items-center justify-center p-6">
        <button onClick={() => setTheme(toggleTheme())}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 shadow-sm transition hover:text-brand-dark"
          aria-label="Toggle theme">
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        <div className="w-full max-w-md space-y-5">
          <div className="lg:hidden"><Wordmark size={34} /></div>
          {onBack && <button onClick={onBack} className="text-sm font-semibold text-neutral-500 hover:text-brand-dark">← Back</button>}

          <div>
            <h2 className="text-2xl font-extrabold">Sign In</h2>
            <p className="mt-1 text-sm text-neutral-500">Choose your role, then sign in.</p>
          </div>

          {/* ── Role pills ─────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setRole(r.id)}
                className={`rounded-xl border px-2 py-2.5 text-center text-[11px] font-bold leading-tight transition
                  ${role === r.id ? 'border-brand bg-brand-50 text-brand-dark' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                {r.title.split(' (')[0]}
              </button>
            ))}
          </div>
          <p className="-mt-3 text-[11px] leading-relaxed text-neutral-400">{cur.desc}</p>

          {/* ── Quick login ────────────────────── */}
          {health?.googleClientId
            ? <div ref={gbtn} className="flex justify-center" />
            : <button onClick={doLogin}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 font-semibold shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]">
                <GoogleG /> Sign in with Google
              </button>
          }
          {health?.features.otpEmail && (
            <EmailOtpLogin role={role} consentOk={consentOk} name={f.name} str={f.str}
              email={f.email} setEmail={v => setF(p => ({ ...p, email: v }))} onLogin={finish} />
          )}
          {health?.features.otp && (
            <PhoneLogin role={role} consentOk={consentOk} name={f.name} str={f.str} onLogin={finish} />
          )}

          {/* ── Consent ────────────────────────── */}
          <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-neutral-50 p-3 text-[12px] leading-snug text-neutral-600">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#00BF63]" />
            <span>I agree to the{' '}
              <button type="button" onClick={() => setShowLegal(true)}
                className="font-bold text-brand-dark underline">Terms & Privacy Policy</button>.
              AI is supportive in nature, not a replacement for a doctor.</span>
          </label>

          {error && <p className="text-xs text-accent">{error}</p>}
          {backendEnabled && (
            <p className="text-[11px] font-semibold text-brand-dark">
              ● Server active{health?.features.ai ? ' · AI' : ''}{health?.features.google ? ' · Google' : ''}{health?.features.payments ? ' · Payments' : ''}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" /> or fill in manually <span className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* ── Adaptive form fields ───────────── */}
          <div className="space-y-3">
            <Field label="Email">
              <input className={inputClass} value={f.email}
                onChange={e => setF(p => ({ ...p, email: e.target.value }))} type="email" />
            </Field>
            <Field label="Full Name">
              <input className={inputClass} value={f.name}
                onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
            </Field>

            {/* Demographics — only for pasien & clinical */}
            {!simple && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Sex</label>
                  <select className={inputClass} value={f.sex}
                    onChange={e => setF(p => ({ ...p, sex: e.target.value as 'L' | 'P' }))}>
                    <option value="L">Male</option>
                    <option value="P">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Date of Birth</label>
                  <input className={inputClass} value={f.dob}
                    onChange={e => setF(p => ({ ...p, dob: e.target.value }))} type="date"
                    max={new Date().toISOString().slice(0, 10)} />
                  {f.dob && <p className="mt-0.5 text-[11px] text-brand-dark">Age: {ageFromDob(f.dob)} years</p>}
                </div>
              </div>
            )}

            {/* STR — clinical roles */}
            {clinical && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    STR No. <span className="text-accent">*</span>
                  </label>
                  <input className={inputClass} value={f.str}
                    onChange={e => setF(p => ({ ...p, str: e.target.value }))}
                    placeholder="Required — STR / practice certificate" />
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {role === 'dokter' ? 'AI-EMR is only for certified clinicians.' : 'Required for certified clinicians / academics.'}
                  </p>
                </div>

                <Collapse title="Education & Credentials History">
                  {role === 'kontributor' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Mini label="Title" value={f.gelar} onChange={v => setF(p => ({ ...p, gelar: v }))} placeholder="Dr., Dr. Sp.PD" />
                      <Mini label="Specialty" value={f.spesialis} onChange={v => setF(p => ({ ...p, spesialis: v }))} placeholder="Internal Medicine" />
                    </div>
                  )}
                  {role === 'verifikator' && (
                    <Mini label="Subspecialty" value={f.subspesialis} onChange={v => setF(p => ({ ...p, subspesialis: v }))} placeholder="Gastroenterology-Hepatology" />
                  )}
                  <Mini label="Expertise" value={f.keahlian} onChange={v => setF(p => ({ ...p, keahlian: v }))} placeholder="Preventive cardiology, longevity" />
                  <div className="grid grid-cols-2 gap-2">
                    <Mini label="University" value={f.universitas} onChange={v => setF(p => ({ ...p, universitas: v }))} placeholder="Universitas Indonesia" />
                    <Mini label="Graduation Year" value={f.tahunLulus} onChange={v => setF(p => ({ ...p, tahunLulus: v.replace(/\D/g, '').slice(0, 4) }))} placeholder="2018" numeric />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-neutral-500">Upload Credentials (PDF)</label>
                    <input type="file" accept="application/pdf"
                      onChange={e => setF(p => ({ ...p, pdfName: e.target.files?.[0]?.name ?? '' }))}
                      className="block w-full text-xs text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
                    {f.pdfName && <p className="mt-1 text-[11px] text-brand-dark">✓ {f.pdfName}</p>}
                  </div>
                  <p className="text-[11px] text-neutral-400">Reviewed by AI-Agent & approved by Owner before full access.</p>
                </Collapse>
              </>
            )}

            {/* Optional pasien details — collapsed by default */}
            {role === 'pasien' && (
              <Collapse title="Additional details (optional)">
                <div className="grid grid-cols-2 gap-2">
                  <Mini label="Occupation" value={f.occupation} onChange={v => setF(p => ({ ...p, occupation: v }))} placeholder="Employee" />
                  <Mini label="National ID (NIK)" value={f.nik} onChange={v => setF(p => ({ ...p, nik: v.replace(/\D/g, '').slice(0, 16) }))} placeholder="16 digits" numeric />
                </div>
                <Mini label="Health background" value={f.background} onChange={v => setF(p => ({ ...p, background: v }))} placeholder="Family history of hypertension, etc." />
              </Collapse>
            )}
          </div>

          <Button onClick={doLogin} className="w-full">Sign in as {cur.title}</Button>
          <p className="text-center text-[11px] text-neutral-400">⚕️ Data protected in accordance with Indonesia's PDP Law.</p>
        </div>

        {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      </div>
    </div>
  )
}

/* ── Email OTP ───────────────────────────────────────────── */

function EmailOtpLogin({ role, name, str, email, setEmail, consentOk, onLogin }: {
  role: Role; name: string; str: string; email: string;
  setEmail: (v: string) => void; consentOk: () => boolean; onLogin: (a: Account) => void
}) {
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function start() {
    if (!consentOk()) return
    if (!email.trim()) { setMsg('Enter your email.'); return }
    setBusy(true); setMsg('')
    try { await api.emailOtpStart(email.trim()); setSent(true); setMsg('Code sent to your email.') }
    catch { setMsg('Failed to send code.') } finally { setBusy(false) }
  }

  async function verify() {
    if (!code.trim()) { setMsg('Enter the code from your email.'); return }
    setBusy(true); setMsg('')
    try {
      const a = await api.emailOtpVerify(email.trim(), code.trim(), name.trim() || 'Panaceamed User', role)
      onLogin({ ...a, isOwner: a.email.toLowerCase() === OWNER_EMAIL, isSubscriber: role === 'owner', sex: 'L',
        str: STR_ROLES.includes(role) ? str.trim() : undefined,
        strStatus: STR_ROLES.includes(role) ? 'pending' : 'none', consentAt: new Date().toISOString() })
    } catch { setMsg('Incorrect or expired code.') } finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-50/50 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-dark">✉️ Quick sign-in with Email (Free OTP)</div>
      <div className="flex gap-2">
        <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)}
          type="email" placeholder="email@you.com" disabled={sent} />
        {!sent
          ? <Button onClick={start} disabled={busy} className="shrink-0">{busy ? '…' : 'Send Code'}</Button>
          : <button onClick={() => { setSent(false); setCode(''); setMsg('') }} className="shrink-0 px-2 text-xs font-semibold text-neutral-500">Change</button>}
      </div>
      {sent && (
        <div className="mt-2 flex gap-2">
          <input className={inputClass} value={code} onChange={e => setCode(e.target.value)}
            inputMode="numeric" placeholder="6-digit code" />
          <Button onClick={verify} disabled={busy} className="shrink-0">{busy ? '…' : 'Verify'}</Button>
        </div>
      )}
      {msg && <p className="mt-1.5 text-[11px] font-semibold text-brand-dark">{msg}</p>}
    </div>
  )
}

/* ── Phone OTP ───────────────────────────────────────────── */

function PhoneLogin({ role, name, str, consentOk, onLogin }: {
  role: Role; name: string; str: string; consentOk: () => boolean; onLogin: (a: Account) => void
}) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function start() {
    if (!consentOk()) return
    if (!phone.trim()) { setMsg('Enter your phone number.'); return }
    setBusy(true); setMsg('')
    try { await api.otpStart(phone.trim()); setSent(true); setMsg('OTP code sent via SMS.') }
    catch { setMsg('Failed to send OTP.') } finally { setBusy(false) }
  }

  async function verify() {
    if (!code.trim()) { setMsg('Enter the OTP code.'); return }
    setBusy(true); setMsg('')
    try {
      const a = await api.otpVerify(phone.trim(), code.trim(), name.trim() || 'Panaceamed User', role)
      onLogin({ ...a, isOwner: a.email.toLowerCase() === OWNER_EMAIL, isSubscriber: role === 'owner', sex: 'L',
        str: STR_ROLES.includes(role) ? str.trim() : undefined,
        strStatus: STR_ROLES.includes(role) ? 'pending' : 'none', consentAt: new Date().toISOString() })
    } catch { setMsg('Incorrect or expired OTP code.') } finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-50/50 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-dark">📱 Quick sign-in with Phone No. (SMS OTP)</div>
      <div className="flex gap-2">
        <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)}
          inputMode="tel" placeholder="08xxxxxxxxxx" disabled={sent} />
        {!sent
          ? <Button onClick={start} disabled={busy} className="shrink-0">{busy ? '…' : 'Send OTP'}</Button>
          : <button onClick={() => { setSent(false); setCode(''); setMsg('') }} className="shrink-0 px-2 text-xs font-semibold text-neutral-500">Change</button>}
      </div>
      {sent && (
        <div className="mt-2 flex gap-2">
          <input className={inputClass} value={code} onChange={e => setCode(e.target.value)}
            inputMode="numeric" placeholder="6-digit code" />
          <Button onClick={verify} disabled={busy} className="shrink-0">{busy ? '…' : 'Verify'}</Button>
        </div>
      )}
      {msg && <p className="mt-1.5 text-[11px] font-semibold text-brand-dark">{msg}</p>}
    </div>
  )
}

/* ── Legal modal ─────────────────────────────────────────── */

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Consent, Privacy & Terms</h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">
          <p><b>Informed Consent.</b> AI interactions are educational & supportive in nature — not a final diagnosis. Diagnosis & treatment still require verification by a licensed doctor.</p>
          <p><b>Privacy (Indonesia's PDP Law No. 27/2022).</b> Your health data is specific personal data, stored encrypted in Indonesia, with an access audit log. You have the right to access, correct, and delete your data at any time.</p>
          <p><b>Terms.</b> AI-EMR is only for clinicians with a verified STR/SIP. Pharmacy services are subject to licensed pharmacists & BPOM regulation. In an emergency, use the SOS Emergency feature and contact the nearest healthcare facility.</p>
          <p className="text-xs text-neutral-400">The full version is available in the "Privacy & Legal" menu after signing in.</p>
        </div>
        <button onClick={onClose}
          className="mt-5 w-full rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] py-2.5 text-sm font-bold text-white">
          I Understand
        </button>
      </div>
    </div>
  )
}

/* ── Google "G" SVG ──────────────────────────────────────── */

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.3h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.1-3.8 6.5-9.5 6.5-16.2Z" />
      <path fill="#FBBC05" d="M10.3 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.8-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.5 10.5l7.8-6.1Z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.5 2.1-7.9 2.1-6.4 0-11.8-3.7-13.7-9.9l-7.8 6.1C6.4 42.6 14.6 48 24 48Z" />
    </svg>
  )
}
