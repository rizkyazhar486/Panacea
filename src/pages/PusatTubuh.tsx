import { lazy, useMemo } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { PanelAngka, NADA, type Angka } from '../components/PanelAngka'
import { KartuAngkaKlinis } from '../components/AngkaKlinis'
import { auditTubuh } from '../lib/rujukanTubuh'
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
  { id: 'energi', label: 'Energy', emoji: '🔋', komponen: BodyBattery,
    ringkas: 'Energy reserve 0–100 and stress level through the day' },
  { id: 'jantung', label: 'Heart', emoji: '❤️', komponen: HeartRateLog,
    ringkas: 'Every heart-rate sample the watch sends, and how dense it is' },
  { id: 'tidur', label: 'Sleep', emoji: '😴', komponen: SleepPattern,
    ringkas: 'Duration, stages, and how consistent your bedtime is' },
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
    <HalamanTab
      judul="Body Signals"
      subjudul="Energy, heart, sleep, movement and clinical trackers on one page"
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
  )
}

export default PusatTubuh
