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
  { id: 'energi', label: 'Energi', emoji: '🔋', komponen: BodyBattery,
    ringkas: 'Cadangan energi 0–100 dan tingkat stres sepanjang hari' },
  { id: 'jantung', label: 'Jantung', emoji: '❤️', komponen: HeartRateLog,
    ringkas: 'Setiap sampel denyut yang dikirim jam tangan, beserta kerapatannya' },
  { id: 'tidur', label: 'Tidur', emoji: '😴', komponen: SleepPattern,
    ringkas: 'Durasi, tahapan, dan keteraturan jam tidur' },
  { id: 'gerak', label: 'Gerak', emoji: '🦶', komponen: GaitAnalysis,
    ringkas: 'Asimetri langkah, kualitas berjalan, bentuk lari, pemulihan denyut' },
  { id: 'klinis', label: 'Klinis', emoji: '🩺', komponen: ClinicalTrackers,
    ringkas: 'SpO₂, catatan EKG, jet lag, kehamilan, fisiologi kursi roda' },
]

export function PusatTubuh() {
  return (
    <HalamanTab
      judul="Sinyal Tubuh"
      subjudul="Energi, jantung, tidur, gerak dan pelacak klinis dalam satu halaman"
      ikon={<IconActivity />}
      tabs={TABS}
    />
  )
}

export default PusatTubuh
