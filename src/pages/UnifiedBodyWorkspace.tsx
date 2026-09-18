import { lazy, Suspense, useState, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'
import { BodyExposurePortal } from '../components/BodyExposurePortal'

const BodyComposition = lazy(() => import('./BodyComposition').then((m) => ({ default: m.BodyComposition })))
const BodyExposureOS = lazy(() => import('./BodyExposureOS').then((m) => ({ default: m.BodyExposureOS })))
const PersonalBodyAvatar3D = lazy(() => import('../components/PersonalBodyAvatar3D').then((m) => ({ default: m.PersonalBodyAvatar3D })))
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
  { key: 'character', label: 'Body & Posture Profile', short: 'Posture', component: ShapeForming, description: 'Measurement and posture-analysis tools remain available as data tools; they no longer replace the canonical anatomical body.' },
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

const PRIMARY_VIEW_KEYS: readonly BodyView[] = ['body', 'training', 'recovery', 'nutrition', 'health-data']

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
  const [moreOpen, setMoreOpen] = useState(false)
  const primaryViews = VIEWS.filter((view) => PRIMARY_VIEW_KEYS.includes(view.key))
  const secondaryViews = VIEWS.filter((view) => !PRIMARY_VIEW_KEYS.includes(view.key))

  function select(view: View) {
    const next = new URLSearchParams(params)
    next.set('view', view.key)
    if (view.childTab) next.set('t', view.childTab)
    else next.delete('t')
    if (view.key !== 'body-exposure') next.delete('panel')
    setParams(next, { replace: true })
    setMoreOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-4 pb-10">
      <PanaceaZoneNav />

      <section className={`relative overflow-hidden grid gap-4 rounded-[30px] border border-white/[.08] bg-[#020306] p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-5 ${isExposure ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(280px,.72fr)_minmax(360px,1.28fr)]'}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.11),transparent_28%),radial-gradient(circle_at_76%_0%,rgba(139,92,246,.09),transparent_24%)]" aria-hidden />
        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200/80">
              {isExposure ? 'Your Body · Body Exposure OS' : 'Your Body · one personal health workspace'}
            </div>
            {isExposure && <span className="rounded-full border border-violet-300/15 bg-violet-300/[.07] px-2 py-0.5 text-[9px] font-black uppercase tracking-[.15em] text-violet-200/80">flagship atlas</span>}
          </div>

          <h1 className="mt-1 line-clamp-1 max-w-5xl text-2xl font-black tracking-[-.035em] text-white sm:text-3xl">
            {isExposure ? 'Explore the body at every biological scale' : 'One body. Many functions. No duplicate avatar.'}
          </h1>
          <p className="mt-2 line-clamp-1 max-w-5xl text-sm font-medium text-white/48">
            {isExposure
              ? 'Anatomy remains the anchor while physiology, imaging, disease, drugs, surgery, cells and genes open as activities.'
              : 'Body Exposure is the visual anchor; personal measurements, recovery, training, nutrition and health data stay around the same source-backed anatomy.'}
          </p>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Your Body primary activities">
            {primaryViews.map((view) => {
              const selected = activeKey === view.key
              return (
                <button
                  key={view.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => select(view)}
                  className={`min-h-[42px] shrink-0 rounded-full border px-3.5 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
                    selected
                      ? 'border-cyan-300/25 bg-cyan-300/[.12] text-white'
                      : 'border-white/[.08] bg-white/[.03] text-white/48 hover:bg-white/[.06] hover:text-white/78'
                  }`}
                >
                  {view.short}
                </button>
              )
            })}
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((value) => !value)}
              className="min-h-[42px] shrink-0 rounded-full border border-white/[.08] bg-white/[.03] px-3.5 text-[11px] font-black text-white/48 transition hover:bg-white/[.06] hover:text-white/78"
            >
              {moreOpen ? 'Close' : 'More'}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto rounded-[18px] border border-white/[.07] bg-black/25 p-2">
                  {secondaryViews.map((view) => (
                    <button
                      key={view.key}
                      type="button"
                      onClick={() => select(view)}
                      className={`min-h-[42px] rounded-[13px] border px-3 text-left text-[10px] font-black transition ${
                        activeKey === view.key
                          ? 'border-cyan-300/25 bg-cyan-300/[.1] text-white'
                          : 'border-white/[.06] bg-white/[.025] text-white/48 hover:bg-white/[.05] hover:text-white/78'
                      }`}
                    >
                      <span className="block truncate">{view.short}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 truncate rounded-2xl border border-white/[.07] bg-white/[.025] px-3 py-2.5 text-[10px] font-semibold text-white/42">
            <b className="text-white/75">{active.label}</b> · {active.description}
          </div>
        </div>

        {!isExposure && (
          <div className="relative min-w-0 lg:sticky lg:top-24 lg:self-start">
            <BodyExposurePortal context="personal" />
          </div>
        )}
      </section>

      <section role="tabpanel" aria-label={active.label} className="min-w-0">
        {/* Karakter parametrik tetap tersedia sebagai alat ukur/postur sekunder.
            Ia sengaja hanya muncul di view character agar tidak menggantikan
            Body Exposure sebagai jangkar anatomi source-backed. */}
        {activeKey === 'character' && (
          <div className="mb-4">
            <Suspense fallback={<Loader />}>
              <PersonalBodyAvatar3D />
            </Suspense>
          </div>
        )}
        <Suspense fallback={<Loader exposure={isExposure} />}><Active /></Suspense>
      </section>

      <FeatureBoulevard zone="body" title="Your Body feature boulevard" />
    </div>
  )
}

export default UnifiedBodyWorkspace
