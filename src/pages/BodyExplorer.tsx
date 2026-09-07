import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BodyEvidenceDock, type BodyEvidenceMode } from '../components/digital-twin/BodyEvidenceDock'

const HeadToToeAnatomyWorkbench = lazy(() =>
  import('../components/digital-twin/HeadToToeAnatomyWorkbench').then((m) => ({ default: m.HeadToToeAnatomyWorkbench })),
)
const HumanAnatomyMasterAtlas = lazy(() =>
  import('../components/digital-twin/HumanAnatomyMasterAtlas').then((m) => ({ default: m.HumanAnatomyMasterAtlas })),
)
const HumanAnatomyLayerNavigator = lazy(() =>
  import('../components/digital-twin/HumanAnatomyLayerNavigator').then((m) => ({ default: m.HumanAnatomyLayerNavigator })),
)
const BodyParts3DDeepAtlas = lazy(() =>
  import('../components/digital-twin/BodyParts3DDeepAtlas').then((m) => ({ default: m.BodyParts3DDeepAtlas })),
)
const Ocular4DAtlas = lazy(() =>
  import('../components/digital-twin/Ocular4DAtlas').then((m) => ({ default: m.Ocular4DAtlas })),
)
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
  { key: 'realistic-atlas', label: 'Anatomy', hint: 'Navigate precise named anatomy from scalp and brain to ankle and toes, then switch source tools without stacking heavy viewers.' },
  { key: 'physiology', label: 'Physiology', hint: 'Connect anatomy to organ function, mechanisms and pathology.' },
  { key: 'vision', label: 'Eye 4D', hint: 'Ocular anatomy, optics, retina, visual pathways and examination.' },
  { key: 'digital-twin', label: 'Body → Cell', hint: 'Move from body structures into microscopy and molecular evidence.' },
  { key: 'cell-genome', label: 'Cell → DNA', hint: 'HPA, Ensembl and local sequencing evidence without decorative fake biology.' },
  { key: 'workout-4d', label: 'Exercise', hint: 'Replay measured exercise signals against fixed source anatomy.' },
  { key: 'surgery', label: 'Surgery', hint: 'Operation-specific anatomy with procedure checkpoints.' },
]

const MORE: Mode[] = [
  { key: 'surgery-rehearsal', label: 'Practice', hint: 'Active recall and surgical risk-map practice.' },
  { key: 'counterfactual', label: 'What-if', hint: 'Source anatomy plus explicit causal scenarios.' },
  { key: 'regeneration', label: 'Research', hint: 'Aging and recovery hypotheses kept separate from measured facts.' },
]

const ALL = [...PRIMARY, ...MORE]

type AnatomyTool = 'head-to-toe' | 'systems' | 'layers' | 'deep' | 'hra' | 'search'

const ANATOMY_TOOLS: { key: AnatomyTool; label: string; detail: string }[] = [
  { key: 'head-to-toe', label: 'Head → toe', detail: 'Ordered named structures from scalp and brain through limbs to toes.' },
  { key: 'systems', label: 'System atlas', detail: 'Regional anatomy, organ systems and special senses grouped clinically.' },
  { key: 'layers', label: 'Layers', detail: 'Skin → soft tissue → muscle → bone → vessels → nerves → organs.' },
  { key: 'deep', label: 'Deep atlas', detail: 'BodyParts3D source geometry for a selected system or structure.' },
  { key: 'hra', label: 'HRA canvas', detail: 'Multi-layer HuBMAP HRA canvas when simultaneous structures are needed.' },
  { key: 'search', label: 'Source search', detail: 'Find anatomy across supported HRA releases and source records.' },
]

function isLabMode(value: string | null): value is LabMode {
  return ALL.some((item) => item.key === value)
}

function LoadingLab({ label }: { label: string }) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-8 text-center text-sm font-medium text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      Loading {label}…
    </div>
  )
}

function OnDemandPanel({
  title,
  detail,
  eyebrow = 'Optional tool',
  children,
}: {
  title: string
  detail: string
  eyebrow?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[.035]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
        aria-expanded={open}
      >
        <div>
          <div className="text-[9px] font-medium uppercase tracking-[.14em] text-neutral-400">{eyebrow}</div>
          <div className="mt-1 text-[15px] font-semibold text-neutral-950 dark:text-white">{title}</div>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{detail}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg text-neutral-700 transition dark:bg-white/10 dark:text-white ${open ? 'rotate-45' : ''}`}>＋</span>
      </button>
      {open && <div className="border-t border-neutral-100 p-4 dark:border-white/10 sm:p-5">{children}</div>}
    </section>
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
      <OnDemandPanel eyebrow={eyebrow} title={title} detail={detail}>{children}</OnDemandPanel>
    </div>
  )
}

function CellEvidenceMode({ mode }: { mode: 'body-cell' | 'cell-genome' }) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<LoadingLab label="HPA and Ensembl source evidence" />}>
        <CellGenomeEvidenceLab mode={mode} />
      </Suspense>
      <OnDemandPanel
        eyebrow="Sequencing"
        title="Open local FASTA / FASTQ / VCF evidence"
        detail="Kept off by default so microscopy and sequencing tools do not compete for memory on mobile."
      >
        <Suspense fallback={<LoadingLab label="local sequencing evidence" />}>
          <SequenceEvidenceWorkbench />
        </Suspense>
      </OnDemandPanel>
    </div>
  )
}

function AnatomyMode({ onOpenPhysiology }: { onOpenPhysiology: () => void }) {
  const [tool, setTool] = useState<AnatomyTool>('head-to-toe')
  const activeTool = ANATOMY_TOOLS.find((item) => item.key === tool) ?? ANATOMY_TOOLS[0]

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[9px] font-medium uppercase tracking-[.14em] text-neutral-400">Whole-body anatomy source selector</div>
            <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-neutral-950 dark:text-white">One anatomy workspace at a time</h2>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              Head → toe is the default. Switching tools unmounts the previous workspace before loading the next, keeping WebGL and network use predictable on mobile.
            </p>
          </div>
          <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-[9px] font-medium text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">Active · {activeTool.label}</div>
        </div>

        <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {ANATOMY_TOOLS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTool(item.key)}
              className={`min-w-[150px] shrink-0 rounded-2xl border p-3 text-left transition ${tool === item.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-200'}`}
            >
              <div className="text-[12px] font-semibold">{item.label}</div>
              <div className={`mt-1 text-[10px] leading-relaxed ${tool === item.key ? 'text-white/65 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>{item.detail}</div>
            </button>
          ))}
        </div>
      </section>

      {tool === 'head-to-toe' ? (
        <Suspense fallback={<LoadingLab label="head-to-toe anatomy" />}>
          <HeadToToeAnatomyWorkbench onOpenPhysiology={onOpenPhysiology} />
        </Suspense>
      ) : tool === 'systems' ? (
        <Suspense fallback={<LoadingLab label="human anatomy master atlas" />}>
          <HumanAnatomyMasterAtlas onOpenPhysiology={onOpenPhysiology} />
        </Suspense>
      ) : tool === 'layers' ? (
        <Suspense fallback={<LoadingLab label="human anatomy layers" />}>
          <HumanAnatomyLayerNavigator />
        </Suspense>
      ) : tool === 'deep' ? (
        <Suspense fallback={<LoadingLab label="BodyParts3D deep anatomy" />}>
          <BodyParts3DDeepAtlas />
        </Suspense>
      ) : tool === 'hra' ? (
        <Suspense fallback={<LoadingLab label="HuBMAP Human Reference Atlas" />}>
          <HraClinicalAtlas />
        </Suspense>
      ) : (
        <Suspense fallback={<LoadingLab label="multi-release HRA source search" />}>
          <HraSourceSearch />
        </Suspense>
      )}
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
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-4 pb-12">
      <section className="sticky top-0 z-40 rounded-[22px] border border-neutral-200 bg-white/95 px-3 py-3 shadow-[0_8px_24px_rgba(20,30,40,.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080b0e]/95 sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[9px] font-medium uppercase tracking-[.14em] text-neutral-400">Panacea Body Exposure</div>
            <h1 className="mt-0.5 text-[18px] font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-xl">{active.label}</h1>
            <p className="mt-1 max-w-4xl text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{active.hint}</p>
          </div>
          <div className="hidden shrink-0 gap-1.5 sm:flex">
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[8px] font-medium uppercase tracking-[.1em] text-neutral-500 dark:border-white/10 dark:bg-white/[.04]">HRA</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[8px] font-medium uppercase tracking-[.1em] text-neutral-500 dark:border-white/10 dark:bg-white/[.04]">BodyParts3D</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[8px] font-medium uppercase tracking-[.1em] text-neutral-500 dark:border-white/10 dark:bg-white/[.04]">HPA</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[8px] font-medium uppercase tracking-[.1em] text-neutral-500 dark:border-white/10 dark:bg-white/[.04]">Ensembl</span>
          </div>
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {PRIMARY.map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition ${mode === item.key ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}
            >
              {item.label}
            </button>
          ))}
          <details className="relative shrink-0">
            <summary className="list-none cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-[10px] font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">More ▾</summary>
            <div className="absolute right-0 z-50 mt-2 flex min-w-[180px] flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#111519]">
              {MORE.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setMode(item.key)}
                  className={`rounded-xl px-3 py-2 text-left text-[10px] font-semibold ${mode === item.key ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      </section>

      {mode === 'digital-twin' ? (
        <CellEvidenceMode mode="body-cell" />
      ) : mode === 'realistic-atlas' ? (
        <AnatomyMode onOpenPhysiology={() => setMode('physiology')} />
      ) : mode === 'physiology' ? (
        <div id="body-physiology">
          <Suspense fallback={<LoadingLab label="HRA-native physiology workbench" />}><PhysiologyHraWorkbench /></Suspense>
        </div>
      ) : mode === 'vision' ? (
        <Suspense fallback={<LoadingLab label="4D ocular anatomy and visual physiology" />}><Ocular4DAtlas /></Suspense>
      ) : mode === 'cell-genome' ? (
        <CellEvidenceMode mode="cell-genome" />
      ) : mode === 'workout-4d' ? (
        <SecondaryLayer
          eyebrow="Data replay"
          title="Replay measured workout signals"
          detail="The anatomy workbench stays fixed. Open replay only when you want the measured and derived timeline."
          sourcePanel={<Suspense fallback={<LoadingLab label="workout-specific HRA workbench" />}><WorkoutHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="workout signal replay" />}><WorkoutSignalReplay /></Suspense>
        </SecondaryLayer>
      ) : mode === 'surgery' ? (
        <SecondaryLayer
          eyebrow="Procedure education"
          title="Open operation timeline"
          detail="Keep the operation-specific anatomy primary; load objectives, risks and checkpoints only when needed."
          sourcePanel={<Suspense fallback={<LoadingLab label="operation-specific HRA workbench" />}><SurgicalHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="procedure timeline" />}><SurgicalProcedureTimeline /></Suspense>
        </SecondaryLayer>
      ) : mode === 'surgery-rehearsal' ? (
        <SecondaryLayer
          eyebrow="Practice lab"
          title="Open active-recall rehearsal"
          detail="The HRA workbench remains the anatomy source. Practice is mounted separately to avoid duplicate heavy viewers."
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
