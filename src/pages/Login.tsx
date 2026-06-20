import { useEffect, useRef, useState } from 'react'
import { useStore, uid, OWNER_EMAIL } from '../lib/store'
import { Wordmark } from '../components/Logo'
import { Button, inputClass } from '../components/ui'
import { IconUser, IconSun, IconMoon } from '../components/icons'
import { api, backendEnabled, renderGoogleButton, type Health } from '../lib/api'
import { getTheme, toggleTheme, type Theme } from '../lib/theme'
import type { Account, Role } from '../lib/types'

// Roles that must provide an STR / practice-certificate at sign-up. Clinical &
// content-authority roles are licence-gated; patients and admins are not.
const STR_ROLES: Role[] = ['dokter', 'kontributor', 'verifikator']

const ROLES: { id: Role; title: string; desc: string }[] = [
  { id: 'pasien', title: 'Pelanggan / Pasien', desc: 'Dashboard hidup sehat, AI Chatbot, edukasi, nutrisi & Longevity, konsultasi, apotek & faskes' },
  { id: 'dokter', title: 'Dokter', desc: 'Khusus AI-EMR, Planning, konsultasi pasien' },
  { id: 'kontributor', title: 'Kontributor / Penulis', desc: 'Tulis, edit & unggah materi ke verifikator' },
  { id: 'verifikator', title: 'Verifikator', desc: 'AI + Subspesialis/Profesor mereview jurnal' },
  { id: 'admin', title: 'Admin (Layanan)', desc: 'Tangani keluhan via AI + manusia' },
  { id: 'owner', title: 'Owner', desc: 'Lihat keuntungan moneter perusahaan' },
]

export function Login({ onBack }: { onBack?: () => void }) {
  const { login, sendEmail, state } = useStore()
  const [role, setRole] = useState<Role>('pasien')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sex, setSex] = useState<'L' | 'P'>('L')
  const [age, setAge] = useState('')
  const [occupation, setOccupation] = useState('')
  const [background, setBackground] = useState('')
  const [str, setStr] = useState('')
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const [theme, setTheme] = useState<Theme>(getTheme)
  const roleRef = useRef<Role>('pasien')
  const consentRef = useRef(false)
  const gbtn = useRef<HTMLDivElement>(null)

  // Detect a configured backend; render the real Google button when available.
  useEffect(() => {
    if (!backendEnabled) return
    api.health().then(setHealth).catch(() => setError('Backend tidak terjangkau — memakai mode lokal.'))
  }, [])

  useEffect(() => {
    roleRef.current = role
  }, [role])
  useEffect(() => {
    consentRef.current = consent
  }, [consent])

  useEffect(() => {
    if (health?.googleClientId && gbtn.current) {
      renderGoogleButton(gbtn.current, health.googleClientId, (credential) => {
        if (!consentRef.current) {
          setError('Harap menyetujui Syarat, Kebijakan Privasi & Persetujuan Tindakan terlebih dahulu.')
          return
        }
        api
          .googleLogin(credential, roleRef.current)
          .then((acc) => login({ ...acc, isSubscriber: acc.role === 'owner', consentAt: new Date().toISOString(), strStatus: STR_ROLES.includes(acc.role) ? 'pending' : 'none' }))
          .catch(() => setError('Verifikasi Google gagal.'))
      }).catch(() => setError('Gagal memuat Google Sign-In.'))
    }
  }, [health, login])

  function pick(r: Role) {
    setRole(r)
  }

  function finish(account: Account) {
    login(account)
    // Register the doctor's STR number on the server so the Owner can verify it.
    // We never write strStatus here (would overwrite an existing 'verified').
    if (backendEnabled && STR_ROLES.includes(account.role) && account.str) {
      api.saveSettings({ str: account.str }).catch(() => {})
    }
    sendEmail({
      id: uid(),
      to: account.email,
      subject: 'Selamat datang di Panaceamed.id',
      body: `Halo ${account.name}, akun Anda (${account.role}) telah aktif. Informasi edukasi, diagnosis, dan penjadwalan akan dikirim ke email ini.`,
      at: new Date().toISOString(),
    })
  }

  function doLogin() {
    if (!consent) {
      setError('Harap menyetujui Syarat, Kebijakan Privasi & Persetujuan Tindakan terlebih dahulu.')
      return
    }
    const cleanEmail = (email.trim() || 'user@gmail.com').toLowerCase()
    const isOwner = cleanEmail === OWNER_EMAIL
    // Admin is restricted to owner-approved emails only.
    if (role === 'admin' && !isOwner && !state.adminEmails.includes(cleanEmail)) {
      setError('Email ini belum diizinkan sebagai Admin. Hubungi Owner untuk menambahkan email Anda.')
      return
    }
    // Clinical & content-authority roles must provide an STR / practice-licence.
    if (STR_ROLES.includes(role) && !str.trim()) {
      setError('Nomor STR / sertifikat praktik wajib diisi untuk peran Dokter, Kontributor/Penulis, dan Verifikator.')
      return
    }
    const account: Account = {
      email: cleanEmail,
      name: name.trim() || 'Pengguna Panaceamed',
      role,
      isSubscriber: role === 'owner',
      loggedAt: new Date().toISOString(),
      sex,
      age: age.trim() ? Number(age) : undefined,
      occupation: occupation.trim() || undefined,
      background: background.trim() || undefined,
      str: STR_ROLES.includes(role) ? str.trim() : undefined,
      strStatus: STR_ROLES.includes(role) ? 'pending' : 'none',
      consentAt: new Date().toISOString(),
      isOwner,
    }
    // Backend present → create a real server session (dev-login) for the wallet/API.
    if (backendEnabled) {
      api
        .devLogin(account.email, account.name, role)
        .then((acc) => finish({ ...acc, isSubscriber: account.isSubscriber }))
        .catch(() => finish(account)) // graceful fallback to local
      return
    }
    finish(account)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — animated */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute -left-16 top-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="orb absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-900/30 blur-3xl" style={{ animationDelay: '-8s' }} />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        <div className="relative">
          <Wordmark size={40} onDark />
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">
            Longevity Medical-AI <span className="animate-gradient-text bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">Co-Physician</span>
          </h1>
          <p className="mt-3 max-w-md text-white/85">
            AI melakukan anamnesis & edukasi; dokter memverifikasi. Catatan kedokteran ter-tokenisasi,
            pemantauan kontinu untuk healthspan.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['AI-EMR Bersertifikat', 'Longevity AI', 'Faskes Darurat', 'Apotek Digital'].map((t) => (
              <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/70">⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi.</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6">
        <button
          onClick={() => setTheme(toggleTheme())}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 shadow-sm transition hover:text-brand-dark"
          title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          aria-label="Ganti tema"
        >
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Wordmark size={34} />
          </div>
          {onBack && (
            <button onClick={onBack} className="mb-3 text-sm font-semibold text-neutral-500 hover:text-brand-dark">
              ← Kembali ke beranda
            </button>
          )}
          <h2 className="text-2xl font-extrabold">Masuk</h2>
          <p className="mt-1 text-sm text-neutral-500">Pilih peran lalu masuk dengan akun Google Anda.</p>

          {health?.googleClientId ? (
            <div ref={gbtn} className="mt-5 flex justify-center" />
          ) : (
            <button
              onClick={doLogin}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 font-semibold shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]"
            >
              <GoogleG /> Masuk dengan Google
            </button>
          )}
          {health?.features.otp && (
            <PhoneLogin
              role={role}
              consentOk={() => {
                if (!consent) { setError('Harap menyetujui Syarat, Kebijakan Privasi & Persetujuan Tindakan terlebih dahulu.'); return false }
                if (STR_ROLES.includes(role) && !str.trim()) { setError('Nomor STR / sertifikat praktik wajib untuk peran ini.'); return false }
                return true
              }}
              name={name}
              str={str}
              onLogin={(acc) => finish(acc)}
            />
          )}
          {error && <p className="mt-2 text-xs text-accent">{error}</p>}
          {backendEnabled && (
            <p className="mt-2 text-[11px] font-semibold text-brand-dark">
              ● Server aktif
              {health?.features.ai ? ' · AI LIVE' : ''}
              {health?.features.google ? ' · Google LIVE' : ''}
              {health?.features.payments ? ' · Pembayaran LIVE' : ''}
            </p>
          )}

          <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" /> atau isi manual <span className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</label>
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Nama Lengkap</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap Anda" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Jenis Kelamin</label>
                <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value as 'L' | 'P')}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Umur</label>
                <input className={inputClass} value={age} onChange={(e) => setAge(e.target.value)} type="number" placeholder="mis. 34" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Pekerjaan</label>
                <input className={inputClass} value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="mis. Karyawan" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Latar belakang (singkat)</label>
              <input className={inputClass} value={background} onChange={(e) => setBackground(e.target.value)} placeholder="mis. Riwayat hipertensi keluarga, ingin hidup lebih sehat" />
            </div>
            {STR_ROLES.includes(role) && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  No. STR / Sertifikat Praktik <span className="text-accent">*</span>
                </label>
                <input className={inputClass} value={str} onChange={(e) => setStr(e.target.value)} placeholder="Wajib — nasional atau internasional" />
                <p className="mt-1 text-[11px] text-neutral-400">
                  {role === 'dokter'
                    ? 'AI-EMR hanya untuk klinisi bersertifikat. STR diverifikasi sebelum akses penuh.'
                    : 'Kontributor & Verifikator wajib klinisi/akademisi bersertifikat — STR/sertifikat diverifikasi sebelum materi tayang.'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Masuk sebagai</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => pick(r.id)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    role === r.id ? 'border-brand bg-brand-50' : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <IconUser size={14} className="text-brand" /> {r.title}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl bg-neutral-50 p-3 text-[12px] leading-snug text-neutral-600">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#00BF63]" />
            <span>
              Saya telah membaca &amp; menyetujui <button type="button" onClick={() => setShowLegal(true)} className="font-bold text-brand-dark underline">Syarat &amp; Ketentuan, Kebijakan Privasi, dan Persetujuan Tindakan (Informed Consent)</button>. Saya memahami AI bersifat pendukung, bukan pengganti dokter.
            </span>
          </label>

          <Button onClick={doLogin} className="mt-4 w-full">
            Masuk sebagai {ROLES.find((r) => r.id === role)?.title}
          </Button>
          <p className="mt-3 text-center text-[11px] text-neutral-400">
            ⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi. Data Anda dilindungi sesuai UU PDP.
          </p>

          {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
        </div>
      </div>
    </div>
  )
}

// Phone-number + SMS OTP login (Twilio Verify). Only shown when the server has
// OTP configured (health.features.otp). Fast path for mobile users.
function PhoneLogin({ role, name, str, consentOk, onLogin }: {
  role: Role
  name: string
  str: string
  consentOk: () => boolean
  onLogin: (acc: Account) => void
}) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function start() {
    if (!consentOk()) return
    if (!phone.trim()) { setMsg('Masukkan nomor HP.'); return }
    setBusy(true); setMsg('')
    try {
      await api.otpStart(phone.trim())
      setSent(true)
      setMsg('Kode OTP dikirim via SMS. Cek pesan masuk Anda.')
    } catch {
      setMsg('Gagal mengirim OTP. Periksa nomor & coba lagi.')
    } finally { setBusy(false) }
  }

  async function verify() {
    if (!code.trim()) { setMsg('Masukkan kode OTP.'); return }
    setBusy(true); setMsg('')
    try {
      const acc = await api.otpVerify(phone.trim(), code.trim(), name.trim() || 'Pengguna Panaceamed', role)
      onLogin({
        ...acc,
        isSubscriber: role === 'owner',
        sex: 'L',
        str: STR_ROLES.includes(role) ? str.trim() : undefined,
        strStatus: STR_ROLES.includes(role) ? 'pending' : 'none',
        consentAt: new Date().toISOString(),
      })
    } catch {
      setMsg('Kode OTP salah atau kedaluwarsa.')
    } finally { setBusy(false) }
  }

  return (
    <div className="mt-3 rounded-2xl border border-brand/20 bg-brand-50/50 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-dark">📱 Masuk cepat dengan No. HP (OTP SMS)</div>
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="08xxxxxxxxxx"
          disabled={sent}
        />
        {!sent ? (
          <Button onClick={start} disabled={busy} className="shrink-0">{busy ? '…' : 'Kirim OTP'}</Button>
        ) : (
          <button onClick={() => { setSent(false); setCode(''); setMsg('') }} className="shrink-0 px-2 text-xs font-semibold text-neutral-500">Ubah</button>
        )}
      </div>
      {sent && (
        <div className="mt-2 flex gap-2">
          <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="Kode 6 digit" />
          <Button onClick={verify} disabled={busy} className="shrink-0">{busy ? '…' : 'Verifikasi'}</Button>
        </div>
      )}
      {msg && <p className="mt-1.5 text-[11px] font-semibold text-brand-dark">{msg}</p>}
    </div>
  )
}

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Persetujuan, Privasi & Ketentuan</h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">
          <p><b>Persetujuan Tindakan (Informed Consent).</b> Interaksi AI bersifat edukatif &amp; pendukung — bukan diagnosis final. Diagnosis &amp; terapi tetap memerlukan verifikasi dokter berlisensi.</p>
          <p><b>Privasi (UU PDP No. 27/2022).</b> Data kesehatan Anda adalah data pribadi spesifik, disimpan terenkripsi di Indonesia, dengan audit log akses. Anda berhak mengakses, memperbaiki, dan menghapus data kapan saja.</p>
          <p><b>Ketentuan.</b> AI-EMR hanya untuk klinisi dengan STR/SIP terverifikasi. Layanan apotek tunduk pada apoteker berizin &amp; BPOM. Dalam keadaan darurat, gunakan fitur Darurat SOS dan hubungi faskes terdekat.</p>
          <p className="text-xs text-neutral-400">Versi lengkap tersedia di menu “Privasi &amp; Legal” setelah masuk.</p>
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] py-2.5 text-sm font-bold text-white">Mengerti</button>
      </div>
    </div>
  )
}

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
