import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'
import { HomeNowWidget } from '../components/HomeNowWidget'
import '../styles/home-health-spectrum.css'
import '../styles/home-mobile-shell-repair-v45.css'

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
type View = { key: HomeView; label: string; short: string; component: ComponentType; description: string }

const VIEWS: View[] = [
  { key: 'home', label: 'Overview', short: 'Home', component: Beranda, description: 'Recorded health, daily actions and your personal overview.' },
  { key: 'social', label: 'Social', short: 'Social', component: Feed, description: 'Healthy-living posts, activity, learning and sharing.' },
  { key: 'community', label: 'Community', short: 'Community', component: Community, description: 'People, support, accountability and health-oriented social spaces.' },
  { key: 'clubs', label: 'Club Hub', short: 'Clubs', component: ClubHub, description: 'Groups, communities and shared activity.' },
  { key: 'finance', label: 'Finance & Emergency Fund', short: 'Finance', component: MoneyHub, description: 'Personal finance, planning and emergency-fund context.' },
  { key: 'markets', label: 'Stocks & Markets', short: 'Markets', component: Markets, description: 'Delayed market data for monitoring and learning, not trading instructions.' },
  { key: 'scores', label: 'Scores', short: 'Scores', component: SportsScores, description: 'Live and recorded sports-score context.' },
  { key: 'religion', label: 'Religion & Reflection', short: 'Religion', component: ReligionWorkspace, description: 'Scripture, hadith, prayer-time tools and reflective learning in one room.' },
  { key: 'learn', label: 'Read & Learn', short: 'Learn', component: MedStudyHub, description: 'Reading, cases and study material available without leaving the Home experience.' },
]

const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return (
    <div
      className="relative grid min-h-[26vh] place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-[#020509]/95 text-sm font-black text-cyan-100 shadow-[0_22px_70px_rgba(0,0,0,.38)] backdrop-blur-2xl"
      role="status"
      aria-live="polite"
    >
      <span className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />
      <span className="relative">Loading Home…</span>
    </div>
  )
}

export function HomeSocialWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as HomeView | null
  const activeKey: HomeView = requested && VALID.has(requested) ? requested : 'home'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component

  const select = (view: View) => {
    const next = new URLSearchParams(params)
    next.set('t', view.key)
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-3 pb-10 sm:space-y-4">
      <div className="hidden sm:block">
        <PanaceaZoneNav />
      </div>

      <nav
        className="home-rooms-mobile-nav sticky top-2 z-30 -mx-1 rounded-[18px] border border-white/10 bg-[#020509]/95 p-1.5 shadow-[0_18px_46px_rgba(0,0,0,.28)] backdrop-blur-2xl"
        aria-label="Home rooms"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden />
        <div className="no-scrollbar flex gap-1 overflow-x-auto" role="tablist" aria-label="Home room tabs">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={activeKey === view.key}
              aria-current={activeKey === view.key ? 'page' : undefined}
              onClick={() => select(view)}
              className={`min-h-[42px] shrink-0 rounded-[13px] border px-3.5 text-[11px] font-black transition duration-200 active:scale-[.98] sm:text-[12px] ${
                activeKey === view.key
                  ? 'border-cyan-200/55 bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 text-[#020509] shadow-[0_7px_24px_rgba(34,211,238,.12)]'
                  : 'border-transparent bg-transparent text-white/62 hover:border-white/10 hover:bg-white/[.035] hover:text-white'
              }`}
            >
              {view.short}
            </button>
          ))}
        </div>
        <div className="px-2 pb-1 pt-1.5 text-[10px] font-medium leading-relaxed text-white/42 sm:text-[11px]">
          <b className="text-white/78">{active.label}</b> · {active.description}
        </div>
      </nav>

      {activeKey === 'home' ? (
        <div className="space-y-3 sm:space-y-4">
          <HomeNowWidget />
          <section role="tabpanel" aria-label={active.label} className="min-w-0">
            <Suspense fallback={<Loader />}><Active /></Suspense>
          </section>
          <FeatureBoulevard zone="all" title="Explore Panacea · 200+ interactive tools" />
        </div>
      ) : (
        <section role="tabpanel" aria-label={active.label} className="min-w-0">
          <Suspense fallback={<Loader />}><Active /></Suspense>
        </section>
      )}
    </div>
  )
}

export default HomeSocialWorkspace
