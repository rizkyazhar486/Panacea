import { lazy, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { PanelAngka, NADA, type Angka } from '../components/PanelAngka'
import { IconRun } from '../components/icons'
import { getWorkouts } from '../lib/workoutStore'
import { getVitals } from '../lib/healthVitals'
import { statusSingkat } from '../lib/pelatih'
import { hrMaxFromAge } from '../lib/workoutImport'

// ─────────────────────────────────────────────────────────────────────────────
// Pusat Latihan — empat halaman yang selama ini terpisah, padahal semuanya
// menjawab pertanyaan yang sama: "latihan saya bagaimana".
//
//   Pelatih    — apa berikutnya, rangkuman sesi terakhir, riwayat, target, PR
//   Analisis   — kebugaran & kesegaran, upaya relatif, log, zona pace
//   Fisiologi  — beban, status, pemulihan, ambang, kesiapan
//   Endurance  — bahan bakar, keringat, FTP, panduan daya, aklimatisasi
//
// Isinya tidak ditulis ulang; tab memuat komponen halaman aslinya.
// ─────────────────────────────────────────────────────────────────────────────

const WorkoutHistory = lazy(() => import('./WorkoutHistory').then((m) => ({ default: m.WorkoutHistory })))
const AnalisisPro = lazy(() => import('./AnalisisPro').then((m) => ({ default: m.AnalisisPro })))
const TrainingPhysiology = lazy(() => import('./TrainingPhysiology').then((m) => ({ default: m.TrainingPhysiology })))
const EnduranceTools = lazy(() => import('./EnduranceTools').then((m) => ({ default: m.EnduranceTools })))

const TABS: TabDef[] = [
  { id: 'pelatih', label: 'Pelatih', emoji: '🏃', komponen: WorkoutHistory,
    ringkas: 'Sesi berikutnya, rangkuman sesi terakhir, riwayat, target, rekor' },
  { id: 'analisis', label: 'Analisis', emoji: '📈', komponen: AnalisisPro,
    ringkas: 'Kebugaran & kesegaran, upaya relatif, log latihan, zona pace' },
  { id: 'fisiologi', label: 'Fisiologi', emoji: '🫀', komponen: TrainingPhysiology,
    ringkas: 'Beban latihan, status, waktu pulih, ambang laktat, kesiapan' },
  { id: 'endurance', label: 'Daya Tahan', emoji: '⛽', komponen: EnduranceTools,
    ringkas: 'Bahan bakar, laju keringat, FTP, panduan daya, aklimatisasi' },
]

export function PusatLatihan() {
  /**
   * Angka latihan terkini, di atas seluruh tab.
   *
   * Halaman ini setinggi 6,3 layar telepon, dan yang paling sering dicari --
   * "boleh latihan keras hari ini atau tidak" -- terkubur di dalam tab
   * pertama. Ditaruh di atas supaya jawabannya terbaca sebelum menggulir.
   */
  const angka = useMemo<Angka[]>(() => {
    const w = getWorkouts()
    if (!w.length) return []
    const v = getVitals()
    const teramati = w.reduce((a, x) => Math.max(a, x.maxHr ?? 0), 0)
    const sex = (v.sex === 'F' ? 'F' : 'M') as 'M' | 'F'
    const k = {
      hrMax: Math.max(teramati, hrMaxFromAge(30, sex)),
      hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
      sex,
    }
    const st = statusSingkat(w, k)
    if (!st) return []
    const deret = Array.from({ length: 14 }, (_, i) => {
      const x = statusSingkat(w, k, Date.now() - (13 - i) * 86400_000)
      return x ? x.kesegaran : 0
    })
    return [
      { label: 'Segar', nilai: String(Math.round(st.kesegaran)),
        nada: st.kesegaran >= -10 ? NADA.baik : NADA.perhatian, deret },
      { label: 'Bugar', nilai: String(Math.round(st.kebugaran)), nada: NADA.biru },
      { label: 'Lelah', nilai: String(Math.round(st.kelelahan)), nada: NADA.jantung },
      { label: 'Sesi', nilai: String(w.length), satuan: 'tercatat', nada: NADA.netral },
    ]
  }, [])

  return (
    <>
    <HalamanTab
      judul="Latihan"
      subjudul="Pelatih, analisis, fisiologi, dan daya tahan dalam satu halaman"
      ikon={<IconRun />}
      ringkasan={<PanelAngka angka={angka} />}
      tabs={TABS}
    />
    {/* Pintu ke alat-alat yang tidak muat dalam empat tab di atas. */}
    <div className="-mt-20 pb-24">
      <Link to="/fitness-hub"
        className="block rounded-2xl border border-dashed border-white/15 py-2.5 text-center text-[12px] font-bold text-neutral-500 transition hover:border-white/30 hover:text-ink">
        🔎 Seluruh alat latihan lainnya
      </Link>
    </div>
    </>
  )
}

export default PusatLatihan
