import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { HomeCommandDeck } from '../components/HomeCommandDeck'
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
type View = { key: HomeView; label: string; short: string; component: ComponentType }

const VIEWS: View[] = [
  { key: 'home', label: 'Overview', short: 'Home', component: Beranda },
  { key: 'social', label: 'Social', short: 'Social', component: Feed },
  { key: 'community', label: 'Community', short: 'People', component: Community },
  { key: 'clubs', label: 'Club Hub', short: 'Clubs', component: ClubHub },
  { key: 'finance', label: 'Finance', short: 'Money', component: MoneyHub },
  { key: 'markets', label: 'Markets', short: 'Markets', component: Markets },
  { key: 'scores', label: 'Scores', short: 'Scores', component: SportsScores },
  { key: 'religion', label: 'Faith', short: 'Faith', component: ReligionWorkspace },
  { key: 'learn', label: 'Learn', short: 'Learn', component: MedStudyHub },
]

const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return (
    <div className="grid min-h-[24vh] place-items-center rounded-[24px] border border-white/10 bg-[#01040a]/90 text-xs font-black text-cyan-100" role="status" aria-live="polite">
      Loading…
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
    if (view.key === 'home') next.delete('t')
    else next.set('t', view.key)
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-3 pb-10 sm:space-y-4">
      <PanaceaZoneNav />

      <nav className="sticky top-2 z-30 rounded-[20px] border border-white/[.08] bg-[#01040a]/88 p-1.5 shadow-[0_16px_44px_rgba(0,0,0,.28)] backdrop-blur-2xl" aria-label="Home spaces">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Home spaces">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={activeKey === view.key}
              aria-current={activeKey === view.key ? 'page' : undefined}
              title={view.label}
              onClick={() => select(view)}
              className={`grid min-h-[40px] shrink-0 place-items-center rounded-[13px] border px-3.5 text-[11px] font-black transition duration-200 active:scale-[.98] sm:min-w-[72px] ${
                activeKey === view.key
                  ? 'border-cyan-100/55 bg-gradient-to-r from-cyan-200 via-emerald-200 to-violet-200 text-[#01040a] shadow-[0_8px_28px_rgba(34,211,238,.12)]'
                  : 'border-transparent bg-transparent text-white/58 hover:border-white/10 hover:bg-white/[.045] hover:text-white'
              }`}
            >
              {view.short}
            </button>
          ))}
        </div>
      </nav>

      {activeKey === 'home' ? (
        <HomeCommandDeck />
      ) : (
        <section role="tabpanel" aria-label={active.label} className="min-w-0">
          <Suspense fallback={<Loader />}><Active /></Suspense>
        </section>
      )}
    </div>
  )
}

export default HomeSocialWorkspace
