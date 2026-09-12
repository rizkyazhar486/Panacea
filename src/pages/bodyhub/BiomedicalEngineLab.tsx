import { useMemo, useState } from 'react'
import {
  BIOMEDICAL_DATA_CONTRACTS,
  BIOMEDICAL_TRACKS,
  VALIDATION_GATES,
  type BiomedicalDomain,
} from '../../lib/biomedicalEngineBlueprint'
import {
  n50,
  phredErrorProbability,
  variantAlleleFraction,
} from '../../lib/biomedicalEvidence'
import {
  ANATOMY_LAYERS,
  Body3D,
  CT_WINDOWS,
  MOTION_OFF,
  type AnatomyLayer,
  type RenderMode,
  type SlicePlane,
} from '../../components/Body3D'

type View = 'engine' | 'imaging' | 'data' | 'evidence' | 'validation'

const VIEWS: Array<{ key: View; label: string }> = [
  { key: 'engine', label: 'Engine map' },
  { key: 'imaging', label: 'Imaging 3D' },
  { key: 'data', label: 'Data contracts' },
  { key: 'evidence', label: 'Evidence lab' },
  { key: 'validation', label: 'Validation gates' },
]

const DOMAIN_ICON: Record<BiomedicalDomain, string> = {
  genomics: 'DNA',
  'hematology-oncology': 'HEME',
  'single-cell-multiomics': 'CELL',
  'radiology-3d': '3D',
  'neuro-pathway-bioelectric': 'NEURO',
  'longevity-wellness': 'LONG',
  'translational-rnd': 'R&D',
}

const EXAM_LIBRARY = [
  {
    id: 'empty-can',
    label: 'Empty can test',
    target: 'Supraspinatus',
    highlights: ['Supraspinatus muscle.l', 'Supraspinatus muscle.r'],
    action: 'Elevate the arm in the scapular plane, then apply resisted downward force.',
    boundary: 'Educational manoeuvre orientation only. Pain or weakness does not establish a tear by itself.',
  },
  {
    id: 'external-rotation',
    label: 'Resisted external rotation',
    target: 'Infraspinatus + teres minor',
    highlights: ['Infraspinatus muscle.l', 'Infraspinatus muscle.r', 'Teres minor muscle.l', 'Teres minor muscle.r'],
    action: 'Keep the elbow close to the side and resist external rotation of the humerus.',
    boundary: 'Use as an anatomy-and-force-direction teaching view, not a diagnosis engine.',
  },
  {
    id: 'hawkins',
    label: 'Hawkins–Kennedy',
    target: 'Subacromial / rotator-cuff context',
    highlights: ['Supraspinatus muscle.l', 'Supraspinatus muscle.r'],
    action: 'Flex the shoulder and elbow, then internally rotate while observing the subacromial relationship.',
    boundary: 'The atlas shows reference geometry only; it cannot infer impingement in a patient.',
  },
  {
    id: 'neer',
    label: 'Neer manoeuvre',
    target: 'Supraspinatus / subacromial context',
    highlights: ['Supraspinatus muscle.l', 'Supraspinatus muscle.r'],
    action: 'Elevate the arm while limiting scapular substitution to study the changing shoulder relationship.',
    boundary: 'Educational manoeuvre sequence only. Patient-specific range, pain and pathology are not inferred.',
  },
] as const

const IMAGING_PRESETS: Array<{ label: string; layers: AnatomyLayer['key'][]; mode: RenderMode; window: string }> = [
  { label: 'Soft tissue', layers: ['surface', 'muscular', 'visceral', 'cardiovascular'], mode: 'ct', window: 'soft' },
  { label: 'Bone', layers: ['skeletal'], mode: 'ct', window: 'bone' },
  { label: 'Vessels', layers: ['cardiovascular'], mode: 'anatomy', window: 'soft' },
  { label: 'Muscle', layers: ['muscular', 'skeletal'], mode: 'anatomy', window: 'soft' },
  { label: 'X-ray projection', layers: ['skeletal', 'muscular', 'visceral'], mode: 'xray', window: 'bone' },
]

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-300">{children}</span>
}

export function BiomedicalEngineLab() {
  const [view, setView] = useState<View>('engine')
  const [selected, setSelected] = useState<BiomedicalDomain>('genomics')
  const [qScore, setQScore] = useState(20)
  const [referenceReads, setReferenceReads] = useState(70)
  const [alternateReads, setAlternateReads] = useState(30)
  const [readLengths, setReadLengths] = useState('1200, 850, 2100, 500, 1800, 3200')

  const [imagingLayers, setImagingLayers] = useState<Set<AnatomyLayer['key']>>(new Set(['skeletal', 'muscular']))
  const [renderMode, setRenderMode] = useState<RenderMode>('anatomy')
  const [ctWindowKey, setCtWindowKey] = useState('soft')
  const [slicePlane, setSlicePlane] = useState<SlicePlane>('none')
  const [slicePos, setSlicePos] = useState(0)
  const [unfold, setUnfold] = useState(0)
  const [dissect, setDissect] = useState(0)
  const [selectedExam, setSelectedExam] = useState(EXAM_LIBRARY[0])
  const [pickedStructure, setPickedStructure] = useState('')

  const track = BIOMEDICAL_TRACKS.find((item) => item.id === selected) ?? BIOMEDICAL_TRACKS[0]
  const evidence = useMemo(() => {
    const lengths = readLengths.split(',').map((item) => Number(item.trim())).filter(Number.isFinite)
    return {
      error: phredErrorProbability(qScore),
      vaf: variantAlleleFraction(referenceReads, alternateReads),
      n50: n50(lengths),
    }
  }, [qScore, referenceReads, alternateReads, readLengths])

  function applyImagingPreset(preset: (typeof IMAGING_PRESETS)[number]) {
    setImagingLayers(new Set(preset.layers))
    setRenderMode(preset.mode)
    setCtWindowKey(preset.window)
    setSlicePlane('none')
    setDissect(0)
    setUnfold(0)
  }

  function toggleImagingLayer(key: AnatomyLayer['key']) {
    setImagingLayers((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-brand/[0.04] p-4 dark:border-white/10 dark:from-white/[0.04] dark:to-brand/[0.04]">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Panacea Biomedical Technology Engine</div>
        <h2 className="mt-1 text-lg font-black text-ink dark:text-white">From measured data → evidence → 3D mechanism → reviewed decision support</h2>
        <p className="mt-1 max-w-4xl text-[11px] leading-relaxed text-neutral-500">
          A production scaffold for genomic sequencing, precision hematology/oncology, single-cell multi-omics, radiology-to-3D, neuro/pathway/bioelectric visualization and longitudinal health. It organizes evidence and simulations; it does not autonomously manufacture therapies or promote research output into a clinical fact.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 sm:grid-cols-5 dark:bg-white/5">
        {VIEWS.map((item) => (
          <button key={item.key} type="button" aria-pressed={view === item.key} onClick={() => setView(item.key)} className={`rounded-lg px-2 py-2 text-[10px] font-bold transition ${view === item.key ? 'bg-white text-ink shadow-sm dark:bg-white/10 dark:text-white' : 'text-neutral-500'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {view === 'engine' && (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {BIOMEDICAL_TRACKS.map((item) => (
              <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={`rounded-2xl border p-3 text-left transition ${selected === item.id ? 'border-brand bg-brand/[0.05]' : 'border-neutral-200 dark:border-white/10'}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black tracking-[0.12em] text-brand">{DOMAIN_ICON[item.id]}</span><Pill>{item.evidenceLevel}</Pill></div>
                <div className="mt-1 text-sm font-black text-ink dark:text-white">{item.label}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{item.mission}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-[10px] font-bold uppercase tracking-wide text-brand">Selected pipeline</div><div className="text-base font-black text-ink dark:text-white">{track.label}</div></div><Pill>{track.evidenceLevel}</Pill></div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Inputs</div><div className="mt-1 flex flex-wrap gap-1">{track.inputs.map((x) => <Pill key={x}>{x}</Pill>)}</div></div>
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Outputs</div><div className="mt-1 flex flex-wrap gap-1">{track.outputs.map((x) => <Pill key={x}>{x}</Pill>)}</div></div>
              <div><div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">3D / visual layers</div><div className="mt-1 flex flex-wrap gap-1">{track.visualLayers.map((x) => <Pill key={x}>{x}</Pill>)}</div></div>
            </div>
            <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{track.clinicalBoundary}</div>
          </div>

          <div className="grid gap-2 md:grid-cols-5">
            {['Measured data', 'QC + provenance', 'Evidence graph', '3D mechanism', 'Human-reviewed output'].map((item, index) => (
              <div key={item} className="relative rounded-xl border border-neutral-200 p-3 text-center dark:border-white/10">
                <div className="text-[9px] font-black text-brand">0{index + 1}</div><div className="mt-1 text-[11px] font-bold text-ink dark:text-white">{item}</div>{index < 4 && <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-neutral-300 md:block">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'imaging' && (
        <div className="space-y-3" data-biomedical-imaging-lab="v1">
          <div className="rounded-2xl border border-cyan-400/20 bg-[#071014] p-3 text-white sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Imaging reconstruction & exam atlas</div>
                <h3 className="mt-1 text-base font-black">3D anatomy + cross-section + focused examination</h3>
                <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-slate-400">Inspired by clinical 3D reconstruction workstations: isolate a source-backed structure, change tissue layers, inspect CT-style windows, create a section plane, and correlate a physical-exam manoeuvre with the anatomy it stresses.</p>
              </div>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black text-amber-200">REFERENCE ATLAS · NOT PATIENT DICOM</span>
            </div>

            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {IMAGING_PRESETS.map((preset) => (
                <button key={preset.label} type="button" onClick={() => applyImagingPreset(preset)} className="min-h-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[10px] font-bold text-slate-200 hover:border-cyan-300/40">
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[190px_minmax(0,1fr)_260px]">
              <aside className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">Exam library · shoulder</div>
                <div className="mt-2 space-y-1.5">
                  {EXAM_LIBRARY.map((exam) => (
                    <button key={exam.id} type="button" aria-pressed={selectedExam.id === exam.id} onClick={() => setSelectedExam(exam)} className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${selectedExam.id === exam.id ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/5 bg-white/[0.025]'}`}>
                      <div className="text-[10px] font-bold text-white">{exam.label}</div>
                      <div className="mt-0.5 text-[8.5px] text-slate-500">{exam.target}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 border-t border-white/10 pt-2.5">
                  <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">Atlas layers</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ANATOMY_LAYERS.map((layer) => (
                      <button key={layer.key} type="button" aria-pressed={imagingLayers.has(layer.key)} onClick={() => toggleImagingLayer(layer.key)} className={`rounded-full border px-2 py-1 text-[9px] font-bold ${imagingLayers.has(layer.key) ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-500'}`}>
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#05080a]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                  <div><div className="text-[9px] font-black uppercase tracking-wide text-cyan-300">3D reference reconstruction</div><div className="text-[9px] text-slate-500">drag to rotate · scroll/pinch to zoom</div></div>
                  <div className="flex gap-1">
                    {(['anatomy', 'xray', 'ct', 'mriT1', 'mriT2'] as RenderMode[]).map((mode) => (
                      <button key={mode} type="button" aria-pressed={renderMode === mode} onClick={() => setRenderMode(mode)} className={`rounded-md px-2 py-1 text-[8.5px] font-bold uppercase ${renderMode === mode ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-400'}`}>{mode}</button>
                    ))}
                  </div>
                </div>
                <div className="min-h-[360px] sm:min-h-[440px]">
                  <Body3D
                    layers={imagingLayers}
                    highlighted={[...selectedExam.highlights]}
                    focusKeywords={null}
                    renderMode={renderMode}
                    ctWindow={CT_WINDOWS.find((window) => window.key === ctWindowKey) ?? CT_WINDOWS[0]}
                    slicePlane={slicePlane}
                    slicePos={slicePos}
                    motion={MOTION_OFF}
                    unfold={unfold}
                    dissect={dissect}
                    onPick={(_rawName, label) => setPickedStructure(label)}
                  />
                </div>
                <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-3">
                  <label className="text-[9px] font-bold text-slate-400">Section position · {Math.round(slicePos * 100)}%<input type="range" min={-1} max={1} step={0.01} value={slicePos} onChange={(event) => setSlicePos(Number(event.target.value))} className="mt-1 w-full accent-cyan-300" /></label>
                  <label className="text-[9px] font-bold text-slate-400">Layer separation · {Math.round((unfold / 0.35) * 100)}%<input type="range" min={0} max={0.35} step={0.005} value={unfold} onChange={(event) => setUnfold(Number(event.target.value))} className="mt-1 w-full accent-cyan-300" /></label>
                  <label className="text-[9px] font-bold text-slate-400">Dissection depth · {Math.round(dissect)}<input type="range" min={0} max={6} step={1} value={dissect} onChange={(event) => setDissect(Number(event.target.value))} className="mt-1 w-full accent-cyan-300" /></label>
                </div>
              </div>

              <aside className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">Structures in focus</div>
                <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-2.5">
                  <div className="text-xs font-black text-emerald-200">{selectedExam.target}</div>
                  <div className="mt-1 text-[9px] leading-relaxed text-slate-400">{selectedExam.action}</div>
                </div>

                <div className="mt-3 text-[9px] font-black uppercase tracking-wide text-slate-500">Cross-section plane</div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(['none', 'axial', 'coronal', 'sagittal'] as SlicePlane[]).map((plane) => (
                    <button key={plane} type="button" aria-pressed={slicePlane === plane} onClick={() => setSlicePlane(plane)} className={`rounded-lg border px-2 py-2 text-[9px] font-bold capitalize ${slicePlane === plane ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-500'}`}>{plane === 'none' ? '3D whole' : plane}</button>
                  ))}
                </div>

                {renderMode === 'ct' && (
                  <div className="mt-3">
                    <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">CT window</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CT_WINDOWS.map((window) => (
                        <button key={window.key} type="button" aria-pressed={ctWindowKey === window.key} onClick={() => setCtWindowKey(window.key)} className={`rounded-full border px-2 py-1 text-[9px] font-bold ${ctWindowKey === window.key ? 'border-cyan-300/50 text-cyan-100' : 'border-white/10 text-slate-500'}`}>{window.label}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 rounded-lg border border-white/10 p-2.5 text-[9px] leading-relaxed text-slate-400">
                  <span className="font-black text-white">Picked:</span> {pickedStructure || 'tap a source-backed structure'}
                </div>
                <p className="mt-3 text-[9px] leading-relaxed text-amber-200/80">{selectedExam.boundary}</p>
              </aside>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] font-black text-cyan-300">AVAILABLE NOW</div><p className="mt-1 text-[9px] leading-relaxed text-slate-400">Source-backed GLB anatomy, structure picking, layer isolation, CT/X-ray/MRI-style educational rendering, clipping sections, dissection depth and exam-target highlighting.</p></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] font-black text-amber-300">BLOCKED UNTIL REAL DATA</div><p className="mt-1 text-[9px] leading-relaxed text-slate-400">Patient DICOM/NIfTI volume ingestion, HU-threshold segmentation, region growing, STL export, MPR/DRR from real voxels and patient-specific measurements require validated imaging input and provenance.</p></div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-[9px] font-black text-emerald-300">SAFETY BOUNDARY</div><p className="mt-1 text-[9px] leading-relaxed text-slate-400">This surface is for education/research. It does not diagnose a tear, generate operative navigation, infer pathology or claim that reference anatomy is a patient's anatomy.</p></div>
            </div>
          </div>
        </div>
      )}

      {view === 'data' && (
        <div className="space-y-2">
          {BIOMEDICAL_DATA_CONTRACTS.map((item) => (
            <div key={item.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-black text-ink dark:text-white">{item.label}</div><Pill>{item.status}</Pill></div>
              <div className="mt-1 flex flex-wrap gap-1">{item.formats.map((format) => <Pill key={format}>{format}</Pill>)}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{item.purpose}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">Provenance rule: {item.provenance}</p>
            </div>
          ))}
        </div>
      )}

      {view === 'evidence' && (
        <div className="space-y-4">
          <p className="text-[11px] leading-relaxed text-neutral-500">Small transparent calculations for sequencing and evidence QA. These are mathematical utilities, not a disease classifier.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="rounded-xl border border-neutral-200 p-3 text-xs font-bold text-ink dark:border-white/10 dark:text-white">Phred Q: {qScore}<input className="mt-2 w-full accent-brand" type="range" min="0" max="50" step="1" value={qScore} onChange={(e) => setQScore(Number(e.target.value))} /><span className="mt-2 block text-[10px] font-normal text-neutral-500">p(error) = 10<sup>−Q/10</sup> = {evidence.error.toExponential(2)}</span></label>
            <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-xs font-bold text-ink dark:text-white">Variant allele fraction</div><div className="mt-2 grid grid-cols-2 gap-2"><input type="number" min="0" value={referenceReads} onChange={(e) => setReferenceReads(Number(e.target.value))} className="rounded-lg border border-neutral-200 bg-transparent p-2 text-xs dark:border-white/10" aria-label="Reference reads"/><input type="number" min="0" value={alternateReads} onChange={(e) => setAlternateReads(Number(e.target.value))} className="rounded-lg border border-neutral-200 bg-transparent p-2 text-xs dark:border-white/10" aria-label="Alternate reads"/></div><div className="mt-2 text-[10px] text-neutral-500">VAF = alt/(ref+alt) = {(evidence.vaf * 100).toFixed(1)}%</div></div>
            <label className="rounded-xl border border-neutral-200 p-3 text-xs font-bold text-ink dark:border-white/10 dark:text-white">Read lengths<input value={readLengths} onChange={(e) => setReadLengths(e.target.value)} className="mt-2 w-full rounded-lg border border-neutral-200 bg-transparent p-2 font-mono text-[10px] font-normal dark:border-white/10"/><span className="mt-2 block text-[10px] font-normal text-neutral-500">N50 = {evidence.n50.toLocaleString()} bp</span></label>
          </div>
          <div className="rounded-2xl bg-neutral-950 p-4 font-mono text-[11px] leading-relaxed text-neutral-100"><div className="text-brand">Transparent formulas</div><div className="mt-2">p(error) = 10^(−Q/10)</div><div>VAF = n_alt / (n_ref + n_alt)</div><div>N50 = length L where ≥50% of total sequence length lies in reads/contigs of length ≥ L</div><div>posterior odds = prior odds × ∏ LRᵢ (only when validated likelihood ratios exist)</div></div>
        </div>
      )}

      {view === 'validation' && (
        <div className="space-y-2">
          {VALIDATION_GATES.map((gate) => (
            <div key={gate.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-black text-ink dark:text-white">{gate.label}</div>{gate.blocksAutonomy && <Pill>blocks autonomous promotion</Pill>}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{gate.requirement}</p>
              <div className="mt-2 flex flex-wrap gap-1">{gate.appliesTo.map((domain) => <Pill key={domain}>{domain}</Pill>)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-neutral-100 pt-3 text-[10px] leading-relaxed text-neutral-400 dark:border-white/5">
        Architecture rule: raw measurements, algorithmic outputs, published evidence, educational simulation and clinician-validated conclusions must remain separate data classes with visible provenance. The future engine may become more capable; it must not become less auditable.
      </div>
    </div>
  )
}

export default BiomedicalEngineLab