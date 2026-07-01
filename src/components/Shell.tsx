import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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
  IconTimer,
  IconPill,
  IconHospital,
  IconMoon,
  IconSun,
  IconRun,
  IconUsers,
  IconFlame,
  IconSparkle,
  IconHome,
  IconActivity,
  IconPlus,
  IconUser,
} from './icons'
import { useStore } from '../lib/store'
import { getTheme, toggleTheme, type Theme } from '../lib/theme'
import { ageFromDob } from '../lib/anthro'
import { Badge } from './ui'
import { Login } from '../pages/Login'
import { Landing } from '../pages/Landing'
import { ContactService } from './ContactService'
import { NotificationBell } from './NotificationBell'
import { InstallBanner } from './InstallApp'
import { OnboardingTour } from './OnboardingTour'
import { api, backendEnabled } from '../lib/api'
import { trackVisit, rankByUsage } from '../lib/usage'
import type { Role } from '../lib/types'

// Public entry: marketing landing first, then the login screen on demand.
function PublicEntry() {
  const [showLogin, setShowLogin] = useState(false)
  return showLogin ? <Login onBack={() => setShowLogin(false)} /> : <Landing onMasuk={() => setShowLogin(true)} />
}

type Nav = { to: string; label: string; icon: typeof IconDashboard; roles: Role[]; end?: boolean; group?: string }

const ALL: Role[] = ['pasien', 'dokter', 'kontributor', 'verifikator', 'admin', 'owner']

// Sidebar groups (accordion sections) — order defines display order. Grouped by
// intent with short labels so the menu stays scannable and icon-led.
const GROUP_ORDER = ['Beranda', 'Kesehatan', 'Kebugaran', 'Klinis & AI', 'Layanan', 'Konten', 'Kelola', 'Akun']

const nav: Nav[] = [
  // Beranda (rendered as plain links — the most-used, social-first destinations)
  { to: '/', label: 'Beranda', icon: IconHome, roles: ['pasien', 'dokter', 'owner'], end: true, group: 'Beranda' },
  { to: '/community', label: 'Community', icon: IconUsers, roles: ['pasien', 'dokter', 'owner'], group: 'Beranda' },
  { to: '/messages', label: 'Pesan', icon: IconChat, roles: ['pasien', 'dokter', 'owner'], group: 'Beranda' },
  { to: '/logs', label: 'Log & Statistik', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Beranda' },
  { to: '/profile', label: 'Profil', icon: IconUser, roles: ['pasien', 'dokter', 'owner'], group: 'Beranda' },
  // Kesehatan
  { to: '/vitapulse', label: 'VitaPulse', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Kesehatan' },
  { to: '/nutrition', label: 'Nutrisi', icon: IconFood, roles: ['pasien'], group: 'Kesehatan' },
  { to: '/education', label: 'Edukasi', icon: IconBook, roles: ['pasien'], group: 'Kesehatan' },
  { to: '/recovery', label: 'Recovery', icon: IconMoon, roles: ['pasien', 'dokter'], group: 'Kesehatan' },
  // Kebugaran
  { to: '/athlete', label: 'Atlet', icon: IconRun, roles: ['pasien', 'dokter'], group: 'Kebugaran' },
  { to: '/workout', label: 'Workout', icon: IconFlame, roles: ['pasien', 'dokter'], group: 'Kebugaran' },
  { to: '/fitness-test', label: 'Tes Fisik', icon: IconActivity, roles: ['pasien', 'dokter'], group: 'Kebugaran' },
  { to: '/training-plan', label: 'Program AI', icon: IconTimer, roles: ['pasien', 'dokter'], group: 'Kebugaran' },
  { to: '/body', label: 'Komposisi Tubuh', icon: IconHeart, roles: ['pasien', 'dokter'], group: 'Kebugaran' },
  { to: '/sports-science', label: 'Sains & KPI', icon: IconChartUp, roles: ['pasien', 'dokter'], group: 'Kebugaran' },
  { to: '/shape-forming', label: 'Shape Forming', icon: IconSparkle, roles: ['pasien'], group: 'Kebugaran' },
  // Klinis & AI
  { to: '/chatbot', label: 'AI Chatbot', icon: IconChat, roles: ['pasien', 'dokter'], group: 'Klinis & AI' },
  { to: '/clinical', label: 'Data Klinis', icon: IconHeart, roles: ['dokter'], group: 'Klinis & AI' },
  { to: '/emr', label: 'AI-EMR', icon: IconEMR, roles: ['dokter'], group: 'Klinis & AI' },
  { to: '/planning', label: 'Planning', icon: IconPlan, roles: ['dokter'], group: 'Klinis & AI' },
  { to: '/sexual-health', label: 'Seksual & Obgyn', icon: IconUsers, roles: ['pasien', 'dokter'], group: 'Klinis & AI' },
  // Layanan
  { to: '/consult', label: 'Konsultasi', icon: IconStethoscope, roles: ['pasien', 'dokter'], group: 'Layanan' },
  { to: '/hospitals', label: 'Faskes', icon: IconHospital, roles: ['pasien', 'dokter'], group: 'Layanan' },
  { to: '/pharmacy', label: 'Apotek', icon: IconPill, roles: ['pasien', 'dokter'], group: 'Layanan' },
  { to: '/orders', label: 'Transaksi', icon: IconWallet, roles: ['pasien'], group: 'Layanan' },
  // Konten
  { to: '/editor', label: 'Tulis Materi', icon: IconBook, roles: ['kontributor'], group: 'Konten' },
  { to: '/marketplace', label: 'Marketplace', icon: IconStore, roles: ['pasien', 'dokter', 'kontributor', 'verifikator', 'owner'], group: 'Konten' },
  { to: '/my-materials', label: 'Materi Saya', icon: IconBook, roles: ['kontributor'], group: 'Konten' },
  { to: '/verification', label: 'Verifikasi', icon: IconShield, roles: ['verifikator'], group: 'Konten' },
  // Kelola
  { to: '/admin', label: 'Admin', icon: IconStethoscope, roles: ['admin'], group: 'Kelola' },
  { to: '/owner', label: 'Owner', icon: IconChartUp, roles: ['owner'], group: 'Kelola' },
  { to: '/architecture', label: 'Arsitektur', icon: IconArchitecture, roles: ['admin'], group: 'Kelola' },
  // Akun
  { to: '/billing', label: 'Billing', icon: IconWallet, roles: ALL, group: 'Akun' },
  { to: '/settings', label: 'Pengaturan', icon: IconSettings, roles: ALL, group: 'Akun' },
  { to: '/legal', label: 'Legal', icon: IconShield, roles: ALL, group: 'Akun' },
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
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({})
  const account = state.account

  // Close the mobile drawer & record the visit (for "most-used services").
  useEffect(() => { setMenuOpen(false); trackVisit(loc.pathname) }, [loc.pathname])

  if (!account) return <PublicEntry />

  const items = nav.filter((n) => n.roles.includes(account.role))
  const title = items.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to)))
  // Only doctors switch between patients; patients see their own data only.
  const showPatient = PATIENT_PAGES.includes(loc.pathname) && account.role === 'dokter'
  // Quick actions (mobile): the role's most useful destinations, minus the
  // utility pages — one-tap shortcuts beside the hamburger menu.
  const quick = items.filter((n) => !['/settings', '/legal', '/billing', '/architecture'].includes(n.to)).slice(0, 6)
  const doLogout = () => { if (backendEnabled) api.logout().catch(() => {}); logout() }
  // Beranda ringkas — the user's most-used services (ranked by visit history),
  // shown on the home route only.
  const homeServices = rankByUsage(
    items.filter((n) => !['/', '/settings', '/legal', '/architecture'].includes(n.to)),
  ).slice(0, 8)
  const onHome = loc.pathname === '/'
  // Sidebar accordion groups (only groups with visible items for this role).
  const groups = GROUP_ORDER
    .map((name) => ({ name, items: items.filter((n) => (n.group ?? 'Akun') === name) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="relative flex min-h-screen">
      {/* Kop surat untuk cetak/PDF — tampil hanya saat mencetak, di tiap halaman */}
      <div className="print-letterhead">
        <LogoMark size={28} />
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight">Panaceamed<span className="text-brand">.id</span></div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Longevity Medical-AI · Dokumen Resmi</div>
        </div>
      </div>
      {/* Ambient animated backdrop — sits behind every page */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb absolute -left-32 top-10 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="orb absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" style={{ animationDelay: '-8s' }} />
        <div className="orb absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" style={{ animationDelay: '-14s' }} />
      </div>
      <aside className={`sticky top-0 z-10 hidden h-screen shrink-0 flex-col border-r border-black/5 bg-white/80 py-6 backdrop-blur-xl transition-all duration-300 lg:flex ${sidebarOpen ? 'w-64 px-4' : 'w-0 overflow-hidden border-r-0 px-0 opacity-0'}`}>
        <div className="mb-6 flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2.5">
            <LogoMark size={36} />
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
          <button onClick={() => setSidebarOpen(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30" title="Sembunyikan menu" aria-label="Sembunyikan menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-brand-50 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">Masuk sebagai</div>
          <div className="truncate text-sm font-bold">{account.name}</div>
          <div className="text-[11px] text-neutral-500">{roleLabel[account.role]}</div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {groups.map((g) => {
            const open = !closedGroups[g.name]
            // A single-item "Beranda" group renders as a plain link (no accordion).
            if (g.name === 'Beranda') {
              return g.items.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${isActive ? 'bg-brand-50 text-brand-dark font-bold' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'}`}>
                  <n.icon size={20} /> {n.label}
                </NavLink>
              ))
            }
            return (
              <div key={g.name} className="mt-1">
                <button
                  onClick={() => setClosedGroups((s) => ({ ...s, [g.name]: !s[g.name] }))}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400 hover:text-neutral-600"
                >
                  {g.name}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? '' : '-rotate-90'}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {open && (
                  <div className="mt-0.5 space-y-0.5">
                    {g.items.map((n) => (
                      <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${isActive ? 'bg-brand-50 text-brand-dark font-bold' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'}`}>
                        <n.icon size={18} /> {n.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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
            {/* Mobile: buka drawer */}
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral-100 lg:hidden"
              aria-label="Buka menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
            {/* Desktop: buka kembali sidebar saat diciutkan (di dalam header → tidak menimpa judul) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral-100 lg:grid"
                aria-label="Buka menu samping"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            )}
            <h1 className="truncate text-base font-bold sm:text-lg">{title?.label ?? 'Panaceamed.id'}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {['pasien', 'dokter', 'owner'].includes(account.role) && (
              <NavLink to="/messages" aria-label="Pesan" title="Pesan"
                className={({ isActive }) => `grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-neutral-100 ${isActive ? 'text-brand-dark' : 'text-neutral-500'}`}>
                <IconChat size={20} />
              </NavLink>
            )}
            <NotificationBell />
            <button
              onClick={() => setTheme(toggleTheme())}
              className="hidden h-9 w-9 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:grid"
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
              <span className="hidden text-[10px] font-semibold text-white/60 sm:inline">PNC</span>
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
        <div className="flex gap-2 overflow-x-auto border-b border-black/5 bg-white px-3 py-2.5 lg:hidden">
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

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:pb-6">
          {onHome && <InstallBanner />}
          {onHome && homeServices.length > 0 && (
            <div className="mb-5 hidden lg:block">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
                Layanan tersering Anda
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {homeServices.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-black/5 bg-white p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand-50 hover:shadow-[0_8px_20px_rgba(0,191,99,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-dark">
                      <n.icon size={20} />
                    </span>
                    <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-neutral-600">{n.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
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

      {/* Bottom tab bar (mobile) — ikon besar & universal untuk navigasi sosial.
          Ditujukan agar bisa dipakai siapa pun, termasuk yang kesulitan membaca:
          ikon jelas + aria-label untuk pembaca layar + target sentuh besar. */}
      {['pasien', 'dokter', 'owner'].includes(account.role) && (
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Navigasi utama">
          {[
            { to: '/', label: 'Beranda', icon: IconHome, end: true },
            { to: '/community', label: 'Community', icon: IconUsers },
          ].map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} aria-label={t.label}
              className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 ${isActive ? 'text-brand-dark' : 'text-neutral-400'}`}>
              <t.icon size={26} />
              <span className="text-[9px] font-bold">{t.label}</span>
            </NavLink>
          ))}
          {/* Tombol tengah "+" — buat post/story */}
          <button
            onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new Event('panacea:compose')), 60) }}
            aria-label="Buat postingan atau story baru"
            className="-mt-5 flex flex-col items-center justify-center"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 6px 18px rgba(0,191,99,0.45)' }}>
              <IconPlus size={28} />
            </span>
          </button>
          {[
            { to: '/vitapulse', label: 'VitaPulse', icon: IconActivity },
            { to: '/profile', label: 'Profil', icon: IconUser },
          ].map((t) => (
            <NavLink key={t.to} to={t.to} aria-label={t.label}
              className={({ isActive }) => `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 ${isActive ? 'text-brand-dark' : 'text-neutral-400'}`}>
              <t.icon size={26} />
              <span className="text-[9px] font-bold">{t.label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {['pasien', 'dokter', 'owner'].includes(account.role) && <OnboardingTour />}

      <ContactService />
    </div>
  )
}
