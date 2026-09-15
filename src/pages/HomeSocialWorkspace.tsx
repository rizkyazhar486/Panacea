import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HomeNowWidget } from '../components/HomeNowWidget'
import '../styles/panacea-system.css'

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
type View = { key: HomeView; label: string; component: ComponentType; description: string }

const VIEWS: View[] = [
  { key: 'home', label: 'Overview', component: Beranda, description: 'Today, body, actions and priorities.' },
  { key: 'social', label: 'Social', component: Feed, description: 'Healthy-living posts and activity.' },
  { key: 'community', label: 'Community', component: Community, description: 'People, support and accountability.' },
  { key: 'clubs', label: 'Clubs', component: ClubHub, description: 'Groups and shared activity.' },
  { key: 'finance', label: 'Finance', component: MoneyHub, description: 'Planning and emergency-fund context.' },
  { key: 'markets', label: 'Markets', component: Markets, description: 'Delayed market data for monitoring and learning.' },
  { key: 'scores', label: 'Scores', component: SportsScores, description: 'Live and recorded sports-score context.' },
  { key: 'religion', label: 'Reflection', component: ReligionWorkspace, description: 'Scripture, prayer and reflection.' },
  { key: 'learn', label: 'Learn', component: MedStudyHub, description: 'Reading, cases and study material.' },
]

const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return (
    <div className="p-glass grid min-h-[24vh] place-items-center p-6 text-sm font-bold" role="status" aria-live="polite">
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

  const select = (key: HomeView) => {
    const next = new URLSearchParams(params)
    if (key === 'home') next.delete('t')
    else next.set('t', key)
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="p-home-shell p-page">
      <div className="p-glass p-workspace-switcher" aria-label="Home workspace">
        <select
          className="p-workspace-select"
          value={activeKey}
          onChange={(event) => select(event.target.value as HomeView)}
          aria-label="Choose Home workspace"
        >
          {VIEWS.map((view) => <option key={view.key} value={view.key}>{view.label}</option>)}
        </select>

        <div className="p-workspace-tabs no-scrollbar" role="tablist" aria-label="Home workspace">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={activeKey === view.key}
              onClick={() => select(view.key)}
              className="p-workspace-tab p-interactive"
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {activeKey === 'home' ? <HomeNowWidget /> : null}

      <section role="tabpanel" aria-label={active.label} className="min-w-0">
        <Suspense fallback={<Loader />}><Active /></Suspense>
      </section>
    </div>
  )
}

export default HomeSocialWorkspace
