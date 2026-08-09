import { lazy } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { IconActivity } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Sinyal Tubuh — lima halaman yang semuanya membaca deret dari jam tangan,
// disatukan karena orang membacanya berurutan, bukan satu per satu.
//
//   Energi   — Body Battery dan stres sepanjang hari
//   Jantung  — setiap sampel denyut yang dikirim jam tangan
//   Tidur    — durasi, tahapan, dan keteraturan jam tidur
//   Gerak    — asimetri langkah, kualitas jalan, bentuk lari
//   Klinis   — SpO₂, EKG, jet lag, kehamilan, kursi roda
// ─────────────────────────────────────────────────────────────────────────────

const BodyBattery = lazy(() => import('./BodyBattery').then((m) => ({ default: m.BodyBattery })))
const HeartRateLog = lazy(() => import('./HeartRateLog').then((m) => ({ default: m.HeartRateLog })))
const SleepPattern = lazy(() => import('./SleepPattern').then((m) => ({ default: m.SleepPattern })))
const GaitAnalysis = lazy(() => import('./GaitAnalysis').then((m) => ({ default: m.GaitAnalysis })))
const ClinicalTrackers = lazy(() => import('./ClinicalTrackers').then((m) => ({ default: m.ClinicalTrackers })))

const TABS: TabDef[] = [
  { id: 'energi', label: 'Energy', emoji: '🔋', komponen: BodyBattery,
    ringkas: 'Energy reserve 0–100 and stress level through the day' },
  { id: 'jantung', label: 'Heart', emoji: '❤️', komponen: HeartRateLog,
    ringkas: 'Every heart-rate sample your watch sends, and how dense they are' },
  { id: 'tidur', label: 'Sleep', emoji: '😴', komponen: SleepPattern,
    ringkas: 'Duration, stages, and how regular your sleep timing is' },
  { id: 'gerak', label: 'Movement', emoji: '🦶', komponen: GaitAnalysis,
    ringkas: 'Step asymmetry, walking quality, running form, heart-rate recovery' },
  { id: 'klinis', label: 'Clinical', emoji: '🩺', komponen: ClinicalTrackers,
    ringkas: 'SpO₂, ECG log, jet lag, pregnancy, wheelchair physiology' },
]

export function PusatTubuh() {
  return (
    <HalamanTab
      judul="Body Signals"
      subjudul="Energy, heart, sleep, movement and clinical trackers on one page"
      ikon={<IconActivity />}
      tabs={TABS}
    />
  )
}

export default PusatTubuh
