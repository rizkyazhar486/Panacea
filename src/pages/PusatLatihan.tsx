import { lazy, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { NADA, type Angka } from '../components/PanelAngka'
import { MetalStatPanel } from '../components/MetalStatPanel'
import { FightHero } from '../components/FightHero'
import { KartuAngkaKlinis } from '../components/AngkaKlinis'
import { RaporRamalanKesegaran } from '../components/RaporRamalan'
import { auditKebugaran, auditKelelahan, auditKesegaran, bacaanJujur, type BahanAudit } from '../lib/auditKebugaran'
import { IconRun } from '../components/icons'
import { getWorkouts } from '../lib/workoutStore'
import { getVitals } from '../lib/healthVitals'
import { statusSingkat } from '../lib/pelatih'
import { upayaRelatif } from '../lib/analisisPro'
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
// Sisa suite latihan yang dulu tersebar sebagai rute sendiri-sendiri. Semuanya
// dipasang apa adanya — tidak satu pun isinya ditulis ulang, sama seperti
// penggabungan skor klinis: yang digabung adalah TEMPATNYA, bukan isinya.
const Workout = lazy(() => import('./Workout').then((m) => ({ default: m.Workout })))
const LatihanBeban = lazy(() => import('./LatihanBeban').then((m) => ({ default: m.LatihanBeban })))
const Kalistenik = lazy(() => import('./Kalistenik').then((m) => ({ default: m.Kalistenik })))
const CrossFit = lazy(() => import('./CrossFit').then((m) => ({ default: m.CrossFit })))
const Peregangan = lazy(() => import('./Peregangan').then((m) => ({ default: m.Peregangan })))
const TeknikLari = lazy(() => import('./TeknikLari').then((m) => ({ default: m.TeknikLari })))
const MultiSport = lazy(() => import('./MultiSport').then((m) => ({ default: m.MultiSport })))
const BaseTraining = lazy(() => import('./BaseTraining').then((m) => ({ default: m.BaseTraining })))
const TrainingPlan = lazy(() => import('./TrainingPlan').then((m) => ({ default: m.TrainingPlan })))
const FitnessTest = lazy(() => import('./FitnessTest').then((m) => ({ default: m.FitnessTest })))
const PerformanceLab = lazy(() => import('./PerformanceLab').then((m) => ({ default: m.PerformanceLab })))
const SportsScience = lazy(() => import('./SportsScience').then((m) => ({ default: m.SportsScience })))
const SportsLab = lazy(() => import('./SportsLab').then((m) => ({ default: m.SportsLab })))
const GymEquipment = lazy(() => import('./GymEquipment').then((m) => ({ default: m.GymEquipment })))
const MovementToolkit = lazy(() => import('./MovementToolkit').then((m) => ({ default: m.MovementToolkit })))
const GaitAnalysis = lazy(() => import('./GaitAnalysis').then((m) => ({ default: m.GaitAnalysis })))
const ShapeForming = lazy(() => import('./ShapeForming').then((m) => ({ default: m.ShapeForming })))
const Rekomposisi = lazy(() => import('./Rekomposisi').then((m) => ({ default: m.Rekomposisi })))

const TABS: TabDef[] = [
  { id: 'pelatih', label: 'Coach', emoji: '🏃', komponen: WorkoutHistory,
    ringkas: 'Next session, last session summary, history, targets, records' },
  { id: 'analisis', label: 'Analysis', emoji: '📈', komponen: AnalisisPro,
    ringkas: 'Fitness & freshness, relative effort, training log, pace zones' },
  { id: 'fisiologi', label: 'Physiology', emoji: '🫀', komponen: TrainingPhysiology,
    ringkas: 'Training load, status, recovery time, lactate threshold, readiness' },
  { id: 'endurance', label: 'Endurance', emoji: '⛽', komponen: EnduranceTools,
    ringkas: 'Fuelling, sweat rate, FTP, power guidance, acclimatisation' },

  // ── Yang dulu berdiri sebagai rute sendiri ────────────────────────────────
  // Urutannya mengikuti cara latihan benar-benar dijalani: apa yang dikerjakan
  // hari ini, dengan cara apa, lalu bagaimana ia diukur dan direncanakan.
  { id: 'sesi', label: 'Exercises', emoji: '🏋️', komponen: Workout,
    ringkas: 'The exercise library by muscle group, with form cues and photographs' },
  { id: 'beban', label: 'Weights', emoji: '🔩', komponen: LatihanBeban,
    ringkas: 'Barbell and dumbbell work — loading, progression, technique' },
  { id: 'kalistenik', label: 'Calisthenics', emoji: '🤸', komponen: Kalistenik,
    ringkas: 'Bodyweight progressions from the five basics upward' },
  { id: 'crossfit', label: 'CrossFit', emoji: '⏱️', komponen: CrossFit,
    ringkas: 'Benchmark workouts, scaling, and the metabolic demand of each' },
  { id: 'peregangan', label: 'Mobility', emoji: '🧘', komponen: Peregangan,
    ringkas: 'Stretching and mobility work, and when each type actually helps' },
  { id: 'lari', label: 'Running', emoji: '👟', komponen: TeknikLari,
    ringkas: 'Running technique — cadence, foot strike, common faults' },
  { id: 'multisport', label: 'Multi-sport', emoji: '🚴', komponen: MultiSport,
    ringkas: 'Running, cycling and swimming together' },
  { id: 'dasar', label: 'Base', emoji: '🧱', komponen: BaseTraining,
    ringkas: 'Aerobic base building — the slow work that everything else rests on' },
  { id: 'rencana', label: 'Plan', emoji: '🗓️', komponen: TrainingPlan,
    ringkas: 'Periodised training plans and how a block is structured' },
  { id: 'tes', label: 'Testing', emoji: '📋', komponen: FitnessTest,
    ringkas: 'Field tests of strength, endurance and mobility, with norms' },
  { id: 'lab', label: 'Performance', emoji: '🔬', komponen: PerformanceLab,
    ringkas: 'Performance metrics — VO₂max, thresholds, power and pace' },
  { id: 'sains', label: 'Science', emoji: '📚', komponen: SportsScience,
    ringkas: 'The evidence behind training methods' },
  { id: 'sportlab', label: 'Sports lab', emoji: '🧪', komponen: SportsLab,
    ringkas: 'Sport-specific analysis and benchmarks' },
  { id: 'alat', label: 'Equipment', emoji: '🏟️', komponen: GymEquipment,
    ringkas: 'Gym equipment — what each machine loads and how to set it up' },
  { id: 'gerak', label: 'Movement', emoji: '🦵', komponen: MovementToolkit,
    ringkas: 'Movement quality screens and corrective work' },
  { id: 'gait', label: 'Gait', emoji: '🚶', komponen: GaitAnalysis,
    ringkas: 'Walking and running gait analysis' },
  { id: 'bentuk', label: 'Shaping', emoji: '📐', komponen: ShapeForming,
    ringkas: 'Body shaping goals and the training that actually changes them' },
  { id: 'rekomposisi', label: 'Recomp', emoji: '⚖️', komponen: Rekomposisi,
    ringkas: 'Losing fat and gaining muscle at once — when it is possible' },
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
      { label: 'Fresh', nilai: String(Math.round(st.kesegaran)),
        nada: st.kesegaran >= -10 ? NADA.baik : NADA.perhatian, deret },
      { label: 'Fit', nilai: String(Math.round(st.kebugaran)), nada: NADA.biru },
      { label: 'Fatigue', nilai: String(Math.round(st.kelelahan)), nada: NADA.jantung },
      { label: 'Sessions', nilai: String(w.length), satuan: 'recorded', nada: NADA.netral },
    ]
  }, [])

  /**
   * Bahan untuk menjabarkan ketiga angka itu.
   *
   * Dihitung dari sumber yang SAMA PERSIS dengan angka ringkas di atas, bukan
   * dihitung ulang secara terpisah. Penjabaran yang berasal dari perhitungan
   * kedua pasti akan menyimpang dari angka yang dijabarkannya begitu salah satu
   * diubah, dan penjabaran yang tidak cocok dengan angkanya lebih buruk
   * daripada tidak ada penjabaran sama sekali.
   */
  const audit = useMemo(() => {
    const w = getWorkouts()
    if (!w.length) return null
    const v = getVitals()
    const teramati = w.reduce((a, x) => Math.max(a, x.maxHr ?? 0), 0)
    const sex = (v.sex === 'F' ? 'F' : 'M') as 'M' | 'F'
    const hrMax = Math.max(teramati, hrMaxFromAge(30, sex))
    const hrIstirahat = typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60
    const st = statusSingkat(w, { hrMax, hrRest: hrIstirahat, sex })
    if (!st) return null

    const waktu = w.map((x) => Date.parse(x.mulai)).filter((t) => !Number.isNaN(t))
    const rentangHari = waktu.length
      ? Math.max(1, Math.round((Date.now() - Math.min(...waktu)) / 86400_000))
      : 0

    // Beban hari ini: jumlah TRIMP seluruh sesi yang mulai pada tanggal
    // kalender yang sama. Dihitung dengan fungsi yang SAMA dengan yang dipakai
    // model, bukan ditaksir ulang — penjabaran yang memakai perhitungan kedua
    // akan menyimpang dari angka yang dijabarkannya.
    const hariIni = new Date().toDateString()
    const upayaHariIni = w
      .filter((x) => new Date(Date.parse(x.mulai)).toDateString() === hariIni)
      .reduce((a, x) => a + upayaRelatif(x, { hrMax, hrRest: hrIstirahat, sex }).skor, 0)

    return {
      bahan: {
        kebugaran: st.kebugaran,
        kelelahan: st.kelelahan,
        kesegaran: st.kesegaran,
        jumlahSesi: w.length,
        rentangHari,
        hrMax,
        hrIstirahat,
        upayaHariIni,
      } satisfies BahanAudit,
      riwayat: w,
      k: { hrMax, hrRest: hrIstirahat, sex },
    }
  }, [])

  return (
    <HalamanTab
      judul="Training"
      subjudul="Coach, analysis, physiology and endurance on one page"
      ikon={<IconRun />}
      theme="metal"
      ringkasan={
        <div className="space-y-3">
          <FightHero tag="Arena" title="Training" motto="Veni. Vidi. Vici." />
          <MetalStatPanel angka={angka} />
        </div>
      }
      tabs={TABS}
      kaki={
        <div className="space-y-3">
          {/* Penjabaran ketiga angka.
              Ada karena pertanyaan "angka ini dari mana" adalah pertanyaan yang
              sah, dan karena tidak menjawabnya membuat orang menyimpulkan
              tubuhnya bermasalah atas sesuatu yang sebenarnya sifat model. */}
          {audit && (
            <section className="space-y-3">
              <h2 className="text-[13px] font-black text-ink dark:text-white">
                Where these numbers come from
              </h2>
              {bacaanJujur(audit.bahan) && (
                <p className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-3 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  {bacaanJujur(audit.bahan)}
                </p>
              )}
              <KartuAngkaKlinis a={auditKesegaran(audit.bahan)} />
              <KartuAngkaKlinis a={auditKebugaran(audit.bahan)} />
              <KartuAngkaKlinis a={auditKelelahan(audit.bahan)} />
              <RaporRamalanKesegaran riwayat={audit.riwayat} k={audit.k} />
            </section>
          )}

          {/* Pintu ke alat-alat yang tidak muat dalam empat tab di atas. */}
          <Link to="/fitness-hub"
            className="flex h-11 items-center justify-center rounded-2xl border border-dashed border-white/15 text-[12px] font-bold text-neutral-500 transition hover:border-white/30 hover:text-ink">
            🔎 All other training tools
          </Link>
        </div>
      }
    />
  )
}

export default PusatLatihan
