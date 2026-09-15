import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'
import { PanaceaPulseWidget } from '../components/PanaceaPulseWidget'

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
  { key: 'home', label: 'Logs & Stats', short: 'Home', component: Beranda, description: 'Your daily logs, snapshots and useful actions.' },
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
    <div className="grid min-h-[26vh] place-items-center rounded-[22px] border border-brand/15 bg-brand/[.025] text-sm font-bold text-brand/75 dark:bg-brand/[.045]" role="status" aria-live="polite">
      Loading Home…
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
      <div className="hidden sm:block"><PanaceaZoneNav /></div>

      <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-[16px] border border-brand/10 bg-white/[.9] px-1.5 py-1.5 shadow-[0_8px_24px_rgba(15,23,42,.04)] dark:bg-black/[.68] sm:hidden" aria-label="Home rooms">
        {VIEWS.map((view) => (
          <button key={view.key} type="button" aria-current={activeKey === view.key ? 'page' : undefined} onClick={() => select(view)} className={`min-h-[38px] shrink-0 rounded-[12px] border px-3.5 text-[11px] font-black transition active:scale-[.98] ${activeKey === view.key ? 'border-brand bg-brand text-white shadow-[0_6px_18px_rgba(0,191,99,.2)]' : 'border-transparent bg-transparent text-neutral-700 hover:border-brand/15 hover:bg-brand/[.055] hover:text-brand dark:text-neutral-200 dark:hover:bg-brand/[.08]'}`}>
            {view.short}
          </button>
        ))}
      </nav>

      {activeKey === 'home' && <PanaceaPulseWidget />}

      <section className="hidden rounded-[26px] border border-brand/12 bg-white/[.94] p-4 shadow-[0_14px_38px_rgba(15,23,42,.055)] backdrop-blur-xl dark:bg-black/[.74] dark:shadow-[0_16px_40px_rgba(0,0,0,.22)] sm:block sm:p-5">
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-brand">Home · life, people, faith and money</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">Your daily life in one home</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">Logs and stats sit beside social, community, clubs, finance, markets, scores, religion and reading. These are rooms inside one Home, not a maze of separate destinations.</p>
        <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Home workspace">
          {VIEWS.map((view) => (
            <button key={view.key} type="button" role="tab" aria-selected={activeKey === view.key} onClick={() => select(view)} className={`min-h-[42px] shrink-0 rounded-[13px] border px-4 text-xs font-black transition ${activeKey === view.key ? 'border-brand bg-brand text-white' : 'border-transparent bg-brand/[.035] text-neutral-700 hover:border-brand/15 hover:bg-brand/[.07] hover:text-brand dark:text-neutral-200'}`}>
              {view.short}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-[16px] border border-brand/10 bg-brand/[.025] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-600 dark:bg-brand/[.04] dark:text-neutral-300"><b className="text-ink dark:text-white">{active.label}:</b> {active.description}</div>
      </section>

      <section role="tabpanel" aria-label={active.label} className="min-w-0"><Suspense fallback={<Loader />}><Active /></Suspense></section>
      <FeatureBoulevard zone="home" title="Home feature boulevard" />
    </div>
  )
}

export default HomeSocialWorkspace
