import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect, type ReactNode } from 'react'
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
  IconFood,
  IconStethoscope,
  IconChartUp,
  IconLogout,
  IconHeart,
  IconPill,
  IconHospital,
  IconMoon,
  IconSun,
} from './icons'
import { useStore } from '../lib/store'
import { getTheme, toggleTheme, type Theme } from '../lib/theme'
import { ageFromDob } from '../lib/anthro'
import { Badge } from './ui'
import { Login } from '../pages/Login'
import { Landing } from '../pages/Landing'
import { ContactService } from './ContactService'
import { NotificationBell } from './NotificationBell'
import { api, backendEnabled } from '../lib/api'
import type { Role } from '../lib/types'

// Public entry: marketing landing first, then the login screen on demand.
function PublicEntry() {
  const [showLogin, setShowLogin] = useState(false)
  return showLogin ? <Login onBack={() => setShowLogin(false)} /> : <Landing onMasuk={() => setShowLogin(true)} />
}

type Nav = { to: string; label: string; icon: typeof IconDashboard; roles: Role[]; end?: boolean }

const ALL: Role[] = ['pasien', 'dokter', 'kontributor', 'verifikator', 'admin', 'owner']

const nav: Nav[] = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, roles: ['pasien', 'dokter', 'owner'], end: true },
  { to: '/chatbot', label: 'AI Chatbot', icon: IconChat, roles: ['pasien', 'dokter'] },
  { to: '/clinical', label: 'Data Klinis Pasien', icon: IconHeart, roles: ['dokter'] },
  { to: '/emr', label: 'AI-EMR', icon: IconEMR, roles: ['dokter'] },
  { to: '/planning', label: 'Planning', icon: IconPlan, roles: ['dokter'] },
  { to: '/education', label: 'Edukasi Saya', icon: IconBook, roles: ['pasien'] },
  { to: '/nutrition', label: 'Nutrisi & Kalori', icon: IconFood, roles: ['pasien'] },
  { to: '/consult', label: 'Konsultasi Dokter', icon: IconStethoscope, roles: ['pasien', 'dokter'] },
  { to: '/hospitals', label: 'Faskes Terdekat', icon: IconHospital, roles: ['pasien', 'dokter'] },
  { to: '/pharmacy', label: 'Apotek', icon: IconPill, roles: ['pasien', 'dokter'] },
  { to: '/orders', label: 'Riwayat Transaksi', icon: IconWallet, roles: ['pasien'] },
  { to: '/editor', label: 'Tulis Materi', icon: IconBook, roles: ['kontributor'] },
  { to: '/marketplace', label: 'Marketplace', icon: IconStore, roles: ['pasien', 'dokter', 'kontributor', 'verifikator', 'owner'] },
  { to: '/my-materials', label: 'Materi Saya', icon: IconBook, roles: ['kontributor'] },
  { to: '/verification', label: 'Verifikasi', icon: IconShield, roles: ['verifikator'] },
  { to: '/admin', label: 'Layanan & Admin', icon: IconStethoscope, roles: ['admin'] },
  { to: '/owner', label: 'Owner — Keuntungan', icon: IconChartUp, roles: ['owner'] },
  { to: '/billing', label: 'Billing & Token', icon: IconWallet, roles: ALL },
  { to: '/architecture', label: 'Arsitektur CDSS', icon: IconArchitecture, roles: ['admin'] },
  { to: '/settings', label: 'Pengaturan', icon: IconSettings, roles: ALL },
  { to: '/legal', label: 'Privasi & Legal', icon: IconShield, roles: ALL },
]

// Pages that show the active-patient context. Patients see only their own data
// (no selector); doctors manage patients via the selector.
const PATIENT_PAGES = ['/clinical', '/chatbot', '/emr', '/planning']

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
  const { state, activePatient, setActivePatient, logout, setMode } = useStore()
  const loc = useLocation()
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const account = state.account

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMenuOpen(false) }, [loc.pathname])

  if (!account) return <PublicEntry />

  const items = nav.filter((n) => n.roles.includes(account.role))
  const title = items.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))
  // Only doctors switch between patients; patients see their own data only.
  const showPatient = PATIENT_PAGES.includes(loc.pathname) && account.role === 'dokter'
  // Quick actions (mobile): the role's most useful destinations, minus the
  // utility pages — one-tap shortcuts beside the hamburger menu.
  const quick = items.filter((n) => !['/settings', '/legal', '/billing', '/architecture'].includes(n.to)).slice(0, 6)
  const doLogout = () => { if (backendEnabled) api.logout().catch(() => {}); logout() }

  return (
    <div className="relative flex min-h-screen">
      {/* Ambient animated backdrop — sits behind every page */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb absolute -left-32 top-10 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="orb absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" style={{ animationDelay: '-8s' }} />
        <div className="orb absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" style={{ animationDelay: '-14s' }} />
      </div>
      <aside className="sticky top-0 z-10 hidden h-screen w-64 shrink-0 flex-col border-r border-black/5 bg-white/80 px-4 py-6 backdrop-blur-xl lg:flex">
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
                `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-50 text-brand-dark font-bold' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                }`
              }
            >
              <n.icon size={20} />
              {n.label}
            </NavLink>
          ))}
        </nav>

        {(account.role === 'pasien' || account.role === 'dokter') && (
          <NavLink
            to="/hospitals"
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-accent/10 px-3 py-2.5 text-sm font-bold text-accent transition hover:bg-accent/20"
          >
            <IconHospital size={18} /> Darurat (SOS)
          </NavLink>
        )}
        <button
          onClick={() => {
            if (backendEnabled) api.logout().catch(() => {})
            logout()
          }}
          className="mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-50"
        >
          <IconLogout size={18} /> Keluar
        </button>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral-100 lg:hidden"
              aria-label="Buka menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
            <span className="shrink-0 lg:hidden"><LogoMark size={26} /></span>
            <h1 className="truncate text-base font-bold sm:text-lg">{title?.label ?? 'Panaceamed.id'}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <button
              onClick={() => setTheme(toggleTheme())}
              className="grid h-9 w-9 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-brand-dark"
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              aria-label="Ganti tema"
            >
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            {account.isOwner && (
              <label className="flex items-center gap-1.5 rounded-xl border border-brand bg-brand-50 px-2 py-1" title="Owner — pindah mode akses">
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand-dark">Mode</span>
                <select
                  value={account.role}
                  onChange={(e) => setMode(e.target.value as Role)}
                  className="cursor-pointer bg-transparent text-sm font-bold text-brand-dark outline-none"
                >
                  {ALL.map((r) => (
                    <option key={r} value={r}>{roleLabel[r]}</option>
                  ))}
                </select>
              </label>
            )}
            <NavLink
              to="/billing"
              className="flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm font-bold text-white"
              title="Saldo PanaceaToken"
            >
              <IconToken size={16} className="text-brand" />
              {state.wallet.balance}
              <span className="text-[10px] font-semibold text-white/60">PNC</span>
            </NavLink>
            {/* Mobile-only exit/logout — the sidebar Keluar is hidden on phones */}
            <button
              onClick={() => {
                if (backendEnabled) api.logout().catch(() => {})
                logout()
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent transition hover:bg-accent/20 lg:hidden"
              title="Keluar"
              aria-label="Keluar"
            >
              <IconLogout size={18} />
            </button>
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

        {/* Quick actions — one-tap shortcuts (mobile only) */}
        <div className="flex gap-2 overflow-x-auto border-b border-black/5 bg-white px-3 py-2 lg:hidden">
          <span className="flex shrink-0 items-center pr-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Cepat</span>
          {quick.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                  isActive ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'
                }`
              }
            >
              <n.icon size={15} />
              {n.label}
            </NavLink>
          ))}
          {(account.role === 'pasien' || account.role === 'dokter') && (
            <NavLink to="/hospitals" className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
              <IconHospital size={15} /> SOS
            </NavLink>
          )}
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <div key={loc.pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile drawer — full menu (different & friendlier than the desktop sidebar) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-white shadow-2xl drawer-in">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <LogoMark size={34} />
                <div className="leading-tight">
                  <div className="text-base font-extrabold tracking-tight">Panacea<span className="text-brand">med</span><span className="text-accent">.id</span></div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{roleLabel[account.role]}</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-2xl leading-none text-neutral-400 hover:bg-neutral-100" aria-label="Tutup menu">×</button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
              {items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition ${
                      isActive ? 'bg-brand-50 text-brand-dark font-bold' : 'text-neutral-600 hover:bg-neutral-50'
                    }`
                  }
                >
                  <n.icon size={20} />
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-black/5 p-3">
              {(account.role === 'pasien' || account.role === 'dokter') && (
                <NavLink to="/hospitals" className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-accent/10 px-3 py-3 text-sm font-bold text-accent">
                  <IconHospital size={18} /> Darurat (SOS)
                </NavLink>
              )}
              <button onClick={doLogout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-bold text-neutral-600">
                <IconLogout size={18} /> Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      <ContactService />
    </div>
  )
}
