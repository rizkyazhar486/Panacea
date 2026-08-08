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
  { id: 'pelatih', label: 'Pelatih', emoji: '🏃', komponen: WorkoutHistory,
    ringkas: 'Sessions berikutnya, rangkuman sesi terakhir, riwayat, target dan rekor' },
  { id: 'analisis', label: 'Analisis', emoji: '📈', komponen: AnalisisPro,
    ringkas: 'Kebugaran & kesegaran, upaya relatif, log latihan, zona pace' },
  { id: 'fisiologi', label: 'Fisiologi', emoji: '🫀', komponen: TrainingPhysiology,
    ringkas: 'Beban latihan, status, waktu pemulihan, ambang laktat, kesiapan' },
  { id: 'endurance', label: 'Endurance', emoji: '⛽', komponen: EnduranceTools,
    ringkas: 'Bahan bakar, laju keringat, FTP, panduan daya, aklimatisasi' },
]

export function PusatLatihan() {
  return (
    <>
    <HalamanTab
      judul="Latihan"
      subjudul="Pelatih, analisis, fisiologi dan alat endurance dalam satu halaman"
      ikon={<IconRun />}
      tabs={TABS}
    />
    {/* Pintu ke alat-alat yang tidak muat dalam empat tab di atas. */}
    <div className="-mt-20 pb-24">
      <Link to="/fitness-hub"
        className="block rounded-2xl border border-dashed border-white/15 py-2.5 text-center text-[12px] font-bold text-slate-400 transition hover:border-white/30 hover:text-white">
        🔎 Semua alat latihan lainnya
      </Link>
    </div>
    </>
  )
}

export default PusatLatihan
