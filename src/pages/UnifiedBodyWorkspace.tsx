import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'
import { PersonalBodyAvatar3D } from '../components/PersonalBodyAvatar3D'

const BodyComposition = lazy(() => import('./BodyComposition').then((m) => ({ default: m.BodyComposition })))
const ShapeForming = lazy(() => import('./ShapeForming').then((m) => ({ default: m.ShapeForming })))
const PusatLatihan = lazy(() => import('./PusatLatihan').then((m) => ({ default: m.PusatLatihan })))
const PusatTubuh = lazy(() => import('./PusatTubuh').then((m) => ({ default: m.PusatTubuh })))
const PusatGizi = lazy(() => import('./PusatGizi').then((m) => ({ default: m.PusatGizi })))
const HealthProfile = lazy(() => import('./HealthProfile').then((m) => ({ default: m.HealthProfile })))
const VitaPulse = lazy(() => import('./VitaPulse').then((m) => ({ default: m.VitaPulse })))
const Longevity = lazy(() => import('./Longevity').then((m) => ({ default: m.Longevity })))
const DataLab = lazy(() => import('./DataLab').then((m) => ({ default: m.DataLab })))

type BodyView = 'body' | 'character' | 'training' | 'workout' | 'recovery' | 'numbers' | 'nutrition' | 'health-data' | 'labs' | 'longevity' | 'vitapulse'
type View = {
  key: BodyView
  label: string
  short: string
  eyebrow: string
  component: ComponentType
  childTab?: string
  description: string
}

const VIEWS: View[] = [
  { key: 'body', label: 'Your Body', short: 'Body', eyebrow: 'Measure', component: BodyComposition, description: 'Body composition and measurements that define your personal body context.' },
  { key: 'character', label: '3D Character & Body Shaper', short: '3D', eyebrow: 'Visualize', component: ShapeForming, description: 'Refine your personal 3D character with measurements, posture and body-shape context.' },
  { key: 'training', label: 'Training', short: 'Training', eyebrow: 'Plan', component: PusatLatihan, childTab: 'rencana', description: 'Plans, sport science and training progression in the same personal workspace.' },
  { key: 'workout', label: 'Workout', short: 'Workout', eyebrow: 'Move', component: PusatLatihan, childTab: 'sesi', description: 'Daily sessions, strength and movement work connected to your current body context.' },
  { key: 'recovery', label: 'Sleep & Recovery', short: 'Recovery', eyebrow: 'Recover', component: PusatTubuh, childTab: 'pulih', description: 'Sleep, recovery and readiness context.' },
  { key: 'numbers', label: 'Your Numbers', short: 'Numbers', eyebrow: 'Track', component: PusatTubuh, childTab: 'energi', description: 'Recorded signals, trends and body metrics.' },
  { key: 'nutrition', label: 'Nutrition', short: 'Nutrition', eyebrow: 'Fuel', component: PusatGizi, childTab: 'makan', description: 'Food, hydration and nutrition context connected to the same person.' },
  { key: 'health-data', label: 'Health Data', short: 'Data', eyebrow: 'Connect', component: HealthProfile, description: 'Imported and recorded health data with provenance.' },
  { key: 'labs', label: 'Health Data Lab', short: 'Lab', eyebrow: 'Analyze', component: DataLab, description: 'Explore structured personal data without turning it into an unsupported diagnosis.' },
  { key: 'longevity', label: 'Longevity', short: 'Longevity', eyebrow: 'Prevent', component: Longevity, description: 'Long-term health and healthy-aging context.' },
  { key: 'vitapulse', label: 'VitaPulse', short: 'VitaPulse', eyebrow: 'Summarize', component: VitaPulse, description: 'A compact vitality view tied to the rest of Your Body.' },
]

const VALID = new Set(VIEWS.map((view) => view.key))

function Loader({ label }: { label: string }) {
  return (
    <div className="relative grid min-h-[38vh] place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-neutral-950/60 text-sm font-bold text-neutral-400" role="status" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/45 to-transparent" />
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand shadow-[0_0_18px_rgba(0,191,99,.7)]" />
        Loading {label}…
      </div>
    </div>
  )
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
    <div className="mx-auto w-full max-w-[1480px] space-y-3 pb-8 sm:space-y-4 sm:pb-10">
      <PanaceaZoneNav />

      <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-neutral-950/70 p-3 shadow-[0_20px_70px_rgba(0,0,0,.24)] backdrop-blur-2xl sm:rounded-[30px] sm:p-5">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[9px] font-black uppercase tracking-[.24em] text-brand sm:text-[10px]">Your Body · one personal health operating space</div>
                <h1 className="mt-1 text-[1.65rem] font-black leading-tight tracking-[-.035em] text-white sm:text-3xl">Train, recover, eat and measure as one connected body.</h1>
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
                  Your 3D character, health signals, training, recovery, nutrition, labs and longevity stay attached to the same personal context instead of fragmenting into disconnected tools.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-[16px] border border-brand/20 bg-brand/[.08] px-3 py-2 xl:self-auto">
                <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_14px_rgba(0,191,99,.75)]" />
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.18em] text-brand">{active.eyebrow}</div>
                  <div className="text-xs font-black text-white">{active.label}</div>
                </div>
              </div>
            </div>

            <div className="no-scrollbar relative mt-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:gap-2" role="tablist" aria-label="Your Body workspace">
              {VIEWS.map((view) => (
                <button
                  key={view.key}
                  type="button"
                  role="tab"
                  aria-selected={activeKey === view.key}
                  aria-controls={`body-panel-${view.key}`}
                  onClick={() => select(view)}
                  className={`min-h-[42px] shrink-0 snap-start rounded-[15px] border px-3.5 text-[11px] font-black transition duration-200 sm:min-h-[44px] sm:rounded-[16px] sm:px-4 sm:text-xs ${
                    activeKey === view.key
                      ? 'border-brand/70 bg-brand text-white shadow-[0_8px_26px_rgba(0,191,99,.22)]'
                      : 'border-white/[.08] bg-white/[.035] text-neutral-400 hover:border-white/15 hover:bg-white/[.07] hover:text-white'
                  }`}
                >
                  {view.short}
                </button>
              ))}
            </div>

            <div className="relative mt-2.5 flex items-start gap-2 rounded-[16px] border border-white/[.07] bg-white/[.025] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-400 sm:mt-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/80" />
              <span><b className="text-neutral-100">{active.label}.</b> {active.description}</span>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[20px] border border-white/[.08] bg-black/[.16] p-1 lg:sticky lg:top-20 lg:self-start">
            <PersonalBodyAvatar3D />
          </div>
        </div>
      </section>

      <section
        id={`body-panel-${active.key}`}
        role="tabpanel"
        aria-label={active.label}
        className="min-w-0 overflow-hidden rounded-[24px] border border-white/[.08] bg-black/[.16] p-1 sm:rounded-[28px] sm:p-2"
      >
        <Suspense fallback={<Loader label={active.label} />}>
          <Active />
        </Suspense>
      </section>

      <FeatureBoulevard zone="body" title="Your Body feature boulevard" />
    </div>
  )
}

export default UnifiedBodyWorkspace
