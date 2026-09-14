import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'

const Kitab = lazy(() => import('./Kitab').then((m) => ({ default: m.Kitab })))
const Hadis = lazy(() => import('./Hadis').then((m) => ({ default: m.Hadis })))
const Adzan = lazy(() => import('./Adzan').then((m) => ({ default: m.Adzan })))
const KisahNabi = lazy(() => import('./KisahNabi').then((m) => ({ default: m.KisahNabi })))

type FaithView = 'scripture' | 'hadith' | 'prayer' | 'stories'
type View = { key: FaithView; label: string; short: string; component: ComponentType; description: string }

const VIEWS: View[] = [
  { key: 'scripture', label: 'Scripture', short: 'Scripture', component: Kitab, description: 'Reading and reflection in the same personal-life workspace.' },
  { key: 'hadith', label: 'Hadith', short: 'Hadith', component: Hadis, description: 'Hadith reading and learning.' },
  { key: 'prayer', label: 'Prayer Times', short: 'Prayer', component: Adzan, description: 'Prayer-time utilities and daily religious rhythm.' },
  { key: 'stories', label: 'Prophet Stories', short: 'Stories', component: KisahNabi, description: 'Narrative learning and reflection.' },
]
const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return <div className="grid min-h-[30vh] place-items-center text-sm font-bold text-neutral-500" role="status">Loading Religion…</div>
}

export function ReligionWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('faith') as FaithView | null
  const activeKey: FaithView = requested && VALID.has(requested) ? requested : 'scripture'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-4">
        <div className="text-[10px] font-black uppercase tracking-[.18em] text-brand">Religion & reflection</div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Religion workspace">
          {VIEWS.map((view) => (
            <button key={view.key} type="button" role="tab" aria-selected={activeKey === view.key} onClick={() => {
              const next = new URLSearchParams(params); next.set('faith', view.key); setParams(next, { replace: true })
            }} className={`min-h-[44px] shrink-0 rounded-full border px-4 text-xs font-black ${activeKey === view.key ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/5 text-neutral-600 dark:text-neutral-300'}`}>
              {view.short}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400"><b className="text-ink dark:text-white">{active.label}:</b> {active.description}</p>
      </section>
      <section role="tabpanel" aria-label={active.label}><Suspense fallback={<Loader />}><Active /></Suspense></section>
    </div>
  )
}

export default ReligionWorkspace
