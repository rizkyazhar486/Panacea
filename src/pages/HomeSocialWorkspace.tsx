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
  { key: 'learn', label: 'Read & Learn', short: 'Read & Learn', component: MedStudyHub, description: 'Reading, cases and study material available without leaving the Home experience.' },
]
const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return <div className="grid min-h-[34vh] place-items-center rounded-[28px] border border-white/10 bg-black/10 text-sm font-bold text-neutral-500" role="status">Loading Home…</div>
}

export function HomeSocialWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as HomeView | null
  const activeKey: HomeView = requested && VALID.has(requested) ? requested : 'home'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component
  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-4 pb-10">
      <PanaceaZoneNav />
      <section className="rounded-[30px] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-brand">Home · life, people, faith and money</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">Your daily life in one home</h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-300">Logs and stats sit beside social, community, clubs, finance, markets, scores, religion and reading. These are rooms inside one Home, not a maze of separate destinations.</p>
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Home workspace">
          {VIEWS.map((view) => (
            <button key={view.key} type="button" role="tab" aria-selected={activeKey === view.key} onClick={() => { const next = new URLSearchParams(params); next.set('t', view.key); setParams(next, { replace: true }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className={`min-h-[44px] shrink-0 rounded-full border px-4 text-xs font-black transition ${activeKey === view.key ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/5 text-neutral-600 dark:text-neutral-300'}`}>{view.short}</button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400"><b className="text-ink dark:text-white">{active.label}:</b> {active.description}</div>
      </section>
      <section role="tabpanel" aria-label={active.label}><Suspense fallback={<Loader />}><Active /></Suspense></section>
      <FeatureBoulevard zone="home" title="Home feature boulevard" />
    </div>
  )
}

export default HomeSocialWorkspace
