import { useEffect, useMemo, useState } from 'react'
import AtlasViewer3D, { type PartMeta } from '../../components/AtlasViewer3D'
import { CARDIO_PARTS } from '../../lib/cardioAtlas.gen'
import { partsForModule } from '../../lib/systemAtlas.gen'
import {
  SURGERY_SIMULATION_SCENARIOS,
  type SurgerySimulationScenario,
  type SurgerySimulationStep,
} from '../../lib/surgerySimulator'

export interface SurgerySharedView {
  renderMode: 'anatomy' | 'ct'
  slicePlane: 'none' | 'axial' | 'coronal' | 'sagittal'
  slicePos: number
  unfold: number
  label: string
}

interface Props {
  onKedalaman?: (depth: number) => void
  onSorot?: (names: string[]) => void
  onSharedView?: (view: SurgerySharedView) => void
}

type SourcePart = { name: string; kind: string; group?: string }

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function matchesKeywords(parts: SourcePart[], keywords: string[]) {
  if (!keywords.length) return []
  const wanted = keywords.map(normalize).filter(Boolean)
  const found = new Set<string>()
  for (const part of parts) {
    const name = normalize(part.name)
    if (wanted.some((keyword) => name.includes(keyword) || keyword.includes(name))) found.add(part.name)
  }
  return [...found]
}

function missingKeywords(parts: SourcePart[], keywords: string[]) {
  return keywords.filter((keyword) => matchesKeywords(parts, [keyword]).length === 0)
}

function sourcePartsFor(scenario: SurgerySimulationScenario): SourcePart[] {
  if (scenario.atlas === 'cardio') {
    return CARDIO_PARTS.map((part) => ({ name: part.name, kind: part.kind, group: part.region }))
  }
  return partsForModule(scenario.atlas).map((part) => ({ name: part.name, kind: part.kind, group: part.kind }))
}

function ScenarioChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[34px] rounded-full border px-3 text-[11px] font-black transition ${
        active
          ? 'border-brand bg-brand text-white'
          : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:border-brand/40'
      }`}
    >
      {children}
    </button>
  )
}

function StepList({
  scenario,
  activeIndex,
  onPick,
}: {
  scenario: SurgerySimulationScenario
  activeIndex: number
  onPick: (index: number) => void
}) {
  return (
    <div className="space-y-1.5">
      {scenario.steps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          onClick={() => onPick(index)}
          aria-current={index === activeIndex ? 'step' : undefined}
          className={`w-full rounded-xl border p-2.5 text-left transition ${
            index === activeIndex
              ? 'border-brand/60 bg-brand/10'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
              index < activeIndex ? 'bg-brand text-white' : index === activeIndex ? 'border border-brand text-brand' : 'border border-white/15 text-neutral-500'
            }`}>
              {index + 1}
            </span>
            <span>
              <span className="block text-[10.5px] font-black text-white">{step.label}</span>
              <span className="mt-0.5 block text-[9px] leading-snug text-neutral-500">{step.mode.replace('-', ' ')}</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function ImagingPanel({ step, scenario }: { step: SurgerySimulationStep; scenario: SurgerySimulationScenario }) {
  if (!step.imaging) return null
  const isIce = step.imaging.modality === 'ICE'
  return (
    <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-300">{step.imaging.modality} guidance</div>
          <div className="mt-0.5 text-[11px] font-black text-white">{step.imaging.view}</div>
        </div>
        {isIce && <span className="rounded-full border border-cyan-300/20 px-2 py-1 text-[8px] font-bold text-cyan-200">orientation, not diagnosis</span>}
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {step.imaging.expected.map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-[9.5px] leading-snug text-neutral-300">
            {item}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px] leading-relaxed text-cyan-100/60">{step.imaging.limitation}</p>
      {isIce && scenario.id === 'transseptal-ice' && (
        <a
          href="https://shimayuz.github.io/cardiac-atlas-lab/?scenario=transseptal"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-[9.5px] font-bold text-cyan-300 underline decoration-cyan-300/30 underline-offset-2"
        >
          Open-source Cardiac Atlas Lab reference prototype ↗
        </a>
      )}
    </div>
  )
}

function SharedCorrelationPanel({
  scenario,
  active,
  onPick,
}: {
  scenario: SurgerySimulationScenario
  active: string
  onPick: (id: string, view: SurgerySharedView) => void
}) {
  const regionLevel = scenario.id === 'caesarean-anatomy' ? 0.52 : 0.72
  const views: Array<{ id: string; view: SurgerySharedView }> = [
    { id: 'source', view: { renderMode: 'anatomy', slicePlane: 'none', slicePos: regionLevel, unfold: 0, label: 'Source 3D' } },
    { id: 'axial', view: { renderMode: 'ct', slicePlane: 'axial', slicePos: regionLevel, unfold: 0, label: 'Axial CT' } },
    { id: 'coronal', view: { renderMode: 'ct', slicePlane: 'coronal', slicePos: 0.5, unfold: 0, label: 'Coronal CT' } },
    { id: 'sagittal', view: { renderMode: 'ct', slicePlane: 'sagittal', slicePos: 0.5, unfold: 0, label: 'Sagittal CT' } },
    { id: 'exploded', view: { renderMode: 'anatomy', slicePlane: 'none', slicePos: regionLevel, unfold: 0.28, label: 'Exploded 3D' } },
  ]

  return (
    <div data-surgery-correlation="shared-body3d" className="rounded-xl border border-violet-300/15 bg-violet-300/[0.04] p-3">
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-300">3D ↔ cross-section correlation</div>
      <p className="mt-1 text-[9.5px] leading-relaxed text-neutral-300">
        Push this procedure context into the shared whole-body viewer above. CT presets clip the same reference geometry so front–back, left–right and slice orientation can be learned together.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {views.map(({ id, view }) => (
          <button
            key={id}
            type="button"
            aria-pressed={active === id}
            onClick={() => onPick(id, view)}
            className={`rounded-full border px-2.5 py-1.5 text-[9px] font-bold ${
              active === id ? 'border-violet-300 bg-violet-300/15 text-violet-100' : 'border-white/10 text-neutral-400'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[8.5px] leading-relaxed text-neutral-500">
        Teaching render only — standard tissue-value greyscale and atlas clipping, not patient DICOM, CT segmentation, navigation coordinates or operative planning.
      </p>
    </div>
  )
}

export function SurgerySimulatorLab({ onKedalaman, onSorot, onSharedView }: Props) {
  const [scenarioId, setScenarioId] = useState(SURGERY_SIMULATION_SCENARIOS[0].id)
  const [atlasScenarioId, setAtlasScenarioId] = useState(SURGERY_SIMULATION_SCENARIOS[0].id)
  const [stepIndex, setStepIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sharedViewId, setSharedViewId] = useState('source')

  const scenario = SURGERY_SIMULATION_SCENARIOS.find((item) => item.id === scenarioId) ?? SURGERY_SIMULATION_SCENARIOS[0]
  const atlasScenario = SURGERY_SIMULATION_SCENARIOS.find((item) => item.id === atlasScenarioId) ?? SURGERY_SIMULATION_SCENARIOS[0]
  const step = scenario.steps[Math.min(stepIndex, scenario.steps.length - 1)]
  const sourceParts = useMemo(() => sourcePartsFor(scenario), [scenario])
  const partMeta = useMemo<PartMeta[]>(() => sourceParts.map((part) => ({ ...part })), [sourceParts])
  const targetMatches = useMemo(() => matchesKeywords(sourceParts, step.atlasKeywords), [sourceParts, step])
  const riskMatches = useMemo(() => matchesKeywords(sourceParts, step.atRiskKeywords), [sourceParts, step])
  const missing = useMemo(() => missingKeywords(sourceParts, step.atlasKeywords), [sourceParts, step])

  const atlasStepIndex = atlasScenario.id === scenario.id ? stepIndex : 0
  const atlasStep = atlasScenario.steps[Math.min(atlasStepIndex, atlasScenario.steps.length - 1)]
  const atlasSourceParts = useMemo(() => sourcePartsFor(atlasScenario), [atlasScenario])
  const atlasPartMeta = useMemo<PartMeta[]>(() => atlasSourceParts.map((part) => ({ ...part })), [atlasSourceParts])
  const atlasTargetMatches = useMemo(() => matchesKeywords(atlasSourceParts, atlasStep.atlasKeywords), [atlasSourceParts, atlasStep])
  const atlasRiskMatches = useMemo(() => matchesKeywords(atlasSourceParts, atlasStep.atRiskKeywords), [atlasSourceParts, atlasStep])

  useEffect(() => {
    setStepIndex(0)
    setShowAnswer(false)
    setSharedViewId('source')
  }, [scenarioId])

  useEffect(() => {
    if (atlasScenarioId === scenarioId) return
    // Keep the discrete scenario selection responsive. AtlasViewer3D teardown
    // can be expensive under software/mobile WebGL, so swap the heavy GLB only
    // after the selected scenario UI has had one frame to commit and paint.
    const frame = window.requestAnimationFrame(() => setAtlasScenarioId(scenarioId))
    return () => window.cancelAnimationFrame(frame)
  }, [scenarioId, atlasScenarioId])

  function chooseScenario(id: string) {
    if (id === scenarioId) return
    setScenarioId(id)
  }

  function goStep(index: number) {
    const next = Math.max(0, Math.min(scenario.steps.length - 1, index))
    const nextStep = scenario.steps[next]
    setStepIndex(next)
    setShowAnswer(false)
    onKedalaman?.(nextStep.bodyDepth)
    onSorot?.([...nextStep.sharedBodyKeywords, ...nextStep.atRiskText])
  }

  function applySharedView(id: string, view: SurgerySharedView) {
    setSharedViewId(id)
    onSharedView?.(view)
  }

  return (
    <section data-surgery-simulator="anatomy-grounded" className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#071018] text-white shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 bg-gradient-to-br from-cyan-400/10 via-transparent to-brand/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">Panacea Surgical Simulation · Do It Yourself with AI #DIYAI</div>
            <h3 className="mt-1 text-lg font-black">Source-grounded anatomy first. Human review status visible.</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">
              One reference atlas at a time, exact named source meshes where available, explicit gaps where they are not. No patient-specific target coordinates, fake “safe zones”, or invented anatomy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1 text-right text-[8.5px] text-neutral-500">
            <span>Patient data</span><b className="text-neutral-300">None</b>
            <span>Geometry</span><b className="text-neutral-300">Reference atlas</b>
            <span>Use</span><b className="text-neutral-300">Education</b>
            <span>AI content</span><b className="text-neutral-300">AI-assisted · disclosed</b>
            <span>Academic review</span><b className="text-amber-300">Human review pending</b>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2 text-[9px] leading-relaxed text-amber-100/70">
          Academic gate: source citations and named geometry do not equal human academic review. Until a qualified anatomy/surgical reviewer is recorded with credentials, date and scope, this simulator remains explicitly <b className="text-amber-200">not academically reviewed</b>.
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {SURGERY_SIMULATION_SCENARIOS.map((item) => (
            <ScenarioChip key={item.id} active={item.id === scenario.id} onClick={() => chooseScenario(item.id)}>
              {item.shortLabel}
            </ScenarioChip>
          ))}
        </div>
      </div>

      <div className="grid gap-3 p-3 xl:grid-cols-[0.82fr_1.65fr_0.9fr]">
        <aside className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-500">Procedure map</div>
          <div className="mt-1 text-sm font-black">{scenario.label}</div>
          <p className="mt-1 text-[9.5px] leading-relaxed text-neutral-400">{scenario.purpose}</p>
          <div className="mt-3"><StepList scenario={scenario} activeIndex={stepIndex} onPick={goStep} /></div>
        </aside>

        <main className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/25 p-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <div className="text-[8.5px] font-black uppercase tracking-[0.16em] text-brand">{scenario.atlasLabel}</div>
                <div className="text-[9px] text-neutral-500">{scenario.atlasSource}</div>
              </div>
              <div className="text-right text-[8.5px] text-neutral-500">
                <div>{sourceParts.length} named source structures</div>
                <div>{targetMatches.length} represented in this step</div>
              </div>
            </div>
            <div data-atlas-scenario={atlasScenario.id}>
              <AtlasViewer3D
                berkas={atlasScenario.atlasFile}
                bagian={atlasPartMeta}
                tinggi={390}
                dipilih={atlasTargetMatches[0] ?? null}
                hilir={atlasTargetMatches.slice(1)}
                lesi={atlasRiskMatches.filter((name) => !atlasTargetMatches.includes(name))}
              />
            </div>
            {atlasScenario.id !== scenario.id && (
              <div role="status" aria-live="polite" className="mt-2 text-center text-[9px] font-semibold text-neutral-500">
                Opening selected anatomy…
              </div>
            )}
          </div>

          <SharedCorrelationPanel scenario={scenario} active={sharedViewId} onPick={applySharedView} />

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-brand">Step {stepIndex + 1} of {scenario.steps.length}</div>
                <div className="mt-0.5 text-base font-black">{step.label}</div>
              </div>
              <button
                type="button"
                onClick={() => onSorot?.([...step.sharedBodyKeywords, ...step.atRiskText])}
                className="rounded-full border border-brand/40 px-3 py-1.5 text-[9px] font-bold text-brand"
              >
                Highlight shared body ↗
              </button>
            </div>
            <p className="mt-2 text-[10.5px] font-semibold leading-relaxed text-neutral-300">{step.objective}</p>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">{step.anatomy}</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.04] p-2.5">
                <div className="text-[8.5px] font-black uppercase tracking-wide text-emerald-300">Exact source geometry</div>
                {targetMatches.length > 0 ? (
                  <div className="mt-1 text-[9.5px] leading-relaxed text-neutral-300">{targetMatches.join(' · ')}</div>
                ) : (
                  <div className="mt-1 text-[9.5px] leading-relaxed text-neutral-500">No separately verified mesh for this step in the selected atlas.</div>
                )}
              </div>
              <div className="rounded-lg border border-rose-300/15 bg-rose-300/[0.04] p-2.5">
                <div className="text-[8.5px] font-black uppercase tracking-wide text-rose-300">Adjacent / at-risk anatomy</div>
                <div className="mt-1 text-[9.5px] leading-relaxed text-neutral-300">{step.atRiskText.join(' · ') || 'No additional structure listed.'}</div>
              </div>
            </div>

            {missing.length > 0 && (
              <div className="mt-2 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-2.5 text-[9px] leading-relaxed text-amber-100/70">
                <b className="text-amber-300">Source gap:</b> {missing.join(' · ')} {missing.length === 1 ? 'is' : 'are'} not separately represented by a named mesh here. Panacea leaves the gap visible instead of drawing substitute anatomy.
              </div>
            )}

            {step.boundary && <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">Boundary: {step.boundary}</p>}
          </div>

          <ImagingPanel step={step} scenario={scenario} />

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => goStep(stepIndex - 1)} disabled={stepIndex === 0} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-neutral-300 disabled:opacity-30">← Previous</button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-brand transition-all" style={{ width: `${((stepIndex + 1) / scenario.steps.length) * 100}%` }} /></div>
            <button type="button" onClick={() => goStep(stepIndex + 1)} disabled={stepIndex === scenario.steps.length - 1} className="rounded-full border border-brand/40 px-3 py-1.5 text-[10px] font-bold text-brand disabled:opacity-30">Next →</button>
          </div>
        </main>

        <aside className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-500">Self-check</div>
            <p className="mt-1.5 text-[10.5px] font-semibold leading-relaxed text-neutral-200">{step.selfCheck.prompt}</p>
            <button type="button" onClick={() => setShowAnswer((value) => !value)} className="mt-2 rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-bold text-neutral-300">
              {showAnswer ? 'Hide answer' : 'Reveal answer'}
            </button>
            {showAnswer && <p className="mt-2 rounded-lg bg-white/[0.04] p-2.5 text-[9.5px] leading-relaxed text-neutral-300">{step.selfCheck.answer}</p>}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-500">Instrument families</div>
            <ul className="mt-1.5 space-y-1 text-[9.5px] leading-relaxed text-neutral-400">
              {scenario.instrumentFamilies.map((item) => <li key={item}>• {item}</li>)}
            </ul>
            <p className="mt-2 text-[8.5px] leading-relaxed text-neutral-600">Categories only — no device sizing, insertion depth, force or manufacturer-specific operating instructions are encoded.</p>
          </div>

          <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-300">Academic boundary</div>
            <p className="mt-1.5 text-[9.5px] leading-relaxed text-neutral-300">{scenario.geometryBoundary}</p>
            <p className="mt-2 text-[9.5px] leading-relaxed text-neutral-400">{scenario.evidenceBoundary}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-neutral-500">Sources</div>
            <ul className="mt-1.5 space-y-1 text-[8.5px] leading-relaxed text-neutral-500">
              {scenario.sources.map((source) => <li key={source}>• {source}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default SurgerySimulatorLab
