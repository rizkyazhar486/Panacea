import { lazy, Suspense, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { OneShape } from '../components/OneShape'
import { SuperPageCapabilityRail } from '../components/SuperPageCapabilityRail'
import { PersonalBodyUnifiedSurface, PersonalBodySurfaceShown } from '../components/PersonalBodyUnifiedSurface'
import { SurfaceDepthNavigator } from '../components/SurfaceDepthNavigator'
import { hitungScrollAgarTerlihat } from '../lib/railViewport'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'
import { getVitals } from '../lib/healthVitals'
import { getDemoTersimpan } from '../lib/profile'

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

type BodyView = 'body' | 'body-exposure' | 'body-tools' | 'character' | 'training' | 'ranked' | 'workout' | 'recovery' | 'numbers' | 'nutrition' | 'health-data' | 'labs' | 'longevity' | 'vitapulse'
type View = { key: BodyView; label: string; short: string; component: ComponentType; childTab?: string; description: string }

const VIEWS: View[] = [
  { key: 'body', label: 'Your Body', short: 'Body', component: BodyComposition, description: 'Body composition and the measurements that define your personal body context.' },
  { key: 'body-exposure', label: 'Body Exposure', short: 'Body Exposure', component: BodyExposureOS, description: 'Whole-body anatomy first, then physiology, imaging, surgery, disease, cells and molecular detail in one continuous atlas.' },
  { key: 'body-tools', label: 'Body & Skin Tools', short: 'Body Tools', component: BodyToolkit, description: 'Body-region symptom logging, skin routine tools and daily non-exercise activity tracking connected to the body workspace.' },
  { key: 'character', label: '3D Character & Body Shaper', short: '3D Character', component: ShapeForming, description: 'Use your measurements and body/posture photo analysis to refine the same personal 3D character shown above.' },
  { key: 'training', label: 'Training', short: 'Training', component: PusatLatihan, childTab: 'rencana', description: 'Plans, sport science and training progression in the same personal workspace.' },
  { key: 'ranked', label: 'Ranked Season', short: 'League', component: HealthPerformanceLeague, description: 'A 90-day Health Rank and Sport Rank ladder driven by observed training, recovery, progression and evidence quality.' },
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
const PRIMARY_VIEW_KEYS = new Set<BodyView>(['body', 'body-exposure', 'training', 'ranked', 'recovery', 'nutrition', 'health-data'])

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

function DailyReadinessTargetBar({ onSelectView }: { onSelectView: (key: BodyView) => void }) {
  const [synced, setSynced] = useState(false)
  const vitals = getVitals()
  const demo = getDemoTersimpan()

  const rhr = typeof vitals.restingHr === 'number' && vitals.restingHr > 0 ? vitals.restingHr : 48
  const hrv = typeof vitals.hrvMs === 'number' && vitals.hrvMs > 0 ? vitals.hrvMs : 76
  const rec = typeof vitals.recoveryPct === 'number' && vitals.recoveryPct > 0 ? vitals.recoveryPct : 88
  const wt = typeof demo.weightKg === 'number' && demo.weightKg > 0 ? demo.weightKg : 70
  const targetProtein = Math.round(wt * 1.8)

  const handleQuickSync = () => {
    setSynced(true)
    window.dispatchEvent(new Event('panacea:health-updated'))
    setTimeout(() => setSynced(false), 2000)
  }

  return (
    <div className="mb-4 rounded-2xl border border-emerald-500/25 bg-slate-950/80 p-3.5 backdrop-blur-md sm:p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">Target Harian & Kesiapan Tubuh Terpadu</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleQuickSync}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-200 transition hover:bg-emerald-500/20 active:scale-95"
          >
            {synced ? '✓ Tersinkron' : '🔄 Sinkronisasi 1-Klik'}
          </button>
          <button
            type="button"
            onClick={() => onSelectView('health-data')}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/70 hover:bg-white/10"
          >
            Hub Data Wearable →
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Skor Kesiapan & HRV</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-400">{rec}%</span>
            <span className="text-xs text-white/60">rMSSD {hrv} ms · Nadi {rhr} bpm</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-emerald-300/80 font-medium">Sistem vagal siap adaptasi</span>
            <button
              type="button"
              onClick={() => onSelectView('recovery')}
              className="text-[10px] font-bold text-cyan-300 underline"
            >
              Protokol Pemulihan →
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Makronutrisi & Hidrasi</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-cyan-400">2.5 L</span>
            <span className="text-xs text-white/60">Protein ~{targetProtein}g · Karbo kompleks</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-cyan-300/80 font-medium">1.8g/kg BB ({wt} kg)</span>
            <button
              type="button"
              onClick={() => onSelectView('nutrition')}
              className="text-[10px] font-bold text-cyan-300 underline"
            >
              Atur Menu Gizi →
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Musim Liga & Latihan</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-amber-400">Ranked S1</span>
            <span className="text-xs text-white/60">Target: Beban Progresif Terjaga</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSelectView('training')}
              className="text-[10px] font-bold text-emerald-300 underline"
            >
              Rencana Latihan →
            </button>
            <button
              type="button"
              onClick={() => onSelectView('ranked')}
              className="text-[10px] font-bold text-amber-300 underline"
            >
              Papan Musim Liga →
            </button>
          </div>
        </div>
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
    <div className="mx-auto w-full max-w-[1580px] space-y-4 pb-10">
      <PanaceaZoneNav />

      {/* `dark` menandai bahwa permukaan ini memang gelap apa pun tema
          aplikasinya. Seluruh gaya `dark:` dan lapisan pemetaan `.dark`
          bergantung pada kelas itu; tanpa penandanya komponen di dalam sini
          merender versi terangnya di atas latar hitam. */}
      <section className={`dark relative overflow-hidden grid gap-4 rounded-[24px] border border-white/[.075] bg-[#020306] p-3.5 shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-4 ${isExposure ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_340px]'}`}>
        <div className="relative min-w-0">
          {/* Keep one semantic page title without duplicating the visible
              Body Exposure identity owned by BodyExposureOS. */}
          <h1 className="sr-only">Your Body · {active.label}</h1>

          {/* Wadah scroll memegang tablist DAN pemilih "More features": pemilih bukan tab, jadi tidak boleh menjadi anak
              role="tablist" (ARIA: tablist hanya memiliki tab; axe aria-required-children). */}
          <div
            ref={workspaceRailRef}
            className={`no-scrollbar flex snap-x gap-1.5 overflow-x-auto pb-1 ${isExposure ? 'mt-3' : ''}`}
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
                  aria-selected={selected}
                  onClick={() => select(view)}
                  className={`min-h-[42px] shrink-0 snap-start rounded-full border px-3.5 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                    selected
                      ? 'border-transparent text-black'
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
                className="min-h-[42px] rounded-full border border-white/10 bg-white/[.04] px-3 text-[11px] font-black text-white outline-none"
              >
                <option value="">More features</option>
                {secondaryViews.map((view) => <option key={view.key} value={view.key}>{view.short}</option>)}
              </select>
            </label>
          </div>

          {/* Satu ⓘ untuk semua penjelasan: deskripsi tampilan, cara pakai, dan
              tangga kedalaman. Sebelumnya ketiganya tampil terbuka di layar
              pertama dan menambah 8 tombol sebelum isi apa pun. */}
          <details className="mt-2 rounded-[14px] border border-white/[.065] bg-white/[.02] px-3 py-2 text-[11px] text-white/60">
            <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 font-black text-white/72">
              <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border border-white/20 text-[10px]">i</span>
              About {active.label}
            </summary>
            <p className="mt-2 leading-relaxed">{active.description}</p>
            <ol className="mt-2 grid gap-1 leading-relaxed">
              {[
                'Start with My Body or Body Exposure.',
                'Use the six primary destinations for daily work.',
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
          </details>
          <BatasKlaimKesehatan permukaan="body.workspace" className="mt-2 text-[11px] leading-snug text-white/55" />
        </div>

        {!isExposure && (
          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <PersonalBodyUnifiedSurface compact defaultFocus="identity" shareable cameraCapture />
          </div>
        )}
      </section>

      <section role="tabpanel" aria-label={active.label} className="min-w-0">
        {isExposure ? (
          <Suspense fallback={<Loader exposure />}><Active /></Suspense>
        ) : (
          <PersonalBodySurfaceShown>
            <DailyReadinessTargetBar onSelectView={(k) => {
              const target = VIEWS.find((v) => v.key === k)
              if (target) select(target)
            }} />
            <Suspense fallback={<Loader />}><Active /></Suspense>
          </PersonalBodySurfaceShown>
        )}
      </section>

      <SuperPageCapabilityRail domain="body" initialLimit={16} />
    </div>
  )
}

export default UnifiedBodyWorkspace
