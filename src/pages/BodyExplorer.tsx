import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DigitalTwinEngine } from '../components/digital-twin/DigitalTwinEngine'
import { BodyEvidenceDock, type BodyEvidenceMode } from '../components/digital-twin/BodyEvidenceDock'

const HraClinicalAtlas = lazy(() =>
  import('../components/digital-twin/HraClinicalAtlas').then((m) => ({ default: m.HraClinicalAtlas })),
)
const RegenerationResearchSandbox = lazy(() =>
  import('../components/digital-twin/RegenerationResearchSandbox').then((m) => ({ default: m.RegenerationResearchSandbox })),
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

type LabMode = BodyEvidenceMode

type Mode = {
  key: LabMode
  label: string
  hint: string
}

const PRIMARY: Mode[] = [
  { key: 'realistic-atlas', label: 'Anatomy', hint: 'HuBMAP HRA reference objects · rotate, isolate, inspect' },
  { key: 'digital-twin', label: 'Body → Cell', hint: 'Organ, tissue, cell and pathway with live source references' },
  { key: 'cell-genome', label: 'Cell → DNA', hint: 'Cell, nucleus, chromatin, sequencing and genomics evidence' },
  { key: 'workout-4d', label: 'Exercise', hint: 'Movement physiology paired with current literature' },
  { key: 'surgery', label: 'Surgery', hint: 'Surgical anatomy and procedural sequence with live evidence' },
]

const MORE: Mode[] = [
  { key: 'surgery-rehearsal', label: 'Practice', hint: 'Surgical rehearsal separated from source evidence' },
  { key: 'counterfactual', label: 'What-if', hint: 'Scenario modelling with real evidence shown separately' },
  { key: 'regeneration', label: 'Research', hint: 'Experimental regeneration concepts with current trials and literature' },
]

const ALL = [...PRIMARY, ...MORE]

function isLabMode(value: string | null): value is LabMode {
  return ALL.some((item) => item.key === value)
}

function LoadingLab({ label }: { label: string }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-10 text-center text-sm font-semibold text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
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
    <main className="mx-auto w-full max-w-[1500px] space-y-4 pb-12">
      <section className="sticky top-0 z-40 rounded-[22px] border border-neutral-200 bg-white/95 px-3 py-3 shadow-[0_10px_30px_rgba(20,30,40,.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080b0e]/95 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-neutral-400">Panacea Body Exposure</div>
            <div className="mt-0.5 text-[15px] font-black tracking-tight text-neutral-950 dark:text-white">{active.label}</div>
            <div className="mt-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{active.hint}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.1em] text-neutral-500">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">HRA / HuBMAP</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">EMBL-EBI</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">Europe PMC</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">ClinicalTrials.gov</span>
          </div>
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {PRIMARY.map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-black transition ${mode === item.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}
            >
              {item.label}
            </button>
          ))}
          <details className="shrink-0">
            <summary className="list-none cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-[10px] font-black text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">More ▾</summary>
            <div className="absolute right-3 mt-2 flex min-w-[170px] flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#111519]">
              {MORE.map((item) => (
                <button key={item.key} onClick={() => setMode(item.key)} className={`rounded-xl px-3 py-2 text-left text-[10px] font-black ${mode === item.key ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10'}`}>{item.label}</button>
              ))}
            </div>
          </details>
        </div>
      </section>

      {mode === 'digital-twin' ? (
        <DigitalTwinEngine />
      ) : mode === 'realistic-atlas' ? (
        <Suspense fallback={<LoadingLab label="HuBMAP Human Reference Atlas" />}>
          <HraClinicalAtlas />
        </Suspense>
      ) : mode === 'cell-genome' ? (
        <Suspense fallback={<LoadingLab label="cell-to-genome explorer" />}>
          <CellGenomeExplorer />
        </Suspense>
      ) : mode === 'workout-4d' ? (
        <Suspense fallback={<LoadingLab label="exercise physiology" />}>
          <Workout4DLab />
        </Suspense>
      ) : mode === 'surgery' ? (
        <Suspense fallback={<LoadingLab label="surgical anatomy" />}>
          <SurgicalOperationAtlas />
        </Suspense>
      ) : mode === 'surgery-rehearsal' ? (
        <Suspense fallback={<LoadingLab label="surgical rehearsal" />}>
          <SurgicalRehearsalLab />
        </Suspense>
      ) : mode === 'counterfactual' ? (
        <Suspense fallback={<LoadingLab label="what-if lab" />}>
          <CounterfactualBiologyLab />
        </Suspense>
      ) : (
        <Suspense fallback={<LoadingLab label="regeneration research" />}>
          <RegenerationResearchSandbox />
        </Suspense>
      )}

      <BodyEvidenceDock mode={mode} />
    </main>
  )
}
