import { useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Wordmark } from '../components/Logo'
import { Button, inputClass } from '../components/ui'
import { IconUser } from '../components/icons'
import type { Account, Role } from '../lib/types'

const ROLES: { id: Role; title: string; desc: string }[] = [
  { id: 'pasien', title: 'Pelanggan / Pasien', desc: 'AI Chatbot, edukasi, nutrisi, sosial, konsultasi & cari RS' },
  { id: 'dokter', title: 'Dokter', desc: 'Khusus AI-EMR, Planning, konsultasi pasien' },
  { id: 'kontributor', title: 'Kontributor / Penulis', desc: 'Tulis, edit & unggah materi ke verifikator' },
  { id: 'verifikator', title: 'Verifikator', desc: 'AI + Subspesialis/Profesor mereview jurnal' },
  { id: 'admin', title: 'Admin (Layanan)', desc: 'Tangani keluhan via AI + manusia' },
  { id: 'owner', title: 'Owner', desc: 'Lihat keuntungan moneter perusahaan' },
]

const DEFAULT_NAME: Record<Role, string> = {
  pasien: 'Bpk. Hartono Wijaya',
  dokter: 'dr. Pemeriksa, Sp.PD',
  kontributor: 'dr. Maya Lestari',
  verifikator: 'Prof. dr. Rina Kusuma, Sp.PD-KGEH',
  admin: 'Admin Panaceamed',
  owner: 'Owner Panaceamed',
}

export function Login() {
  const { login, sendEmail } = useStore()
  const [role, setRole] = useState<Role>('pasien')
  const [email, setEmail] = useState('rizkyazhar486@gmail.com')
  const [name, setName] = useState(DEFAULT_NAME['pasien'])

  function pick(r: Role) {
    setRole(r)
    setName(DEFAULT_NAME[r])
  }

  function doLogin() {
    const account: Account = {
      email: email.trim() || 'user@gmail.com',
      name: name.trim() || DEFAULT_NAME[role],
      role,
      isSubscriber: role === 'owner', // owner must subscribe too — prompt later
      patientId: role === 'pasien' || role === 'dokter' ? 'p1' : undefined,
      loggedAt: new Date().toISOString(),
    }
    login(account)
    // Simulate emailing registration + onboarding info to the account email.
    sendEmail({
      id: uid(),
      to: account.email,
      subject: 'Selamat datang di Panaceamed.id',
      body: `Halo ${account.name}, akun Anda (${account.role}) telah aktif. Informasi edukasi, diagnosis, dan penjadwalan akan dikirim ke email ini.`,
      at: new Date().toISOString(),
    })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] p-10 text-white lg:flex">
        <Wordmark size={40} onDark />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Longevity Medical-AI Co-Physician</h1>
          <p className="mt-3 max-w-md text-white/85">
            AI melakukan anamnesis & edukasi; dokter memverifikasi. Catatan kedokteran ter-tokenisasi,
            pemantauan kontinu untuk healthspan.
          </p>
        </div>
        <p className="text-xs text-white/70">⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Wordmark size={34} />
          </div>
          <h2 className="text-2xl font-extrabold">Masuk</h2>
          <p className="mt-1 text-sm text-neutral-500">Pilih peran lalu masuk dengan akun Google Anda.</p>

          <button
            onClick={doLogin}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 font-semibold shadow-sm transition hover:bg-neutral-50"
          >
            <GoogleG /> Masuk dengan Google
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" /> atau isi manual <span className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</label>
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Nama</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
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

          <Button onClick={doLogin} className="mt-5 w-full">
            Masuk sebagai {ROLES.find((r) => r.id === role)?.title}
          </Button>
          <p className="mt-3 text-center text-[11px] text-neutral-400">
            Demo — login & Google disimulasikan. Semua peran termasuk Owner wajib menjadi pelanggan.
          </p>
        </div>
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
