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

// Training is organized decision-first rather than feature-first:
// 1) what should I do today, 2) what does the data say, 3) what physiology
// explains it, 4) what exercise / plan should I choose.
const WorkoutHistory = lazy(() => import('./WorkoutHistory').then((m) => ({ default: m.WorkoutHistory })))
const AthleteScience = lazy(() => import('./AthleteScience').then((m) => ({ default: m.AthleteScience })))
const AnalisisPro = lazy(() => import('./AnalisisPro').then((m) => ({ default: m.AnalisisPro })))
const TrainingPhysiology = lazy(() => import('./TrainingPhysiology').then((m) => ({ default: m.TrainingPhysiology })))
const EnduranceTools = lazy(() => import('./EnduranceTools').then((m) => ({ default: m.EnduranceTools })))
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
const ShapeForming = lazy(() => import('./ShapeForming').then((m) => ({ default: m.ShapeForming })))
const Rekomposisi = lazy(() => import('./Rekomposisi').then((m) => ({ default: m.Rekomposisi })))

const TABS: TabDef[] = [
  { id: 'pelatih', label: 'Today', emoji: '🎯', komponen: WorkoutHistory,
    ringkas: 'Decision first: next session, recovery context, recent history and targets' },
  { id: 'athlete-science', label: 'Athlete Science', emoji: '🧬', komponen: AthleteScience,
    ringkas: 'VO₂, HRV, load and recovery with assumptions, confidence and physiological context' },
  { id: 'analisis', label: 'Analysis', emoji: '📈', komponen: AnalisisPro,
    ringkas: 'Fitness/fatigue trends, relative effort, training log and pace analysis' },
  { id: 'fisiologi', label: 'Physiology', emoji: '🫀', komponen: TrainingPhysiology,
    ringkas: 'Training load, recovery, thresholds, readiness and the physiology behind them' },
  { id: 'endurance', label: 'Endurance', emoji: '⛽', komponen: EnduranceTools,
    ringkas: 'Fuelling, sweat rate, FTP, power guidance and acclimatisation' },
  { id: 'sesi', label: 'Exercises', emoji: '🏋️', komponen: Workout,
    ringkas: 'Exercise library by muscle group, with technique and clinical context' },
  { id: 'beban', label: 'Weights', emoji: '🔩', komponen: LatihanBeban,
    ringkas: 'Barbell and dumbbell work — loading, progression and technique' },
  { id: 'kalistenik', label: 'Calisthenics', emoji: '🤸', komponen: Kalistenik,
    ringkas: 'Bodyweight progressions from fundamentals upward' },
  { id: 'crossfit', label: 'CrossFit', emoji: '⏱️', komponen: CrossFit,
    ringkas: 'Benchmark workouts, scaling and metabolic demand' },
  { id: 'peregangan', label: 'Mobility', emoji: '🧘', komponen: Peregangan,
    ringkas: 'Mobility and stretching — what changes performance and what does not' },
  { id: 'lari', label: 'Running', emoji: '👟', komponen: TeknikLari,
    ringkas: 'Technique, cadence, pacing and common movement errors' },
  { id: 'multisport', label: 'Multi-sport', emoji: '🚴', komponen: MultiSport,
    ringkas: 'Running, cycling and swimming together' },
  { id: 'dasar', label: 'Base', emoji: '🧱', komponen: BaseTraining,
    ringkas: 'Aerobic-base development without presenting one intensity distribution as universal' },
  { id: 'rencana', label: 'Plan', emoji: '🗓️', komponen: TrainingPlan,
    ringkas: 'Periodised plans, load progression and block structure' },
  { id: 'tes', label: 'Testing', emoji: '📋', komponen: FitnessTest,
    ringkas: 'Field tests with measurement limits and useful norms' },
  { id: 'lab', label: 'Performance', emoji: '🔬', komponen: PerformanceLab,
    ringkas: 'VO₂, thresholds, power, pace and performance trends' },
  { id: 'sains', label: 'Evidence', emoji: '📚', komponen: SportsScience,
    ringkas: 'Evidence quality, training methods and uncertainty' },
  { id: 'sportlab', label: 'Sports lab', emoji: '🧪', komponen: SportsLab,
    ringkas: 'Sport-specific analysis and benchmarks' },
  { id: 'alat', label: 'Equipment', emoji: '🏟️', komponen: GymEquipment,
    ringkas: 'Gym equipment — load, setup and movement mechanics' },
  { id: 'gerak', label: 'Movement', emoji: '🦵', komponen: MovementToolkit,
    ringkas: 'Movement quality, asymmetry and corrective work' },
  { id: 'bentuk', label: 'Shaping', emoji: '📐', komponen: ShapeForming,
    ringkas: 'Body-composition goals and realistic training effects' },
  { id: 'rekomposisi', label: 'Recomp', emoji: '⚖️', komponen: Rekomposisi,
    ringkas: 'Fat loss and muscle gain with explicit assumptions' },
]

export function PusatLatihan() {
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
      { label: 'Freshness', nilai: String(Math.round(st.kesegaran)),
        nada: st.kesegaran >= -10 ? NADA.baik : NADA.perhatian, deret },
      { label: 'Fitness trend', nilai: String(Math.round(st.kebugaran)), nada: NADA.biru },
      { label: 'Fatigue load', nilai: String(Math.round(st.kelelahan)), nada: NADA.jantung },
      { label: 'Sessions', nilai: String(w.length), satuan: 'recorded', nada: NADA.netral },
    ]
  }, [])

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
      judul="Training Lab"
      subjudul="Decision → evidence → physiology → workout"
      ikon={<IconRun />}
      theme="metal"
      ringkasan={
        <div className="space-y-3">
          <FightHero tag="Human Performance" title="Training Lab" motto="Measure. Interpret. Adapt." />
          <MetalStatPanel angka={angka} />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">1 · Decision</div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">What session makes sense today?</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">2 · Evidence</div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">What was measured, estimated, or inferred?</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">3 · Mechanism</div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">Which physiological system explains the result?</p>
            </div>
          </div>
        </div>
      }
      tabs={TABS}
      kaki={
        <div className="space-y-3">
          {audit && (
            <section className="space-y-3">
              <h2 className="text-[13px] font-black text-ink dark:text-white">Model audit & uncertainty</h2>
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[12px] leading-relaxed text-neutral-500">
                Fitness, fatigue and freshness are model outputs, not direct biological measurements. Interpret trends within the same athlete and verify them against symptoms, sleep, session RPE and actual performance.
              </p>
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
