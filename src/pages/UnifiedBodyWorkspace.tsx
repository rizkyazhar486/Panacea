import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'
import { PersonalBodyAvatar3D } from '../components/PersonalBodyAvatar3D'

const BodyComposition = lazy(() => import('./BodyComposition').then((m) => ({ default: m.BodyComposition })))
const BodyExplorer = lazy(() => import('./BodyExplorer').then((m) => ({ default: m.BodyExplorer })))
const BodyToolkit = lazy(() => import('./BodyToolkit').then((m) => ({ default: m.BodyToolkit })))
const ShapeForming = lazy(() => import('./ShapeForming').then((m) => ({ default: m.ShapeForming })))
const PusatLatihan = lazy(() => import('./PusatLatihan').then((m) => ({ default: m.PusatLatihan })))
const PusatTubuh = lazy(() => import('./PusatTubuh').then((m) => ({ default: m.PusatTubuh })))
const PusatGizi = lazy(() => import('./PusatGizi').then((m) => ({ default: m.PusatGizi })))
const HealthProfile = lazy(() => import('./HealthProfile').then((m) => ({ default: m.HealthProfile })))
const VitaPulse = lazy(() => import('./VitaPulse').then((m) => ({ default: m.VitaPulse })))
const Longevity = lazy(() => import('./Longevity').then((m) => ({ default: m.Longevity })))
const DataLab = lazy(() => import('./DataLab').then((m) => ({ default: m.DataLab })))

type BodyView = 'body' | 'body-exposure' | 'body-tools' | 'character' | 'training' | 'workout' | 'recovery' | 'numbers' | 'nutrition' | 'health-data' | 'labs' | 'longevity' | 'vitapulse'
type View = { key: BodyView; label: string; short: string; component: ComponentType; childTab?: string; description: string }

const VIEWS: View[] = [
  { key: 'body', label: 'Your Body', short: 'Body', component: BodyComposition, description: 'Body composition and the measurements that define your personal body context.' },
  { key: 'body-exposure', label: 'Body Exposure', short: 'Body Exposure', component: BodyExplorer, description: 'Interactive whole-body anatomy, organ systems, physiology, radiology modes, dissection, biomechanics, molecular and clinical exploration in one living body atlas.' },
  { key: 'body-tools', label: 'Body & Skin Tools', short: 'Body Tools', component: BodyToolkit, description: 'Body-region symptom logging, skin routine tools and daily non-exercise activity tracking connected to the body workspace.' },
  { key: 'character', label: '3D Character & Body Shaper', short: '3D Character', component: ShapeForming, description: 'Use your measurements and body/posture photo analysis to refine the same personal 3D character shown above.' },
  { key: 'training', label: 'Training', short: 'Training', component: PusatLatihan, childTab: 'rencana', description: 'Plans, sport science and training progression in the same personal workspace.' },
  { key: 'workout', label: 'Workout', short: 'Workout', component: PusatLatihan, childTab: 'sesi', description: 'Daily sessions, strength and movement work.' },
  { key: 'recovery', label: 'Sleep & Recovery', short: 'Recovery', component: PusatTubuh, childTab: 'pulih', description: 'Sleep, recovery and readiness context.' },
  { key: 'numbers', label: 'Your Numbers', short: 'Numbers', component: PusatTubuh, childTab: 'energi', description: 'Your recorded signals and body metrics.' },
  { key: 'nutrition', label: 'Nutrition', short: 'Nutrition', component: PusatGizi, childTab: 'makan', description: 'Food, hydration and nutrition context connected to the same person.' },
  { key: 'health-data', label: 'Health Data', short: 'Data', component: HealthProfile, description: 'Imported and recorded health data with provenance.' },
  { key: 'labs', label: 'Health Data Lab', short: 'Lab', component: DataLab, description: 'Explore your own structured data without turning it into an unsupported diagnosis.' },
  { key: 'longevity', label: 'Longevity', short: 'Longevity', component: Longevity, description: 'Long-term health and healthy-aging context.' },
  { key: 'vitapulse', label: 'VitaPulse', short: 'VitaPulse', component: VitaPulse, description: 'A compact vitality view tied to the rest of Your Body.' },
]
const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return <div className="grid min-h-[34vh] place-items-center rounded-[28px] border border-white/10 bg-black/10 text-sm font-bold text-neutral-500" role="status">Loading Your Body…</div>
}

export function UnifiedBodyWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('view') as BodyView | null
  const activeKey: BodyView = requested && VALID.has(requested) ? requested : 'body'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component

  function select(view: View) {
    const next = new URLSearchParams(params)
    next.set('view', view.key)
    if (view.childTab) next.set('t', view.childTab)
    else next.delete('t')
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-4 pb-10">
      <PanaceaZoneNav />
      <section className="grid gap-4 rounded-[30px] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-xl sm:p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-brand">Your Body · one personal health workspace</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">Train, recover, eat, measure and age in one body context</h1>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-300">
            The 3D character is the visual anchor. Measurements entered in your profile shape its proportions; a saved Body Shaper photo analysis refines the body-type model; your profile photo can appear as its face texture. Training, workouts, sleep, recovery, nutrition, health data, labs, longevity and VitaPulse stay around the same person.
          </p>
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Your Body workspace">
            {VIEWS.map((view) => (
              <button key={view.key} type="button" role="tab" aria-selected={activeKey === view.key} onClick={() => select(view)}
                className={`min-h-[44px] shrink-0 rounded-full border px-4 text-xs font-black transition ${activeKey === view.key ? 'border-brand bg-brand text-white shadow-[0_8px_24px_rgba(0,191,99,.18)]' : 'border-white/10 bg-white/5 text-neutral-600 hover:border-brand/30 dark:text-neutral-300'}`}>
                {view.short}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400"><b className="text-ink dark:text-white">{active.label}:</b> {active.description}</div>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PersonalBodyAvatar3D />
        </div>
      </section>
      <section role="tabpanel" aria-label={active.label} className="min-w-0"><Suspense fallback={<Loader />}><Active /></Suspense></section>
      <FeatureBoulevard zone="body" title="Your Body feature boulevard" />
    </div>
  )
}

export default UnifiedBodyWorkspace
