import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'
import '../styles/panaceaFoundation.css'
import '../styles/homeWidgetContrast.css'

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
  { key: 'home', label: 'Logs & Stats', short: 'Home', component: Beranda, description: 'Daily logs, health signals, widgets and useful actions.' },
  { key: 'social', label: 'Social', short: 'Social', component: Feed, description: 'Healthy-living posts, activity, learning and sharing.' },
  { key: 'community', label: 'Community', short: 'Community', component: Community, description: 'People, support, accountability and health-oriented social spaces.' },
  { key: 'clubs', label: 'Club Hub', short: 'Clubs', component: ClubHub, description: 'Groups, communities and shared activity.' },
  { key: 'finance', label: 'Finance & Emergency Fund', short: 'Finance', component: MoneyHub, description: 'Personal finance, planning and emergency-fund context.' },
  { key: 'markets', label: 'Stocks & Markets', short: 'Markets', component: Markets, description: 'Delayed market context for monitoring and learning, not trading instructions.' },
  { key: 'scores', label: 'Scores', short: 'Scores', component: SportsScores, description: 'Live and recorded sports-score context.' },
  { key: 'religion', label: 'Religion & Reflection', short: 'Religion', component: ReligionWorkspace, description: 'Scripture, hadith, prayer-time tools and reflective learning.' },
  { key: 'learn', label: 'Read & Learn', short: 'Learn', component: MedStudyHub, description: 'Reading, cases and study material inside the Home experience.' },
]

const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return <div className="pan-home-loader" role="status">Loading Home…</div>
}

export function HomeSocialWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as HomeView | null
  const activeKey: HomeView = requested && VALID.has(requested) ? requested : 'home'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component

  return (
    <div className="home-social-workspace">
      <PanaceaZoneNav />

      <section className="home-workspace-intro" data-pan-surface aria-labelledby="home-workspace-title">
        <p className="pan-home-eyebrow">Home · daily operating layer</p>
        <h1 id="home-workspace-title" className="pan-home-title">Your health and daily life, one workspace.</h1>
        <p className="pan-home-copy">
          Move between health logs, people, finance, markets, scores, reflection and learning without leaving Home.
        </p>

        <div className="pan-home-tabs" role="tablist" aria-label="Home workspace">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={activeKey === view.key}
              data-active={activeKey === view.key}
              className="pan-home-tab"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.set('t', view.key)
                setParams(next, { replace: true })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              {view.short}
            </button>
          ))}
        </div>

        <div className="pan-home-room-description" aria-live="polite">
          <strong>{active.label}</strong> · {active.description}
        </div>
      </section>

      <section className="pan-home-panel" role="tabpanel" aria-label={active.label}>
        <Suspense fallback={<Loader />}>
          <Active />
        </Suspense>
      </section>

      <FeatureBoulevard zone="home" title="Home feature boulevard" />
    </div>
  )
}

export default HomeSocialWorkspace
