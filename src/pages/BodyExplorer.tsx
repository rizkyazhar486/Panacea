import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DigitalTwinEngine } from '../components/digital-twin/DigitalTwinEngine'

const RegenerationResearchSandbox = lazy(() =>
  import('../components/digital-twin/RegenerationResearchSandbox').then((m) => ({ default: m.RegenerationResearchSandbox })),
)

const RealisticAnatomyAtlas = lazy(() =>
  import('../components/digital-twin/RealisticAnatomyAtlas').then((m) => ({ default: m.RealisticAnatomyAtlas })),
)

const CounterfactualBiologyLab = lazy(() =>
  import('../components/digital-twin/CounterfactualBiologyLab').then((m) => ({ default: m.CounterfactualBiologyLab })),
)

const Workout4DLab = lazy(() =>
  import('../components/digital-twin/Workout4DLab').then((m) => ({ default: m.Workout4DLab })),
)

const SurgicalOperationAtlas = lazy(() =>
  import('../components/digital-twin/SurgicalOperationAtlasV2').then((m) => ({ default: m.SurgicalOperationAtlasV2 })),
)

const SurgicalRehearsalLab = lazy(() =>
  import('../components/digital-twin/SurgicalRehearsalLab').then((m) => ({ default: m.SurgicalRehearsalLab })),
)

type LabMode = 'digital-twin' | 'realistic-atlas' | 'workout-4d' | 'surgery' | 'surgery-rehearsal' | 'counterfactual' | 'regeneration'
type ViewMode = 'overview' | LabMode

type ModeCard = {
  key: LabMode
  shortLabel: string
  technicalLabel: string
  description: string
  question: string
  accent: string
  button: string
}

const MODES: ModeCard[] = [
  {
    key: 'realistic-atlas',
    shortLabel: '3D Anatomy',
    technicalLabel: 'Realistic Anatomy Atlas',
    description: 'Rotate the body, reveal layers and learn where structures are located.',
    question: 'Where is it?',
    accent: 'border-cyan-400/30 bg-cyan-400/[.07]',
    button: 'bg-cyan-500 text-white',
  },
  {
    key: 'digital-twin',
    shortLabel: 'Body → Cell',
    technicalLabel: 'Digital Twin Engine',
    description: 'Move from whole body to organ, tissue, cell and molecular pathway.',
    question: 'How does it work?',
    accent: 'border-emerald-400/30 bg-emerald-400/[.07]',
    button: 'bg-emerald-500 text-white',
  },
  {
    key: 'workout-4d',
    shortLabel: 'Workout Replay',
    technicalLabel: 'Workout 4D + Human Replay',
    description: 'See a workout as a body story: movement, physiology and the systems involved.',
    question: 'What happens during exercise?',
    accent: 'border-lime-400/30 bg-lime-400/[.07]',
    button: 'bg-lime-500 text-neutral-950',
  },
  {
    key: 'surgery',
    shortLabel: 'Learn Surgery',
    technicalLabel: 'Operation Universe',
    description: 'Explore operations visually by anatomy, approach and procedural sequence.',
    question: 'How is an operation performed?',
    accent: 'border-amber-400/30 bg-amber-400/[.07]',
    button: 'bg-amber-400 text-neutral-950',
  },
  {
    key: 'surgery-rehearsal',
    shortLabel: 'Practice Surgery',
    technicalLabel: 'Surgical Rehearsal',
    description: 'Review procedural steps with active recall instead of reading a dense page.',
    question: 'Can I remember the steps?',
    accent: 'border-orange-400/30 bg-orange-400/[.07]',
    button: 'bg-orange-400 text-neutral-950',
  },
  {
    key: 'counterfactual',
    shortLabel: 'What-If Lab',
    technicalLabel: 'Counterfactual Biology',
    description: 'Compare educational biological scenarios and see which assumptions changed.',
    question: 'What if something changes?',
    accent: 'border-sky-400/30 bg-sky-400/[.07]',
    button: 'bg-sky-500 text-white',
  },
  {
    key: 'regeneration',
    shortLabel: 'Research Lab',
    technicalLabel: 'Regeneration Research',
    description: 'Explore experimental regeneration concepts while keeping research separate from clinical claims.',
    question: 'What is still experimental?',
    accent: 'border-violet-400/30 bg-violet-400/[.07]',
    button: 'bg-violet-500 text-white',
  },
]

const QUICK_WIDGETS: Array<{
  title: string
  value: string
  detail: string
  mode: LabMode
}> = [
  { title: 'Anatomy layers', value: 'Skin → organ', detail: 'Best first stop for visual learners.', mode: 'realistic-atlas' },
  { title: 'Biological scale', value: 'Body → molecule', detail: 'Connect anatomy with cells and pathways.', mode: 'digital-twin' },
  { title: 'Movement', value: 'Exercise replay', detail: 'Understand what changes while the body moves.', mode: 'workout-4d' },
  { title: 'Procedure learning', value: 'See → recall', detail: 'Learn an operation, then rehearse the sequence.', mode: 'surgery' },
]

function isLabMode(value: string | null): value is LabMode {
  return MODES.some((item) => item.key === value)
}

function LoadingLab({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      Loading {label}…
    </div>
  )
}

function Overview({ onOpen }: { onOpen: (mode: LabMode) => void }) {
  return (
    <div className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#061019] p-6 text-white shadow-xl md:p-8">
        <div className="max-w-4xl">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">Body Explorer</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">See the body. Then understand it.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            You do not need to understand the technical engine first. Choose one simple question below and PanaceaMed opens the right visual tool for it.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => onOpen('realistic-atlas')} className="rounded-full bg-white px-5 py-2.5 text-xs font-black text-neutral-950">Start with 3D anatomy</button>
            <button onClick={() => onOpen('workout-4d')} className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-black text-white">Show me the body during exercise</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ['1', 'Choose a question', 'Start from what you want to learn, not from a technical feature name.'],
          ['2', 'Interact with the visual', 'Rotate, reveal, replay or compare only the information you need.'],
          ['3', 'Open detail when needed', 'Advanced models stay available, but they are no longer the first thing you have to understand.'],
        ].map(([step, title, detail]) => (
          <div key={step} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-black text-white">{step}</span>
              <div className="text-sm font-black text-ink dark:text-white">{title}</div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{detail}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-black tracking-tight text-ink dark:text-white">What do you want to understand?</h2>
            <p className="mt-1 text-xs text-neutral-500">Every card answers one human question. Technical names are shown only as secondary labels.</p>
          </div>
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500 dark:border-white/10">7 visual labs</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MODES.map((item) => (
            <button
              key={item.key}
              onClick={() => onOpen(item.key)}
              className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${item.accent}`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">{item.question}</div>
              <div className="mt-2 text-xl font-black tracking-tight text-ink dark:text-white">{item.shortLabel}</div>
              <div className="mt-1 text-[10px] font-bold text-neutral-400">{item.technicalLabel}</div>
              <p className="mt-3 min-h-12 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{item.description}</p>
              <span className={`mt-4 inline-flex rounded-full px-3 py-2 text-[11px] font-black ${item.button}`}>Open →</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-black tracking-tight text-ink dark:text-white">Quick widgets</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_WIDGETS.map((widget) => (
            <button key={widget.title} onClick={() => onOpen(widget.mode)} className="rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-brand/40 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-400">{widget.title}</div>
              <div className="mt-1 text-base font-black text-ink dark:text-white">{widget.value}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{widget.detail}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-sky-300/30 bg-sky-50 p-4 text-xs leading-relaxed text-sky-950 dark:bg-sky-300/[.06] dark:text-sky-100">
        <strong>How to read this feature:</strong> visual anatomy and physiology can be educational reference material; patient-specific findings require traceable patient data; clinical conclusions require validated rules or models. The interface keeps these levels separate instead of presenting a simulation as a diagnosis.
      </section>
    </div>
  )
}

export function BodyExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('mode')
  const mode: ViewMode = isLabMode(requested) ? requested : 'overview'
  const activeMode = isLabMode(mode) ? MODES.find((item) => item.key === mode) : undefined

  function setMode(next: ViewMode) {
    const params = new URLSearchParams(searchParams)
    if (next === 'overview') params.delete('mode')
    else params.set('mode', next)
    setSearchParams(params, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (mode === 'overview') return <Overview onOpen={setMode} />

  return (
    <div className="space-y-4 pb-10">
      <div className="sticky top-0 z-40 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#071017]/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMode('overview')} className="shrink-0 rounded-full border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-600 hover:border-brand/40 dark:border-white/10 dark:text-neutral-300">← All tools</button>
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-ink dark:text-white">{activeMode?.shortLabel}</div>
              <div className="truncate text-[10px] text-neutral-500">{activeMode?.description}</div>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {MODES.map((item) => (
              <button
                key={item.key}
                onClick={() => setMode(item.key)}
                title={item.technicalLabel}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black ${mode === item.key ? item.button : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}
              >
                {item.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'digital-twin' ? (
        <DigitalTwinEngine />
      ) : mode === 'realistic-atlas' ? (
        <Suspense fallback={<LoadingLab label="3D anatomy" />}>
          <RealisticAnatomyAtlas />
        </Suspense>
      ) : mode === 'workout-4d' ? (
        <Suspense fallback={<LoadingLab label="workout replay" />}>
          <Workout4DLab />
        </Suspense>
      ) : mode === 'surgery' ? (
        <Suspense fallback={<LoadingLab label="surgical atlas" />}>
          <SurgicalOperationAtlas />
        </Suspense>
      ) : mode === 'surgery-rehearsal' ? (
        <Suspense fallback={<LoadingLab label="surgical rehearsal" />}>
          <SurgicalRehearsalLab />
        </Suspense>
      ) : mode === 'counterfactual' ? (
        <Suspense fallback={<LoadingLab label="what-if biology lab" />}>
          <CounterfactualBiologyLab />
        </Suspense>
      ) : (
        <Suspense fallback={<LoadingLab label="research lab" />}>
          <RegenerationResearchSandbox />
        </Suspense>
      )}
    </div>
  )
}
