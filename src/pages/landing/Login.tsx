import { useEffect, useRef, useState } from 'react'
import { hariIni } from '../../lib/tanggal'
import { useStore, uid, OWNER_EMAIL } from '../../lib/store'
import { Wordmark } from '../../components/Logo'
import { Button, inputClass } from '../../components/ui'
import { IconSun, IconMoon } from '../../components/icons'
import { api, backendEnabled, renderGoogleButton, type Health } from '../../lib/api'
import { getTheme, toggleTheme, type Theme } from '../../lib/theme'
import { ageFromDob } from '../../lib/anthro'
import type { Account, Role } from '../../lib/types'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'

const STR_ROLES: Role[] = ['dokter', 'kontributor', 'verifikator']

const ROLES: { id: Role; title: string; desc: string }[] = [
  { id: 'pasien', title: 'Pasien & Umum', desc: 'Dasbor gaya hidup sehat, asisten edukasi kesehatan, gizi & longevity, konsultasi, serta fasilitas farmasi.' },
  { id: 'dokter', title: 'Dokter / Klinisi', desc: 'Akses modul AI-EMR, perencanaan klinis, dan konsultasi pasien berizin.' },
  { id: 'kontributor', title: 'Kontributor Medis', desc: 'Penulisan, kurasi, dan telaah materi edukasi kesehatan bersama tim verifikator.' },
  { id: 'verifikator', title: 'Verifikator Jurnal', desc: 'Penelaahan pustaka medis ilmiah dan validasi materi berbasis bukti.' },
  { id: 'admin', title: 'Admin / Dukungan', desc: 'Pengelolaan operasional platform dan koordinasi bantuan pengguna.' },
  { id: 'owner', title: 'Manajemen / Owner', desc: 'Pemantauan metrik operasional dan pertumbuhan platform.' },
]

/* ── Tiny helpers ────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</label>
      {children}
    </div>
  )
}

function Mini({ label, value, onChange, placeholder, numeric }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{label}</label>
      <input className={inputClass} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} inputMode={numeric ? 'numeric' : undefined} />
    </div>
  )
}

function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex min-h-[44px] w-full items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
        <span>{title}</span>
        <span className="text-[10px] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : '' }}>▼</span>
      </button>
      {open && <div className="space-y-3 border-t border-neutral-100 dark:border-neutral-800 px-3 py-3">{children}</div>}
    </div>
  )
}

/* ── Main Login ──────────────────────────────────────────── */

export function Login({ onBack }: { onBack?: () => void }) {
  const { login, sendEmail, state } = useStore()
  const [role, setRole] = useState<Role>('pasien')
  /** Pemilih peran hanya muncul bila diminta atau bila beralih ke klinisi. */
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
            setServerNotice('Sesi aktif dalam mode penyimpanan berkas/lokal. Akun tersimpan dengan aman di peramban ini.')
          } else {
            setServerNotice('')
          }
          return
        } catch {
          if (batal) return
          setServerNotice(i === 0
            ? 'Menghubungkan ke layanan server… instans gratis memerlukan waktu sekitar 50 detik untuk aktif.'
            : 'Masih menunggu respon server…')
          await new Promise((r) => setTimeout(r, 8000))
        }
      }
      if (!batal) setServerNotice('Layanan server belum terhubung — aplikasi berjalan dalam mode lokal dengan data tersimpan di perangkat ini.')
    }
    void coba()
    return () => { batal = true }
  }, [])

  useEffect(() => {
    if (!health?.googleClientId || !gbtn.current) return
    renderGoogleButton(gbtn.current, health.googleClientId, cred => {
      if (!consentRef.current) { setError('Harap setujui Syarat Layanan & Kebijakan Privasi.'); return }
      setError('')
      api.googleLogin(cred, roleRef.current)
        .then(a => login({ ...a, isOwner: a.email.toLowerCase() === OWNER_EMAIL, isSubscriber: a.role === 'owner', consentAt: new Date().toISOString(), strStatus: STR_ROLES.includes(a.role) ? 'pending' : 'none' }))
        .catch(() => setError('Verifikasi akun Google gagal.'))
    }).catch(() => setError('Gagal memuat tombol Google Sign-In.'))
  }, [health, login])

  /* shared consent guard for OTP sub-components */
  function consentOk() {
    if (!consent) { setError('Harap setujui Syarat Layanan & Kebijakan Privasi.'); return false }
    if (clinical && !f.str.trim()) { setError('Nomor STR wajib diisi untuk peran tenaga medis ini.'); return false }
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
      setError('Email ini belum terdaftar dengan otorisasi Admin.'); return
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
            AI-EMR & Longevity Medis{' '}
            <span className="animate-gradient-text bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">Ditinjau oleh Klinisi</span>
          </h1>
          <BatasKlaimKesehatan
            permukaan="care.login"
            className="mt-3 max-w-md text-[12px] leading-snug text-white/70"
          />
          <p className="mt-3 max-w-md text-white/85 text-sm leading-relaxed">
            AI mendukung anamnesis & edukasi kesehatan dengan peninjauan klinisi berizin. Rekam medis terstruktur,
            pemantauan vitalitas berkelanjutan untuk ketahanan hidup sehat.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['AI-EMR Terpadu', 'Estimasi Longevity', 'Pemantauan Vitalitas', 'Farmasi Digital'].map(t => (
              <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/70">⚕️ AI mendukung analisis data medis dan tidak menggantikan keputusan klinisi berizin.</p>
      </div>

      {/* ── Form panel ────────────────────────────── */}
      <div className="relative flex items-center justify-center p-6">
        <button onClick={() => setTheme(toggleTheme())}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 shadow-sm transition hover:text-brand-dark dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-brand"
          aria-label="Toggle theme">
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        <div className="w-full max-w-md space-y-5">
          <div className="lg:hidden"><Wordmark size={34} /></div>
          {onBack && (
            <button onClick={onBack} className="inline-flex min-h-[44px] items-center text-sm font-semibold text-neutral-500 hover:text-brand-dark transition-colors dark:text-neutral-400 dark:hover:text-brand">
              ← Kembali ke Beranda
            </button>
          )}

          <div>
            <h2 className="text-2xl font-extrabold text-ink">Masuk ke Akun Anda</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Cukup gunakan email dan nama. Informasi klinis atau riwayat tambahan dapat dilengkapi nanti.</p>
          </div>

          {/* ── Peran: Segmented switch (Pasien vs Klinisi) ────────── */}
          <div className="space-y-3">
            <div className="flex rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/50">
              <button
                type="button"
                onClick={() => { setRole('pasien'); setPilihPeran(false) }}
                className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'pasien' && !pilihPeran
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <span>👤</span>
                <span>Pasien & Publik</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (role === 'pasien') setRole('dokter')
                  setPilihPeran(true)
                }}
                className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  pilihPeran || role !== 'pasien'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <span>🩺</span>
                <span>Klinisi / Medis (STR)</span>
              </button>
            </div>

            {(pilihPeran || role !== 'pasien') && (
              <div className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/60">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Pilih Peran Medis
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Kredensial STR Diperlukan</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROLES.filter(r => r.id !== 'pasien').map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`min-h-[44px] rounded-xl border px-2 py-1 text-center text-[11px] font-bold leading-snug transition ${
                        role === r.id
                          ? 'border-brand bg-brand-50 text-brand-dark dark:border-brand dark:bg-brand/10 dark:text-brand'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{cur.desc}</p>
              </div>
            )}
          </div>

          {/* ── Quick login (Google) ────────────────── */}
          {health?.googleClientId
            ? <div ref={gbtn} className="flex justify-center" />
            : <button onClick={doLogin}
                className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 font-semibold shadow-sm transition hover:bg-neutral-50 active:scale-[0.99] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700">
                <GoogleG /> Masuk dengan Google
              </button>
          }
          {health?.features.otpEmail && (
            <EmailOtpLogin role={role} consentOk={consentOk} name={f.name} str={f.str}
              email={f.email} setEmail={v => setF(p => ({ ...p, email: v }))} onLogin={finish} />
          )}

          {/* ── Consent ────────────────────────── */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-3 text-[12px] leading-snug text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#00BF63]" />
            <span>Saya menyetujui{' '}
              <button type="button" onClick={() => setShowLegal(true)}
                className="font-bold text-brand-dark underline dark:text-brand hover:opacity-85">Syarat Layanan & Kebijakan Privasi</button>.
              AI adalah asisten suportif, bukan pengganti konsultasi langsung dengan dokter.</span>
          </label>

          {/* ── Error message ──────────────────── */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs font-semibold text-accent dark:border-accent/30 dark:bg-accent/10">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Server notice (gentle informative) ── */}
          {serverNotice && (
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
              <span className="shrink-0 text-base leading-none">ℹ️</span>
              <span className="leading-relaxed">{serverNotice}</span>
            </div>
          )}

          {backendEnabled && (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-brand-dark dark:text-brand">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span>Layanan Server Aktif{health?.features.ai ? ' · AI' : ''}{health?.features.google ? ' · Google' : ''}{health?.features.payments ? ' · Pembayaran' : ''}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span>atau lengkapi formulir manual</span>
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* ── Adaptive form fields ───────────── */}
          <div className="space-y-3">
            <Field label="Alamat Email">
              <input className={inputClass} value={f.email}
                onChange={e => setF(p => ({ ...p, email: e.target.value }))} type="email" placeholder="nama@email.com" />
            </Field>
            <Field label="Nama Lengkap">
              <input className={inputClass} value={f.name}
                onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap Anda" />
            </Field>

            {!simple && (
              <Collapse title="Data Tambahan untuk Akurasi Vitalitas (Opsional)">
                <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Usia dan jenis kelamin biologis digunakan untuk memperkirakan denyut jantung maksimal dan kebutuhan energi harian. Tanpa data ini, estimasi akan menggunakan nilai rata-rata umum.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Jenis Kelamin</label>
                    <select className={inputClass} value={f.sex}
                      onChange={e => setF(p => ({ ...p, sex: e.target.value as 'L' | 'P' }))}>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Tanggal Lahir</label>
                    <input className={inputClass} value={f.dob}
                      onChange={e => setF(p => ({ ...p, dob: e.target.value }))} type="date"
                      max={hariIni()} />
                    {f.dob && <p className="mt-0.5 text-[11px] text-brand-dark dark:text-brand">Usia: {ageFromDob(f.dob)} tahun</p>}
                  </div>
                </div>
              </Collapse>
            )}

            {/* STR — clinical roles */}
            {clinical && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Nomor STR <span className="text-accent">*</span>
                  </label>
                  <input className={inputClass} value={f.str}
                    onChange={e => setF(p => ({ ...p, str: e.target.value }))}
                    placeholder="Wajib diisi — Nomor STR atau sertifikat kompetensi" />
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {role === 'dokter' ? 'Modul AI-EMR hanya diperuntukkan bagi klinisi berizin.' : 'Wajib bagi tenaga medis, akademisi, dan kontributor berizin.'}
                  </p>
                </div>

                <Collapse title="Riwayat Pendidikan & Kredensial Medis">
                  {role === 'kontributor' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Mini label="Gelar Akademik" value={f.gelar} onChange={v => setF(p => ({ ...p, gelar: v }))} placeholder="dr., Sp.PD" />
                      <Mini label="Spesialisasi" value={f.spesialis} onChange={v => setF(p => ({ ...p, spesialis: v }))} placeholder="Penyakit Dalam" />
                    </div>
                  )}
                  {role === 'verifikator' && (
                    <Mini label="Subspesialisasi" value={f.subspesialis} onChange={v => setF(p => ({ ...p, subspesialis: v }))} placeholder="Gastroenterohepatologi" />
                  )}
                  <Mini label="Bidang Keahlian" value={f.keahlian} onChange={v => setF(p => ({ ...p, keahlian: v }))} placeholder="Kardiologi preventif, umur panjang (longevity)" />
                  <div className="grid grid-cols-2 gap-2">
                    <Mini label="Universitas / Institusi" value={f.universitas} onChange={v => setF(p => ({ ...p, universitas: v }))} placeholder="Universitas Indonesia" />
                    <Mini label="Tahun Kelulusan" value={f.tahunLulus} onChange={v => setF(p => ({ ...p, tahunLulus: v.replace(/\D/g, '').slice(0, 4) }))} placeholder="2018" numeric />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">Unggah Berkas Kredensial (PDF)</label>
                    <input type="file" accept="application/pdf"
                      onChange={e => setF(p => ({ ...p, pdfName: e.target.files?.[0]?.name ?? '' }))}
                      className="block w-full text-xs text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
                    {f.pdfName && <p className="mt-1 text-[11px] text-brand-dark dark:text-brand">✓ {f.pdfName}</p>}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Berkas akan ditinjau sebelum otorisasi penuh diaktifkan.</p>
                </Collapse>
              </>
            )}

            {/* Optional pasien details */}
            {role === 'pasien' && (
              <Collapse title="Informasi Tambahan Pasien (Opsional)">
                <div className="grid grid-cols-2 gap-2">
                  <Mini label="Profesi / Pekerjaan" value={f.occupation} onChange={v => setF(p => ({ ...p, occupation: v }))} placeholder="Karyawan swasta" />
                </div>
                <Mini label="Riwayat Kesehatan Singkat" value={f.background} onChange={v => setF(p => ({ ...p, background: v }))} placeholder="Riwayat hipertensi keluarga, alergi, dll." />
              </Collapse>
            )}
          </div>

          <Button onClick={doLogin} className="w-full min-h-[44px]">
            {role === 'pasien' ? 'Masuk ke Akun Sekarang' : `Masuk sebagai ${cur.title}`}
          </Button>
          <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
            🔒 Seluruh data terenkripsi dan terlindungi di bawah UU Perlindungan Data Pribadi (UU PDP No. 27/2022).
          </p>
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
    if (!email.trim()) { setMsg('Harap masukkan alamat email Anda.'); return }
    setBusy(true); setMsg('')
    try { await api.emailOtpStart(email.trim()); setSent(true); setMsg('Kode verifikasi telah dikirim ke email Anda.') }
    catch { setMsg('Gagal mengirim kode verifikasi.') } finally { setBusy(false) }
  }

  async function verify() {
    if (!code.trim()) { setMsg('Harap masukkan kode dari email Anda.'); return }
    setBusy(true); setMsg('')
    try {
      const a = await api.emailOtpVerify(email.trim(), code.trim(), name.trim() || 'Pengguna Panacea', role)
      onLogin({ ...a, isOwner: a.email.toLowerCase() === OWNER_EMAIL, isSubscriber: role === 'owner', sex: 'L',
        str: STR_ROLES.includes(role) ? str.trim() : undefined,
        strStatus: STR_ROLES.includes(role) ? 'pending' : 'none', consentAt: new Date().toISOString() })
    } catch { setMsg('Kode verifikasi salah atau sudah kedaluwarsa.') } finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-50/50 p-3 dark:border-brand/30 dark:bg-brand/10">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-dark dark:text-brand">✉️ Masuk Cepat via Kode Email (OTP Gratis)</div>
      <div className="flex gap-2">
        <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)}
          type="email" placeholder="nama@email.com" disabled={sent} />
        {!sent
          ? <Button onClick={start} disabled={busy} className="shrink-0 min-h-[44px]">{busy ? '…' : 'Kirim Kode'}</Button>
          : <button onClick={() => { setSent(false); setCode(''); setMsg('') }} className="shrink-0 px-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 min-h-[44px]">Ganti</button>}
      </div>
      {sent && (
        <div className="mt-2 flex gap-2">
          <input className={inputClass} value={code} onChange={e => setCode(e.target.value)}
            inputMode="numeric" placeholder="6 digit kode" />
          <Button onClick={verify} disabled={busy} className="shrink-0 min-h-[44px]">{busy ? '…' : 'Verifikasi'}</Button>
        </div>
      )}
      {msg && <p className="mt-1.5 text-[11px] font-semibold text-brand-dark dark:text-brand">{msg}</p>}
    </div>
  )
}

/* ── Legal modal ─────────────────────────────────────────── */

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-ink">Persetujuan Klinis, Privasi & Ketentuan Layanan</h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p><b>Informed Consent.</b> Interaksi dengan asisten AI bersifat edukatif dan suportif untuk membantu analisis kesehatan, bukan diagnosis medis akhir. Diagnosis resmi dan keputusan terapi tetap memerlukan verifikasi langsung oleh dokter berizin.</p>
          <p><b>Privasi (UU Perlindungan Data Pribadi No. 27/2022).</b> Data kesehatan Anda adalah data pribadi spesifik yang disimpan terenkripsi dengan audit log akses yang ketat. Anda memiliki hak penuh untuk mengakses, memperbarui, atau menghapus riwayat data Anda kapan saja.</p>
          <p><b>Ketentuan Profesi.</b> Modul AI-EMR khusus diperuntukkan bagi klinisi terdaftar dengan STR/SIP aktif. Layanan kefarmasian tunduk pada regulasi BPOM dan pengawasan apoteker berlisensi. Dalam situasi darurat medis, gunakan fitur Darurat SOS atau segera hubungi IGD rumah sakit terdekat.</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Ketentuan lengkap dapat diakses kembali melalui menu "Privasi & Legalitas" setelah Anda masuk.</p>
        </div>
        <button onClick={onClose}
          className="mt-5 w-full rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 min-h-[44px]">
          Saya Mengerti & Setuju
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
