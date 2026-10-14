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
import { Fold } from '../shared/ui/Fold'
import '../styles/home-liquid-reference.css'
import '../styles/home-green-material-v48.css'
import '../styles/home-human-interface.css'
import '../styles/home-liquid-control-layer.css'
import '../styles/home-compact-responsive.css'

const Feed = lazy(() => import('./social/Feed'))
const Community = lazy(() => import('./social/Community').then((m) => ({ default: m.Community })))
const ClubHub = lazy(() => import('./social/ClubHub').then((m) => ({ default: m.ClubHub })))
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
    <div className="panacea-liquid-home w-full max-w-none pb-32">
      <div className="lg:hidden">
        <PanaceaZoneNav />
      </div>
      {activeKey === 'home' ? (
        <div className="panacea-human-home">
          {/* Executive Bento Grid on Desktop (12 columns: 7 left, 5 right) */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Left Column (7 cols): Longitudinal Vitals & Recovery Trends */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              <HomeHealthBrief />
              <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0c1017]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tren Pemulihan & Tidur (7 Hari)
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                    Live Telemetry
                  </span>
                </div>
                <HomeRecoveryVisuals />
              </div>
            </div>

            {/* Right Column (5 cols): AI Copilot, Daily Tools */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <HomeVisualLanding />
              <HomeEssentialTools />
            </div>
          </div>

          {/* 7 Connected Categories (Full width) */}
          <SuperPageLauncher />

          {/* Secondary Ecosystem Modules in balanced 2-column grid on desktop */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
