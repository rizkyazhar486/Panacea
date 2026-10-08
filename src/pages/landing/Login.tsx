import { useEffect, useRef, useState } from 'react'
import { hariIni } from '../../lib/tanggal'
import { useStore, uid, OWNER_EMAIL } from '../../lib/store'
import { Wordmark } from '../../components/Logo'
import { inputClass } from '../../components/ui'
import { IconSun, IconMoon } from '../../components/icons'
import { api, backendEnabled, renderGoogleButton, type Health } from '../../lib/api'
import { getTheme, toggleTheme, type Theme } from '../../lib/theme'
import { ageFromDob } from '../../lib/anthro'
import type { Account, Role } from '../../lib/types'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { GoogleG } from './loginSvgs'
import { STR_ROLES, ROLES, LOGIN_PILLS } from './loginData'
import './login.css'

/* ── Form Field Helper ────────────────────────────────────────── */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
        {label} {required && <span className="text-emerald-600 dark:text-emerald-400 font-black">*</span>}
      </label>
      {children}
    </div>
  )
}

function Mini({ label, value, onChange, placeholder, numeric }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean
}) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{label}</label>
      <input
        className={inputClass}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={numeric ? 'numeric' : undefined}
      />
    </div>
  )
}

/* ── Main Login ──────────────────────────────────────────────── */

export function Login({ onBack }: { onBack?: () => void }) {
  const { login, sendEmail, state } = useStore()
  const [authMode, setAuthMode] = useState<'masuk' | 'daftar'>('masuk')
  const [role, setRole] = useState<Role>('pasien')
  const [pilihPeran, setPilihPeran] = useState(false)
  const [f, setF] = useState({
    email: '', name: '', sex: 'L' as 'L' | 'P', dob: '',
    occupation: '', background: '',
    str: '', gelar: '', keahlian: '', universitas: '',
    tahunLulus: '', spesialis: '', subspesialis: '', pdfName: '',
  })
  const [error, setError] = useState('')
  const [serverNotice, setServerNotice] = useState('')
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
  const hasOptionalFields = authMode === 'daftar' && !simple && (clinical || role === 'pasien')

  // Form validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())
  const isNameValid = f.name.trim().length >= 2
  const isStrValid = !clinical || f.str.trim().length >= 4
  const isFormValid = authMode === 'masuk'
    ? isEmailValid && consent
    : isEmailValid && isNameValid && isStrValid && consent

  useEffect(() => { roleRef.current = role }, [role])
  useEffect(() => { consentRef.current = consent }, [consent])

  useEffect(() => {
    if (!backendEnabled) return
    let batal = false
    const coba = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          const h = await api.health()
          if (batal) return
          setHealth(h)
          if (h.penyimpanan === 'berkas') {
            setServerNotice('Sesi aktif dalam mode penyimpanan berkas/lokal.')
          } else {
            setServerNotice('')
          }
          return
        } catch {
          if (batal) return
          setServerNotice(i === 0
            ? 'Menghubungkan ke layanan server…'
            : 'Masih menunggu respon server…')
          await new Promise((r) => setTimeout(r, 8000))
        }
      }
      if (!batal) setServerNotice('Layanan server belum terhubung — aplikasi berjalan dalam mode lokal.')
    }
    void coba()
    return () => { batal = true }
  }, [])

  useEffect(() => {
    if (!health?.googleClientId || !gbtn.current) return
    renderGoogleButton(gbtn.current, health.googleClientId, cred => {
      if (!consentRef.current) {
        setError('Harap setujui Syarat Layanan & Kebijakan Privasi terlebih dahulu.')
        return
      }
      setError('')
      api.googleLogin(cred, roleRef.current)
        .then(a => login({
          ...a,
          isOwner: a.email.toLowerCase() === OWNER_EMAIL,
          isSubscriber: a.role === 'owner',
          consentAt: new Date().toISOString(),
          strStatus: STR_ROLES.includes(a.role) ? 'pending' : 'none',
        }))
        .catch(() => setError('Verifikasi akun Google gagal.'))
    }).catch(() => setError('Gagal memuat tombol Google Sign-In.'))
  }, [health, login])

  function consentOk() {
    if (!consent) {
      setError('Harap setujui Syarat Layanan & Kebijakan Privasi.')
      return false
    }
    if (clinical && !f.str.trim()) {
      setError('Nomor STR wajib diisi untuk peran tenaga medis ini.')
      return false
    }
    setError('')
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
      subject: 'Selamat Datang di Panaceamed.id',
      body: `Halo ${acc.name}, akun Anda (${acc.role}) telah aktif dan siap digunakan.`,
      at: new Date().toISOString(),
    })
  }

  function doLogin() {
    if (!consentOk()) return
    const email = (f.email.trim() || 'user@gmail.com').toLowerCase()
    const isOwner = email === OWNER_EMAIL
    if (role === 'admin' && !isOwner && !state.adminEmails.includes(email)) {
      setError('Email ini belum terdaftar dengan otorisasi Admin.')
      return
    }
    setError('')
    const acc: Account = {
      email, name: f.name.trim() || 'Pengguna Panacea', role,
      isSubscriber: role === 'owner', loggedAt: new Date().toISOString(),
      sex: simple ? undefined : f.sex,
      dob: simple || !f.dob ? undefined : f.dob,
      age: simple || !f.dob ? undefined : ageFromDob(f.dob),
      occupation: f.occupation.trim() || undefined,
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

  function doDemoLogin() {
    setConsent(true)
    setError('')
    const isOwner = role === 'owner'
    const acc: Account = {
      email: isOwner ? OWNER_EMAIL : 'demo.user@panaceamed.id',
      name: role === 'pasien' ? 'Pengguna Demo' : role === 'owner' ? 'Owner Panacea' : 'dr. Demo Klinisi',
      role,
      isSubscriber: isOwner,
      loggedAt: new Date().toISOString(),
      str: clinical ? '31.1.1.100.1.23.123456' : undefined,
      strStatus: clinical ? 'verified' : 'none',
      consentAt: new Date().toISOString(),
      isOwner,
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
    <div className="login-page-root grid h-screen lg:grid-cols-2 overflow-hidden">
      {/* ── Brand panel (desktop) ─────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between h-full overflow-hidden bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] dark:from-[#041c11] dark:via-[#02130b] dark:to-[#010a06] dark:border-r dark:border-white/10 p-10 lg:p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute -left-16 top-10 h-72 w-72 rounded-full bg-white/15 dark:bg-emerald-500/10 blur-3xl" />
          <div
            className="orb absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-900/30 dark:bg-emerald-950/40 blur-3xl"
            style={{ animationDelay: '-8s' }}
          />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        <div className="relative"><Wordmark size={40} onDark /></div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">
            AI-EMR &amp; Longevity Medis{' '}
            <span className="animate-gradient-text bg-gradient-to-r from-white via-emerald-100 to-white dark:from-white dark:via-emerald-300 dark:to-white bg-clip-text text-transparent">
              Ditinjau oleh Klinisi
            </span>
          </h1>
          <BatasKlaimKesehatan
            permukaan="care.login"
            className="mt-3 max-w-md text-[12px] leading-snug text-white/70 dark:text-emerald-200/70"
          />
          <p className="mt-3 max-w-md text-white/85 dark:text-neutral-300 text-sm leading-relaxed">
            AI mendukung anamnesis &amp; edukasi kesehatan dengan peninjauan klinisi berizin. Rekam medis terstruktur,
            pemantauan vitalitas berkelanjutan untuk ketahanan hidup sehat.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {LOGIN_PILLS.map(t => (
              <span
                key={t}
                className="rounded-full border border-white/20 bg-white/10 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 px-3 py-1 text-xs font-semibold backdrop-blur-md"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/70 dark:text-neutral-400">
          ⚕️ AI mendukung analisis data medis dan tidak menggantikan keputusan klinisi berizin.
        </p>
      </div>

      {/* ── Form panel (Clean, never clipped at top) ──── */}
      <div className="login-form-panel relative flex flex-col items-center h-full overflow-y-auto px-6 sm:px-10">
        <div className="w-full max-w-[440px] my-auto py-8">
          {/* Top bar controls */}
          <div className="flex items-center justify-between mb-4">
            {onBack ? (
              <button
                onClick={onBack}
                className="inline-flex min-h-[36px] items-center text-xs font-bold text-neutral-500 hover:text-brand-dark transition-colors dark:text-neutral-400 dark:hover:text-emerald-400"
              >
                ← Kembali ke Beranda
              </button>
            ) : <div />}

            <button
              onClick={() => setTheme(toggleTheme())}
              className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white text-neutral-600 shadow-sm transition hover:text-brand-dark dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:text-emerald-400"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
          </div>

          <div className="space-y-4">
            <div className="lg:hidden"><Wordmark size={32} /></div>

          {/* ── Mode Auth: Masuk vs Daftar Baru ─────────────────── */}
          <div className="flex rounded-full border border-neutral-200/80 bg-neutral-100/80 p-1 dark:border-white/10 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => { setAuthMode('masuk'); setError('') }}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition duration-150 ${
                authMode === 'masuk'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Masuk ke Akun
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('daftar'); setError('') }}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition duration-150 ${
                authMode === 'daftar'
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-ink dark:text-white">
              {authMode === 'masuk' ? 'Masuk ke Akun Anda' : 'Buat Akun Panaceamed'}
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {authMode === 'masuk'
                ? 'Pintu gerbang rekam medis & kesehatan longevity presisi.'
                : 'Pilih peran dan daftarkan diri untuk akses rekam medis digital.'}
            </p>
          </div>

          {/* ── Peran: Segmented switch (Hanya di mode Daftar Baru) ── */}
          {authMode === 'daftar' && (
            <div className="space-y-2.5">
              <div className="login-role-switch" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={role === 'pasien' && !pilihPeran}
                  data-active={role === 'pasien' && !pilihPeran ? 'true' : 'false'}
                  onClick={() => { setRole('pasien'); setPilihPeran(false) }}
                  className="login-role-tab"
                >
                  <span>👤</span>
                  <span>Pasien &amp; Publik</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={pilihPeran || role !== 'pasien'}
                  data-active={pilihPeran || role !== 'pasien' ? 'true' : 'false'}
                  onClick={() => {
                    if (role === 'pasien') setRole('dokter')
                    setPilihPeran(true)
                  }}
                  className="login-role-tab"
                >
                  <span>🩺</span>
                  <span>Klinisi / Medis (STR)</span>
                </button>
              </div>

              {/* Sub-role pills: Distinct selected state with solid emerald & checkmark */}
              {(pilihPeran || role !== 'pasien') && (
                <div className="space-y-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Peran Medis Aktif:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Kredensial STR Diperlukan
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ROLES.filter(r => r.id !== 'pasien').map(r => {
                      const isSelected = role === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          data-selected={isSelected ? 'true' : 'false'}
                          className="login-subrole-btn"
                        >
                          {isSelected && <span className="text-[12px] font-black">✓</span>}
                          <span>{r.title}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {cur.desc}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Google One-Click Login ────────────────────────────── */}
          {health?.googleClientId ? (
            <div ref={gbtn} className="flex justify-center" />
          ) : (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={doDemoLogin}
                className="login-google-btn flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-bold shadow-xs active:scale-[0.99]"
              >
                <GoogleG />
                <span>Masuk Cepat dengan Akun Demo</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Demo
                </span>
              </button>
              <p className="text-center text-[10.5px] text-neutral-400">
                Google OAuth belum diset di .env — klik untuk masuk instan dengan akun simulasi.
              </p>
            </div>
          )}

          {health?.features.otpEmail && (
            <EmailOtpLogin
              role={role}
              consentOk={consentOk}
              name={f.name}
              str={f.str}
              email={f.email}
              setEmail={v => setF(p => ({ ...p, email: v }))}
              onLogin={finish}
            />
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span>atau {authMode === 'masuk' ? 'masuk dengan email' : 'daftar dengan email'}</span>
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* ── Core Essential Inputs Only ────────────────────────── */}
          <div className="space-y-3">
            <Field label="Alamat Email" required>
              <input
                className={inputClass}
                value={f.email}
                onChange={e => {
                  setF(p => ({ ...p, email: e.target.value }))
                  if (error) setError('')
                }}
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </Field>

            {authMode === 'daftar' && (
              <Field label="Nama Lengkap" required>
                <input
                  className={inputClass}
                  value={f.name}
                  onChange={e => {
                    setF(p => ({ ...p, name: e.target.value }))
                    if (error) setError('')
                  }}
                  placeholder={role === 'pasien' ? 'Nama lengkap Anda' : 'dr. Nama Lengkap, Sp.X'}
                  autoComplete="name"
                />
              </Field>
            )}

            {/* STR — Only shown in register mode for clinical roles */}
            {authMode === 'daftar' && clinical && (
              <Field label="Nomor STR / Kredensial Medis" required>
                <input
                  className={inputClass}
                  value={f.str}
                  onChange={e => {
                    setF(p => ({ ...p, str: e.target.value }))
                    if (error) setError('')
                  }}
                  placeholder="Contoh: 31.1.1.100.1.23.123456"
                />
              </Field>
            )}
          </div>

          {/* ── Progressive Disclosure: Optional Extra Details (Sebelum Submit) ─ */}
          {hasOptionalFields && (
            <details className="group rounded-2xl border border-neutral-200/70 bg-neutral-50/40 dark:border-white/10 dark:bg-white/[0.02] p-3 text-xs">
              <summary className="cursor-pointer font-bold text-neutral-600 dark:text-neutral-400 list-none flex items-center justify-between select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <span>▸ Lengkapi data profil opsional (dapat diisi nanti)</span>
                <span className="text-[10px] text-neutral-400 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-3 space-y-3 pt-3 border-t border-neutral-200/60 dark:border-white/10">
                {/* Optional biological parameters */}
                {!simple && (
                  <div>
                    <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Usia dan jenis kelamin membantu kalibrasi estimasi denyut jantung maksimal dan energi harian.
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Jenis Kelamin</label>
                        <select
                          className={inputClass}
                          value={f.sex}
                          onChange={e => setF(p => ({ ...p, sex: e.target.value as 'L' | 'P' }))}
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Tanggal Lahir</label>
                        <input
                          className={inputClass}
                          value={f.dob}
                          onChange={e => setF(p => ({ ...p, dob: e.target.value }))}
                          type="date"
                          max={hariIni()}
                        />
                        {f.dob && <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">Usia: {ageFromDob(f.dob)} tahun</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional clinical education details */}
                {clinical && (
                  <div className="space-y-2.5 border-t border-neutral-200/60 dark:border-white/10 pt-2.5">
                    <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">Riwayat Akademik &amp; Kredensial Medis:</p>
                    {role === 'kontributor' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Mini label="Gelar Akademik" value={f.gelar} onChange={v => setF(p => ({ ...p, gelar: v }))} placeholder="dr., Sp.PD" />
                        <Mini label="Spesialisasi" value={f.spesialis} onChange={v => setF(p => ({ ...p, spesialis: v }))} placeholder="Penyakit Dalam" />
                      </div>
                    )}
                    {role === 'verifikator' && (
                      <Mini label="Subspesialisasi" value={f.subspesialis} onChange={v => setF(p => ({ ...p, subspesialis: v }))} placeholder="Gastroenterohepatologi" />
                    )}
                    <Mini label="Bidang Keahlian" value={f.keahlian} onChange={v => setF(p => ({ ...p, keahlian: v }))} placeholder="Kardiologi, longevity" />
                    <div className="grid grid-cols-2 gap-2">
                      <Mini label="Universitas / Almamater" value={f.universitas} onChange={v => setF(p => ({ ...p, universitas: v }))} placeholder="Universitas Indonesia" />
                      <Mini label="Tahun Kelulusan" value={f.tahunLulus} onChange={v => setF(p => ({ ...p, tahunLulus: v.replace(/\D/g, '').slice(0, 4) }))} placeholder="2018" numeric />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Unggah Berkas Kredensial (PDF)</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={e => setF(p => ({ ...p, pdfName: e.target.files?.[0]?.name ?? '' }))}
                        className="block w-full text-xs text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                      />
                      {f.pdfName && <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">✓ {f.pdfName}</p>}
                    </div>
                  </div>
                )}

                {/* Optional patient details */}
                {role === 'pasien' && (
                  <div className="space-y-2 border-t border-neutral-200/60 dark:border-white/10 pt-2.5">
                    <Mini label="Profesi / Pekerjaan" value={f.occupation} onChange={v => setF(p => ({ ...p, occupation: v }))} placeholder="Karyawan, Wiraswasta, dll." />
                    <Mini label="Riwayat Kesehatan Singkat" value={f.background} onChange={v => setF(p => ({ ...p, background: v }))} placeholder="Riwayat alergi, hipertensi keluarga, dll." />
                  </div>
                )}
              </div>
            </details>
          )}

          {/* ── Checkbox Persetujuan ──────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3 text-[12px] leading-snug text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => {
                  setConsent(e.target.checked)
                  if (e.target.checked && error.includes('setujui')) setError('')
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#00BF63]"
              />
              <span>
                Saya menyetujui{' '}
                <button
                  type="button"
                  onClick={() => setShowLegal(true)}
                  className="font-bold text-emerald-700 underline dark:text-emerald-400 hover:opacity-85"
                >
                  Syarat Layanan &amp; Kebijakan Privasi
                </button>
                . AI adalah asisten analitis suportif, bukan pengganti konsultasi langsung dengan dokter.
              </span>
            </label>

            {/* Inline subtle error when consent or form issue occurs */}
            {error && (
              <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Primary Submit Button ─────────────────────────────── */}
          <button
            type="button"
            onClick={doLogin}
            disabled={!isFormValid}
            className="login-submit-btn flex w-full items-center justify-center gap-2 rounded-full py-3"
          >
            {!consent
              ? 'Centang Persetujuan untuk Lanjut'
              : !isEmailValid
              ? 'Lengkapi Alamat Email yang Benar'
              : authMode === 'daftar' && !isNameValid
              ? 'Lengkapi Nama Lengkap Anda'
              : authMode === 'daftar' && clinical && !isStrValid
              ? 'Masukkan Nomor STR Medis'
              : authMode === 'masuk'
              ? 'Masuk ke Akun Sekarang →'
              : `Daftar sebagai ${cur.title} →`}
          </button>

          {/* ── Footer Micro-Badges & Status (Clean, Non-Disruptive) ─ */}
          <div className="pt-2 text-center space-y-1">
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              🔒 Mode lokal aman · Terenkripsi &amp; Patuh UU PDP No. 27/2022
            </p>
            {backendEnabled && (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Layanan Server Aktif{health?.features.ai ? ' · AI' : ''}{health?.features.google ? ' · Google' : ''}
                </span>
                {serverNotice && (
                  <span className="text-neutral-400" title={serverNotice}>
                    (Penyimpanan Lokal Aman)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      </div>
    </div>
  )
}

/* ── Email OTP ───────────────────────────────────────────────── */

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
    if (!email.trim()) { setMsg('Harap masukkan alamat email Anda.'); return }
    setBusy(true); setMsg('')
    try {
      await api.emailOtpStart(email.trim())
      setSent(true)
      setMsg('Kode verifikasi telah dikirim ke email Anda.')
    } catch {
      setMsg('Gagal mengirim kode verifikasi.')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (!code.trim()) { setMsg('Harap masukkan kode dari email Anda.'); return }
    setBusy(true); setMsg('')
    try {
      const a = await api.emailOtpVerify(email.trim(), code.trim(), name.trim() || 'Pengguna Panacea', role)
      onLogin({
        ...a,
        isOwner: a.email.toLowerCase() === OWNER_EMAIL,
        isSubscriber: role === 'owner',
        sex: 'L',
        str: STR_ROLES.includes(role) ? str.trim() : undefined,
        strStatus: STR_ROLES.includes(role) ? 'pending' : 'none',
        consentAt: new Date().toISOString(),
      })
    } catch {
      setMsg('Kode verifikasi salah atau sudah kedaluwarsa.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-50/50 p-3 dark:border-brand/30 dark:bg-brand/10">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-dark dark:text-brand">
        ✉️ Masuk Cepat via Kode Email (OTP Gratis)
      </div>
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          placeholder="nama@email.com"
          disabled={sent}
        />
        {!sent ? (
          <button
            onClick={start}
            disabled={busy}
            type="button"
            className="shrink-0 min-h-[40px] px-4 rounded-xl bg-brand text-white font-bold text-xs disabled:opacity-50"
          >
            {busy ? '…' : 'Kirim Kode'}
          </button>
        ) : (
          <button
            onClick={() => { setSent(false); setCode(''); setMsg('') }}
            type="button"
            className="shrink-0 px-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 min-h-[40px]"
          >
            Ganti
          </button>
        )}
      </div>
      {sent && (
        <div className="mt-2 flex gap-2">
          <input
            className={inputClass}
            value={code}
            onChange={e => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="6 digit kode"
          />
          <button
            onClick={verify}
            disabled={busy}
            type="button"
            className="shrink-0 min-h-[40px] px-4 rounded-xl bg-brand text-white font-bold text-xs disabled:opacity-50"
          >
            {busy ? '…' : 'Verifikasi'}
          </button>
        </div>
      )}
      {msg && <p className="mt-1.5 text-[11px] font-semibold text-brand-dark dark:text-brand">{msg}</p>}
    </div>
  )
}

/* ── Legal Modal ─────────────────────────────────────────────── */

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-ink dark:text-white">
          Persetujuan Klinis, Privasi &amp; Ketentuan Layanan
        </h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            <b>Informed Consent.</b> Interaksi dengan asisten AI bersifat edukatif dan suportif untuk membantu analisis kesehatan, bukan diagnosis medis akhir. Diagnosis resmi dan keputusan terapi tetap memerlukan verifikasi langsung oleh dokter berizin.
          </p>
          <p>
            <b>Privasi (UU Perlindungan Data Pribadi No. 27/2022).</b> Data kesehatan Anda adalah data pribadi spesifik yang disimpan terenkripsi dengan audit log akses yang ketat. Anda memiliki hak penuh untuk mengakses, memperbarui, atau menghapus riwayat data Anda kapan saja.
          </p>
          <p>
            <b>Ketentuan Profesi.</b> Modul AI-EMR khusus diperuntukkan bagi klinisi terdaftar dengan STR/SIP aktif. Layanan kefarmasian tunduk pada regulasi BPOM dan pengawasan apoteker berlisensi. Dalam situasi darurat medis, gunakan fitur Darurat SOS atau segera hubungi IGD rumah sakit terdekat.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Ketentuan lengkap dapat diakses kembali melalui menu "Privasi &amp; Legalitas" setelah Anda masuk.
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="mt-5 w-full rounded-full bg-brand hover:opacity-95 py-3 text-sm font-bold text-white shadow-md min-h-[44px]"
        >
          Saya Mengerti &amp; Setuju
        </button>
      </div>
    </div>
  )
}
