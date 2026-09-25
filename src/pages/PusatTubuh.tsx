import { lazy, useMemo } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { PanelAngka, NADA, type Angka } from '../components/PanelAngka'
import { KartuAngkaKlinis } from '../components/AngkaKlinis'
import { auditTubuh } from '../lib/rujukanTubuh'
import { IconActivity } from '../components/icons'
import { getVitals } from '../lib/healthVitals'
import { CekHarian } from '../components/CekHarian'
import { UbinLab } from '../components/UbinLab'
import { PersonalBodyUnifiedSurface } from '../components/PersonalBodyUnifiedSurface'

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
// Pemulihan dan tidur yang dulu tersebar sebagai rute sendiri-sendiri. Halaman
// ini sudah memiliki tab Tidur sejak awal, jadi di sinilah tempatnya — bukan di
// hub baru. Isinya tidak ditulis ulang; komponennya dipasang apa adanya.
const SleepDebt = lazy(() => import('./SleepDebt').then((m) => ({ default: m.SleepDebt })))
const SleepApneaScreen = lazy(() => import('./SleepApneaScreen').then((m) => ({ default: m.SleepApneaScreen })))
const SleepToolkit = lazy(() => import('./SleepToolkit').then((m) => ({ default: m.SleepToolkit })))
const Chronotype = lazy(() => import('./Chronotype').then((m) => ({ default: m.Chronotype })))
const Recovery = lazy(() => import('./Recovery').then((m) => ({ default: m.Recovery })))
const Breathwork = lazy(() => import('./Breathwork').then((m) => ({ default: m.Breathwork })))
const ThermalTherapy = lazy(() => import('./ThermalTherapy').then((m) => ({ default: m.ThermalTherapy })))
const PostureBreaks = lazy(() => import('./PostureBreaks').then((m) => ({ default: m.PostureBreaks })))
const FastingTimer = lazy(() => import('./FastingTimer').then((m) => ({ default: m.FastingTimer })))
const PhoneHealthScan = lazy(() => import('./PhoneHealthScan').then((m) => ({ default: m.PhoneHealthScan })))

const TABS: TabDef[] = [
  { id: 'phone', label: 'Phone scan', emoji: '📱', komponen: PhoneHealthScan,
    ringkas: 'Camera pulse + local visual intake; useful without a wearable' },
  { id: 'energi', label: 'Energy', emoji: '🔋', komponen: BodyBattery,
    ringkas: 'Energy reserve 0–100 and stress level through the day' },
  { id: 'jantung', label: 'Heart', emoji: '❤️', komponen: HeartRateLog,
    ringkas: 'Every heart-rate sample the watch sends, and how dense it is' },
  { id: 'tidur', label: 'Sleep', emoji: '😴', komponen: SleepPattern,
    ringkas: 'Duration, stages, and how consistent your bedtime is' },
  // ── Tidur, diperinci ──────────────────────────────────────────────────────
  { id: 'utang-tidur', label: 'Sleep debt', emoji: '📉', komponen: SleepDebt,
    ringkas: 'Accumulated shortfall against your own need, and what repays it' },
  { id: 'apnea', label: 'Apnoea screen', emoji: '🫁', komponen: SleepApneaScreen,
    ringkas: 'STOP-BANG style screening for obstructive sleep apnoea' },
  { id: 'kronotipe', label: 'Chronotype', emoji: '🌗', komponen: Chronotype,
    ringkas: 'Your body clock, and why forcing it costs more than it saves' },
  { id: 'alat-tidur', label: 'Sleep toolkit', emoji: '🛏️', komponen: SleepToolkit,
    ringkas: 'Sleep hygiene, light, temperature and timing — what changes it' },

  // ── Pemulihan ─────────────────────────────────────────────────────────────
  { id: 'pulih', label: 'Recovery', emoji: '🌱', komponen: Recovery,
    ringkas: 'Recovering from surgery, injury, illness or overtraining' },
  { id: 'napas', label: 'Breathwork', emoji: '💨', komponen: Breathwork,
    ringkas: 'Breathing patterns that shift autonomic balance, and their limits' },
  { id: 'termal', label: 'Thermal recovery', emoji: '♨️', komponen: ThermalTherapy,
    ringkas: 'Spa, sauna, steam, jacuzzi, hot, cold and onsen — visual first, safety in context' },
  { id: 'postur', label: 'Posture breaks', emoji: '🪑', komponen: PostureBreaks,
    ringkas: 'Breaking up sitting — the intervention with the best evidence' },
  { id: 'puasa', label: 'Fasting', emoji: '⏳', komponen: FastingTimer,
    ringkas: 'Fasting windows and what actually happens in each' },

  { id: 'gerak', label: 'Movement', emoji: '🦶', komponen: GaitAnalysis,
    ringkas: 'Step asymmetry, walking quality, running form, heart-rate recovery' },
  { id: 'klinis', label: 'Clinical', emoji: '🩺', komponen: ClinicalTrackers,
    ringkas: 'SpO₂, ECG recordings, jet lag, pregnancy, wheelchair physiology' },
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
    if (v.weightKg) out.push({ label: 'Weight', nilai: String(v.weightKg), satuan: 'kg', nada: NADA.netral })
    if (v.restingHr) out.push({ label: 'Pulse', nilai: String(v.restingHr), satuan: 'bpm', nada: NADA.jantung })
    if (v.systolic && v.diastolic) out.push({ label: 'BP', nilai: `${v.systolic}/${v.diastolic}`, nada: NADA.netral })
    if (v.spo2Pct) out.push({ label: 'SpO₂', nilai: String(v.spo2Pct), satuan: '%', nada: NADA.biru })
    if (v.hrvMs) out.push({ label: 'HRV', nilai: String(v.hrvMs), satuan: 'ms', nada: NADA.biru })
    return out
  }, [])

  /**
   * Penjabaran tiap angka tubuh: rentang rujukan BESERTA POPULASINYA, ragam
   * harian dalam diri sendiri, dan batasan alatnya.
   *
   * Label "baik / cukup / kurang" sengaja tidak dipakai. Label semacam itu
   * menyembunyikan terhadap siapa angkanya dibandingkan, seberapa tidak pasti
   * alatnya, dan seberapa besar ayunan hariannya — dan ketiganya menentukan
   * apakah angka itu berarti sama sekali.
   */
  const klinis = useMemo(() => {
    const v = getVitals()
    return auditTubuh({
      restingHr: typeof v.restingHr === 'number' ? v.restingHr : undefined,
      hrvMs: typeof v.hrvMs === 'number' ? v.hrvMs : undefined,
      spo2Pct: typeof v.spo2Pct === 'number' ? v.spo2Pct : undefined,
      systolic: typeof v.systolic === 'number' ? v.systolic : undefined,
      diastolic: typeof v.diastolic === 'number' ? v.diastolic : undefined,
    })
  }, [])

  return (
    <div className="space-y-4">
      {/* Darah adalah fondasi Longevity-First (docs/LONGEVITY_FIRST_MASTER_DIRECTIVE.md
          §4–5). Sebelumnya ubin lab hanya muncul bila dipilih manual di papan
          widget beranda — tidak aktif secara bawaan. */}
      <CekHarian />
      <UbinLab />
      {/* Tubuh 3D setinggi ~2.300px; di atas, ia mendorong hasil darah ke y~3.080. */}
      <PersonalBodyUnifiedSurface compact defaultFocus="identity" shareable cameraCapture />
      <HalamanTab
      judul="Body Signals"
      subjudul="Phone-first checks, energy, heart, sleep, movement and clinical trackers"
      ikon={<IconActivity />}
      ringkasan={<PanelAngka angka={angka} />}
      tabs={TABS}
      kaki={
        klinis.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-[13px] font-black text-ink dark:text-white">Where these numbers come from</h2>
            <p className="text-[12px] leading-relaxed text-neutral-500">
              Each number below carries its reference range and the population it came from, how much it swings
              day to day, and when it should not be trusted.
            </p>
            {klinis.map((a) => (
              <KartuAngkaKlinis key={a.label} a={a} />
            ))}
          </section>
        ) : undefined
      }
      />
    </div>
  )
}

export default PusatTubuh
