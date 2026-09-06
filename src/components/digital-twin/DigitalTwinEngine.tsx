import { lazy, Suspense, useMemo, useState } from 'react'
import {
  ANATOMY_LAYERS,
  Body3D,
  CT_WINDOWS,
  type AnatomyLayer,
  type MotionState,
  type RenderMode,
  type SlicePlane,
} from '../Body3D'
import {
  CONNECTORS,
  DEMO_FINDINGS,
  DISCOVERY_STEPS,
  FORMULAS,
  SCALE_PATH,
  TIMELINE,
  layerLabel,
  type KnowledgeLayer,
  type ScaleNode,
} from '../../lib/digitalTwin'

const LegacyBodyExplorer = lazy(() => import('../../pages/BodyExplorerLegacy').then((m) => ({ default: m.BodyExplorer })))

type MainTab = 'twin' | 'advanced'

type CardProps = {
  title: string
  children: React.ReactNode
  className?: string
}

function Panel({ title, children, className = '' }: CardProps) {
  return (
    <section className={`rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035] ${className}`}>
      <h2 className="text-sm font-black tracking-tight text-ink dark:text-white">{title}</h2>
      {children}
    </section>
  )
}

const LAYER_STYLES: Record<KnowledgeLayer, string> = {
  educational: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200',
  'patient-derived': 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
  'clinical-inference': 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
}

function LayerBadge({ layer }: { layer: KnowledgeLayer }) {
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${LAYER_STYLES[layer]}`}>{layerLabel(layer)}</span>
}

function MicroScene({ node }: { node: ScaleNode }) {
  const molecules = node.scale === 'molecule'
  const cell = node.scale === 'cell' || node.scale === 'organelle'
  return (
    <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-2xl bg-[#050b13] p-8 text-white">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.22) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      {molecules ? (
        <div className="relative z-10 w-full max-w-xl">
          <div className="mb-8 text-center">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Molecular pathway</div>
            <div className="mt-2 text-3xl font-black">EGFR → RAS → RAF → MEK → ERK</div>
            <p className="mt-2 text-xs leading-relaxed text-white/60">Interactive pathway scaffold. Patient variants, expression and drug evidence remain separate overlays with provenance.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['EGFR', 'RAS', 'RAF', 'MEK', 'ERK', 'Transcription'].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <div className="grid h-20 min-w-20 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 text-sm font-black shadow-[0_0_35px_rgba(52,211,153,.12)]">{item}</div>
                {index < 5 && <span className="text-xl text-emerald-300">→</span>}
              </div>
            ))}
          </div>
        </div>
      ) : cell ? (
        <div className="relative z-10 grid h-[390px] w-[390px] place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/5 shadow-[0_0_80px_rgba(34,211,238,.12)]">
          <div className="absolute inset-10 rounded-full border border-white/10" />
          <div className="grid h-44 w-44 place-items-center rounded-full border border-violet-300/30 bg-violet-300/10 text-center shadow-[0_0_55px_rgba(196,181,253,.12)]">
            <div><div className="text-lg font-black">Nucleus</div><div className="text-xs text-white/55">DNA · transcription</div></div>
          </div>
          {['Mitochondria', 'ER', 'Golgi', 'Membrane'].map((x, i) => (
            <span key={x} className="absolute rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold" style={{ transform: `rotate(${i * 90}deg) translateY(-150px) rotate(${-i * 90}deg)` }}>{x}</span>
          ))}
        </div>
      ) : (
        <div className="relative z-10 max-w-lg text-center">
          <div className="mx-auto grid h-64 w-64 place-items-center rounded-full border-[18px] border-rose-300/20 bg-rose-300/5 shadow-[inset_0_0_70px_rgba(251,113,133,.12)]">
            <div className="h-36 w-36 rounded-full border border-cyan-200/30 bg-cyan-200/10" />
          </div>
          <div className="mt-6 text-2xl font-black">Alveolar microenvironment</div>
          <p className="mt-2 text-sm leading-relaxed text-white/55">Educational tissue schematic. A DICOM WSI specimen or validated segmentation must replace this layer before calling it patient-derived.</p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white/60">Educational schematic · not patient microscopy</div>
    </div>
  )
}

function ProvenanceRail() {
  const items: Array<{ layer: KnowledgeLayer; title: string; detail: string }> = [
    { layer: 'educational', title: 'Educational visualization', detail: 'Reference anatomy, physiology, histology, pathways and formulas.' },
    { layer: 'patient-derived', title: 'Patient-derived findings', detail: 'Only measurements/annotations traceable to DICOM, WSI, labs, genomics or EMR.' },
    { layer: 'clinical-inference', title: 'Validated clinical inference', detail: 'Only versioned rules/models with required inputs, validation metadata and audit trail.' },
  ]
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.layer} className={`rounded-2xl border p-3 ${LAYER_STYLES[item.layer]}`}>
          <div className="flex items-center justify-between gap-2"><strong className="text-xs">{item.title}</strong><LayerBadge layer={item.layer} /></div>
          <p className="mt-2 text-[11px] leading-relaxed opacity-80">{item.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function DigitalTwinEngine() {
  const [mainTab, setMainTab] = useState<MainTab>('twin')
  const [activeNodeId, setActiveNodeId] = useState('human')
  const [demoCase, setDemoCase] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState('')
  const [renderMode, setRenderMode] = useState<RenderMode>('anatomy')
  const [slicePlane, setSlicePlane] = useState<SlicePlane>('none')
  const [slicePos, setSlicePos] = useState(0.5)
  const [timelineIndex, setTimelineIndex] = useState(0)
  const [unfold, setUnfold] = useState(0)
  const [dissect, setDissect] = useState(0)

  const activeNode = SCALE_PATH.find((node) => node.id === activeNodeId) ?? SCALE_PATH[0]
  const isMacro = activeNode.scale === 'whole-body' || activeNode.scale === 'system' || activeNode.scale === 'organ'
  const layers = useMemo(() => {
    const hints = activeNode.layerHints ?? ['skeletal', 'muscular', 'visceral']
    return new Set<AnatomyLayer['key']>(hints)
  }, [activeNode])
  const timeline = TIMELINE[timelineIndex]
  const motion: MotionState = {
    heartRate: timeline.heartRate,
    respRate: timeline.respRate,
    contractionRate: timeline.contractionRate,
    peristalsisRate: timeline.peristalsisRate,
  }

  if (mainTab === 'advanced') {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#071017]/95">
          <div><div className="text-sm font-black text-ink dark:text-white">Advanced Atlas</div><div className="text-[11px] text-neutral-500">Existing specialist, genomics, cell, molecular, surgical and physiology labs preserved intact.</div></div>
          <button onClick={() => setMainTab('twin')} className="rounded-full bg-brand px-4 py-2 text-xs font-black text-white">← Digital Twin</button>
        </div>
        <Suspense fallback={<div className="rounded-2xl border border-neutral-200 p-8 text-center text-sm text-neutral-500 dark:border-white/10">Loading advanced atlas…</div>}>
          <LegacyBodyExplorer />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-10">
      <header className="overflow-hidden rounded-3xl border border-emerald-300/20 bg-[#061019] p-5 text-white shadow-xl">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300">PanaceaMed · Interactive Human Digital Twin</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">One human, every biological scale.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">Navigate whole body → organ → tissue → cell → organelle → molecular pathway while keeping educational content, patient-derived observations and clinical inference structurally/auditably separable in the data model.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDemoCase((x) => !x)} className={`rounded-full border px-4 py-2 text-xs font-black ${demoCase ? 'border-amber-300 bg-amber-300 text-black' : 'border-white/15 bg-white/5 text-white'}`}>{demoCase ? 'Synthetic demo ON' : 'Load synthetic case'}</button>
            <button onClick={() => setMainTab('advanced')} className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-200">Open Advanced Atlas →</button>
          </div>
        </div>
        <div className="mt-5"><ProvenanceRail /></div>
      </header>

      <div className="grid gap-4 2xl:grid-cols-[250px_minmax(0,1fr)_360px]">
        <Panel title="Multi-scale atlas" className="2xl:sticky 2xl:top-4 2xl:self-start">
          <div className="mt-3 space-y-1.5">
            {SCALE_PATH.map((node, index) => {
              const active = node.id === activeNode.id
              return (
                <button key={node.id} onClick={() => setActiveNodeId(node.id)} className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-brand bg-brand/10' : 'border-transparent bg-neutral-50 hover:border-neutral-200 dark:bg-white/[0.035] dark:hover:border-white/10'}`}>
                  <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-200 text-[10px] font-black dark:bg-white/10">{index + 1}</span><span className="text-xs font-black text-ink dark:text-white">{node.label}</span></div>
                  <div className="mt-1 pl-8 text-[10px] leading-relaxed text-neutral-500">{node.scale} · {node.subtitle}</div>
                </button>
              )
            })}
          </div>
          <div className="mt-4 rounded-xl border border-sky-300/30 bg-sky-50 p-3 text-[10px] leading-relaxed text-sky-900 dark:bg-sky-300/5 dark:text-sky-100">
            <strong>Current provenance:</strong> {activeNode.provenance.source}. {activeNode.provenance.note}
          </div>
        </Panel>

        <main className="min-w-0 space-y-4">
          <Panel title={`${activeNode.label} · ${activeNode.subtitle}`}>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(['anatomy', 'xray', 'ct', 'mriT1', 'mriT2'] as RenderMode[]).map((mode) => (
                <button key={mode} onClick={() => setRenderMode(mode)} disabled={!isMacro} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase ${renderMode === mode && isMacro ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-500 disabled:opacity-30 dark:border-white/10'}`}>{mode}</button>
              ))}
              <span className="ml-auto"><LayerBadge layer={activeNode.provenance.layer} /></span>
            </div>
            <div className="mt-3">
              {isMacro ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <Body3D
                    layers={layers}
                    highlighted={activeNode.highlights ?? []}
                    focusKeywords={activeNode.focusKeywords ?? null}
                    renderMode={renderMode}
                    ctWindow={CT_WINDOWS[0]}
                    slicePlane={slicePlane}
                    slicePos={slicePos}
                    motion={motion}
                    unfold={unfold}
                    dissect={dissect}
                    onPick={(_, label) => setSelectedStructure(label)}
                  />
                </div>
              ) : <MicroScene node={activeNode} />}
            </div>
            {isMacro && (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div>
                  <div className="mb-1 flex justify-between text-[10px] font-black uppercase text-neutral-500"><span>Explode / unfold</span><span>{unfold.toFixed(2)}</span></div>
                  <input className="w-full accent-emerald-500" type="range" min="0" max="1.3" step="0.05" value={unfold} onChange={(e) => setUnfold(Number(e.target.value))} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] font-black uppercase text-neutral-500"><span>Dissection depth</span><span>{dissect}/6</span></div>
                  <input className="w-full accent-emerald-500" type="range" min="0" max="6" step="1" value={dissect} onChange={(e) => setDissect(Number(e.target.value))} />
                </div>
              </div>
            )}
            {(renderMode === 'ct' || renderMode === 'mriT1' || renderMode === 'mriT2') && isMacro && (
              <div className="mt-3 grid gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5 md:grid-cols-[1fr_2fr]">
                <select value={slicePlane} onChange={(e) => setSlicePlane(e.target.value as SlicePlane)} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-black/20">
                  <option value="none">No slice</option><option value="axial">Axial</option><option value="coronal">Coronal</option><option value="sagittal">Sagittal</option>
                </select>
                <input type="range" min="0" max="1" step="0.01" value={slicePos} onChange={(e) => setSlicePos(Number(e.target.value))} className="accent-emerald-500" />
              </div>
            )}
            {selectedStructure && <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-300/5 dark:text-emerald-100"><strong>Selected structure:</strong> {selectedStructure}</div>}
          </Panel>

          <Panel title="4D physiology / time-motion">
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {TIMELINE.map((state, index) => (
                <button key={state.id} onClick={() => setTimelineIndex(index)} className={`rounded-xl border p-3 text-left ${index === timelineIndex ? 'border-brand bg-brand/10' : 'border-neutral-200 dark:border-white/10'}`}>
                  <div className="text-xs font-black text-ink dark:text-white">{state.label}</div>
                  <div className="mt-1 text-[10px] text-neutral-500">HR {state.heartRate} · RR {state.respRate}</div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">{timeline.note} Motion values animate the reference mesh; they are not a prediction of an individual patient's physiology.</p>
          </Panel>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Radiology → lesion → pathology bridge">
              <div className="mt-3 space-y-2 text-xs">
                {['DICOM series', 'Segmentation / ROI', 'Measurement', 'Anatomical structure', 'Pathology specimen', 'Molecular profile'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neutral-100 text-[10px] font-black dark:bg-white/10">{i + 1}</span><span className="font-bold text-ink dark:text-white">{step}</span>{i < 5 && <span className="ml-auto text-neutral-300">→</span>}</div>
                ))}
              </div>
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-900 dark:bg-amber-300/5 dark:text-amber-100">A radiology rendering must never manufacture histology. The bridge only becomes patient-derived when both sides carry source IDs and provenance.</p>
            </Panel>
            <Panel title="Pathophysiology graph">
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-black">
                {['Etiology', 'Molecular change', 'Cell phenotype', 'Tissue injury', 'Organ dysfunction', 'Symptoms / signs'].map((x, i) => <span key={x} className="contents"><span className="rounded-full border border-neutral-200 px-3 py-2 dark:border-white/10">{x}</span>{i < 5 && <span className="text-brand">→</span>}</span>)}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">Every edge is designed to carry evidence, source version, directionality and uncertainty rather than being a free-text AI assertion.</p>
            </Panel>
          </div>

          <Panel title="Drug discovery / therapeutic target pipeline">
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {DISCOVERY_STEPS.map((step, i) => (
                <div key={step} className="flex shrink-0 items-center gap-2"><div className="w-36 rounded-xl border border-neutral-200 p-3 text-[10px] font-black text-ink dark:border-white/10 dark:text-white"><span className="mr-1 text-brand">{i + 1}.</span>{step}</div>{i < DISCOVERY_STEPS.length - 1 && <span className="text-brand">→</span>}</div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">This is an evidence-workflow scaffold, not an autonomous drug-design claim. Candidate generation must remain downstream of experimental validation, toxicology and regulated clinical development.</p>
          </Panel>
        </main>

        <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
          <Panel title="Clinical intelligence">
            {!demoCase ? (
              <div className="mt-3 rounded-xl border border-dashed border-neutral-300 p-5 text-center dark:border-white/15">
                <div className="text-xs font-black text-ink dark:text-white">No patient data connected</div>
                <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Load the synthetic case to test provenance. Real patient findings must enter through typed DICOM/FHIR/WSI/genomics adapters.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {DEMO_FINDINGS.map((finding) => (
                  <div key={finding.id} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[11px] text-ink dark:text-white">{finding.title}</strong><LayerBadge layer={finding.layer} /></div>
                    <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{finding.detail}</p>
                    <div className="mt-2 font-mono text-[9px] text-neutral-400">source: {finding.source}{finding.sourceId ? ` · ${finding.sourceId}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-50 p-3 text-[10px] leading-relaxed text-emerald-900 dark:bg-emerald-300/5 dark:text-emerald-100"><strong>Inference lock:</strong> no production diagnosis/treatment inference is emitted unless a validated, versioned rule/model declares its required inputs and audit metadata.</div>
          </Panel>

          <Panel title="Biomedical data fabric">
            <div className="mt-3 max-h-[430px] space-y-2 overflow-auto pr-1">
              {CONNECTORS.map((connector) => (
                <div key={connector.name} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.035]">
                  <div className="flex items-start justify-between gap-2"><strong className="text-[11px] text-ink dark:text-white">{connector.name}</strong><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${connector.state === 'local' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-200' : connector.state === 'adapter-ready' ? 'bg-sky-100 text-sky-800 dark:bg-sky-300/10 dark:text-sky-200' : 'bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{connector.state}</span></div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">{connector.domain} · {connector.standard}</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{connector.purpose}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Core quantitative models">
            <div className="mt-3 space-y-2">
              {FORMULAS.map((f) => (
                <div key={f.name} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.035]">
                  <div className="text-[10px] font-black text-ink dark:text-white">{f.name}</div>
                  <div className="mt-1 font-mono text-xs font-black text-brand">{f.formula}</div>
                  <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{f.meaning}</p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>

      <footer className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-[10px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/[0.025]">
        <strong className="text-ink dark:text-white">Safety boundary:</strong> the digital twin is an educational/research interface until patient-source adapters, clinical validation, versioned rule packs, model cards, calibration monitoring and regulatory controls are connected. Visual similarity is never treated as diagnosis.
      </footer>
    </div>
  )
}
