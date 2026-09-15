import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'

const Beranda = lazy(() => import('./Beranda'))
const Feed = lazy(() => import('./Feed'))
const Community = lazy(() => import('./Community').then((m) => ({ default: m.Community })))
const ClubHub = lazy(() => import('./ClubHub').then((m) => ({ default: m.ClubHub })))
const MoneyHub = lazy(() => import('./MoneyHub').then((m) => ({ default: m.MoneyHub })))
const Markets = lazy(() => import('./Markets').then((m) => ({ default: m.Markets })))
const SportsScores = lazy(() => import('./SportsScores').then((m) => ({ default: m.SportsScores })))
const ReligionWorkspace = lazy(() => import('./ReligionWorkspace').then((m) => ({ default: m.ReligionWorkspace })))
const MedStudyHub = lazy(() => import('./MedStudyHub').then((m) => ({ default: m.MedStudyHub })))

type HomeView = 'home' | 'social' | 'community' | 'clubs' | 'finance' | 'markets' | 'scores' | 'religion' | 'learn'
type View = {
  key: HomeView
  label: string
  short: string
  eyebrow: string
  component: ComponentType
  description: string
}

const VIEWS: View[] = [
  { key: 'home', label: 'Today', short: 'Today', eyebrow: 'Your day', component: Beranda, description: 'Daily health signals, logs, progress and useful actions in one compact view.' },
  { key: 'social', label: 'Social', short: 'Social', eyebrow: 'Share', component: Feed, description: 'Healthy-living posts, activity, learning and sharing without leaving Home.' },
  { key: 'community', label: 'Community', short: 'People', eyebrow: 'Connect', component: Community, description: 'Support, accountability and health-oriented spaces with people you care about.' },
  { key: 'clubs', label: 'Club Hub', short: 'Clubs', eyebrow: 'Groups', component: ClubHub, description: 'Communities and shared activity collected into a single room.' },
  { key: 'finance', label: 'Finance & Emergency Fund', short: 'Finance', eyebrow: 'Plan', component: MoneyHub, description: 'Personal finance, planning and emergency-fund context alongside daily life.' },
  { key: 'markets', label: 'Stocks & Markets', short: 'Markets', eyebrow: 'Observe', component: Markets, description: 'Delayed market data for monitoring and learning, not trading instructions.' },
  { key: 'scores', label: 'Sports Scores', short: 'Scores', eyebrow: 'Follow', component: SportsScores, description: 'Live and recorded sports-score context in the same Home workspace.' },
  { key: 'religion', label: 'Religion & Reflection', short: 'Reflect', eyebrow: 'Faith', component: ReligionWorkspace, description: 'Scripture, hadith, prayer-time tools and reflective learning in one room.' },
  { key: 'learn', label: 'Read & Learn', short: 'Learn', eyebrow: 'Grow', component: MedStudyHub, description: 'Reading, cases and study material available without turning Home into a maze.' },
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

export function HomeSocialWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as HomeView | null
  const activeKey: HomeView = requested && VALID.has(requested) ? requested : 'home'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component

  function select(view: View) {
    const next = new URLSearchParams(params)
    next.set('t', view.key)
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-3 pb-8 sm:space-y-4 sm:pb-10">
      <PanaceaZoneNav />

      <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-neutral-950/70 p-3 shadow-[0_20px_70px_rgba(0,0,0,.24)] backdrop-blur-2xl sm:rounded-[30px] sm:p-5">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.24em] text-brand sm:text-[10px]">Panacea Home · one continuous daily workspace</div>
            <h1 className="mt-1 text-[1.65rem] font-black leading-tight tracking-[-.035em] text-white sm:text-3xl">Everything important today, without the clutter.</h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
              Health, people, finance, reflection and learning stay connected as rooms inside one Home. Switch context without losing the page or fighting navigation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-[16px] border border-brand/20 bg-brand/[.08] px-3 py-2 lg:self-auto">
            <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_14px_rgba(0,191,99,.75)]" />
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.18em] text-brand">{active.eyebrow}</div>
              <div className="text-xs font-black text-white">{active.label}</div>
            </div>
          </div>
        </div>

        <div className="no-scrollbar relative mt-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:gap-2" role="tablist" aria-label="Home workspace">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={activeKey === view.key}
              aria-controls={`home-panel-${view.key}`}
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
      </section>

      <section
        id={`home-panel-${active.key}`}
        role="tabpanel"
        aria-label={active.label}
        className="min-w-0 overflow-hidden rounded-[24px] border border-white/[.08] bg-black/[.16] p-1 sm:rounded-[28px] sm:p-2"
      >
        <Suspense fallback={<Loader label={active.label} />}>
          <Active />
        </Suspense>
      </section>

      <FeatureBoulevard zone="home" title="Home feature boulevard" />
    </div>
  )
}

export default HomeSocialWorkspace
