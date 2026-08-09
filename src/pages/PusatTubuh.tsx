import { lazy, useMemo } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { PanelAngka, NADA, type Angka } from '../components/PanelAngka'
import { IconActivity } from '../components/icons'
import { getVitals } from '../lib/healthVitals'

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
    ringkas: 'Setiap sampel denyut yang dikirim jam tangan, dan serapatnya' },
  { id: 'tidur', label: 'Tidur', emoji: '😴', komponen: SleepPattern,
    ringkas: 'Durasi, tahapan, dan keteraturan jam tidur' },
  { id: 'gerak', label: 'Gerak', emoji: '🦶', komponen: GaitAnalysis,
    ringkas: 'Asimetri langkah, kualitas jalan, bentuk lari, pemulihan denyut' },
  { id: 'klinis', label: 'Klinis', emoji: '🩺', komponen: ClinicalTrackers,
    ringkas: 'SpO₂, rekam EKG, jet lag, kehamilan, fisiologi kursi roda' },
]

export function PusatTubuh() {
  /**
   * Angka tubuh terkini, ditampilkan di atas seluruh tab.
   *
   * Diukur di peramban sebelum ini ada: halaman /tubuh hanya 42 kata dan
   * nyaris kosong, karena tab pertamanya kebetulan yang paling jarang berisi
   * data — padahal berat, nadi, dan tensi pemakainya tersimpan dan bisa
   * langsung dibaca. Halaman yang terbuka kosong mengajarkan orang bahwa
   * halaman itu memang kosong, dan ia tidak akan kembali.
   */
  const angka = useMemo<Angka[]>(() => {
    const v = getVitals()
    const out: Angka[] = []
    if (v.weightKg) out.push({ label: 'Berat', nilai: String(v.weightKg), satuan: 'kg', nada: NADA.netral })
    if (v.restingHr) out.push({ label: 'Nadi', nilai: String(v.restingHr), satuan: 'bpm', nada: NADA.jantung })
    if (v.systolic && v.diastolic) out.push({ label: 'Tensi', nilai: `${v.systolic}/${v.diastolic}`, nada: NADA.netral })
    if (v.spo2Pct) out.push({ label: 'SpO₂', nilai: String(v.spo2Pct), satuan: '%', nada: NADA.biru })
    if (v.hrvMs) out.push({ label: 'HRV', nilai: String(v.hrvMs), satuan: 'ms', nada: NADA.biru })
    return out
  }, [])

  return (
    <HalamanTab
      judul="Tanda Tubuh"
      subjudul="Energi, jantung, tidur, gerak, dan pemantau klinis dalam satu halaman"
      ikon={<IconActivity />}
      ringkasan={<PanelAngka angka={angka} />}
      tabs={TABS}
    />
  )
}

export default PusatTubuh
