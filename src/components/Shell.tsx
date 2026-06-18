import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { LogoMark } from './Logo'
import {
  IconDashboard,
  IconChat,
  IconEMR,
  IconPlan,
  IconSettings,
  IconStore,
  IconWallet,
  IconShield,
  IconToken,
  IconBook,
  IconArchitecture,
  IconUsers,
  IconFood,
  IconStethoscope,
  IconHospital,
  IconChartUp,
  IconLogout,
} from './icons'
import { useStore } from '../lib/store'
import { ageFromDob } from '../lib/anthro'
import { Badge } from './ui'
import { Login } from '../pages/Login'
import { ContactService } from './ContactService'
import type { Role } from '../lib/types'

type Nav = { to: string; label: string; icon: typeof IconDashboard; roles: Role[]; end?: boolean }

const ALL: Role[] = ['pasien', 'dokter', 'kontributor', 'verifikator', 'admin', 'owner']

const nav: Nav[] = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, roles: ['dokter', 'owner'], end: true },
  { to: '/chatbot', label: 'AI Chatbot', icon: IconChat, roles: ['pasien', 'dokter'] },
  { to: '/emr', label: 'AI-EMR', icon: IconEMR, roles: ['dokter'] },
  { to: '/planning', label: 'Planning', icon: IconPlan, roles: ['dokter'] },
  { to: '/education', label: 'Edukasi Saya', icon: IconBook, roles: ['pasien'] },
  { to: '/nutrition', label: 'Nutrisi & Kalori', icon: IconFood, roles: ['pasien'] },
  { to: '/consult', label: 'Konsultasi Dokter', icon: IconStethoscope, roles: ['pasien', 'dokter'] },
  { to: '/hospitals', label: 'Cari Rumah Sakit', icon: IconHospital, roles: ['pasien', 'dokter'] },
  { to: '/social', label: 'Sosial', icon: IconUsers, roles: ALL },
  { to: '/editor', label: 'Tulis Materi', icon: IconBook, roles: ['kontributor'] },
  { to: '/marketplace', label: 'Marketplace', icon: IconStore, roles: ['pasien', 'dokter', 'kontributor', 'verifikator', 'owner'] },
  { to: '/my-materials', label: 'Materi Saya', icon: IconBook, roles: ['kontributor'] },
  { to: '/verification', label: 'Verifikasi', icon: IconShield, roles: ['verifikator'] },
  { to: '/admin', label: 'Layanan & Admin', icon: IconStethoscope, roles: ['admin'] },
  { to: '/owner', label: 'Owner — Keuntungan', icon: IconChartUp, roles: ['owner'] },
  { to: '/billing', label: 'Billing & Token', icon: IconWallet, roles: ALL },
  { to: '/architecture', label: 'Arsitektur CDSS', icon: IconArchitecture, roles: ['dokter', 'owner', 'admin'] },
  { to: '/settings', label: 'Pengaturan', icon: IconSettings, roles: ALL },
]

const PATIENT_PAGES = ['/', '/chatbot', '/emr', '/planning']

const roleLabel: Record<Role, string> = {
  pasien: 'Pelanggan/Pasien',
  dokter: 'Dokter',
  kontributor: 'Kontributor',
  verifikator: 'Verifikator',
  admin: 'Admin',
  owner: 'Owner',
}

const riskLabel: Record<string, string> = {
  chronic: 'Penyakit Kronis',
  elderly: 'Lansia',
  immunocompromised: 'Immunocompromised',
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, activePatient, setActivePatient, logout } = useStore()
  const loc = useLocation()
  const account = state.account

  if (!account) return <Login />

  const items = nav.filter((n) => n.roles.includes(account.role))
  const title = items.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))
  const showPatient = PATIENT_PAGES.includes(loc.pathname) && (account.role === 'dokter' || account.role === 'owner')

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/5 bg-white px-4 py-6 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <LogoMark size={38} />
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight">
              Panacea<span className="text-brand">med</span>
              <span className="text-accent">.id</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Longevity Medical-AI
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-brand-50 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">Masuk sebagai</div>
          <div className="truncate text-sm font-bold">{account.name}</div>
          <div className="text-[11px] text-neutral-500">{roleLabel[account.role]}</div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-50 text-brand-dark' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                }`
              }
            >
              <n.icon size={20} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-50"
        >
          <IconLogout size={18} /> Keluar
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-white/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="lg:hidden"><LogoMark size={30} /></span>
            <h1 className="text-lg font-bold">{title?.label ?? 'Panaceamed.id'}</h1>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/billing"
              className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm font-bold text-white"
              title="Saldo PanaceaToken"
            >
              <IconToken size={16} className="text-brand" />
              {state.wallet.balance}
              <span className="text-[10px] font-semibold text-white/60">PNC</span>
            </NavLink>
            {showPatient && (
              <div
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1"
                title="Identitas pasien aktif"
              >
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white"
                  style={{ background: activePatient.avatarColor }}
                >
                  {activePatient.name.replace(/^[^ ]+ /, '').slice(0, 2).toUpperCase()}
                </span>
                <select
                  value={state.activePatientId}
                  onChange={(e) => setActivePatient(e.target.value)}
                  className="max-w-[160px] cursor-pointer bg-transparent text-sm font-semibold outline-none"
                >
                  {state.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {ageFromDob(p.dob)}th
                    </option>
                  ))}
                </select>
              </div>
            )}
            {showPatient && (
              <div className="hidden items-center gap-1.5 xl:flex">
                {activePatient.riskFlags.map((r) => (
                  <Badge key={r} tone="high">{riskLabel[r]}</Badge>
                ))}
              </div>
            )}
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-black/5 bg-white px-3 py-2 lg:hidden">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  isActive ? 'bg-brand-50 text-brand-dark' : 'text-neutral-500'
                }`
              }
            >
              <n.icon size={16} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>

      <ContactService />
    </div>
  )
}
