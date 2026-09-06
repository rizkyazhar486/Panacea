import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DigitalTwinEngine } from '../components/digital-twin/DigitalTwinEngine'

const RegenerationResearchSandbox = lazy(() =>
  import('../components/digital-twin/RegenerationResearchSandbox').then((m) => ({ default: m.RegenerationResearchSandbox })),
)
const RealisticAnatomyAtlas = lazy(() =>
  import('../components/digital-twin/RealisticAnatomyAtlas').then((m) => ({ default: m.RealisticAnatomyAtlas })),
)
const CellGenomeExplorer = lazy(() =>
  import('../components/digital-twin/CellGenomeExplorer').then((m) => ({ default: m.CellGenomeExplorer })),
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

type LabMode = 'digital-twin' | 'realistic-atlas' | 'cell-genome' | 'workout-4d' | 'surgery' | 'surgery-rehearsal' | 'counterfactual' | 'regeneration'

type Mode = {
  key: LabMode
  label: string
  hint: string
  active: string
}

const PRIMARY: Mode[] = [
  { key: 'realistic-atlas', label: 'Anatomy', hint: 'Rotate, zoom and tap structures', active: 'bg-cyan-500 text-white border-cyan-500' },
  { key: 'digital-twin', label: 'Body → Cell', hint: 'Organ, tissue, cell and pathway', active: 'bg-emerald-500 text-white border-emerald-500' },
  { key: 'cell-genome', label: 'Cell → DNA', hint: 'Cell, nucleus, chromatin, DNA and sequencing evidence', active: 'bg-violet-500 text-white border-violet-500' },
  { key: 'workout-4d', label: 'Exercise', hint: 'See what changes during movement', active: 'bg-lime-400 text-neutral-950 border-lime-400' },
  { key: 'surgery', label: 'Surgery', hint: 'Anatomy and procedural sequence', active: 'bg-amber-400 text-neutral-950 border-amber-400' },
]

const MORE: Mode[] = [
  { key: 'surgery-rehearsal', label: 'Practice', hint: 'Recall surgical steps', active: 'bg-orange-400 text-neutral-950 border-orange-400' },
  { key: 'counterfactual', label: 'What-if', hint: 'Compare biological scenarios', active: 'bg-sky-500 text-white border-sky-500' },
  { key: 'regeneration', label: 'Research', hint: 'Experimental concepts', active: 'bg-violet-500 text-white border-violet-500' },
]

const ALL = [...PRIMARY, ...MORE]

function isLabMode(value: string | null): value is LabMode {
  return ALL.some((item) => item.key === value)
}

function LoadingLab({ label }: { label: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      Loading {label}…
    </div>
  )
}

export function BodyExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('mode')
  const mode: LabMode = isLabMode(requested) ? requested : 'realistic-atlas'
  const active = ALL.find((item) => item.key === mode)!

  function setMode(next: LabMode) {
    const params = new URLSearchParams(searchParams)
    params.set('mode', next)
    setSearchParams(params, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-3 pb-10">
      <section className="sticky top-0 z-40 overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#071017]/95">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-black text-ink dark:text-white">Body Exposure · Atlas</div>
            <div className="mt-0.5 text-[10px] text-neutral-500">{active.hint}</div>
          </div>
          <div className="text-[9px] font-bold text-neutral-400">Drag to rotate · pinch/scroll to zoom · tap a structure</div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {PRIMARY.map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black transition ${mode === item.key ? item.active : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer select-none text-[10px] font-black text-neutral-500">More tools</summary>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {MORE.map((item) => (
              <button
                key={item.key}
                onClick={() => setMode(item.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black transition ${mode === item.key ? item.active : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </details>
      </section>

      {mode === 'digital-twin' ? (
        <DigitalTwinEngine />
      ) : mode === 'realistic-atlas' ? (
        <Suspense fallback={<LoadingLab label="anatomy" />}>
          <RealisticAnatomyAtlas />
        </Suspense>
      ) : mode === 'cell-genome' ? (
        <Suspense fallback={<LoadingLab label="cell-to-genome explorer" />}>
          <CellGenomeExplorer />
        </Suspense>
      ) : mode === 'workout-4d' ? (
        <Suspense fallback={<LoadingLab label="exercise view" />}>
          <Workout4DLab />
        </Suspense>
      ) : mode === 'surgery' ? (
        <Suspense fallback={<LoadingLab label="surgery atlas" />}>
          <SurgicalOperationAtlas />
        </Suspense>
      ) : mode === 'surgery-rehearsal' ? (
        <Suspense fallback={<LoadingLab label="practice mode" />}>
          <SurgicalRehearsalLab />
        </Suspense>
      ) : mode === 'counterfactual' ? (
        <Suspense fallback={<LoadingLab label="what-if lab" />}>
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
