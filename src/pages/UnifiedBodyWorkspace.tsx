import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { SuperPageCapabilityRail } from '../components/SuperPageCapabilityRail'
import { PersonalBodyUnifiedSurface } from '../components/PersonalBodyUnifiedSurface'
import { SurfaceGuide } from '../components/SurfaceGuide'
import { SurfaceDepthNavigator } from '../components/SurfaceDepthNavigator'

const BodyComposition = lazy(() => import('./BodyComposition').then((m) => ({ default: m.BodyComposition })))
const BodyExposureOS = lazy(() => import('./BodyExposureOS').then((m) => ({ default: m.BodyExposureOS })))
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
  { key: 'body-exposure', label: 'Body Exposure', short: 'Body Exposure', component: BodyExposureOS, description: 'Whole-body anatomy first, then physiology, imaging, surgery, disease, cells and molecular detail in one continuous atlas.' },
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
const PRIMARY_VIEW_KEYS = new Set<BodyView>(['body', 'body-exposure', 'training', 'recovery', 'nutrition', 'health-data'])

const BODY_DEPTH_BY_VIEW: Record<BodyView, string> = {
  body: 'today',
  'body-exposure': 'domain',
  'body-tools': 'domain',
  character: 'domain',
  training: 'domain',
  workout: 'session',
  recovery: 'domain',
  numbers: 'metric',
  nutrition: 'domain',
  'health-data': 'source',
  labs: 'sample',
  longevity: 'today',
  vitapulse: 'today',
}

const BODY_VIEW_BY_DEPTH: Record<string, BodyView> = {
  today: 'body',
  domain: 'training',
  metric: 'numbers',
  session: 'workout',
  sample: 'labs',
  source: 'health-data',
}

function Loader({ exposure = false }: { exposure?: boolean }) {
  return (
    <div className={`grid min-h-[34vh] place-items-center rounded-[28px] border text-sm font-bold ${exposure ? 'border-cyan-300/10 bg-black text-white/45' : 'border-white/10 bg-black/10 text-neutral-500'}`} role="status">
      {exposure ? 'Opening Body Exposure…' : 'Loading Your Body…'}
    </div>
  )
}

export function UnifiedBodyWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('view') as BodyView | null
  const activeKey: BodyView = requested && VALID.has(requested) ? requested : 'body'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component
  const isExposure = activeKey === 'body-exposure'
  const primaryViews = VIEWS.filter((view) => PRIMARY_VIEW_KEYS.has(view.key))
  const secondaryViews = VIEWS.filter((view) => !PRIMARY_VIEW_KEYS.has(view.key))
  const secondaryValue = secondaryViews.some((view) => view.key === activeKey) ? activeKey : ''

  function select(view: View) {
    const next = new URLSearchParams(params)
    next.set('view', view.key)
    if (view.childTab) next.set('t', view.childTab)
    else next.delete('t')
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectDepth(stopId: string) {
    const targetKey = BODY_VIEW_BY_DEPTH[stopId]
    if (!targetKey) return
    const target = VIEWS.find((view) => view.key === targetKey)
    if (target) select(target)
  }

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-4 pb-10">
      <PanaceaZoneNav />

      {/* `dark` menandai bahwa permukaan ini memang gelap apa pun tema
          aplikasinya. Seluruh gaya `dark:` dan lapisan pemetaan `.dark`
          bergantung pada kelas itu; tanpa penandanya komponen di dalam sini
          merender versi terangnya di atas latar hitam. */}
      <section className={`dark relative overflow-hidden grid gap-4 rounded-[24px] border border-white/[.075] bg-[#020306] p-3.5 shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-4 ${isExposure ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_340px]'}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.11),transparent_28%),radial-gradient(circle_at_76%_0%,rgba(139,92,246,.09),transparent_24%)]" aria-hidden />
        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200/80">
              {isExposure ? 'Your Body · Body Exposure OS' : 'Your Body · one personal health workspace'}
            </div>
            {isExposure && <span className="rounded-full border border-violet-300/15 bg-violet-300/[.07] px-2 py-0.5 text-[9px] font-black uppercase tracking-[.15em] text-violet-200/80">flagship atlas</span>}
          </div>

          <h1 className="mt-1 max-w-5xl text-[clamp(1.35rem,4vw,2rem)] font-black leading-[1.04] tracking-[-.035em] text-white">
            {isExposure ? 'Your body, from whole person to molecule' : 'One body context'}
          </h1>
          <p className="mt-1.5 truncate text-[11px] font-bold text-white/48 sm:text-xs">
            {isExposure
              ? 'Whole body → organ → tissue → cell → molecule'
              : 'Train · recover · eat · measure · age'}
          </p>

          <div className="no-scrollbar mt-3 flex snap-x gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Your Body workspace">
            {primaryViews.map((view) => {
              const selected = activeKey === view.key
              const exposureTab = view.key === 'body-exposure'
              return (
                <button
                  key={view.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => select(view)}
                  className={`min-h-[42px] shrink-0 snap-start rounded-full border px-3.5 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                    selected
                      ? 'border-white bg-white text-black shadow-sm'
                      : exposureTab
                        ? 'border-white/15 bg-white/[.055] text-white/85 hover:bg-white/[.09]'
                        : 'border-white/[.08] bg-white/[.035] text-white/75 hover:border-white/15 hover:bg-white/[.055] hover:text-white'
                  }`}
                >
                  {view.short}
                  {exposureTab && !selected && <span className="ml-2 text-[8px] uppercase tracking-[.16em] text-cyan-200/50">OS</span>}
                </button>
              )
            })}
            <label className="shrink-0">
              <span className="sr-only">More features</span>
              <select
                aria-label="More features"
                value={secondaryValue}
                onChange={(event) => {
                  const target = VIEWS.find((view) => view.key === event.target.value)
                  if (target) select(target)
                }}
                className="min-h-[42px] rounded-full border border-white/10 bg-white/[.04] px-3 text-[11px] font-black text-white outline-none"
              >
                <option value="">More features</option>
                {secondaryViews.map((view) => <option key={view.key} value={view.key}>{view.short}</option>)}
              </select>
            </label>
          </div>

          <SurfaceGuide
            summary="pick one goal → stay on one body → open details only when needed"
            steps={[
              'Start with My Body or Body Exposure.',
              'Use the six primary destinations for daily work.',
              'Everything else stays preserved under More features.',
            ]}
          />

          <SurfaceDepthNavigator
            surface="your-body"
            activeStopId={BODY_DEPTH_BY_VIEW[activeKey]}
            onSelect={selectDepth}
          />

          <details className="mt-2.5 rounded-[14px] border border-white/[.065] bg-white/[.02] px-3 py-2 text-[10px] text-white/45">
            <summary className="cursor-pointer font-black text-white/72">About {active.label}</summary>
            <p className="mt-2 leading-relaxed">{active.description}</p>
          </details>
        </div>

        {!isExposure && (
          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <PersonalBodyUnifiedSurface compact defaultFocus="identity" shareable cameraCapture />
          </div>
        )}
      </section>

      <section role="tabpanel" aria-label={active.label} className="min-w-0">
        <Suspense fallback={<Loader exposure={isExposure} />}><Active /></Suspense>
      </section>

      <SuperPageCapabilityRail domain="body" initialLimit={16} />
    </div>
  )
}

export default UnifiedBodyWorkspace
