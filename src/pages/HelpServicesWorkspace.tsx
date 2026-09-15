import { lazy, Suspense, type ComponentType } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { FeatureBoulevard } from '../components/FeatureBoulevard'

const EMR = lazy(() => import('./EMR').then((m) => ({ default: m.EMR })))
const Chatbot = lazy(() => import('./Chatbot').then((m) => ({ default: m.Chatbot })))
const EmergencyCard = lazy(() => import('./EmergencyCard').then((m) => ({ default: m.EmergencyCard })))

type HelpView = 'records' | 'assistant' | 'emergency'
type View = {
  key: HelpView
  label: string
  short: string
  eyebrow: string
  component: ComponentType
  description: string
  urgent?: boolean
}

const VIEWS: View[] = [
  { key: 'assistant', label: 'AI Health Assistant', short: 'AI Assistant', eyebrow: 'Ask', component: Chatbot, description: 'Organize symptoms, questions and next-step options without replacing professional assessment.' },
  { key: 'records', label: 'AI-EMR', short: 'Records', eyebrow: 'Document', component: EMR, description: 'Clinical records and structured care documentation for authorized clinical use.' },
  { key: 'emergency', label: 'Emergency Card', short: 'Emergency', eyebrow: 'Urgent', component: EmergencyCard, description: 'Critical identity and health information kept quickly reachable when it matters.', urgent: true },
]

const VALID = new Set(VIEWS.map((view) => view.key))

function Loader({ label }: { label: string }) {
  return (
    <div className="relative grid min-h-[38vh] place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-neutral-950/60 text-sm font-bold text-neutral-400" role="status" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/45 to-transparent" />
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand shadow-[0_0_18px_rgba(0,191,99,.7)]" />
        Loading {label}…
      </div>
    </div>
  )
}

export function HelpServicesWorkspace() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('t') as HelpView | null
  const activeKey: HelpView = requested && VALID.has(requested) ? requested : 'assistant'
  const active = VIEWS.find((view) => view.key === activeKey) ?? VIEWS[0]
  const Active = active.component

  function select(view: View) {
    const next = new URLSearchParams(params)
    next.set('t', view.key)
    setParams(next, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-3 pb-8 sm:space-y-4 sm:pb-10">
      <PanaceaZoneNav />

      <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-neutral-950/70 p-3 shadow-[0_20px_70px_rgba(0,0,0,.24)] backdrop-blur-2xl sm:rounded-[30px] sm:p-5">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        {active.urgent && <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-transparent" />}

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.24em] text-brand sm:text-[10px]">Panacea Care · help, records and urgent access</div>
            <h1 className="mt-1 text-[1.65rem] font-black leading-tight tracking-[-.035em] text-white sm:text-3xl">Get to the right health tool with fewer steps.</h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
              Ask the assistant, work with clinical records or open emergency information from one continuous service workspace built for fast mobile access.
            </p>
          </div>

          <div className={`flex items-center gap-2 self-start rounded-[16px] border px-3 py-2 lg:self-auto ${active.urgent ? 'border-rose-400/25 bg-rose-500/[.08]' : 'border-brand/20 bg-brand/[.08]'}`}>
            <span className={`h-2 w-2 rounded-full ${active.urgent ? 'bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,.75)]' : 'bg-brand shadow-[0_0_14px_rgba(0,191,99,.75)]'}`} />
            <div>
              <div className={`text-[8px] font-black uppercase tracking-[.18em] ${active.urgent ? 'text-rose-300' : 'text-brand'}`}>{active.eyebrow}</div>
              <div className="text-xs font-black text-white">{active.label}</div>
            </div>
          </div>
        </div>

        <div className="no-scrollbar relative mt-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:gap-2" role="tablist" aria-label="Help and services">
          {VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              role="tab"
              aria-selected={activeKey === view.key}
              aria-controls={`care-panel-${view.key}`}
              onClick={() => select(view)}
              className={`min-h-[42px] shrink-0 snap-start rounded-[15px] border px-3.5 text-[11px] font-black transition duration-200 sm:min-h-[44px] sm:rounded-[16px] sm:px-4 sm:text-xs ${
                activeKey === view.key
                  ? view.urgent
                    ? 'border-rose-400/60 bg-rose-500 text-white shadow-[0_8px_26px_rgba(244,63,94,.18)]'
                    : 'border-brand/70 bg-brand text-white shadow-[0_8px_26px_rgba(0,191,99,.22)]'
                  : view.urgent
                    ? 'border-rose-400/15 bg-rose-500/[.045] text-rose-200 hover:border-rose-400/30 hover:bg-rose-500/[.08]'
                    : 'border-white/[.08] bg-white/[.035] text-neutral-400 hover:border-white/15 hover:bg-white/[.07] hover:text-white'
              }`}
            >
              {view.short}
            </button>
          ))}
        </div>

        <div className="relative mt-2.5 flex items-start gap-2 rounded-[16px] border border-white/[.07] bg-white/[.025] px-3 py-2.5 text-[11px] leading-relaxed text-neutral-400 sm:mt-3">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${active.urgent ? 'bg-rose-400' : 'bg-brand/80'}`} />
          <span><b className="text-neutral-100">{active.label}.</b> {active.description}</span>
        </div>
      </section>

      <section
        id={`care-panel-${active.key}`}
        role="tabpanel"
        aria-label={active.label}
        className={`min-w-0 overflow-hidden rounded-[24px] border bg-black/[.16] p-1 sm:rounded-[28px] sm:p-2 ${active.urgent ? 'border-rose-400/15' : 'border-white/[.08]'}`}
      >
        <Suspense fallback={<Loader label={active.label} />}>
          <Active />
        </Suspense>
      </section>

      <FeatureBoulevard zone="services" title="Help & Services feature boulevard" />
    </div>
  )
}

export default HelpServicesWorkspace
