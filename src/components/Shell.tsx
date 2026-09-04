import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { MenuPeran } from './MenuPeran'
import { PencarianGlobal } from './PencarianGlobal'
import { useGestur } from '../lib/useGestur'
import { pasangKilau } from '../lib/kilau'
import { indukRute } from '../lib/alurHalaman'
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { LogoMark } from './Logo'
import { FabNavigasi } from './FabNavigasi'
import { kirimRingkasan } from '../lib/ringkasan'
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
  IconUser,
  IconLeaf,
  IconSearch,
  IconBell,
  IconPhone,
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
import { PeringatanPenyimpanan } from './PeringatanPenyimpanan'
import { OnboardingTour, AssessmentPrompt } from './OnboardingTour'
import { api, backendEnabled } from '../lib/api'
import { trackVisit, rankByUsage } from '../lib/usage'
import type { Role } from '../lib/types'
import { ambilTersembunyi, saring, langgananFitur } from '../lib/fiturTersembunyi'
import { autoIsiDariPerangkat } from '../lib/autoIsi'

// Public entry: marketing landing first, then the login screen on demand.
function PublicEntry() {
  const [showLogin, setShowLogin] = useState(false)
  return showLogin ? <Login onBack={() => setShowLogin(false)} /> : <Landing onMasuk={() => setShowLogin(true)} />
}

type Nav = { to: string; label: string; icon: typeof IconDashboard; roles: Role[]; end?: boolean; group?: string }

// Path-boundary match: '/nutrition' should match '/nutrition' and
// '/nutrition/x', but never '/nutrition-toolkit' — a plain startsWith
// silently matched these route-prefix collisions.
function navMatches(n: Nav, pathname: string): boolean {
  if (n.end) return pathname === n.to
  return pathname === n.to || pathname.startsWith(n.to + '/')
}

const ALL: Role[] = ['pasien', 'dokter', 'kontributor', 'verifikator', 'admin', 'owner']

// Sidebar groups (accordion sections) — order defines display order. Grouped by
// intent with short labels so the menu stays scannable and icon-led.
/* URUTAN INI ADALAH PERKENALAN APLIKASI. Yang berada di atas adalah yang
   dianggap penting, dan sebelumnya yang di atas adalah "Health" berisi tanda
   vital dan kartu darurat, disusul "Clinical & AI". Susunan itu memperkenalkan
   aplikasi ini sebagai alat klinis kepada orang yang membukanya untuk hidup
   lebih sehat. Sekarang gerak lebih dahulu, dan bagian klinisnya
   diperkenalkan sebagai PENGETAHUAN — isinya sama persis. */
const GROUP_ORDER = ['Home', 'Move', 'Your Body', 'Longevity', 'Learn & Look Up', 'Calculators & Labs', 'Fitness', 'Services', 'Money', 'Content', 'Manage', 'Account']

/**
 * Dipakai layar "Atur Fitur" agar daftarnya berasal dari sumber yang sama
 * dengan menu. Daftar terpisah yang ditulis ulang pasti akan tertinggal.
 */
export const NAV_UNTUK_PENGATURAN: { to: string; label: string; group: string; roles: Role[] }[] = []

/**
 * MENU HARIAN — hanya yang dibuka berulang kali.
 *
 * Sebelumnya menu ini memuat 69 tujuan dalam 9 grup. Menu sepanjang itu tidak
 * dipindai, ia diabaikan: begitu daftarnya melewati satu layar, orang berhenti
 * membaca dan kembali memakai dua-tiga jalan yang sudah dihafalnya, sehingga 60
 * tujuan lain praktis tidak pernah ditemukan.
 *
 * Yang dikeluarkan dari sini TIDAK dihapus. Seluruh 69 tujuan tetap ada di
 * KATALOG di bawah, yang menyuplai pencarian global dan layar Atur Fitur --
 * jadi semuanya masih bisa dicari dan dijangkau, hanya tidak lagi berebut
 * tempat di menu.
 */
const nav: Nav[] = [
  // Beranda
  { to: '/', label: 'Home', icon: IconHome, roles: ['pasien', 'dokter', 'owner'], end: true, group: 'Home' },
  { to: '/semua-fitur', label: 'All Features', icon: IconSearch, roles: ALL, group: 'Home' },
  { to: '/tutorial', label: 'How to Use', icon: IconBook, roles: ALL, group: 'Home' },
  { to: '/profile', label: 'Profile', icon: IconUser, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  // Gerak lebih dahulu, lalu badan.
  { to: '/latihan', label: 'Training', icon: IconRun, roles: ['pasien', 'dokter', 'owner'], group: 'Move' },
  { to: '/workout', label: 'Workouts', icon: IconRun, roles: ['pasien', 'dokter', 'owner'], group: 'Move' },
  { to: '/recovery', label: 'Sleep & Recovery', icon: IconMoon, roles: ['pasien', 'dokter'], group: 'Move' },
  { to: '/tubuh', label: 'Your Numbers', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Your Body' },
  { to: '/nutrition', label: 'Nutrition', icon: IconFood, roles: ['pasien', 'dokter', 'owner'], group: 'Your Body' },
  { to: '/health-data', label: 'Health Data', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Your Body' },
  { to: '/emergency', label: 'Emergency Card', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Services' },
  // Pengetahuan — dahulu "Klinis". Isinya sama, perkenalannya berbeda.
  { to: '/med-study', label: 'Medical Library', icon: IconBook, roles: ['pasien', 'dokter', 'owner'], group: 'Learn & Look Up' },
  { to: '/med-study?bagian=usmle', label: 'Study Curriculum', icon: IconBook, roles: ['pasien', 'dokter', 'owner'], group: 'Learn & Look Up' },
  { to: '/evidence', label: 'Ask a Health Question', icon: IconSearch, roles: ['pasien', 'dokter', 'owner'], group: 'Learn & Look Up' },
  { to: '/osce-ukmppd', label: 'Exam Practice', icon: IconBook, roles: ['dokter', 'owner'], group: 'Learn & Look Up' },
  { to: '/clinical-calculators', label: 'Health Calculators', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/drug-info', label: 'Drugs & Herbal', icon: IconPill, roles: ['pasien', 'dokter', 'owner'], group: 'Learn & Look Up' },
  { to: '/emr', label: 'Medical Records', icon: IconEMR, roles: ['dokter', 'owner'], group: 'Learn & Look Up' },
  { to: '/clinical-hub', label: 'More Tools', icon: IconStethoscope, roles: ['dokter', 'owner'], group: 'Learn & Look Up' },
  // Sosial
  { to: '/feed', label: "Friends' Feed", icon: IconUsers, roles: ['pasien', 'dokter', 'owner'], group: 'Content' },
  { to: '/community', label: 'Community', icon: IconUsers, roles: ['pasien', 'dokter', 'owner'], group: 'Content' },
  { to: '/messages', label: 'Messages', icon: IconChat, roles: ['pasien', 'dokter', 'owner'], group: 'Content' },
  { to: '/scripture', label: 'Faith', icon: IconBook, roles: ALL, group: 'Content' },
  // Pengelolaan (peran tertentu saja)
  { to: '/admin', label: 'Admin', icon: IconShield, roles: ['admin'], group: 'Manage' },
  { to: '/owner', label: 'Owner', icon: IconShield, roles: ['owner'], group: 'Manage' },
  { to: '/owner-analytics', label: 'Owner Analytics', icon: IconShield, roles: ['owner'], group: 'Manage' },
  { to: '/editor', label: 'Write Content', icon: IconBook, roles: ['kontributor'], group: 'Manage' },
  { to: '/verification', label: 'Verification', icon: IconShield, roles: ['verifikator'], group: 'Manage' },
  // Akun
  { to: '/atur-fitur', label: 'Manage Features', icon: IconSettings, roles: ALL, group: 'Account' },
  { to: '/settings', label: 'Settings', icon: IconSettings, roles: ALL, group: 'Account' },
]

/**
 * KATALOG LENGKAP — sumber tunggal untuk pencarian global dan Atur Fitur.
 *
 * Terpisah dari `nav` dengan sengaja. Kalau keduanya satu daftar, memangkas
 * menu berarti ikut menghapus tujuan itu dari pencarian, dan fitur yang tidak
 * bisa dicari sama saja dengan fitur yang dihapus -- tanpa ada yang menyadari.
 *
 * Pasar saham dan makro ekonomi TIDAK ada di sini maupun di menu: keduanya
 * dikeluarkan dari produk atas keputusan pemilik, karena tidak berkaitan
 * dengan kesehatan.
 */
const KATALOG: Nav[] = [
  { to: '/', label: 'Home', icon: IconHome, roles: ['pasien', 'dokter', 'owner'], end: true, group: 'Home' },
  { to: '/community', label: 'Community', icon: IconUsers, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/clubs', label: 'Club Hub', icon: IconUsers, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/messages', label: 'Messages', icon: IconChat, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/logs', label: 'Log & Stats', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/profile', label: 'Profile', icon: IconUser, roles: ['pasien', 'dokter', 'owner'], group: 'Home' },
  { to: '/health-data', label: 'Health Data', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/vitapulse', label: 'VitaPulse', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/keuangan', label: 'Finance', icon: IconToken, roles: ['pasien', 'dokter', 'owner'], group: 'Money' },
  { to: '/owner-analytics', label: 'Owner Analytics', icon: IconShield, roles: ['owner'], group: 'Manage' },
  { to: '/nutrition', label: 'Nutrition', icon: IconFood, roles: ['pasien'], group: 'Health' },
  { to: '/emergency', label: 'Emergency Card & SOS', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/education', label: 'Education', icon: IconBook, roles: ['pasien'], group: 'Content' },
  { to: '/recovery', label: 'Recovery', icon: IconMoon, roles: ['pasien', 'dokter'], group: 'Health' },
  { to: '/latihan', label: 'Training', icon: IconRun, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/tubuh', label: 'Body Signals', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Health' },
  { to: '/wellness-hub', label: '✨ Wellness Hub (all)', icon: IconSparkle, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/health-simulator', label: 'What-If Health Simulator', icon: IconSparkle, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/longevity', label: 'Longevity Center', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/biological-age', label: 'Biological Age', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/family-health', label: 'Family Health History', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/life-compass', label: 'Life Compass (Vision & Purpose)', icon: IconSparkle, roles: ['pasien', 'dokter', 'owner'], group: 'Longevity' },
  { to: '/calculator-hub', label: '🔎 Calculator Hub (search all)', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/lab-decoder', label: 'Lab Result Decoder', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/risk', label: 'Risk Calculators', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/reality-check', label: 'Habit Reality Check', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/data-lab', label: 'Data Lab (upload CSV)', icon: IconChartUp, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/fitness-hub', label: '🏃 Fitness Hub (all)', icon: IconRun, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/athlete', label: 'Athlete', icon: IconRun, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/workout', label: 'Workout', icon: IconFlame, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/training-plan', label: 'AI Program', icon: IconTimer, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/readiness', label: 'Recovery & Strain', icon: IconHeart, roles: ['pasien', 'dokter'], group: 'Fitness' },
  { to: '/sports-scores', label: 'Live Scores', icon: IconRun, roles: ['pasien', 'dokter', 'owner'], group: 'Fitness' },
  { to: '/evidence', label: 'Clinical Evidence', icon: IconStethoscope, roles: ['pasien', 'dokter', 'owner'], group: 'Clinical & AI' },
  { to: '/chatbot', label: 'AI Chatbot', icon: IconChat, roles: ['pasien', 'dokter'], group: 'Clinical & AI' },
  { to: '/second-opinion', label: 'Second Opinion', icon: IconStethoscope, roles: ['pasien', 'dokter', 'owner'], group: 'Clinical & AI' },
  { to: '/clinical', label: 'Clinical Data', icon: IconHeart, roles: ['dokter'], group: 'Clinical & AI' },
  { to: '/emr', label: 'AI-EMR', icon: IconEMR, roles: ['dokter'], group: 'Clinical & AI' },
  { to: '/clinical-calculators', label: 'Clinical Calculators', icon: IconStethoscope, roles: ['pasien', 'dokter', 'owner'], group: 'Calculators & Labs' },
  { to: '/planning', label: 'Planning', icon: IconPlan, roles: ['dokter'], group: 'Clinical & AI' },
  { to: '/clinical-hub', label: '🩺 More clinical & AI tools', icon: IconStethoscope, roles: ['pasien', 'dokter', 'owner'], group: 'Clinical & AI' },
  { to: '/consult', label: 'Consultation', icon: IconStethoscope, roles: ['pasien', 'dokter'], group: 'Services' },
  { to: '/hospitals', label: 'Health Facilities', icon: IconHospital, roles: ['pasien', 'dokter'], group: 'Services' },
  { to: '/pharmacy', label: 'Pharmacy', icon: IconPill, roles: ['pasien', 'dokter'], group: 'Services' },
  { to: '/drug-info', label: 'Drug Info', icon: IconPill, roles: ['pasien', 'dokter', 'owner'], group: 'Services' },
  { to: '/med-reminders', label: 'Medication Reminders', icon: IconBell, roles: ['pasien', 'dokter', 'owner'], group: 'Services' },
  { to: '/orders', label: 'Transactions', icon: IconWallet, roles: ['pasien'], group: 'Services' },
  { to: '/pricing', label: 'Pricing & Plans', icon: IconWallet, roles: ['pasien', 'dokter', 'owner'], group: 'Services' },
  { to: '/med-study', label: 'Med Study Hub', icon: IconBook, roles: ['pasien', 'dokter', 'kontributor', 'owner'], group: 'Content' },
  { to: '/editor', label: 'Write Material', icon: IconBook, roles: ['kontributor'], group: 'Content' },
  { to: '/marketplace', label: 'Marketplace', icon: IconStore, roles: ['pasien', 'dokter', 'kontributor', 'verifikator', 'owner'], group: 'Content' },
  { to: '/my-materials', label: 'My Materials', icon: IconBook, roles: ['kontributor'], group: 'Content' },
  { to: '/verification', label: 'Verification', icon: IconShield, roles: ['verifikator'], group: 'Content' },
  { to: '/admin', label: 'Admin', icon: IconStethoscope, roles: ['admin'], group: 'Manage' },
  { to: '/owner', label: 'Owner', icon: IconChartUp, roles: ['owner'], group: 'Manage' },
  { to: '/architecture', label: 'Architecture', icon: IconArchitecture, roles: ['admin'], group: 'Manage' },
  { to: '/billing', label: 'Billing', icon: IconWallet, roles: ALL, group: 'Account' },
  { to: '/scripture', label: 'Scripture', icon: IconShield, roles: ALL, group: 'Account' },
  { to: '/hadith', label: 'Hadith', icon: IconShield, roles: ALL, group: 'Account' },
  { to: '/prayer-times', label: 'Prayer times', icon: IconShield, roles: ALL, group: 'Account' },
  { to: '/change', label: 'Change', icon: IconChartUp, roles: ALL, group: 'Account' },
  { to: '/learn', label: 'Learn', icon: IconChartUp, roles: ALL, group: 'Account' },
  { to: '/dek-connect', label: 'Connect', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Account' },
  { to: '/verifikasi-connect', label: 'Connect Verification', icon: IconShield, roles: ['pasien', 'dokter', 'owner'], group: 'Account' },
  { to: '/tinjau-connect', label: 'Connect Review', icon: IconShield, roles: ['owner'], group: 'Manage' },
  { to: '/atur-fitur', label: 'Manage Features', icon: IconSettings, roles: ['pasien', 'dokter', 'owner'], group: 'Account' },
  { to: '/settings', label: 'Settings', icon: IconSettings, roles: ALL, group: 'Account' },
  { to: '/legal', label: 'Legal', icon: IconShield, roles: ALL, group: 'Account' },
]

// Diisi dari KATALOG, bukan dari `nav`: menu hanya memuat tujuan harian,
// sedangkan pencarian harus tetap menemukan semuanya. Digabung menurut `to`
// supaya tujuan yang ada di keduanya tidak muncul dua kali.
{
  const perTo = new Map<string, Nav>()
  for (const n of [...KATALOG, ...nav]) perTo.set(n.to, n)
  NAV_UNTUK_PENGATURAN.push(
    ...[...perTo.values()].map((n) => ({ to: n.to, label: n.label, group: n.group ?? 'Account', roles: n.roles })),
  )
}
export const SEMUA_TUJUAN = NAV_UNTUK_PENGATURAN

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
  const activeGroup = groups.find((g) => g.items.some((n) => navMatches(n, loc.pathname)))?.name
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
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-neutral-500 hover:bg-neutral-50"
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
  const [cariBuka, setCariBuka] = useState(false)
  /* SATU KOTAK, DIPANGGIL DARI MANA SAJA.
     Kotak pencarian ini menumpang di atas halaman yang sedang dibuka, jadi
     mencari tidak lagi berarti berpindah halaman dan kehilangan tempat yang
     sedang dibaca. Pemanggilnya — tombol Cari di beranda, tombol melayang,
     lambang kaca pembesar — cukup melempar satu peristiwa, tanpa perlu
     dihubungkan satu per satu ke keadaan milik Shell. */
  useEffect(() => {
    const on = () => setCariBuka(true)
    window.addEventListener('panacea:cari', on)
    return () => window.removeEventListener('panacea:cari', on)
  }, [])
  const [bantuanBuka, setBantuanBuka] = useState(false)

  // Kembali mengikuti ALUR HALAMAN, bukan sekadar satu langkah mundur di
  // riwayat. Alasannya ada di lib/alurHalaman.ts: riwayat sering tidak seperti
  // yang dibayangkan — tautan yang dibuka langsung punya riwayat kosong,
  // sehingga history.back() melempar pengguna keluar dari aplikasi.
  const bisaKembali = loc.pathname !== '/'

  // Halaman sebelumnya diingat karena menentukan CARA kembali, bukan tujuannya.
  // Bila induk kebetulan sama dengan halaman sebelumnya, mundur di riwayat
  // lebih baik daripada mendorong entri baru — mendorong entri membuat "lanjut"
  // tidak pernah punya tujuan, karena riwayat ke depan selalu kosong.
  const sebelumnya = useRef<string | null>(null)
  useEffect(() => {
    return () => { sebelumnya.current = loc.pathname }
  }, [loc.pathname])

  const kembali = useCallback(() => {
    if (loc.pathname === '/') return
    const induk = indukRute(loc.pathname)
    if (induk && induk === sebelumnya.current) navigate(-1)
    else if (induk) navigate(induk)
    else if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }, [loc.pathname, navigate])

  // Maju: hanya berarti bila ada yang bisa dimajui. Tidak ada cara membaca
  // panjang riwayat ke depan di peramban, jadi navigate(1) dipanggil apa adanya
  // — bila tidak ada, peramban mengabaikannya dan tidak terjadi apa-apa.
  const lanjut = useCallback(() => navigate(1), [navigate])

  // Menyegarkan tanpa memuat ulang seluruh aplikasi: React dipaksa memasang
  // ulang halaman lewat kunci, sehingga setiap useEffect pengambil data
  // berjalan lagi. Memuat ulang peramban akan membuang seluruh bundel dan
  // terasa jauh lebih lambat di ponsel.
  const [nonceSegar, setNonceSegar] = useState(0)
  const [sedangSegar, setSedangSegar] = useState(false)
  const segarkan = useCallback(() => {
    setSedangSegar(true)
    setNonceSegar((n) => n + 1)
    window.setTimeout(() => setSedangSegar(false), 600)
  }, [])

  const { tarikan, geser, menggeser } = useGestur({
    onKembali: kembali, onLanjut: lanjut, onSegarkan: segarkan,
    mati: cariBuka || menuOpen,
  })

  // Ctrl/Cmd+K membuka pencarian — kebiasaan yang sudah dikenal luas, dan satu-
  // satunya cara membukanya tanpa memindahkan tangan dari papan ketik.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCariBuka(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Satu pendengar untuk seluruh halaman — lihat catatan di lib/kilau.ts.
  useEffect(() => pasangKilau(), [])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({})
  const [navHidden, setNavHidden] = useState(false)
  const account = state.account

  // Close the mobile drawer & record the visit (for "most-used services").
  useEffect(() => { setMenuOpen(false); trackVisit(loc.pathname) }, [loc.pathname])

  // Auto-hide the floating bottom nav while scrolling down through a feed
  // (it otherwise sits on top of post action buttons); bring it back on any
  // upward scroll or once near the top, so it's never more than a flick away.
  // Harus di atas `if (!account)`: hook tidak boleh berada setelah return
  // bersyarat, karena jumlah hook akan berbeda antara render sebelum dan
  // sesudah login — React menolaknya dan seluruh halaman gagal dirender.
  // Sebarkan data perangkat ke seluruh aplikasi sekali saat dibuka. Sebelum
  // ini, Longevity/Fitness/Klinis baru melihat angka pengguna bila ia kebetulan
  // membuka /health-data lebih dulu.
  // Bergantung pada `account`: percobaan pertama terjadi sebelum sesi ada dan
  // pasti gagal, jadi harus dijalankan lagi begitu pengguna masuk.
  useEffect(() => { if (account) void autoIsiDariPerangkat() }, [account])

  /* Ringkasan harian dititipkan ke server supaya aturan notifikasi dapat
     memakai data yang hanya ada di perangkat (gizi, umur hasil lab, puasa,
     kopi). Dikirim saat aplikasi dibuka dan sesudah data berubah; berkasnya
     sendiri menahan pengiriman jadi paling sering sejam sekali. */
  useEffect(() => {
    if (!account) return
    void kirimRingkasan()
    const on = () => void kirimRingkasan()
    window.addEventListener('panacea:lab', on)
    window.addEventListener('panacea:health-updated', on)
    return () => {
      window.removeEventListener('panacea:lab', on)
      window.removeEventListener('panacea:health-updated', on)
    }
  }, [account])

  const [tersembunyi, setTersembunyi] = useState<string[]>(ambilTersembunyi)
  useEffect(() => langgananFitur(setTersembunyi), [])

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

  // Halaman demo mandiri: butuh kanvas penuh sendiri (video layar penuh,
  // tanpa header/nav aplikasi), dan harus dapat diakses lewat URL langsung
  // tanpa login. `fixed inset-0` di dalamnya tidak akan menutupi header/nav
  // Shell karena leluhurnya di sini memakai stacking context sendiri —
  // jadi baris ini melewati Shell sepenuhnya untuk rute ini saja.
  if (loc.pathname === '/design-demo') return <>{children}</>

  if (!account) return <PublicEntry />
  const items = saring(nav.filter((n) => n.roles.includes(account.role)), tersembunyi)
  const title = items.find((n) => navMatches(n, loc.pathname))
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
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Longevity Medical-AI · Official Document</div>
        </div>
      </div>
      {/* Ambient animated backdrop — sits behind every page */}
      {/* Lapisan warna ambient yang BENAR-BENAR terlihat (lihat catatan di
          index.css) — sebelumnya hanya tiga bola hijau/emerald/teal pada
          10% alpha, nyaris tidak terasa sebagai "berwarna". Ditambah emas
          dan magenta supaya terasa pelangi, dan alpha-nya dinaikkan lewat
          dark: supaya tetap terlihat di kanvas gelap, bukan hanya terang. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb absolute -left-32 top-10 h-80 w-80 rounded-full bg-brand/20 blur-3xl dark:bg-brand/14" />
        <div className="orb absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-400/14" style={{ animationDelay: '-8s' }} />
        <div className="orb absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-300/14" style={{ animationDelay: '-14s' }} />
        <div className="orb absolute right-10 bottom-10 h-72 w-72 rounded-full bg-amber-300/18 blur-3xl dark:bg-amber-300/12" style={{ animationDelay: '-4s' }} />
        <div className="orb absolute left-10 top-1/2 h-80 w-80 rounded-full bg-fuchsia-400/16 blur-3xl dark:bg-fuchsia-400/11" style={{ animationDelay: '-18s' }} />
        <div className="orb absolute right-1/3 top-0 h-64 w-64 rounded-full bg-violet-400/14 blur-3xl dark:bg-violet-400/10" style={{ animationDelay: '-11s' }} />
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
              <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Longevity Medical-AI
              </div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30" title="Hide menu" aria-label="Hide menu">
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
            // A single-item "Home" group renders as a plain link (no accordion).
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
                  className="flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500 hover:text-neutral-600"
                >
                  {g.name}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? '' : '-rotate-90'}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {open && (
                  <div className="mt-0.5 space-y-0.5">
                    {g.items.map((n) => (
                      <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex min-h-[40px] items-center gap-3 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${isActive ? 'bg-brand-50 text-brand-dark font-bold' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'}`}>
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
          className="mt-2 flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-neutral-500 hover:bg-neutral-50"
        >
          <IconLogout size={18} /> Log Out
        </button>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="kaca sticky top-0 z-10 flex items-center justify-between gap-2 rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-5">
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
            {/* Tombol kembali: gestur geser saja tidak cukup — ia tidak ada di
                desktop, tidak terlihat, dan tidak bisa dijangkau papan ketik. */}
            {bisaKembali && (
              <button
                onClick={kembali}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral-100"
                aria-label="Go back"
                title="Back"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <h1 className="truncate text-base font-bold sm:text-lg">{title?.label ?? 'Panaceamed.id'}</h1>
          </div>
          {/* Pencarian: fitur sudah lewat 200, dan menu menuntut menebak grupnya
              dulu. Ditaruh di header supaya tersedia dari halaman mana pun. */}
          <button
            onClick={() => setCariBuka(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral-100"
            aria-label="Search features, people, or hashtags"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </button>

          <div className="no-scrollbar flex min-w-0 shrink items-center gap-2 overflow-x-auto sm:gap-3">
            {/* Pesan, dukungan, dan tema pindah ke laci menu -- lihat catatan
                di atas soal delapan sasaran ketuk dalam satu bilah. Yang
                tersisa di sini hanya yang benar-benar dipakai setiap hari. */}
            <NotificationBell />
            <button
              onClick={() => setTheme(toggleTheme())}
              className="hidden h-10 w-10 place-items-center rounded-full border border-black/5 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:grid"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            {/* Peran: lambang orang, bukan kotak pilihan. Saldo PNC: pindah ke
                beranda. Keduanya dulu berdiri di sini dan bersama-sama memakan
                sekitar 170 px dari bilah selebar 390 px, sehingga judul halaman
                terpotong menjadi "Ber…" — lihat catatan di MenuPeran.tsx dan
                UbinDompet.tsx. */}
            {account.isOwner && (
              <MenuPeran peran={account.role} daftar={ALL} label={roleLabel} ganti={setMode} />
            )}
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
        <PencarianGlobal buka={cariBuka} tutup={() => setCariBuka(false)} />

        {/* Pintasan cepat, hanya di layar sempit -- DAN tidak di dasbor.
            Di dasbor deretan ini mengulang persis kisi lambang yang ada tepat
            di bawahnya, jadi ia hanya mendorong isi yang sesungguhnya turun
            satu baris dan memberi dua jalan ke tujuan yang sama. Di halaman
            lain ia tetap berguna, karena di sana kisinya tidak ada. */}
        {!onHome && (
        <div data-pintasan className="relative border-b border-black/5 bg-white lg:hidden">
          <div className="flex gap-2 overflow-x-auto px-3 py-2.5">
            {quick.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold ${
                    isActive ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600'
                  }`
                }
              >
                <n.icon size={15} />
                {n.label}
              </NavLink>
            ))}
            {(account.role === 'pasien' || account.role === 'dokter') && (
              <NavLink to="/hospitals" className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-3 text-xs font-bold text-accent">
                <IconHospital size={15} /> SOS
              </NavLink>
            )}
          </div>
          {/* Fade hint that the strip scrolls further right */}
          <div className="fade-edge-surface pointer-events-none absolute inset-y-0 right-0 w-8" />
        </div>
        )}
        {/* Umpan balik tarikan: tanpa ini gestur terasa seperti tidak terjadi
            apa-apa sampai tiba-tiba halaman berkedip. */}
        {(tarikan > 0 || sedangSegar) && (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center" aria-hidden="true">
            <span
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-dark shadow-lg"
              style={{
                opacity: sedangSegar ? 1 : Math.min(1, tarikan * 1.4),
                // Ikut turun bersama tarikan, bukan diam di tempat: penanda yang
                // tidak ikut bergerak terasa terlepas dari gerakan jari.
                transform: `translate3d(0,${sedangSegar ? 44 : 8 + tarikan * 36}px,0) scale(${
                  sedangSegar ? 1 : 0.7 + tarikan * 0.3}) rotate(${tarikan * 300}deg)`,
                transition: sedangSegar
                  ? 'transform 0.5s cubic-bezier(0.32,0.72,0,1), opacity 0.3s ease'
                  : 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" className={sedangSegar ? 'animate-spin' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </span>
          </div>
        )}

        {/* Isi halaman mengikuti jari saat digeser, lalu memantul pulih. Kelas
            transisi hanya dipasang SETELAH jari diangkat — bila dipasang selagi
            menggeser, gerakannya tertinggal di belakang jari dan justru terasa
            berat. */}
        <main
          /* pb-16, bukan pb-28. Ruang 112 px di bawah dulu disediakan untuk
             bilah navigasi selebar layar; bilah itu sudah diganti tombol
             melayang yang tidak menempati aliran halaman, sehingga menyisakan
             ruang sebesar itu berarti setiap halaman berakhir dengan 112 px
             kosong tanpa sebab. Yang disisakan kini hanya cukup agar baris
             terakhir tidak tertutup tombol saat tombolnya berada di bawah.

             pb-20 (80 px), bukan pb-16 (64 px): letak istirahat tombol kini di
             sudut kanan bawah, dan di sana ia menempati 12-68 px dari dasar
             layar. Dengan 64 px, empat piksel terakhir isi halaman berada
             tepat di bawahnya. */
          className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 sm:px-6 lg:pb-6 ${
            menggeser ? 'geser-ikut' : 'geser-pulih'}`}
          style={geser ? { transform: `translate3d(${geser}px,0,0)` } : undefined}
        >
          {onHome && <PeringatanPenyimpanan />}
          {onHome && <InstallBanner />}
          {onHome && homeServices.length > 0 && (
            <div className="mb-5 hidden lg:block">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
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
          <div key={`${loc.pathname}:${nonceSegar}`} className="page-enter">
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
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{roleLabel[account.role]}</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-2xl leading-none text-neutral-500 hover:bg-neutral-100" aria-label="Close menu">×</button>
            </div>
            <DrawerNav items={items} />
            <div className="border-t border-black/5 p-3">
              {(account.role === 'pasien' || account.role === 'dokter') && (
                <NavLink to="/hospitals" className="mb-2 flex items-center justify-center gap-2 rounded-xl bg-accent/10 px-3 py-3 text-sm font-bold text-accent">
                  <IconHospital size={18} /> Emergency (SOS)
                </NavLink>
              )}
              <NavLink
                to="/messages"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                <IconChat size={18} /> Pesan
              </NavLink>
              <button
                onClick={() => { setMenuOpen(false); setBantuanBuka(true) }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                <IconPhone size={18} /> Bantuan / Dukungan
              </button>
              <button
                onClick={() => setTheme(toggleTheme())}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button onClick={doLogout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 px-3 py-3 text-sm font-bold text-neutral-600">
                <IconLogout size={18} /> Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Navigasi: satu tombol melayang yang dapat dipindah, menggantikan bilah
          selebar layar.

          Bilah lama memakan 68 px tinggi layar SETIAP SAAT pada aplikasi yang
          halaman-halamannya sudah setinggi enam layar. Satu tombol 56 px
          mengembalikan ruang itu kepada isi — dan karena dapat dipindah, ia
          tidak pernah menutupi bagian yang sedang dibaca.

          Tujuh tujuan yang sama tetap ada, kini di dalam menu yang muncul saat
          tombolnya diketuk; tidak ada satu pun yang dihapus. */}
      {['pasien', 'dokter', 'owner'].includes(account.role) && !navHidden && (
        <FabNavigasi
          tujuan={[
            { to: '/', label: 'Home', ikon: <IconHome size={19} />, end: true },
            { to: '/community', label: 'Community', ikon: <IconUsers size={19} /> },
            { to: '/vitapulse', label: 'VitaPulse', ikon: <IconActivity size={19} /> },
            { to: '/health-data', label: 'Device', ikon: <IconHeart size={19} /> },
            { to: '/latihan', label: 'Training', ikon: <IconRun size={19} /> },
            { to: '/sports-scores', label: 'Skor Langsung', ikon: <IconFlame size={19} /> },
            { to: '/profile', label: 'Profile', ikon: <IconUser size={19} /> },
          ]}
          onCari={() => setCariBuka(true)}
          onTambah={() => {
            navigate('/feed')
            setTimeout(() => window.dispatchEvent(new Event('panacea:compose')), 60)
          }}
        />
      )}

      {['pasien', 'dokter', 'owner'].includes(account.role) && <><OnboardingTour /><AssessmentPrompt /></>}

      <ContactService buka={bantuanBuka} onTutup={() => setBantuanBuka(false)} />
    </div>
  )
}
