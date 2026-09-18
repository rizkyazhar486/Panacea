import { lazy, Suspense, type ComponentType } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HomeCommandDeck } from '../components/HomeCommandDeck'
import { HomeHealthBrief } from '../components/HomeHealthBrief'
import { HomeVisualLanding } from '../components/HomeVisualLanding'
import { RelWidgetRumah } from '../components/RelWidgetRumah'
import { IconDashboard, IconHeart, IconSparkle, IconStethoscope } from '../components/icons'
import '../styles/home-liquid-reference.css'
import '../styles/home-green-material-v48.css'
import '../styles/home-human-interface.css'
import '../styles/home-liquid-control-layer.css'

const Feed = lazy(() => import('./Feed'))
const Community = lazy(() => import('./Community').then((m) => ({ default: m.Community })))
const ClubHub = lazy(() => import('./ClubHub').then((m) => ({ default: m.ClubHub })))
const MoneyHub = lazy(() => import('./MoneyHub').then((m) => ({ default: m.MoneyHub })))
const Markets = lazy(() => import('./Markets').then((m) => ({ default: m.Markets })))
const SportsScores = lazy(() => import('./SportsScores').then((m) => ({ default: m.SportsScores })))
const ReligionWorkspace = lazy(() => import('./ReligionWorkspace').then((m) => ({ default: m.ReligionWorkspace })))
const MedStudyHub = lazy(() => import('./MedStudyHub').then((m) => ({ default: m.MedStudyHub })))
const ForYouHub = lazy(() => import('./ForYouHub').then((m) => ({ default: m.ForYouHub })))

type LegacyViewKey = 'social' | 'community' | 'clubs' | 'finance' | 'markets' | 'scores' | 'religion' | 'learn'
type HomeView = 'home' | 'for-you' | LegacyViewKey
type View = { key: LegacyViewKey; label: string; component: ComponentType }

const LEGACY_VIEWS: View[] = [
  { key: 'social', label: 'Social', component: Feed },
  { key: 'community', label: 'Community', component: Community },
  { key: 'clubs', label: 'Club Hub', component: ClubHub },
  { key: 'finance', label: 'Finance', component: MoneyHub },
  { key: 'markets', label: 'Markets', component: Markets },
  { key: 'scores', label: 'Scores', component: SportsScores },
  { key: 'religion', label: 'Faith', component: ReligionWorkspace },
  { key: 'learn', label: 'Learn', component: MedStudyHub },
]

const LEGACY_VALID = new Set(LEGACY_VIEWS.map((view) => view.key))

function Loader() {
  return (
    <div className="grid min-h-[24vh] place-items-center border-y border-white/10 text-xs font-black text-white/50" role="status" aria-live="polite">
      Loading…
    </div>
  )
}

export function HomeSocialWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as HomeView | null
  const activeKey: HomeView = requested === 'for-you' || (requested && LEGACY_VALID.has(requested as LegacyViewKey)) ? requested : 'home'
  const legacy = LEGACY_VIEWS.find((view) => view.key === activeKey)
  const LegacyActive = legacy?.component

  const selectHome = () => {
    const next = new URLSearchParams(params)
    next.delete('t')
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectForYou = () => {
    const next = new URLSearchParams(params)
    next.set('t', 'for-you')
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="panacea-liquid-home mx-auto w-full max-w-[1320px] pb-32">
      {activeKey === 'home' ? (
        <div className="panacea-human-home">
          <HomeHealthBrief />
          <HomeVisualLanding />
          <RelWidgetRumah />
          <HomeCommandDeck />
        </div>
      ) : activeKey === 'for-you' ? (
        <Suspense fallback={<Loader />}><ForYouHub /></Suspense>
      ) : LegacyActive ? (
        <section aria-label={legacy?.label ?? 'Home space'} className="min-w-0">
          <Suspense fallback={<Loader />}><LegacyActive /></Suspense>
        </section>
      ) : null}

      <nav data-panacea-primary-nav data-control-layer="liquid" className="panacea-liquid-dock grid grid-cols-4 gap-1 rounded-[24px] p-1.5" aria-label="Panacea primary navigation">
        <button
          type="button"
          onClick={selectHome}
          data-active={activeKey === 'home'}
          aria-current={activeKey === 'home' ? 'page' : undefined}
          className="liquid-dock-item flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[9px] font-black text-white/55"
        >
          <IconDashboard size={17} />
          <span>Home</span>
        </button>
        <Link
          to="/fitness-hub"
          className="liquid-dock-item flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[9px] font-black text-white/55"
          aria-label="Your Body super page"
        >
          <IconHeart size={17} />
          <span>Your Body</span>
        </Link>
        <Link
          to="/clinical-hub"
          className="liquid-dock-item flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[9px] font-black text-white/55"
          aria-label="Clinical super page"
        >
          <IconStethoscope size={17} />
          <span>Clinical</span>
        </Link>
        <button
          type="button"
          onClick={selectForYou}
          data-active={activeKey === 'for-you' || !!legacy}
          aria-current={activeKey === 'for-you' || !!legacy ? 'page' : undefined}
          className="liquid-dock-item flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 text-[9px] font-black text-white/55"
        >
          <IconSparkle size={17} />
          <span>For You</span>
        </button>
      </nav>
    </div>
  )
}

export default HomeSocialWorkspace
