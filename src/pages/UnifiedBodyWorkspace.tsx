import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { OneShape } from '../components/OneShape'
import { SuperPageCapabilityRail } from '../components/SuperPageCapabilityRail'
import { PersonalBodyUnifiedSurface, PersonalBodySurfaceShown } from '../components/PersonalBodyUnifiedSurface'
import { SurfaceDepthNavigator } from '../components/SurfaceDepthNavigator'
import { hitungScrollAgarTerlihat } from '../lib/railViewport'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'
import { useOptionalStore } from '../lib/store'
import { useOptionalLongitudinalState } from '../lib/useLongitudinalState'
import { getVitals } from '../lib/healthVitals'

const BodyComposition = lazy(() => import('./bodyhub/BodyComposition').then((m) => ({ default: m.BodyComposition })))
const BodyExposureOS = lazy(() => import('./bodyhub/BodyExposureOS').then((m) => ({ default: m.BodyExposureOS })))
const BodyToolkit = lazy(() => import('./bodyhub/BodyToolkit').then((m) => ({ default: m.BodyToolkit })))
const ShapeForming = lazy(() => import('./bodyhub/ShapeForming').then((m) => ({ default: m.ShapeForming })))
const PusatLatihan = lazy(() => import('./fitness/PusatLatihan').then((m) => ({ default: m.PusatLatihan })))
const HealthPerformanceLeague = lazy(() => import('./bodyhub/HealthPerformanceLeague').then((m) => ({ default: m.HealthPerformanceLeague })))
const PusatTubuh = lazy(() => import('./PusatTubuh').then((m) => ({ default: m.PusatTubuh })))
const PusatGizi = lazy(() => import('./bodyhub/PusatGizi').then((m) => ({ default: m.PusatGizi })))
const HealthProfile = lazy(() => import('./bodyhub/HealthProfile').then((m) => ({ default: m.HealthProfile })))
const VitaPulse = lazy(() => import('./bodyhub/VitaPulse').then((m) => ({ default: m.VitaPulse })))
const Longevity = lazy(() => import('./bodyhub/Longevity').then((m) => ({ default: m.Longevity })))
const DataLab = lazy(() => import('./bodyhub/DataLab').then((m) => ({ default: m.DataLab })))
const UniversalCompactBodyCockpit = lazy(() =>
  import('../components/bodyhub/UniversalCompactBodyCockpit').then((m) => ({ default: m.UniversalCompactBodyCockpit })),
)
const DigitalTwinScanFlow = lazy(() =>
  import('../components/scan/DigitalTwinScanFlow').then((m) => ({ default: m.DigitalTwinScanFlow })),
)
const RealityViewCockpit = lazy(() =>
  import('../components/reality-view/RealityViewCockpit').then((m) => ({ default: m.RealityViewCockpit })),
)

type BodyView = 'body' | 'body-exposure' | 'body-tools' | 'character' | 'training' | 'ranked' | 'workout' | 'recovery' | 'numbers' | 'nutrition' | 'health-data' | 'labs' | 'longevity' | 'vitapulse'
type View = { key: BodyView; label: string; short: string; component: ComponentType; childTab?: string; description: string }

const VIEWS: View[] = [
  { key: 'body-exposure', label: '4D Body & Anatomy', short: '4D Body', component: BodyExposureOS, description: 'Unified 4D whole-body atlas, physiology, imaging, micro, and simulation projector.' },
  { key: 'body', label: 'Body Composition', short: 'Composition', component: BodyComposition, description: 'Body composition and core anthropometry.' },
  { key: 'training', label: 'Training', short: 'Training', component: PusatLatihan, childTab: 'rencana', description: 'Plans and training progression.' },
  { key: 'recovery', label: 'Recovery', short: 'Recovery', component: PusatTubuh, childTab: 'pulih', description: 'Sleep and recovery readiness.' },
  { key: 'nutrition', label: 'Nutrition', short: 'Nutrition', component: PusatGizi, childTab: 'makan', description: 'Fuel and hydration logs.' },
  { key: 'health-data', label: 'Health Data', short: 'Data', component: HealthProfile, description: 'Wearable sync and exports.' },
  { key: 'body-tools', label: 'Body & Skin Tools', short: 'Body Tools', component: BodyToolkit, description: 'Skin checks and body region logs.' },
  { key: 'character', label: '3D Character', short: '3D Character', component: ShapeForming, description: 'Parametric 3D twin proportions.' },
  { key: 'ranked', label: 'Ranked Season', short: 'League', component: HealthPerformanceLeague, description: '90-day health and sport rank.' },
  { key: 'workout', label: 'Workout', short: 'Workout', component: PusatLatihan, childTab: 'sesi', description: 'Daily strength and cardio sessions.' },
  { key: 'numbers', label: 'Numbers', short: 'Numbers', component: PusatTubuh, childTab: 'energi', description: 'Recorded body signals.' },
  { key: 'labs', label: 'Data Lab', short: 'Lab', component: DataLab, description: 'Structured biomarker trends.' },
  { key: 'longevity', label: 'Longevity', short: 'Longevity', component: Longevity, description: 'Long-term healthspan metrics.' },
  { key: 'vitapulse', label: 'VitaPulse', short: 'VitaPulse', component: VitaPulse, description: 'Compact vitality overview.' },
]
const VALID = new Set(VIEWS.map((view) => view.key))
const PRIMARY_VIEW_KEYS = new Set<BodyView>(['body-exposure', 'body', 'training', 'recovery', 'nutrition', 'health-data'])

const BODY_DEPTH_BY_VIEW: Record<BodyView, string> = {
  body: 'today',
  'body-exposure': 'domain',
  'body-tools': 'domain',
  character: 'domain',
  training: 'domain',
  ranked: 'domain',
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
  const activeKey: BodyView = requested && VALID.has(requested) ? requested : 'body-exposure'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component
  const isExposure = activeKey === 'body-exposure'
  const primaryViews = VIEWS.filter((view) => PRIMARY_VIEW_KEYS.has(view.key))
  const secondaryViews = VIEWS.filter((view) => !PRIMARY_VIEW_KEYS.has(view.key))
  const secondaryValue = secondaryViews.some((view) => view.key === activeKey) ? activeKey : ''
  const workspaceRailRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const rail = workspaceRailRef.current
    const activeTab = rail?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    if (!rail || !activeTab) return
    const railBox = rail.getBoundingClientRect()
    const itemBox = activeTab.getBoundingClientRect()
    const next = hitungScrollAgarTerlihat({
      viewportWidth: rail.clientWidth,
      scrollWidth: rail.scrollWidth,
      itemLeft: rail.scrollLeft + itemBox.left - railBox.left,
      itemWidth: itemBox.width,
      currentScrollLeft: rail.scrollLeft,
    })
    if (Math.abs(next - rail.scrollLeft) > 1) rail.scrollLeft = next
  }, [activeKey])

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
    <div className="mx-auto w-full max-w-[1580px] space-y-2.5 pb-8">
      <PanaceaZoneNav />

      {/* `dark` menandai bahwa permukaan ini memang gelap apa pun tema
          aplikasinya. Seluruh gaya `dark:` dan lapisan pemetaan `.dark`
          bergantung pada kelas itu; tanpa penandanya komponen di dalam sini
          merender versi terangnya di atas latar hitam. */}
      <section className={`dark relative overflow-hidden grid gap-2 rounded-[24px] border border-white/[.075] bg-[#020306] p-2.5 shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-3 ${isExposure ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_340px]'}`}>
        <div className="relative min-w-0">
          {/* Keep one semantic page title without duplicating the visible
              Body Exposure identity owned by BodyExposureOS. */}
          <h1 className="sr-only">Your Body · {active.label}</h1>

          {/* Wadah scroll memegang tablist DAN pemilih "More features": pemilih bukan tab, jadi tidak boleh menjadi anak
              role="tablist" (ARIA: tablist hanya memiliki tab; axe aria-required-children). */}
          <div
            ref={workspaceRailRef}
            className="no-scrollbar mt-0 flex snap-x gap-1.5 overflow-x-auto pb-1"
            data-body-workspace-rail="v1"
          >
            <div role="tablist" aria-label="Your Body workspace" data-one-shape="aria" className="flex shrink-0 gap-1.5">
            <OneShape />
            {primaryViews.map((view) => {
              const selected = activeKey === view.key
              const exposureTab = view.key === 'body-exposure'
              return (
                <button
                  key={view.key}
                  type="button"
                  role="tab"
                  data-pmd-native="true"
                  aria-selected={selected}
                  onClick={() => select(view)}
                  className={`min-h-[44px] shrink-0 snap-start rounded-full border px-3.5 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                    selected
                      ? 'border-emerald-300 bg-emerald-400 text-neutral-950'
                      : exposureTab
                        ? 'border-white/20 bg-white/[.08] text-white hover:bg-white/[.14]'
                        : 'border-white/15 bg-white/[.06] text-slate-200 hover:border-white/25 hover:bg-white/[.12] hover:text-white'
                  }`}
                >
                  {view.short}
                </button>
              )
            })}
            </div>
            <label className="shrink-0">
              <span className="sr-only">More features</span>
              <select
                aria-label="More features"
                value={secondaryValue}
                onChange={(event) => {
                  const target = VIEWS.find((view) => view.key === event.target.value)
                  if (target) select(target)
                }}
                className="dark min-h-[44px] rounded-full border border-white/15 bg-[#0b111b] px-3 text-[11px] font-black text-white outline-none"
              >
                <option value="">More features</option>
                {secondaryViews.map((view) => <option key={view.key} value={view.key}>{view.short}</option>)}
              </select>
            </label>
          </div>

          {/* Satu ⓘ untuk semua penjelasan: deskripsi tampilan, cara pakai, dan
              tangga kedalaman. */}
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <details className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[.03] px-3 py-0 text-[11px] text-slate-200">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 font-black text-white">
                <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/25 text-[10px]">i</span>
                About {active.label}
              </summary>
              <div className="pb-2.5">
                <p className="mt-1 leading-relaxed">{active.description}</p>
                <ol className="mt-2 grid gap-1 leading-relaxed">
                  {[
                    'Start with My Body or Body Exposure.',
                    'Use the five primary destinations for daily work.',
                    'Everything else stays preserved under More features.',
                  ].map((langkah, i) => (
                    <li key={langkah} className="flex gap-2"><span className="font-black text-[#a5f3fc]">{i + 1}</span>{langkah}</li>
                  ))}
                </ol>
                <div className="mt-2">
                  <SurfaceDepthNavigator
                    surface="your-body"
                    activeStopId={BODY_DEPTH_BY_VIEW[activeKey]}
                    onSelect={selectDepth}
                  />
                </div>
              </div>
            </details>
            <BatasKlaimKesehatan permukaan="body.workspace" className="shrink-0" />
          </div>
        </div>

        {!isExposure && (
          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <PersonalBodyUnifiedSurface compact defaultFocus="identity" shareable cameraCapture />
          </div>
        )}
      </section>

      <section role="tabpanel" aria-label={active.label} className="min-w-0 space-y-3">
        {isExposure ? (
          <Suspense fallback={<Loader exposure />}><Active /></Suspense>
        ) : (
          <PersonalBodySurfaceShown>
            <Suspense fallback={<Loader />}><Active /></Suspense>
          </PersonalBodySurfaceShown>
        )}
        {activeKey === 'body' && (
          <Suspense fallback={<div className="p-4 text-xs text-white/50">Loading cockpit…</div>}>
            <UniversalCompactBodyCockpit />
          </Suspense>
        )}
        {(activeKey === 'body' || activeKey === 'body-exposure') && (
          <details className="dark rounded-2xl border border-cyan-400/25 bg-[#04070e] p-3 text-white">
            <summary
              className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: '#67e8f9' }}
            >
              <span className="min-w-0">4D Reality Timeline · 10 Systems &amp; Lifespan Projection</span>
              <span className="shrink-0 whitespace-nowrap">OPEN ▾</span>
            </summary>
            <div className="mt-3">
              <Suspense fallback={<div className="p-4 text-xs text-slate-200">Loading Reality View…</div>}>
                <RealityViewCockpit />
              </Suspense>
            </div>
          </details>
        )}
        {(activeKey === 'body' || activeKey === 'body-exposure') && (
          <details className="dark rounded-2xl border border-cyan-400/20 bg-[#05070b] p-3 text-white">
            <summary
              className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: '#a5f3fc' }}
            >
              <span className="min-w-0">Digital Twin Visual Studio · CAD/CAE · Skin · Brain/OSA · ANOVA</span>
              <span className="shrink-0 whitespace-nowrap">OPEN ▾</span>
            </summary>
            <div className="mt-3">
              <Suspense fallback={<div className="p-4 text-xs text-slate-200">Loading studio…</div>}>
                <DigitalTwinScanFlow />
              </Suspense>
            </div>
          </details>
        )}
        {['body', 'training', 'ranked', 'recovery', 'nutrition', 'health-data'].includes(activeKey) && (
          <YourBodyDailyStrip activeKey={activeKey} />
        )}
      </section>

      <SuperPageCapabilityRail domain="body" initialLimit={16} />
    </div>
  )
}

function YourBodyDailyStrip({ activeKey }: { readonly activeKey: BodyView }) {
  const store = useOptionalStore()
  const longitudinal = useOptionalLongitudinalState()
  const [rev, setRev] = useState(0)
  useEffect(() => {
    const bump = () => setRev((x) => x + 1)
    window.addEventListener('panacea:health-updated', bump)
    window.addEventListener('panacea:body-character-updated', bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener('panacea:health-updated', bump)
      window.removeEventListener('panacea:body-character-updated', bump)
      window.removeEventListener('storage', bump)
    }
  }, [])
  const vitals = useMemo(() => {
    void rev
    return getVitals(store?.account ?? null)
  }, [store?.account, longitudinal, rev])
  const rhr = typeof vitals.restingHr === 'number' && vitals.restingHr > 0 ? Math.round(vitals.restingHr) : null
  const hrv = typeof vitals.hrvMs === 'number' && vitals.hrvMs > 0 ? Math.round(vitals.hrvMs) : null
  const sleep = typeof vitals.sleepH === 'number' && vitals.sleepH > 0 ? vitals.sleepH.toFixed(1) : null
  const steps = typeof vitals.steps === 'number' && vitals.steps > 0 ? Math.round(vitals.steps) : null
  const weight = typeof vitals.weightKg === 'number' && vitals.weightKg > 0 ? vitals.weightKg : null

  const copy =
    activeKey === 'training' ? { title: 'Daily Training Target', detail: `RHR ${rhr ?? '—'} bpm · HRV ${hrv ?? '—'} ms · Steps ${steps?.toLocaleString('en-US') ?? '—'}`, to: '/fitness-hub?view=health-data', cta: 'Sync Wearable' }
    : activeKey === 'ranked' ? { title: '90-Day League Evidence', detail: `Tracked signals: RHR ${rhr ?? '—'} · HRV ${hrv ?? '—'} · Sleep ${sleep ?? '—'} h`, to: '/fitness-hub?view=training', cta: 'Log Training' }
    : activeKey === 'recovery' ? { title: 'Autonomic Recovery Focus', detail: `HRV ${hrv ?? '—'} ms · Sleep ${sleep ?? '—'} h · Slow 0.1 Hz vagal pacing & wearable fusion ready`, to: '/fitness-hub?view=body-exposure', cta: 'Open 4D Body' }
    : activeKey === 'nutrition' ? { title: 'Daily Fluid & Energy Context', detail: weight != null ? `Recorded Weight ${weight.toFixed(1)} kg · Baseline fluid ~${Math.round(weight * 30)} mL/day` : 'Enter weight on Composition tab for fluid target', to: '/fitness-hub?view=body', cta: 'Update Composition' }
    : { title: 'Devices', detail: `${[rhr, hrv, sleep, steps, weight].filter((x) => x != null).length}/5 signals`, to: '/fitness-hub?view=body-exposure', cta: 'Open 4D Body' }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 16, border: '1px solid rgba(0, 191, 99, 0.28)', background: 'rgba(6, 12, 16, 0.85)', color: '#eef4ff' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5ff2a7' }}>{copy.title}</div>
        <div style={{ marginTop: 2, fontSize: 12, color: '#cbd5e1' }}>{copy.detail}</div>
      </div>
      <Link to={copy.to} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', padding: '0 12px', borderRadius: 999, border: '1px solid rgba(0,191,99,0.45)', background: 'rgba(0,191,99,0.14)', color: '#5ff2a7', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
        {copy.cta} →
      </Link>
    </div>
  )
}

export default UnifiedBodyWorkspace
