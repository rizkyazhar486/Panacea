import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'

const EMR = lazy(() => import('./EMR').then((m) => ({ default: m.EMR })))
const Chatbot = lazy(() => import('./Chatbot').then((m) => ({ default: m.Chatbot })))
const EmergencyCard = lazy(() => import('./EmergencyCard').then((m) => ({ default: m.EmergencyCard })))

type HelpView = 'records' | 'assistant' | 'emergency'
type View = { key: HelpView; label: string; short: string; component: ComponentType; description: string }
const VIEWS: View[] = [
  { key: 'assistant', label: 'AI Health Assistant', short: 'AI Assistant', component: Chatbot, description: 'Ask, organize symptoms and prepare the next step without replacing professional assessment.' },
  { key: 'records', label: 'AI-EMR', short: 'Records', component: EMR, description: 'Clinical records and structured care documentation for authorized clinical use.' },
  { key: 'emergency', label: 'Emergency Card', short: 'Emergency', component: EmergencyCard, description: 'Critical identity and health information intended to be quickly reachable when needed.' },
]
const VALID = new Set(VIEWS.map((view) => view.key))

function Loader() {
  return <div className="grid min-h-[34vh] place-items-center rounded-[28px] border border-white/10 bg-black/10 text-sm font-bold text-neutral-500" role="status">Loading Help & Services…</div>
}

export function HelpServicesWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as HelpView | null
  const activeKey: HelpView = requested && VALID.has(requested) ? requested : 'assistant'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 pb-10">
      <section className="rounded-[30px] border border-white/10 bg-black/20 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-brand">Help & Services</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink dark:text-white sm:text-3xl">Ask, document and reach emergency information in one place</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-300">The assistant, medical record workspace and emergency card share one service destination instead of competing as separate pages.</p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Help and services">
          {VIEWS.map((view) => (
            <button key={view.key} type="button" role="tab" aria-selected={activeKey === view.key} onClick={() => {
              const next = new URLSearchParams(params); next.set('t', view.key); setParams(next, { replace: true }); window.scrollTo({ top: 0, behavior: 'smooth' })
            }} className={`min-h-[44px] rounded-full border px-4 text-xs font-black transition ${activeKey === view.key ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/5 text-neutral-600 dark:text-neutral-300'}`}>{view.short}</button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400"><b className="text-ink dark:text-white">{active.label}:</b> {active.description}</div>
      </section>
      <section role="tabpanel" aria-label={active.label}><Suspense fallback={<Loader />}><Active /></Suspense></section>
    </div>
  )
}

export default HelpServicesWorkspace
