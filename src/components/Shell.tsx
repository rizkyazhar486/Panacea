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
import { DailyQuoteBanner } from './DailyQuoteBanner'
import { OnboardingTour, AssessmentPrompt } from './OnboardingTour'
import { api, backendEnabled } from '../lib/api'
import { trackVisit, rankByUsage } from '../lib/usage'
import type { Role } from '../lib/types'
import { ambilTersembunyi, saring, langgananFitur } from '../lib/fiturTersembunyi'
import { autoIsiDariPerangkat } from '../lib/autoIsi'
import { useCommandBar } from './useCommandBar'
import { SUPER_PAGES } from '../lib/superPages'
import '../styles/command-bar.css'
import '../styles/superpage-convergence.css'

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
  { to: '/body-explorer', label: 'Body Explorer', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Your Body' },
  { to: '/radiology', label: 'Radiology Viewer', icon: IconSearch, roles: ['pasien', 'dokter', 'owner'], group: 'Your Body' },
  { to: '/electrophysiology', label: 'Arrhythmia Lab', icon: IconHeart, roles: ['pasien', 'dokter', 'owner'], group: 'Your Body' },
  { to: '/genome-lab', label: 'Genome Lab', icon: IconActivity, roles: ['pasien', 'dokter', 'owner'], group: 'Your Body' },
  { to: '/knowledge-bridge', label: 'Knowledge Bridge', icon: IconBook, roles: ['pasien', 'dokter', 'owner'], group: 'Learn & Look Up' },
  { to: '/frontier-health', label: 'Frontier Health OS', icon: IconSparkle, roles: ['dokter', 'owner'], group: 'Learn & Look Up' },
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
  { to: '/body-explorer', label: 'Body Explorer', icon: IconActivity, roles: ['pasien'], group: 'Health' },
  { to: '/radiology', label: 'Radiology Viewer', icon: IconSearch, roles: ['pasien', 'dokter'], group: 'Health' },
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

export function Shell({ children }: { children: ReactNode }) {
  const { state, activePatient, setActivePatient, logout, setMode } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [spacesOpen, setSpacesOpen] = useState(false)
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
    mati: cariBuka || spacesOpen,
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
  // Tinggi bilah atas, disiarkan supaya lapisan mengambang tidak menimpanya.
  //
  // Spanduk kutipan harian dipasang `fixed top-4 z-[60]`, tepat di atas bilah
  // ini yang hanya z-10. Di layar 390px ia menutupi SELURUH baris navigasi --
  // menu, tombol kembali, judul halaman, pencarian, notifikasi, profil dan
  // keluar -- dan karena spanduknya menerima penunjuk, tombol-tombol di
  // bawahnya juga tidak bisa ditekan sampai spanduknya ditutup. Angka tetap
  // tidak dipakai di sini: tinggi bilah berubah menurut lebar layar dan isi
  // judulnya, dan tebakan yang meleset mengembalikan tumpang-tindih yang sama.
  const bilahAtas = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const el = bilahAtas.current
    if (!el) return
    const ukur = () => {
      document.documentElement.style.setProperty('--tinggi-bilah-atas', `${Math.round(el.getBoundingClientRect().height)}px`)
    }
    ukur()
    if (typeof ResizeObserver === 'undefined') return
    const pengamat = new ResizeObserver(ukur)
    pengamat.observe(el)
    return () => pengamat.disconnect()
  }, [])

  useEffect(() => pasangKilau(), [])
  const account = state.account

  // Only the top command bar may step out of the way. Assistive Touch remains
  // a persistent global action surface and is not coupled to chrome visibility.
  const keadaanBilah = useCommandBar(bilahAtas)

  // Route changes close the compact command dropdown and record local usage.
  useEffect(() => { setSpacesOpen(false); trackVisit(loc.pathname) }, [loc.pathname])

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
  const doLogout = () => { if (backendEnabled) api.logout().catch(() => {}); logout() }
  // Beranda ringkas — the user's most-used services (ranked by visit history),
  // shown on the home route only.
  const homeServices = rankByUsage(
    items.filter((n) => !['/', '/settings', '/legal', '/architecture'].includes(n.to)),
  ).slice(0, 8)
  const onHome = loc.pathname === '/'
  const bodyExposureView = loc.pathname === '/fitness-hub' && new URLSearchParams(loc.search).get('view') === 'body-exposure'
  const spatialSurface = loc.pathname.startsWith('/body-explorer') || bodyExposureView

  return (
    <div className="pmd-spectral-shell relative flex min-h-screen">
      <DailyQuoteBanner />
      {/* Kop surat untuk cetak/PDF — tampil hanya saat mencetak, di tiap halaman */}
      <div className="print-letterhead">
        <LogoMark size={28} />
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-wordmark)' }}>Panaceamed<span className="text-brand">.id</span></div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Longevity Medical-AI · Official Document</div>
        </div>
      </div>
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Pita tangkap: selalu ada di tepi atas, tidak pernah ikut menyingkir.
            Inilah yang memanggil bilah kembali — mengandalkan hover pada
            bilahnya sendiri mustahil, karena bilah yang tersembunyi sudah tidak
            berada di bawah kursor. Tidak menerima penunjuk supaya tidak pernah
            menelan klik milik isi halaman di bawahnya. */}
        <div className="panacea-command-bar-reveal-zone" aria-hidden />
        <header
          ref={bilahAtas}
          data-panacea-command-bar={keadaanBilah}
          className="kaca panacea-command-bar sticky top-0 z-10 flex items-center justify-between gap-2 rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-5"
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSpacesOpen((value) => !value)}
              className="header-icon-btn grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink"
              aria-label="Open Panacea spaces"
              aria-expanded={spacesOpen}
              aria-haspopup="true"
            >
              <LogoMark size={27} />
            </button>
            {/* Tombol kembali: gestur geser saja tidak cukup — ia tidak ada di
                desktop, tidak terlihat, dan tidak bisa dijangkau papan ketik. */}
            {bisaKembali && (
              <button
                onClick={kembali}
                className="header-icon-btn grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink"
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

          {spacesOpen && (
            <div className="pmd-command-spaces" aria-label="Panacea spaces">
              <NavLink to="/" end className="pmd-command-space-link">
                <span>Home</span><span aria-hidden>⌂</span>
              </NavLink>
              {SUPER_PAGES.map((space) => (
                <NavLink key={space.id} to={space.to} className="pmd-command-space-link">
                  <span>{space.label}</span><span aria-hidden>↗</span>
                </NavLink>
              ))}
              <div className="my-1 h-px bg-black/5 dark:bg-white/10" aria-hidden />
              <NavLink to="/settings" className="pmd-command-space-link">
                <span>Settings</span><IconSettings size={15} />
              </NavLink>
              <button type="button" onClick={() => { setSpacesOpen(false); setBantuanBuka(true) }} className="pmd-command-space-link w-full text-left">
                <span>Support</span><IconPhone size={15} />
              </button>
              <button type="button" onClick={doLogout} className="pmd-command-space-link w-full text-left">
                <span>Log out</span><IconLogout size={15} />
              </button>
            </div>
          )}

          {/* Pencarian: fitur sudah lewat 200, dan menu menuntut menebak grupnya
              dulu. Ditaruh di header supaya tersedia dari halaman mana pun. */}
          <button
            onClick={() => setCariBuka(true)}
            className="header-icon-btn grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink"
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
          data-spatial={spatialSurface ? 'true' : 'false'}
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
          className={`pmd-page-stage pmd-scroll-orchestrator mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 sm:px-6 lg:pb-6 ${
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

      {/* Navigasi: satu tombol melayang yang dapat dipindah, menggantikan bilah
          selebar layar.

          Bilah lama memakan 68 px tinggi layar SETIAP SAAT pada aplikasi yang
          halaman-halamannya sudah setinggi enam layar. Satu tombol 56 px
          mengembalikan ruang itu kepada isi — dan karena dapat dipindah, ia
          tidak pernah menutupi bagian yang sedang dibaca.

          Tujuh tujuan yang sama tetap ada, kini di dalam menu yang muncul saat
          tombolnya diketuk; tidak ada satu pun yang dihapus. */}
      {['pasien', 'dokter', 'owner'].includes(account.role) && (
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
