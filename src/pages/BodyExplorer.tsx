import { lazy, Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BodyEvidenceDock, type BodyEvidenceMode } from '../components/digital-twin/BodyEvidenceDock'

const HraClinicalAtlas = lazy(() =>
  import('../components/digital-twin/HraClinicalAtlas').then((m) => ({ default: m.HraClinicalAtlas })),
)
const HraSourceSearch = lazy(() =>
  import('../components/digital-twin/HraSourceSearch').then((m) => ({ default: m.HraSourceSearch })),
)
const PhysiologyHraWorkbench = lazy(() =>
  import('../components/digital-twin/PhysiologyHraWorkbench').then((m) => ({ default: m.PhysiologyHraWorkbench })),
)
const CellGenomeEvidenceLab = lazy(() =>
  import('../components/digital-twin/CellGenomeEvidenceLab').then((m) => ({ default: m.CellGenomeEvidenceLab })),
)
const SequenceEvidenceWorkbench = lazy(() =>
  import('../components/digital-twin/SequenceEvidenceWorkbench').then((m) => ({ default: m.SequenceEvidenceWorkbench })),
)
const CounterfactualHraWorkbench = lazy(() =>
  import('../components/digital-twin/CounterfactualHraWorkbench').then((m) => ({ default: m.CounterfactualHraWorkbench })),
)
const RegenerationHraWorkbench = lazy(() =>
  import('../components/digital-twin/RegenerationHraWorkbench').then((m) => ({ default: m.RegenerationHraWorkbench })),
)
const WorkoutHraWorkbench = lazy(() =>
  import('../components/digital-twin/WorkoutHraWorkbench').then((m) => ({ default: m.WorkoutHraWorkbench })),
)
const WorkoutSignalReplay = lazy(() =>
  import('../components/digital-twin/WorkoutSignalReplay').then((m) => ({ default: m.WorkoutSignalReplay })),
)
const SurgicalHraWorkbench = lazy(() =>
  import('../components/digital-twin/SurgicalHraWorkbench').then((m) => ({ default: m.SurgicalHraWorkbench })),
)
const SurgicalProcedureTimeline = lazy(() =>
  import('../components/digital-twin/SurgicalProcedureTimeline').then((m) => ({ default: m.SurgicalProcedureTimeline })),
)
const CinematicSurgicalRehearsal = lazy(() =>
  import('../components/digital-twin/CinematicSurgicalRehearsal').then((m) => ({ default: m.CinematicSurgicalRehearsal })),
)

type LabMode = BodyEvidenceMode

type Mode = {
  key: LabMode
  label: string
  hint: string
}

const PRIMARY: Mode[] = [
  { key: 'realistic-atlas', label: 'Anatomy', hint: 'Multi-release HRA source anatomy with browser-loadable GLB provenance' },
  { key: 'physiology', label: 'Physiology', hint: 'HRA source anatomy + explicit physiology phases, formulas and provenance' },
  { key: 'digital-twin', label: 'Body → Cell', hint: 'Human Protein Atlas microscopy/metadata + real local sequence evidence; no generated cell required' },
  { key: 'cell-genome', label: 'Cell → DNA', hint: 'HPA + Ensembl reference sequence + local FASTA/FASTQ/VCF evidence' },
  { key: 'workout-4d', label: 'Exercise', hint: 'Measured workout → resolved HRA GLB → data replay; no body deformation' },
  { key: 'surgery', label: 'Surgery', hint: 'Operation/phase → resolved HRA GLB → procedure timeline' },
]

const MORE: Mode[] = [
  { key: 'surgery-rehearsal', label: 'Practice', hint: 'Operation-specific HRA source anatomy → active recall and risk-map practice' },
  { key: 'counterfactual', label: 'What-if', hint: 'Scenario-resolved HRA geometry + executable causal model, kept separate' },
  { key: 'regeneration', label: 'Research', hint: 'Organ-resolved HRA geometry + explicit aging/recovery hypotheses' },
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

function SecondaryLayer({
  eyebrow,
  title,
  detail,
  sourcePanel,
  children,
}: {
  eyebrow: string
  title: string
  detail: string
  sourcePanel: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      {sourcePanel}
      <details className="group rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-amber-700 dark:text-amber-300">{eyebrow}</div>
            <div className="mt-1 text-[15px] font-black text-neutral-950 dark:text-white">{title}</div>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{detail}</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg text-neutral-700 transition group-open:rotate-45 dark:bg-white/10 dark:text-white">＋</span>
        </summary>
        <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/10">{children}</div>
      </details>
    </div>
  )
}

function CellEvidenceMode({ mode }: { mode: 'body-cell' | 'cell-genome' }) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<LoadingLab label="HPA and Ensembl source evidence" />}>
        <CellGenomeEvidenceLab mode={mode} />
      </Suspense>
      <Suspense fallback={<LoadingLab label="local sequencing evidence" />}>
        <SequenceEvidenceWorkbench />
      </Suspense>
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
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">HuBMAP HRA</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">GitHub models API</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">HRA v1.2 · v1.4 · v2</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">HPA · Ensembl</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">FASTA · FASTQ · VCF</span>
          </div>
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {PRIMARY.map((item) => (
            <button key={item.key} onClick={() => setMode(item.key)} className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-black transition ${mode === item.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{item.label}</button>
          ))}
          <details className="shrink-0">
            <summary className="list-none cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-[10px] font-black text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">More ▾</summary>
            <div className="absolute right-3 mt-2 flex min-w-[170px] flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#111519]">
              {MORE.map((item) => <button key={item.key} onClick={() => setMode(item.key)} className={`rounded-xl px-3 py-2 text-left text-[10px] font-black ${mode === item.key ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10'}`}>{item.label}</button>)}
            </div>
          </details>
        </div>
      </section>

      {mode === 'digital-twin' ? (
        <CellEvidenceMode mode="body-cell" />
      ) : mode === 'realistic-atlas' ? (
        <div className="space-y-4">
          <Suspense fallback={<LoadingLab label="HuBMAP Human Reference Atlas" />}><HraClinicalAtlas /></Suspense>
          <Suspense fallback={<LoadingLab label="multi-release HRA source search" />}><HraSourceSearch /></Suspense>
        </div>
      ) : mode === 'physiology' ? (
        <Suspense fallback={<LoadingLab label="HRA-native physiology workbench" />}><PhysiologyHraWorkbench /></Suspense>
      ) : mode === 'cell-genome' ? (
        <CellEvidenceMode mode="cell-genome" />
      ) : mode === 'workout-4d' ? (
        <SecondaryLayer
          eyebrow="Data replay"
          title="Replay measured workout signals"
          detail="The source-anatomy workbench above loads fixed HRA geometry. This optional timeline replays measured, derived and educational data only; it does not animate or deform the anatomy."
          sourcePanel={<Suspense fallback={<LoadingLab label="workout-specific HRA workbench" />}><WorkoutHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="workout signal replay" />}><WorkoutSignalReplay /></Suspense>
        </SecondaryLayer>
      ) : mode === 'surgery' ? (
        <SecondaryLayer
          eyebrow="Procedure education"
          title="Operation timeline"
          detail="The source-anatomy workbench above resolves the operation and phase to HRA GLB geometry. This optional timeline handles objectives, risks and checkpoints without a second generated body renderer."
          sourcePanel={<Suspense fallback={<LoadingLab label="operation-specific HRA workbench" />}><SurgicalHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="procedure timeline" />}><SurgicalProcedureTimeline /></Suspense>
        </SecondaryLayer>
      ) : mode === 'surgery-rehearsal' ? (
        <SecondaryLayer
          eyebrow="Practice lab"
          title="Active recall and risk-map rehearsal"
          detail="The HRA workbench above remains the anatomy source. Practice below is limited to active recall, atlas coverage and operation comparison—without a duplicate Body3D viewport."
          sourcePanel={<Suspense fallback={<LoadingLab label="operation-specific HRA workbench" />}><SurgicalHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="surgical rehearsal" />}><CinematicSurgicalRehearsal /></Suspense>
        </SecondaryLayer>
      ) : mode === 'counterfactual' ? (
        <Suspense fallback={<LoadingLab label="source-resolved What-if workbench" />}><CounterfactualHraWorkbench /></Suspense>
      ) : (
        <Suspense fallback={<LoadingLab label="source-resolved regeneration research" />}><RegenerationHraWorkbench /></Suspense>
      )}

      <BodyEvidenceDock mode={mode} />
    </main>
  )
}
