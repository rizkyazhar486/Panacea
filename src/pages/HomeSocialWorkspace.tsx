import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HomeCommandDeck } from '../components/HomeCommandDeck'
import { HomeHealthBrief } from '../components/HomeHealthBrief'
import { HomeLiveWidgetRail } from '../components/HomeLiveWidgetRail'
import { HomeRecoveryVisuals } from '../components/HomeRecoveryVisuals'
import { HomeEssentialTools } from '../components/HomeEssentialTools'
import { HomeVisualLanding } from '../components/HomeVisualLanding'
import { RelWidgetRumah } from '../components/RelWidgetRumah'
import { SuperPageLauncher } from '../components/SuperPageLauncher'
import { PanaceaImageSlider } from '../components/PanaceaImageSlider'
import { ThinkingOrb } from '../components/ThinkingOrb'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { Fold, FoldGroup } from '../shared/ui/Fold'

const Feed = lazy(() => import('./social/Feed'))
const Community = lazy(() => import('./social/Community').then((m) => ({ default: m.Community })))
const ClubHub = lazy(() => import('./social/ClubHub').then((m) => ({ default: m.ClubHub })))
const MoneyHub = lazy(() => import('./finance/MoneyHub').then((m) => ({ default: m.MoneyHub })))
const Markets = lazy(() => import('./finance/Markets').then((m) => ({ default: m.Markets })))
const SportsScores = lazy(() => import('./SportsScores').then((m) => ({ default: m.SportsScores })))
const ReligionWorkspace = lazy(() => import('./ReligionWorkspace').then((m) => ({ default: m.ReligionWorkspace })))
const MedStudyHub = lazy(() => import('./MedStudyHub').then((m) => ({ default: m.MedStudyHub })))
const ForYouHub = lazy(() => import('./social/ForYouHub').then((m) => ({ default: m.ForYouHub })))

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
    <div className="panacea-liquid-home mx-auto w-full max-w-7xl pb-32">
      <div className="lg:hidden">
        <PanaceaZoneNav />
      </div>
      {activeKey === 'home' ? (
        <div className="panacea-human-home">
          {/* Balanced 2-Column Bento Grid on Desktop */}
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            {/* Left Column (7 cols): Telemetry Brief */}
            <div className="flex flex-col lg:col-span-7 h-full">
              <HomeHealthBrief />
            </div>

            {/* Right Column (5 cols): AI Copilot, Essential Tools & Recovery */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              <HomeVisualLanding />
              <HomeEssentialTools />
              <HomeRecoveryVisuals />
            </div>
          </div>

          {/* 7 Connected Categories */}
          <SuperPageLauncher />

          {/* Secondary Ecosystem Modules: 1-Column Full-Width Stacked Folds (Zero-Void, Exclusive Accordion) */}
          <FoldGroup name="home-secondary">
            <div className="mt-6 flex flex-col gap-3.5 w-full">
              <Fold label="Widgets" subtitle="Ringkasan Alat & Ekosistem Terhubung">
                <RelWidgetRumah />
              </Fold>
              <Fold label="Live" subtitle="Aliran Telemetri Langsung">
                <HomeLiveWidgetRail />
              </Fold>
              <Fold label="Stories" subtitle="Edukasi & Wawasan Longevity">
                <PanaceaImageSlider />
              </Fold>
              <Fold label="Deck" subtitle="Pusat Kendali Perintah">
                <HomeCommandDeck />
              </Fold>
            </div>
          </FoldGroup>
        </div>
      ) : activeKey === 'for-you' ? (
        <Suspense fallback={<Loader />}><ForYouHub /></Suspense>
      ) : LegacyActive ? (
        <section aria-label={legacy?.label ?? 'Home space'} className="min-w-0">
          <Suspense fallback={<Loader />}><LegacyActive /></Suspense>
        </section>
      ) : null}

    </div>
  )
}

export default HomeSocialWorkspace
