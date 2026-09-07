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
const StableBodyParts3DDeepAtlas = lazy(() =>
  import('../components/digital-twin/StableBodyParts3DDeepAtlas').then((m) => ({ default: m.StableBodyParts3DDeepAtlas })),
)
const OcularAnatomyAtlas = lazy(() =>
  import('../components/digital-twin/OcularAnatomyAtlas').then((m) => ({ default: m.OcularAnatomyAtlas })),
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
type Mode = { key: LabMode; label: string; hint: string }

const PRIMARY: Mode[] = [
  { key: 'realistic-atlas', label: 'Anatomy', hint: 'Head-to-toe source anatomy first: region, system, layer and deep structure.' },
  { key: 'digital-twin', label: 'Body → Cell', hint: 'Stable cell anatomy first, then real microscopy and molecular evidence.' },
  { key: 'vision', label: 'Eye anatomy', hint: 'Specific ocular structures from surface to retina and optic pathway.' },
]

const MORE: Mode[] = [
  { key: 'physiology', label: 'Physiology', hint: 'Preserved for the next layer after anatomy.' },
  { key: 'cell-genome', label: 'Cell → DNA', hint: 'Cell anatomy, HPA microscopy, Ensembl and local sequence evidence.' },
  { key: 'workout-4d', label: 'Exercise', hint: 'Measured exercise replay against source anatomy.' },
  { key: 'surgery', label: 'Surgery', hint: 'Operation-specific anatomy and checkpoints.' },
  { key: 'surgery-rehearsal', label: 'Practice', hint: 'Active recall and surgical risk-map practice.' },
  { key: 'counterfactual', label: 'What-if', hint: 'Source anatomy with explicit causal scenarios.' },
  { key: 'regeneration', label: 'Research', hint: 'Recovery and aging hypotheses kept separate from measured facts.' },
]

const ALL = [...PRIMARY, ...MORE]

type AnatomyTool = 'head-to-toe' | 'systems' | 'layers' | 'deep' | 'hra' | 'search'
const ANATOMY_TOOLS: { key: AnatomyTool; label: string; detail: string }[] = [
  { key: 'head-to-toe', label: 'Head → toe', detail: 'Named structures arranged in anatomical order.' },
  { key: 'systems', label: 'Systems', detail: 'Regional anatomy and organ systems.' },
  { key: 'layers', label: 'Layers', detail: 'Surface → fascia → muscle → bone → vessels → nerves → organs.' },
  { key: 'deep', label: 'Deep atlas', detail: 'BodyParts3D source meshes, one selection at a time.' },
  { key: 'hra', label: 'HRA canvas', detail: 'HuBMAP HRA source geometry when multi-structure context is required.' },
  { key: 'search', label: 'Source search', detail: 'Resolve named anatomy across supported HRA releases.' },
]

function isLabMode(value: string | null): value is LabMode {
  return ALL.some((item) => item.key === value)
}

function LoadingLab({ label }: { label: string }) {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-white p-7 text-center text-[12px] font-medium text-neutral-500 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      Loading {label}…
    </div>
  )
}

function OnDemandPanel({
  title,
  detail,
  eyebrow = 'Optional layer',
  children,
}: {
  title: string
  detail: string
  eyebrow?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[.035]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="text-[8px] font-medium uppercase tracking-[.13em] text-neutral-400">{eyebrow}</div>
          <div className="mt-1 text-[14px] font-semibold text-neutral-950 dark:text-white">{title}</div>
          <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{detail}</p>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-700 dark:bg-white/10 dark:text-white">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="border-t border-neutral-100 p-4 dark:border-white/10">{children}</div>}
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
      <Suspense fallback={<LoadingLab label="cell anatomy and source evidence" />}>
        <CellGenomeEvidenceLab mode={mode} />
      </Suspense>
      <OnDemandPanel
        eyebrow="Sequencing"
        title="FASTA / FASTQ / VCF evidence"
        detail="Sequencing stays off until requested so the cell viewer and sequence tools never compete for mobile memory."
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
      <section className="rounded-[22px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-neutral-400">Anatomy foundation</div>
            <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-neutral-950 dark:text-white">One anatomical workspace at a time</h2>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              The selected workspace is the only heavy anatomy view mounted. No auto-spin, no pulse, and no background 3D viewer.
            </p>
          </div>
          <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[8px] font-medium text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">
            Active · {activeTool.label}
          </div>
        </div>

        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {ANATOMY_TOOLS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTool(item.key)}
              className={`min-w-[138px] shrink-0 rounded-xl border px-3 py-2.5 text-left ${
                tool === item.key
                  ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-200'
              }`}
            >
              <div className="text-[11px] font-semibold">{item.label}</div>
              <div className={`mt-1 text-[9px] leading-relaxed ${tool === item.key ? 'text-white/65 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>{item.detail}</div>
            </button>
          ))}
        </div>
      </section>

      {tool === 'head-to-toe' ? (
        <Suspense fallback={<LoadingLab label="head-to-toe anatomy" />}>
          <HeadToToeAnatomyWorkbench onOpenPhysiology={onOpenPhysiology} />
        </Suspense>
      ) : tool === 'systems' ? (
        <Suspense fallback={<LoadingLab label="human anatomy systems" />}>
          <HumanAnatomyMasterAtlas onOpenPhysiology={onOpenPhysiology} />
        </Suspense>
      ) : tool === 'layers' ? (
        <Suspense fallback={<LoadingLab label="human anatomy layers" />}>
          <HumanAnatomyLayerNavigator />
        </Suspense>
      ) : tool === 'deep' ? (
        <Suspense fallback={<LoadingLab label="deep BodyParts3D anatomy" />}>
          <StableBodyParts3DDeepAtlas />
        </Suspense>
      ) : tool === 'hra' ? (
        <Suspense fallback={<LoadingLab label="HuBMAP Human Reference Atlas" />}>
          <HraClinicalAtlas />
        </Suspense>
      ) : (
        <Suspense fallback={<LoadingLab label="HRA source search" />}>
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
  const active = ALL.find((item) => item.key === mode) ?? PRIMARY[0]

  function setMode(next: LabMode) {
    const params = new URLSearchParams(searchParams)
    params.set('mode', next)
    setSearchParams(params, { replace: true })
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <main className="mx-auto w-full max-w-[1480px] space-y-4 pb-10">
      <section className="sticky top-0 z-40 rounded-[20px] border border-neutral-200 bg-white/95 px-3 py-2.5 shadow-[0_8px_22px_rgba(20,30,40,.055)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080b0e]/95 sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-neutral-400">Panacea Body Exposure</div>
            <h1 className="mt-0.5 text-[16px] font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-[17px]">{active.label}</h1>
            <p className="mt-0.5 max-w-4xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{active.hint}</p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[8px] font-medium text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200 sm:inline-flex">
            anatomy first
          </span>
        </div>

        <div className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {PRIMARY.map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
                mode === item.key
                  ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'
              }`}
            >
              {item.label}
            </button>
          ))}
          <details className="relative shrink-0">
            <summary className="list-none cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300">
              More tools ▾
            </summary>
            <div className="absolute right-0 z-50 mt-2 flex min-w-[190px] flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#111519]">
              {MORE.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setMode(item.key)}
                  className={`rounded-xl px-3 py-2 text-left text-[10px] font-medium ${
                    mode === item.key
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-[8px] leading-relaxed opacity-65">{item.hint}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </section>

      {mode === 'realistic-atlas' ? (
        <AnatomyMode onOpenPhysiology={() => setMode('physiology')} />
      ) : mode === 'digital-twin' ? (
        <CellEvidenceMode mode="body-cell" />
      ) : mode === 'vision' ? (
        <Suspense fallback={<LoadingLab label="ocular anatomy" />}><OcularAnatomyAtlas /></Suspense>
      ) : mode === 'cell-genome' ? (
        <CellEvidenceMode mode="cell-genome" />
      ) : mode === 'physiology' ? (
        <Suspense fallback={<LoadingLab label="HRA-native physiology workbench" />}><PhysiologyHraWorkbench /></Suspense>
      ) : mode === 'workout-4d' ? (
        <SecondaryLayer
          eyebrow="Optional replay"
          title="Measured workout timeline"
          detail="The anatomy workbench stays primary. Replay mounts only when requested."
          sourcePanel={<Suspense fallback={<LoadingLab label="exercise source anatomy" />}><WorkoutHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="workout signal replay" />}><WorkoutSignalReplay /></Suspense>
        </SecondaryLayer>
      ) : mode === 'surgery' ? (
        <SecondaryLayer
          eyebrow="Optional procedure layer"
          title="Operation timeline"
          detail="Operation-specific anatomy stays primary; objectives, risks and checkpoints load only when opened."
          sourcePanel={<Suspense fallback={<LoadingLab label="operation-specific anatomy" />}><SurgicalHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="procedure timeline" />}><SurgicalProcedureTimeline /></Suspense>
        </SecondaryLayer>
      ) : mode === 'surgery-rehearsal' ? (
        <SecondaryLayer
          eyebrow="Optional practice"
          title="Active-recall rehearsal"
          detail="Practice is isolated from the source anatomy renderer to avoid duplicate heavy views."
          sourcePanel={<Suspense fallback={<LoadingLab label="operation-specific anatomy" />}><SurgicalHraWorkbench /></Suspense>}
        >
          <Suspense fallback={<LoadingLab label="surgical rehearsal" />}><CinematicSurgicalRehearsal /></Suspense>
        </SecondaryLayer>
      ) : mode === 'counterfactual' ? (
        <Suspense fallback={<LoadingLab label="source-resolved What-if workbench" />}><CounterfactualHraWorkbench /></Suspense>
      ) : (
        <Suspense fallback={<LoadingLab label="source-resolved regeneration research" />}><RegenerationHraWorkbench /></Suspense>
      )}

      <OnDemandPanel
        eyebrow="Evidence"
        title="References & evidence dock"
        detail="Kept available but closed by default so anatomy remains visually dominant and background data work does not compete with the active 3D view."
      >
        <Suspense fallback={<LoadingLab label="evidence dock" />}><BodyEvidenceDock mode={mode} /></Suspense>
      </OnDemandPanel>
    </main>
  )
}

export default BodyExplorer
