import { lazy, Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BodyEvidenceDock, type BodyEvidenceMode } from '../components/digital-twin/BodyEvidenceDock'
import { HraContextBridge } from '../components/digital-twin/HraContextBridge'

const HraClinicalAtlas = lazy(() =>
  import('../components/digital-twin/HraClinicalAtlas').then((m) => ({ default: m.HraClinicalAtlas })),
)
const PhysiologyBodyLab = lazy(() =>
  import('../components/digital-twin/PhysiologyBodyLab').then((m) => ({ default: m.PhysiologyBodyLab })),
)
const CellGenomeEvidenceLab = lazy(() =>
  import('../components/digital-twin/CellGenomeEvidenceLab').then((m) => ({ default: m.CellGenomeEvidenceLab })),
)
const CinematicCellGenomeExplorer = lazy(() =>
  import('../components/digital-twin/CinematicCellGenomeExplorer').then((m) => ({ default: m.CinematicCellGenomeExplorer })),
)
const RegenerationResearchSandbox = lazy(() =>
  import('../components/digital-twin/RegenerationResearchSandbox').then((m) => ({ default: m.RegenerationResearchSandbox })),
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
  { key: 'realistic-atlas', label: 'Anatomy', hint: 'Live GitHub HRA GLB catalog + published ASCT+B structure mapping' },
  { key: 'physiology', label: 'Physiology 4D', hint: 'Cardiovascular, respiratory, neuromuscular, GI, renal and thermoregulation' },
  { key: 'digital-twin', label: 'Body → Cell', hint: 'Cinematic cell structure + Human Protein Atlas evidence' },
  { key: 'cell-genome', label: 'Cell → DNA', hint: '3D cell/chromatin/DNA + HPA and Ensembl evidence' },
  { key: 'workout-4d', label: 'Exercise', hint: 'HRA reference anatomy first; measured workout replay is a separate layer' },
  { key: 'surgery', label: 'Surgery', hint: 'HRA source anatomy first; procedural simulation is explicitly separated' },
]

const MORE: Mode[] = [
  { key: 'surgery-rehearsal', label: 'Practice', hint: 'HRA source anatomy first; rehearsal remains a separate simulation layer' },
  { key: 'counterfactual', label: 'What-if', hint: 'Reference anatomy and real evidence stay separate from scenario modelling' },
  { key: 'regeneration', label: 'Research', hint: 'Reference anatomy and live trials stay separate from experimental concepts' },
]

const ALL = [...PRIMARY, ...MORE]

const HRA_CONTEXT: Partial<Record<LabMode, string[]>> = {
  physiology: ['heart', 'lung', 'blood vasculature', 'skeletal muscle', 'kidney', 'colon', 'skin', 'brain'],
  'workout-4d': ['heart', 'lung', 'blood vasculature', 'skeletal muscle', 'femur'],
  surgery: ['meniscus', 'femur', 'patella', 'heart valve', 'colon', 'thyroid', 'prostate', 'uterus'],
  'surgery-rehearsal': ['meniscus', 'femur', 'patella', 'heart valve', 'kidney', 'colon'],
  counterfactual: ['heart', 'liver', 'kidney', 'brain', 'lung', 'pancreas'],
  regeneration: ['skin', 'liver', 'kidney', 'heart', 'brain', 'pancreas'],
}

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

function SourceBackedMode({ title, detail, evidenceTerms, children, openDefault = false }: { title: string; detail: string; evidenceTerms: string[]; children: ReactNode; openDefault?: boolean }) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<LoadingLab label="HuBMAP Human Reference Atlas" />}>
        <HraClinicalAtlas />
      </Suspense>
      <HraContextBridge title="Mapped anatomy for this experience" terms={evidenceTerms} />
      <details className="group rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]" open={openDefault}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-amber-700 dark:text-amber-300">Model / simulation layer</div>
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
  const initialStage = mode === 'body-cell' ? 'cell' : 'dna'
  return (
    <div className="space-y-4">
      <Suspense fallback={<LoadingLab label="cinematic cellular 3D" />}>
        <CinematicCellGenomeExplorer initialStage={initialStage} />
      </Suspense>
      <details className="group rounded-[26px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[.035]" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700 dark:text-emerald-300">Source evidence layer</div>
            <div className="mt-1 text-[15px] font-black text-neutral-950 dark:text-white">Human Protein Atlas + Ensembl</div>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The 3D scene above is a structural educational model. Source-backed microscopy, gene records and genomic coordinates remain separately identified here so the render is never presented as patient evidence.</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg text-neutral-700 transition group-open:rotate-45 dark:bg-white/10 dark:text-white">＋</span>
        </summary>
        <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/10">
          <Suspense fallback={<LoadingLab label="HPA and Ensembl evidence" />}>
            <CellGenomeEvidenceLab mode={mode} />
          </Suspense>
        </div>
      </details>
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
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">ASCT+B v1.2 + v2</span>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[.04]">HPA · Ensembl</span>
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
        <CellEvidenceMode mode="body-cell" />
      ) : mode === 'realistic-atlas' ? (
        <Suspense fallback={<LoadingLab label="HuBMAP Human Reference Atlas" />}>
          <HraClinicalAtlas />
        </Suspense>
      ) : mode === 'physiology' ? (
        <SourceBackedMode openDefault evidenceTerms={HRA_CONTEXT.physiology ?? []} title="Whole-body 4D physiology" detail="HRA source anatomy stays visible first. The physiology layer then animates timing and system relationships while separating connected measurements, derived calculations, educational reference values and unavailable measurements.">
          <Suspense fallback={<LoadingLab label="whole-body physiology" />}><PhysiologyBodyLab /></Suspense>
        </SourceBackedMode>
      ) : mode === 'cell-genome' ? (
        <CellEvidenceMode mode="cell-genome" />
      ) : mode === 'workout-4d' ? (
        <SourceBackedMode evidenceTerms={HRA_CONTEXT['workout-4d'] ?? []} title="Measured workout replay" detail="Workout-derived animation is useful only after the HRA anatomical reference is established. Measured device signals, derived physiology and educational context remain explicitly separated.">
          <Suspense fallback={<LoadingLab label="exercise physiology replay" />}><Workout4DLab /></Suspense>
        </SourceBackedMode>
      ) : mode === 'surgery' ? (
        <SourceBackedMode evidenceTerms={HRA_CONTEXT.surgery ?? []} title="Procedural surgery atlas" detail="This section is a procedural education layer, not source anatomy. The HRA cards above resolve representative surgical structures against actual ASCT+B mappings before the simulation is opened.">
          <Suspense fallback={<LoadingLab label="surgical procedure atlas" />}><SurgicalOperationAtlas /></Suspense>
        </SourceBackedMode>
      ) : mode === 'surgery-rehearsal' ? (
        <SourceBackedMode evidenceTerms={HRA_CONTEXT['surgery-rehearsal'] ?? []} title="Surgical rehearsal" detail="Rehearsal remains clearly separated from the HRA reference anatomy. Source mappings are visible first; open this layer only for procedural practice.">
          <Suspense fallback={<LoadingLab label="cinematic surgical rehearsal" />}><CinematicSurgicalRehearsal /></Suspense>
        </SourceBackedMode>
      ) : mode === 'counterfactual' ? (
        <SourceBackedMode evidenceTerms={HRA_CONTEXT.counterfactual ?? []} title="Counterfactual biology model" detail="What-if outputs are modelling hypotheses. They are not observed anatomy, diagnosis or treatment response; HRA source matches stay visibly separate above.">
          <Suspense fallback={<LoadingLab label="what-if model" />}><CounterfactualBiologyLab /></Suspense>
        </SourceBackedMode>
      ) : (
        <SourceBackedMode evidenceTerms={HRA_CONTEXT.regeneration ?? []} title="Regeneration research sandbox" detail="Experimental regeneration concepts are kept behind the reference anatomy and are paired with source-mapped HRA structures plus current literature and registered clinical trials.">
          <Suspense fallback={<LoadingLab label="regeneration research" />}><RegenerationResearchSandbox /></Suspense>
        </SourceBackedMode>
      )}

      <BodyEvidenceDock mode={mode} />
    </main>
  )
}
