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
  IconGauge,
  IconLeaf,
  IconSearch,
  IconBell,
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
import { OnboardingTour, AssessmentPrompt } from './OnboardingTour'
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
const GROUP_ORDER = ['Home', 'Health', 'Longevity', 'Calculators & Labs', 'Fitness', 'Clinical & AI', 'Services', 'Content', 'Manage', 'Account']

const nav: Nav[] = [
  // Beranda (rendered as plain links — the most-used, social-first destinations)
  { to: '/', label: 'Home', icon: IconHome, roles: ['pasien', 'dokter', 'owner'], end: true, group: 'Home' },
  { to: '/community', label: 'Community', icon: IconUsers, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/messages', label: 'Messages', icon: IconChat, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/logs', label: 'Log & Stats', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/profile', label: 'Profile', icon: IconUser, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  // Kesehatan — core health data & daily care
  { to: '/health-data', label: 'Health Data', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/vitapulse', label: 'VitaPulse', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/nutrition', label: 'Nutrition', icon: IconFood, roles: ['pasien'], group: 'Health' },
  { to: '/carbon-diet', label: 'Carbon-Footprint Diet', icon: IconLeaf, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/hydration', label: 'Hydration Calculator', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/alcohol', label: 'Alcohol Unit & BAC Estimator', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/supplements', label: 'Supplements & Ergogenics', icon: IconPill, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/air-quality', label: 'Air Quality & Lungs', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/sun-exposure', label: 'Sun Exposure & Vitamin D', icon: IconSun, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/emergency', label: 'Emergency Card & SOS', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/education', label: 'Education', icon: IconBook, roles: ['pasien'], group: 'Health' },
  { to: '/recovery', label: 'Recovery', icon: IconMoon, roles: ['pasien', 'dokter'], group: 'Health' },
  { to: '/chronotype', label: 'Chronotype Quiz', icon: IconMoon, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/sleep-apnea-screen', label: 'Sleep Apnea Screening', icon: IconMoon, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/mental-health-screen', label: 'Mental Health Screening', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/substance-use-screen', label: 'Alcohol & Tobacco Screening', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/epworth-sleepiness', label: 'Daytime Sleepiness (Epworth)', icon: IconMoon, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/caffeine', label: 'Caffeine & Sleep', icon: IconMoon, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  // Longevity & aging
  { to: '/longevity', label: 'Longevity Center', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/biological-age', label: 'Biological Age', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/aesthetic', label: 'Aesthetic Vitality', icon: IconSparkle, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/family-health', label: 'Family Health History', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/gene-info', label: 'Gene Info', icon: IconStethoscope, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/ikigai', label: 'Ikigai & Legacy Letter', icon: IconSparkle, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/fasting', label: 'Fasting Timer', icon: IconTimer, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  // Calculators & labs
  { to: '/lab-decoder', label: 'Lab Result Decoder', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/risk', label: 'Risk Calculators', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/stroke-risk', label: 'CHA₂DS₂-VASc (AF Stroke Risk)', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/wells-score', label: 'Wells Score (DVT/PE)', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/ottawa-ankle', label: 'Ottawa Ankle Rules', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/child-growth', label: 'Child Growth Tracker', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/qtc-calculator', label: 'QTc Calculator', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/creatinine-clearance', label: 'Creatinine Clearance (Cockcroft-Gault)', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/corrected-calcium', label: 'Corrected Calcium', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/meld-score', label: 'MELD-Na Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/child-pugh-score', label: 'Child-Pugh Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/fena-calculator', label: 'FeNa Calculator', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/ranson-criteria', label: "Ranson's Criteria", icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/has-bled-score', label: 'HAS-BLED Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/bisap-score', label: 'BISAP Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/glasgow-blatchford-score', label: 'Glasgow-Blatchford Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/timi-risk-score', label: 'TIMI Risk Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/perc-rule', label: 'PERC Rule', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/sofa-score', label: 'SOFA Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/lights-criteria', label: "Light's Criteria", icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/4ts-score', label: '4Ts Score (HIT)', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/news2-score', label: 'NEWS2 Score', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/serum-osmolality', label: 'Serum Osmolality', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/ldl-calculator', label: 'LDL (Friedewald)', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/aa-gradient', label: 'A-a Gradient', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/reality-check', label: 'Habit Reality Check', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/data-lab', label: 'Data Lab (upload CSV)', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  // Kebugaran
  { to: '/athlete', label: 'Athlete', icon: IconRun, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/workout', label: 'Workout', icon: IconFlame, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/fitness-test', label: 'Fitness Test', icon: IconActivity, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/readiness', label: 'Recovery & Strain', icon: IconHeart, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/organ-vitality', label: 'Anti-Aging & Organs', icon: IconLeaf, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/assessment', label: 'Initial Assessment', icon: IconActivity, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/training-plan', label: 'AI Program', icon: IconTimer, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/body', label: 'Body Composition', icon: IconHeart, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/lab', label: 'Performance Lab', icon: IconGauge, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/sports-science', label: 'Science & KPIs', icon: IconChartUp, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/shape-forming', label: 'Shape Forming', icon: IconSparkle, roles: ['pasien'], group: 'Fitness' },
  { to: '/sports-scores', label: 'Live Scores', icon: IconRun, roles: ['pasien', 'dokter', 'owner'], group: 'Fitness' },
  // Klinis & AI
  { to: '/evidence', label: 'Clinical Evidence', icon: IconStethoscope, roles: ['pasien', 'dokter', 'owner'], group: 'Clinical & AI' },
  { to: '/trials', label: 'Clinical Trials Finder', icon: IconSearch, roles: ['pasien', 'dokter', 'owner'], group: 'Clinical & AI' },
  { to: '/chatbot', label: 'AI Chatbot', icon: IconChat, roles: ['pasien', 'dokter'], group: 'Clinical & AI' },
  { to: '/clinical', label: 'Clinical Data', icon: IconHeart, roles: ['dokter'], group: 'Clinical & AI' },
  { to: '/emr', label: 'AI-EMR', icon: IconEMR, roles: ['dokter'], group: 'Clinical & AI' },
  { to: '/clinical-calculators', label: 'Clinical Calculators', icon: IconStethoscope, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/longevity-curriculum', label: 'Longevity Curriculum', icon: IconHeart, roles: ['dokter', 'owner'], group: 'Clinical & AI' },
  { to: '/planning', label: 'Planning', icon: IconPlan, roles: ['dokter'], group: 'Clinical & AI' },
  { to: '/sexual-health', label: 'Sexual Health & OB-GYN', icon: IconUsers, roles: ['pasien', 'dokter'], group: 'Clinical & AI' },
  // Layanan
  { to: '/consult', label: 'Consultation', icon: IconStethoscope, roles: ['pasien', 'dokter'], group: 'Services' },
  { to: '/hospitals', label: 'Health Facilities', icon: IconHospital, roles: ['pasien', 'dokter'], group: 'Services' },
  { to: '/pharmacy', label: 'Pharmacy', icon: IconPill, roles: ['pasien', 'dokter'], group: 'Services' },
  { to: '/drug-info', label: 'Drug Info', icon: IconPill, roles: ['pasien', 'dokter', 'owner'], group: 'Services' },
  { to: '/med-reminders', label: 'Medication Reminders', icon: IconBell, roles: ['pasien', 'dokter', 'owner'], group: 'Services' },
  { to: '/orders', label: 'Transactions', icon: IconWallet, roles: ['pasien'], group: 'Services' },
  { to: '/pricing', label: 'Pricing & Plans', icon: IconWallet, roles: ['pasien', 'dokter', 'owner'], group: 'Services' },
  // Konten
  { to: '/med-study', label: 'Med Study Hub', icon: IconBook, roles: ['pasien', 'dokter', 'kontributor', 'owner'], group: 'Content' },
  { to: '/editor', label: 'Write Material', icon: IconBook, roles: ['kontributor'], group: 'Content' },
  { to: '/marketplace', label: 'Marketplace', icon: IconStore, roles: ['pasien', 'dokter', 'kontributor', 'verifikator', 'owner'], group: 'Content' },
  { to: '/my-materials', label: 'My Materials', icon: IconBook, roles: ['kontributor'], group: 'Content' },
  { to: '/verification', label: 'Verification', icon: IconShield, roles: ['verifikator'], group: 'Content' },
  // Kelola
  { to: '/admin', label: 'Admin', icon: IconStethoscope, roles: ['admin'], group: 'Manage' },
  { to: '/owner', label: 'Owner', icon: IconChartUp, roles: ['owner'], group: 'Manage' },
  { to: '/architecture', label: 'Architecture', icon: IconArchitecture, roles: ['admin'], group: 'Manage' },
  // Akun
  { to: '/billing', label: 'Billing', icon: IconWallet, roles: ALL, group: 'Account' },
  { to: '/settings', label: 'Settings', icon: IconSettings, roles: ALL, group: 'Account' },
  { to: '/legal', label: 'Legal', icon: IconShield, roles: ALL, group: 'Account' },
]

// Pages that show the active-patient context. Patients see only their own data
// (no selector); doctors manage patients via the selector.
const PATIENT_PAGES = ['/clinical', '/chatbot', '/emr', '/planning']

const roleLabel: Record<Role, string> = {
  pasien: 'Customer/Patient',
  dokter: 'Doctor',
  kontributor: 'Contributor',
  verifikator: 'Verifier',
  admin: 'Admin',
  owner: 'Owner',
}

const riskLabel: Record<string, string> = {
  chronic: 'Chronic Illness',
  elderly: 'Elderly',
  immunocompromised: 'Immunocompromised',
}

// Mobile drawer navigation with accordion groups — the flat list grew too long
// to scroll. 'Home' items stay as always-visible plain links; every other
// group collapses, with the group containing the current route open by default.
function DrawerNav({ items }: { items: Nav[] }) {
  const loc = useLocation()
  const groups = GROUP_ORDER
    .map((g) => ({ name: g, items: items.filter((n) => n.group === g) }))
    .filter((g) => g.items.length > 0)
  const activeGroup = groups.find((g) => g.items.some((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to))))?.name
  const [open, setOpen] = useState<Record<string, boolean>>(() => (activeGroup ? { [activeGroup]: true } : {}))

  const link = (n: Nav, indent = false) => (
    <NavLink key={n.to} to={n.to} end={n.end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition ${indent ? 'ml-2' : ''} ${
          isActive ? 'bg-brand-50 text-brand-dark font-bold' : 'text-neutral-600 hover:bg-neutral-50'
        }`
      }>
      <n.icon size={20} />
      {n.label}
    </NavLink>
  )

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
      {groups.map((g) =>
        g.name === 'Home' ? (
          g.items.map((n) => link(n))
        ) : (
          <div key={g.name}>
            <button
              onClick={() => setOpen((o) => ({ ...o, [g.name]: !o[g.name] }))}
              aria-expanded={!!open[g.name]}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-neutral-400 hover:bg-neutral-50"
            >
              {g.name}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform ${open[g.name] ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {open[g.name] && <div className="flex flex-col gap-1">{g.items.map((n) => link(n, true))}</div>}
          </div>
        ),
      )}
    </nav>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, activePatient, setActivePatient, logout, setMode } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({})
  const [navHidden, setNavHidden] = useState(false)
  const account = state.account

  // Close the mobile drawer & record the visit (for "most-used services").
  useEffect(() => { setMenuOpen(false); trackVisit(loc.pathname) }, [loc.pathname])

  // Auto-hide the floating bottom nav while scrolling down through a feed
  // (it otherwise sits on top of post action buttons); bring it back on any
  // upward scroll or once near the top, so it's never more than a flick away.
  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY
        if (y < 80) setNavHidden(false)
        else if (delta > 8) setNavHidden(true)
        else if (delta < -8) setNavHidden(false)
        lastY = y
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    .map((name) => ({ name, items: items.filter((n) => (n.group ?? 'Account') === name) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="relative flex min-h-screen">
      {/* Kop surat untuk cetak/PDF — tampil hanya saat mencetak, di tiap halaman */}
      <div className="print-letterhead">
        <LogoMark size={28} />
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight">Panaceamed<span className="text-brand">.id</span></div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Longevity Medical-AI · Official Document</div>
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
          <button onClick={() => setSidebarOpen(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30" title="Hide menu" aria-label="Hide menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-brand-50 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark">Logged in as</div>
          <div className="truncate text-sm font-bold">{account.name}</div>
          <div className="text-[11px] text-neutral-500">{roleLabel[account.role]}</div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {groups.map((g) => {
            const open = !closedGroups[g.name]
            // A single-item "Beranda" group renders as a plain link (no accordion).
            if (g.name === 'Home') {
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
            <IconHospital size={18} /> Emergency (SOS)
          </NavLink>
        )}
        <button
          onClick={() => {
            if (backendEnabled) api.logout().catch(() => {})
            logout()
          }}
          className="mt-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-50"
        >
          <IconLogout size={18} /> Log Out
        </button>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {/* Mobile: buka drawer */}
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral-100 lg:hidden"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
            {/* Desktop: buka kembali sidebar saat diciutkan (di dalam header → tidak menimpa judul) */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral-100 lg:grid"
                aria-label="Open sidebar menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            )}
            <h1 className="truncate text-base font-bold sm:text-lg">{title?.label ?? 'Panaceamed.id'}</h1>
          </div>

          <div className="no-scrollbar flex min-w-0 shrink items-center gap-2 overflow-x-auto sm:gap-3">
            {['pasien', 'dokter', 'owner'].includes(account.role) && (
              <NavLink to="/messages" aria-label="Messages" title="Messages"
                className={({ isActive }) => `grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors hover:bg-neutral-100 ${isActive ? 'text-brand-dark' : 'text-neutral-500'}`}>
                <IconChat size={20} />
              </NavLink>
            )}
            <NotificationBell />
            <button
              onClick={() => setTheme(toggleTheme())}
              className="hidden h-10 w-10 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:grid"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            {account.isOwner && (
              <label className="flex shrink-0 items-center gap-1.5 rounded-xl border border-brand bg-brand-50 px-2 py-1" title="Owner — switch access mode">
                <span className="hidden text-[10px] font-bold uppercase tracking-wide text-brand-dark sm:inline">Mode</span>
                <select
                  value={account.role}
                  onChange={(e) => setMode(e.target.value as Role)}
                  className="max-w-[92px] cursor-pointer bg-transparent text-sm font-bold text-brand-dark outline-none sm:max-w-none"
                >
                  {ALL.map((r) => (
                    <option key={r} value={r}>{roleLabel[r]}</option>
                  ))}
                </select>
              </label>
            )}
            <NavLink
              to="/billing"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm font-bold text-white"
              title="PanaceaToken Balance"
            >
              <IconToken size={16} className="text-brand" />
              {state.wallet.balance}
              <span className="hidden text-[10px] font-semibold text-white/60 sm:inline">PNC</span>
            </NavLink>
            {/* Mobile-only exit/logout — the sidebar Log Out is hidden on phones */}
            <button
              onClick={() => {
                if (backendEnabled) api.logout().catch(() => {})
                logout()
              }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent transition hover:bg-accent/20 lg:hidden"
              title="Log Out"
              aria-label="Log Out"
            >
              <IconLogout size={18} />
            </button>
            {showPatient && (
              <div
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1"
                title="Active patient"
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
                      {p.name} · {ageFromDob(p.dob)}y
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
        <div className="relative border-b border-black/5 bg-white lg:hidden">
          <div className="flex gap-2 overflow-x-auto px-3 py-2.5">
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
          {/* Fade hint that the strip scrolls further right */}
          <div className="fade-edge-surface pointer-events-none absolute inset-y-0 right-0 w-8" />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:pb-6">
          {onHome && <InstallBanner />}
          {onHome && homeServices.length > 0 && (
            <div className="mb-5 hidden lg:block">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
                Your most-used services
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
              <button onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-2xl leading-none text-neutral-400 hover:bg-neutral-100" aria-label="Close menu">×</button>
            </div>
            <DrawerNav items={items} />
            <div className="border-t border-black/5 p-3">
              {(account.role === 'pasien' || account.role === 'dokter') && (
                <NavLink to="/hospitals" className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-accent/10 px-3 py-3 text-sm font-bold text-accent">
                  <IconHospital size={18} /> Emergency (SOS)
                </NavLink>
              )}
              <button onClick={doLogout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-bold text-neutral-600">
                <IconLogout size={18} /> Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Bottom tab bar (mobile) — floating liquid-glass pill, horizontally
          scrollable so it grows with the app's feature set without ever
          feeling cramped. Icon-first: label is a small caption underneath,
          never the primary cue. The "+" compose button floats above the pill,
          fixed in place (not part of the scroll strip). */}
      {['pasien', 'dokter', 'owner'].includes(account.role) && (
        <nav
          className={`fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${navHidden ? 'translate-y-[calc(100%+env(safe-area-inset-bottom)+16px)]' : 'translate-y-0'}`}
          aria-label="Main navigation"
        >
          <div className="liquid-glass relative mx-auto flex max-w-sm items-center rounded-full py-1.5 pl-2 pr-16 shadow-[0_10px_30px_rgba(12,20,16,0.14)]">
            <div className="fade-edge-glass pointer-events-none absolute inset-y-1.5 right-16 z-10 w-6 rounded-r-full" />
            <div className="no-scrollbar flex items-stretch gap-0.5 overflow-x-auto">
              {[
                { to: '/', label: 'Home', icon: IconHome, end: true },
                { to: '/community', label: 'Community', icon: IconUsers },
                { to: '/vitapulse', label: 'VitaPulse', icon: IconActivity },
                { to: '/health-data', label: 'Health', icon: IconHeart },
                { to: '/sports-scores', label: 'Scores', icon: IconRun },
                { to: '/profile', label: 'Profile', icon: IconUser },
              ].map((t) => (
                <NavLink key={t.to} to={t.to} end={t.end} aria-label={t.label}
                  className={({ isActive }) => `group relative flex min-h-[52px] w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full py-2 transition-colors duration-200 ${isActive ? 'text-brand-dark' : 'text-neutral-500'}`}>
                  {({ isActive }) => (<>
                    <span className={`absolute top-0.5 h-0.5 w-6 rounded-full bg-brand transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                    <t.icon size={23} className={`transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'scale-110' : 'group-active:scale-90'}`} />
                    <span className="text-[9px] font-bold">{t.label}</span>
                  </>)}
                </NavLink>
              ))}
            </div>
            {/* Tombol tengah "+" — buat post/story, mengambang di luar area scroll */}
            <button
              onClick={() => { navigate('/'); setTimeout(() => window.dispatchEvent(new Event('panacea:compose')), 60) }}
              aria-label="Create a new post or story"
              className="group absolute right-1 top-1/2 flex -translate-y-1/2 flex-col items-center justify-center"
            >
              <span className="grid place-items-center rounded-full text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-active:scale-95" style={{ height: 52, width: 52, background: 'linear-gradient(135deg, #00BF63, #0B7A4B)', boxShadow: '0 8px 22px rgba(0,191,99,0.45)' }}>
                <IconPlus size={26} />
              </span>
            </button>
          </div>
        </nav>
      )}

      {['pasien', 'dokter', 'owner'].includes(account.role) && <><OnboardingTour /><AssessmentPrompt /></>}

      <ContactService />
    </div>
  )
}
