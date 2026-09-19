import { lazy, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { NADA, type Angka } from '../components/PanelAngka'
import { MetalStatPanel } from '../components/MetalStatPanel'
import { PerformanceVisualizationDeck } from '../components/dashboard/PerformanceVisualizationDeck'
import { TrainingLabBento } from '../components/TrainingLabBento'
import { KartuAngkaKlinis } from '../components/AngkaKlinis'
import { RaporRamalanKesegaran } from '../components/RaporRamalan'
import { auditKebugaran, auditKelelahan, auditKesegaran, bacaanJujur, type BahanAudit } from '../lib/auditKebugaran'
import { IconRun } from '../components/icons'
import { getWorkouts } from '../lib/workoutStore'
import { getVitals } from '../lib/healthVitals'
import { getDemoTersimpan } from '../lib/profile'
import { statusSingkat } from '../lib/pelatih'
import { upayaRelatif } from '../lib/analisisPro'
import { hrMaxFromAge } from '../lib/workoutImport'

// Training is organized decision-first rather than feature-first:
// 1) what should I do today, 2) what does the data say, 3) what physiology
// explains it, 4) what exercise / plan should I choose.
const WorkoutHistory = lazy(() => import('./WorkoutHistory').then((m) => ({ default: m.WorkoutHistory })))
const OrganizerLatihan = lazy(() => import('./OrganizerLatihan').then((m) => ({ default: m.OrganizerLatihan })))
const PelatihProgres = lazy(() => import('./PelatihProgres').then((m) => ({ default: m.PelatihProgres })))
const PelatihAsupan = lazy(() => import('./PelatihAsupan').then((m) => ({ default: m.PelatihAsupan })))
const GpsTracker = lazy(() => import('../components/GpsTracker').then((m) => ({ default: m.GpsTracker })))
const AthleteScience = lazy(() => import('./AthleteScience').then((m) => ({ default: m.AthleteScience })))
const AnalisisPro = lazy(() => import('./AnalisisPro').then((m) => ({ default: m.AnalisisPro })))
const TrainingPhysiology = lazy(() => import('./TrainingPhysiology').then((m) => ({ default: m.TrainingPhysiology })))
const EnduranceTools = lazy(() => import('./EnduranceTools').then((m) => ({ default: m.EnduranceTools })))
const Workout = lazy(() => import('./WorkoutSafe').then((m) => ({ default: m.WorkoutSafe })))
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
    ringkas: 'Next session · recovery · targets' },
  { id: 'organizer', label: 'Organizer', emoji: '🗂️', komponen: OrganizerLatihan,
    ringkas: 'Weekly training calendar' },
  { id: 'asupan-pelatih', label: 'Coach intake', emoji: '📝', komponen: PelatihAsupan,
    ringkas: 'Profile · goals · limits' },
  { id: 'progres', label: 'Progress', emoji: '📈', komponen: PelatihProgres,
    ringkas: 'Week-to-week change' },
  { id: 'gps', label: 'GPS', emoji: '📍', komponen: GpsTracker,
    ringkas: 'Live pace · splits · route' },
  { id: 'athlete-science', label: 'Athlete Science', emoji: '🧬', komponen: AthleteScience,
    ringkas: 'VO₂ · HRV · load' },
  { id: 'analisis', label: 'Analysis', emoji: '📈', komponen: AnalisisPro,
    ringkas: 'Fitness · effort · pace' },
  { id: 'fisiologi', label: 'Physiology', emoji: '🫀', komponen: TrainingPhysiology,
    ringkas: 'Load · threshold · readiness' },
  { id: 'endurance', label: 'Endurance', emoji: '⛽', komponen: EnduranceTools,
    ringkas: 'Fuel · sweat · power' },
  { id: 'sesi', label: 'Exercises', emoji: '🏋️', komponen: Workout,
    ringkas: 'Movement library · technique' },
  { id: 'beban', label: 'Weights', emoji: '🔩', komponen: LatihanBeban,
    ringkas: 'Load · progression · form' },
  { id: 'kalistenik', label: 'Calisthenics', emoji: '🤸', komponen: Kalistenik,
    ringkas: 'Bodyweight progressions' },
  { id: 'crossfit', label: 'CrossFit', emoji: '⏱️', komponen: CrossFit,
    ringkas: 'Benchmarks · scaling' },
  { id: 'peregangan', label: 'Mobility', emoji: '🧘', komponen: Peregangan,
    ringkas: 'Mobility · flexibility' },
  { id: 'lari', label: 'Running', emoji: '👟', komponen: TeknikLari,
    ringkas: 'Technique · cadence · pace' },
  { id: 'multisport', label: 'Multi-sport', emoji: '🚴', komponen: MultiSport,
    ringkas: 'Run · ride · swim' },
  { id: 'dasar', label: 'Base', emoji: '🧱', komponen: BaseTraining,
    ringkas: 'Aerobic base' },
  { id: 'rencana', label: 'Plan', emoji: '🗓️', komponen: TrainingPlan,
    ringkas: 'Periodization · progression' },
  { id: 'tes', label: 'Testing', emoji: '📋', komponen: FitnessTest,
    ringkas: 'Field tests · norms' },
  { id: 'lab', label: 'Performance', emoji: '🔬', komponen: PerformanceLab,
    ringkas: 'VO₂ · power · thresholds' },
  { id: 'sains', label: 'Evidence', emoji: '📚', komponen: SportsScience,
    ringkas: 'Methods · evidence · uncertainty' },
  { id: 'sportlab', label: 'Sports lab', emoji: '🧪', komponen: SportsLab,
    ringkas: 'Sport benchmarks' },
  { id: 'alat', label: 'Equipment', emoji: '🏟️', komponen: GymEquipment,
    ringkas: 'Setup · load · mechanics' },
  { id: 'gerak', label: 'Movement', emoji: '🦵', komponen: MovementToolkit,
    ringkas: 'Gait · asymmetry · control' },
  { id: 'bentuk', label: 'Shaping', emoji: '📐', komponen: ShapeForming,
    ringkas: 'Body composition' },
  { id: 'rekomposisi', label: 'Recomp', emoji: '⚖️', komponen: Rekomposisi,
    ringkas: 'Fat loss · muscle gain' },
]

type Sex = 'M' | 'F'

function angkaPositif(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function sexValid(value: unknown): value is Sex {
  return value === 'M' || value === 'F'
}

function umurValid(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 10 && value <= 100
}

export function PusatLatihan() {
  // workoutStore dan healthVitals sudah menyiarkan event ini setelah data lokal
  // berubah. Tanpa subscription, useMemo([]) membuat Training Lab membeku pada
  // snapshot saat mount dan angka tetap lama setelah import/sync sampai reload.
  const [dataRevision, setDataRevision] = useState(0)
  useEffect(() => {
    const refresh = () => setDataRevision((value) => value + 1)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const snapshot = useMemo(() => {
    const workouts = getWorkouts()
    if (!workouts.length) {
      return { workouts, k: null, status: null, missing: [] as string[], hrMaxSource: '' }
    }

    const vitals = getVitals()
    const demo = getDemoTersimpan()
    const observedMax = workouts.reduce((highest, workout) => Math.max(highest, workout.maxHr ?? 0), 0)
    const sex = sexValid(vitals.sex) ? vitals.sex : sexValid(demo.sex) ? demo.sex : null
    const age = umurValid(demo.age) ? demo.age : null
    const predictedMax = sex && age != null ? hrMaxFromAge(age, sex) : 0
    const hrMax = Math.max(observedMax, predictedMax)
    const hrRest = angkaPositif(vitals.restingHr)
      ? vitals.restingHr
      : angkaPositif(demo.restingHr) ? demo.restingHr : 0

    const missing: string[] = []
    if (!sex) missing.push('sex in Health Profile')
    if (!(hrMax > 0)) missing.push('measured peak HR or saved age')
    if (!(hrRest > 0)) missing.push('resting heart rate')

    if (missing.length || !sex) {
      return { workouts, k: null, status: null, missing, hrMaxSource: '' }
    }

    const k = { hrMax, hrRest, sex }
    const status = statusSingkat(workouts, k)
    const hrMaxSource = observedMax >= predictedMax && observedMax > 0
      ? 'highest observed workout HR'
      : age != null ? `age estimate (${age} y)` : 'observed workout HR'
    return { workouts, k, status, missing, hrMaxSource }
  }, [dataRevision])

  const angka = useMemo<Angka[]>(() => {
    const { workouts, k, status } = snapshot
    if (!workouts.length || !k || !status) return []
    const deret = Array.from({ length: 14 }, (_, i) => {
      const x = statusSingkat(workouts, k, Date.now() - (13 - i) * 86400_000)
      return x ? x.kesegaran : 0
    })
    return [
      { label: 'Freshness', nilai: String(Math.round(status.kesegaran)),
        nada: status.kesegaran >= -10 ? NADA.baik : NADA.perhatian, deret },
      { label: 'Fitness trend', nilai: String(Math.round(status.kebugaran)), nada: NADA.biru },
      { label: 'Fatigue load', nilai: String(Math.round(status.kelelahan)), nada: NADA.jantung },
      { label: 'Sessions', nilai: String(workouts.length), satuan: 'recorded', nada: NADA.netral },
    ]
  }, [snapshot])

  const bento = useMemo(() => {
    const { workouts, k, status } = snapshot
    return {
      freshness: status ? status.kesegaran : null,
      fitness: status ? status.kebugaran : null,
      fatigue: status ? status.kelelahan : null,
      sessions: workouts.length,
      freshnessSeries: status && k
        ? Array.from({ length: 14 }, (_, i) => {
            const point = statusSingkat(workouts, k, Date.now() - (13 - i) * 86400_000)
            return point ? point.kesegaran : 0
          })
        : [],
    }
  }, [snapshot])

  const audit = useMemo(() => {
    const { workouts, k, status } = snapshot
    if (!workouts.length || !k || !status) return null

    const waktu = workouts.map((x) => Date.parse(x.mulai)).filter((t) => !Number.isNaN(t))
    const rentangHari = waktu.length
      ? Math.max(1, Math.round((Date.now() - Math.min(...waktu)) / 86400_000))
      : 0
    const hariIni = new Date().toDateString()
    const upayaHariIni = workouts
      .filter((x) => new Date(Date.parse(x.mulai)).toDateString() === hariIni)
      .reduce((a, x) => a + upayaRelatif(x, k).skor, 0)

    return {
      bahan: {
        kebugaran: status.kebugaran,
        kelelahan: status.kelelahan,
        kesegaran: status.kesegaran,
        jumlahSesi: workouts.length,
        rentangHari,
        hrMax: k.hrMax,
        hrIstirahat: k.hrRest,
        upayaHariIni,
      } satisfies BahanAudit,
      riwayat: workouts,
      k,
    }
  }, [snapshot])

  return (
    <HalamanTab
      judul="Training Lab"
      subjudul="Train · measure · adapt"
      ikon={<IconRun />}
      theme="metal"
      ringkasan={
        <div className="space-y-3">
          <TrainingLabBento snapshot={bento} />

          {snapshot.workouts.length > 0 && !snapshot.k && snapshot.missing.length > 0 && (
            <details className="training-model-disclosure">
              <summary>
                <span>Model paused · {snapshot.missing.length} inputs missing</span>
                <span aria-hidden>+</span>
              </summary>
              <div className="training-model-detail text-[11px] leading-relaxed text-neutral-500">
                Add {snapshot.missing.join(', ')}. Recorded sessions stay available.
              </div>
            </details>
          )}

          <details className="training-depth-disclosure">
            <summary>
              <span>Performance view</span>
              <span aria-hidden>+</span>
            </summary>
            <div className="training-depth-detail space-y-3">
              <PerformanceVisualizationDeck mode="home" />
              <MetalStatPanel angka={angka} />
            </div>
          </details>

          <details className="training-depth-disclosure">
            <summary>
              <span>Reasoning</span>
              <span aria-hidden>+</span>
            </summary>
            <div className="training-depth-detail">
              <div className="grid grid-cols-3 gap-1.5" aria-label="Training reasoning flow">
                {[
                  ['01', 'Decision'],
                  ['02', 'Evidence'],
                  ['03', 'Mechanism'],
                ].map(([step, label], index) => (
                  <div key={label} className="relative min-w-0 overflow-hidden rounded-[14px] border border-white/[.07] bg-white/[.025] px-2.5 py-2">
                    <div className="text-[8px] font-black tabular-nums text-orange-300/60">{step}</div>
                    <div className="mt-0.5 truncate text-[10px] font-black text-white/80">{label}</div>
                    <div className="mt-2 flex h-3 items-end gap-[2px]" aria-hidden="true">
                      {Array.from({ length: 7 }).map((_, bar) => (
                        <i
                          key={bar}
                          className="w-[2px] rounded-full bg-orange-300/55"
                          style={{ height: `${4 + ((bar + index) % 5) * 2}px` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      }
      tabs={TABS}
      kaki={
        <div className="space-y-3">
          {audit && (
            <details className="training-audit-disclosure">
              <summary>
                <span>Model audit · uncertainty</span>
                <span aria-hidden>+</span>
              </summary>
              <div className="training-audit-detail space-y-3">
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  Fitness, fatigue and freshness are model outputs, not direct biological measurements. HRmax input: {audit.k.hrMax} bpm ({snapshot.hrMaxSource}); resting HR: {audit.k.hrRest} bpm. Interpret trends within the same athlete and verify them against symptoms, sleep, session RPE and actual performance.
                </p>
                {bacaanJujur(audit.bahan) && (
                  <p className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                    {bacaanJujur(audit.bahan)}
                  </p>
                )}
                <KartuAngkaKlinis a={auditKesegaran(audit.bahan)} />
                <KartuAngkaKlinis a={auditKebugaran(audit.bahan)} />
                <KartuAngkaKlinis a={auditKelelahan(audit.bahan)} />
                <RaporRamalanKesegaran riwayat={audit.riwayat} k={audit.k} />
              </div>
            </details>
          )}
          <Link to="/fitness-hub"
            className="flex h-11 items-center justify-center rounded-2xl border border-dashed border-white/15 text-[12px] font-bold text-neutral-500 transition hover:border-white/30 hover:text-ink">
            All training tools
          </Link>
        </div>
      }
    />
  )
}

export default PusatLatihan
