import { lazy } from 'react'
import { Link } from 'react-router-dom'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { IconRun } from '../components/icons'

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
  { id: 'pelatih', label: 'Coach', emoji: '🏃', komponen: WorkoutHistory,
    ringkas: 'Next session, last session summary, history, targets and records' },
  { id: 'analisis', label: 'Analysis', emoji: '📈', komponen: AnalisisPro,
    ringkas: 'Fitness & freshness, relative effort, training log, pace zones' },
  { id: 'fisiologi', label: 'Physiology', emoji: '🫀', komponen: TrainingPhysiology,
    ringkas: 'Training load, status, recovery time, lactate threshold, readiness' },
  { id: 'endurance', label: 'Endurance', emoji: '⛽', komponen: EnduranceTools,
    ringkas: 'Fuelling, sweat rate, FTP, power guidance, acclimatisation' },
]

export function PusatLatihan() {
  return (
    <>
    <HalamanTab
      judul="Training"
      subjudul="Coach, analysis, physiology and endurance tools on one page"
      ikon={<IconRun />}
      tabs={TABS}
    />
    {/* Pintu ke alat-alat yang tidak muat dalam empat tab di atas. */}
    <div className="-mt-20 pb-24">
      <Link to="/fitness-hub"
        className="block rounded-2xl border border-dashed border-white/15 py-2.5 text-center text-[12px] font-bold text-neutral-500 transition hover:border-white/30 hover:text-ink">
        🔎 Every other training tool
      </Link>
    </div>
    </>
  )
}

export default PusatLatihan
