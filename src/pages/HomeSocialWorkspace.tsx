import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HomeCommandDeck } from '../components/HomeCommandDeck'
import { HomeHealthBrief } from '../components/HomeHealthBrief'
import { HomeRecoveryVisuals } from '../components/HomeRecoveryVisuals'
import { HomeVisualLanding } from '../components/HomeVisualLanding'
import { RelWidgetRumah } from '../components/RelWidgetRumah'
import { SuperPageLauncher } from '../components/SuperPageLauncher'
import { PanaceaImageSlider } from '../components/PanaceaImageSlider'
import { ThinkingOrb } from '../components/ThinkingOrb'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import '../styles/home-liquid-reference.css'
import '../styles/home-green-material-v48.css'
import '../styles/home-human-interface.css'
import '../styles/home-liquid-control-layer.css'
import '../styles/home-compact-responsive.css'

const Feed = lazy(() => import('./Feed'))
const Community = lazy(() => import('./Community').then((m) => ({ default: m.Community })))
const ClubHub = lazy(() => import('./ClubHub').then((m) => ({ default: m.ClubHub })))
const MoneyHub = lazy(() => import('./MoneyHub').then((m) => ({ default: m.MoneyHub })))
const Markets = lazy(() => import('./Markets').then((m) => ({ default: m.Markets })))
const SportsScores = lazy(() => import('./SportsScores').then((m) => ({ default: m.SportsScores })))
const ReligionWorkspace = lazy(() => import('./ReligionWorkspace').then((m) => ({ default: m.ReligionWorkspace })))
const MedStudyHub = lazy(() => import('./MedStudyHub').then((m) => ({ default: m.MedStudyHub })))
const ForYouHub = lazy(() => import('./ForYouHub').then((m) => ({ default: m.ForYouHub })))
const ForYouSocialPulse = lazy(() => import('../components/ForYouSocialPulse').then((m) => ({ default: m.ForYouSocialPulse })))

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
    <div className="grid min-h-[24vh] place-items-center border-y border-white/10 text-xs font-black text-white/50">
      <ThinkingOrb label="Loading space" size={20} />
    </div>
  )
}

export function HomeSocialWorkspace() {
  const [params] = useSearchParams()
  const requested = params.get('t') as HomeView | null
  const activeKey: HomeView = requested === 'for-you' || (requested && LEGACY_VALID.has(requested as LegacyViewKey)) ? requested : 'home'
  const legacy = LEGACY_VIEWS.find((view) => view.key === activeKey)
  const LegacyActive = legacy?.component

  return (
    <div className="panacea-liquid-home mx-auto w-full max-w-[1320px] pb-32">
      <PanaceaZoneNav />
      {activeKey === 'home' ? (
        <div className="panacea-human-home">
          <HomeHealthBrief />
          <HomeRecoveryVisuals />
          <SuperPageLauncher />
          <RelWidgetRumah />
          <HomeVisualLanding />
          <PanaceaImageSlider />
          <HomeCommandDeck />
        </div>
      ) : activeKey === 'for-you' ? (
        <div className="grid gap-5">
          <Suspense fallback={<Loader />}><ForYouSocialPulse /></Suspense>
          <Suspense fallback={<Loader />}><ForYouHub /></Suspense>
        </div>
      ) : LegacyActive ? (
        <section aria-label={legacy?.label ?? 'Home space'} className="min-w-0">
          <Suspense fallback={<Loader />}><LegacyActive /></Suspense>
        </section>
      ) : null}

    </div>
  )
}

export default HomeSocialWorkspace
