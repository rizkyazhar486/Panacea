import { useMemo, useState } from 'react'
import { Body3D, CT_WINDOWS, type AnatomyLayer, type MotionState } from '../Body3D'
import {
  AGING_HALLMARKS,
  DISCOVERY_EVIDENCE_SOURCES,
  FOUR_D_PHASES,
  ORGAN_AGING_PROFILES,
  REGENERATION_FORMULAS,
  REGENERATION_HYPOTHESES,
  hypothesisFitScore,
} from '../../lib/regenerationResearch'

function pct(x: number) {
  return `${Math.round(x * 100)}%`
}

function Meter({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const display = Math.max(0, Math.min(1, value))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-neutral-500">
        <span>{label}</span><span>{pct(display)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${inverse ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: pct(display) }}
        />
      </div>
    </div>
  )
}

function EvidenceBadge({ value }: { value: string }) {
  const styles = value === 'clinical-research'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200'
    : value === 'preclinical'
      ? 'border-violet-300 bg-violet-50 text-violet-800 dark:bg-violet-400/10 dark:text-violet-200'
      : 'border-neutral-300 bg-neutral-50 text-neutral-700 dark:bg-white/5 dark:text-neutral-300'
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${styles}`}>{value.replace('-', ' ')}</span>
}

function Mechanism4D({
  hallmark,
  hypothesis,
  phaseIndex,
}: {
  hallmark: (typeof AGING_HALLMARKS)[number]
  hypothesis: (typeof REGENERATION_HYPOTHESES)[number]
  phaseIndex: number
}) {
  const phase = FOUR_D_PHASES[phaseIndex]
  const stress = phase.cellularStress
  const recovery = phase.functionIndex
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050b13] p-4 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">4D cellular / DNA mechanism view</div>
          <h3 className="mt-1 text-base font-black">{hallmark.label} → {hypothesis.label}</h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/55">Time dimension = research state transition. The animation is a mechanism map, not a claim that a patient cell has been rejuvenated.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black text-white/70">{phase.label}</div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
        {[
          { title: 'DNA / epigenome', detail: hallmark.pathways[0] ?? 'genome state', intensity: stress },
          { title: 'Organelle state', detail: hallmark.id.includes('mitochond') ? 'mitochondrial quality' : 'proteostasis / signaling', intensity: stress * 0.9 },
          { title: 'Cell phenotype', detail: phase.id === 'aging' ? 'stress / senescence-prone state' : 'resilience hypothesis', intensity: phase.id === 'recovery' ? 1 - recovery : stress },
          { title: 'Tissue function', detail: phase.id === 'recovery' ? 'partial functional restoration hypothesis' : 'system-level consequence', intensity: 1 - recovery },
        ].map((item, index) => (
          <div key={item.title} className="contents">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-black">{index + 1}</div>
                <div>
                  <div className="text-xs font-black">{item.title}</div>
                  <div className="text-[10px] text-white/45">{item.detail}</div>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-500" style={{ width: `${Math.round(Math.max(0.08, Math.min(1, item.intensity)) * 100)}%` }} />
              </div>
            </div>
            {index < 3 && <div className="hidden text-xl text-cyan-300 lg:block">→</div>}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-violet-300/15 bg-violet-300/[0.06] p-3">
        <div className="text-[10px] font-black uppercase tracking-wide text-violet-200">Research perturbation path</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {hypothesis.mechanismSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold text-white/75">{step}</span>
              {index < hypothesis.mechanismSteps.length - 1 && <span className="text-violet-300">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RegenerationResearchSandbox() {
  const [organId, setOrganId] = useState('brain')
  const [hallmarkId, setHallmarkId] = useState('mitochondrial-dysfunction')
  const [hypothesisId, setHypothesisId] = useState('mitochondrial-quality')
  const [phaseIndex, setPhaseIndex] = useState(1)
  const [selectedStructure, setSelectedStructure] = useState('')

  const organ = ORGAN_AGING_PROFILES.find((x) => x.id === organId) ?? ORGAN_AGING_PROFILES[0]
  const relevantHallmarks = AGING_HALLMARKS.filter((x) => organ.hallmarkIds.includes(x.id))
  const hallmark = relevantHallmarks.find((x) => x.id === hallmarkId) ?? relevantHallmarks[0]
  const compatibleHypotheses = REGENERATION_HYPOTHESES.filter((x) => x.compatibleOrgans.includes(organ.id))
  const hypothesis = compatibleHypotheses.find((x) => x.id === hypothesisId) ?? compatibleHypotheses[0]
  const phase = FOUR_D_PHASES[phaseIndex]

  const layers = useMemo(() => new Set<AnatomyLayer['key']>(organ.layerHints), [organ])
  const ranked = useMemo(
    () => compatibleHypotheses
      .map((item) => ({ item, score: hypothesisFitScore(item, organ.id, hallmark.id) }))
      .sort((a, b) => b.score - a.score),
    [compatibleHypotheses, organ.id, hallmark.id],
  )

  const motion: MotionState = {
    heartRate: phase.heartRate,
    respRate: phase.respRate,
    contractionRate: organ.id === 'muscle' && phase.id !== 'aging' ? 12 : 0,
    peristalsisRate: 5,
  }

  return (
    <div className="space-y-4 pb-12">
      <header className="overflow-hidden rounded-3xl border border-violet-300/20 bg-[#071019] p-5 text-white shadow-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-300">PanaceaMed · Regeneration & Aging Research Sandbox</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">Model biological aging across organs, cells and DNA—without pretending a universal reset already exists.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">Explore organ-specific aging mechanisms, sequencing-derived evidence, cellular states, target hypotheses and known compound evidence. The sandbox visualizes what would need to change for recovery and how those changes propagate in 4D from molecular → cellular → tissue → organ scales.</p>
          </div>
          <div className="max-w-md rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-100">
            <strong>Research-only safety boundary.</strong> No DNA-editing sequence design, vector recipe, dosing protocol, de novo synthesis route or human-use “reset” protocol is generated here.
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-ink dark:text-white">4D research timeline</h2>
            <p className="mt-1 text-[11px] text-neutral-500">Move through a schematic biological state transition. Values are normalized educational states, not patient measurements.</p>
          </div>
          <div className="text-xs font-black text-brand">{phaseIndex + 1}/{FOUR_D_PHASES.length} · {phase.label}</div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {FOUR_D_PHASES.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setPhaseIndex(index)}
              className={`rounded-xl border p-3 text-left transition ${index === phaseIndex ? 'border-brand bg-brand/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.025]'}`}
            >
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">t{index}</div>
              <div className="mt-1 text-xs font-black text-ink dark:text-white">{item.label}</div>
              <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{item.note}</div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <h2 className="text-sm font-black text-ink dark:text-white">Organ / tissue system</h2>
            <div className="mt-3 space-y-1.5">
              {ORGAN_AGING_PROFILES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setOrganId(item.id)
                    setHallmarkId(item.hallmarkIds[0])
                    const next = REGENERATION_HYPOTHESES.find((h) => h.compatibleOrgans.includes(item.id))
                    if (next) setHypothesisId(next.id)
                  }}
                  className={`w-full rounded-xl border p-3 text-left ${item.id === organ.id ? 'border-brand bg-brand/10' : 'border-transparent bg-neutral-50 dark:bg-white/[0.025]'}`}
                >
                  <div className="text-xs font-black text-ink dark:text-white">{item.label}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{item.subtitle}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <h2 className="text-sm font-black text-ink dark:text-white">Relevant aging hallmarks</h2>
            <div className="mt-3 space-y-1.5">
              {relevantHallmarks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setHallmarkId(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-[11px] font-bold ${item.id === hallmark.id ? 'border-violet-400 bg-violet-50 text-violet-900 dark:bg-violet-400/10 dark:text-violet-100' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">4D organ visualization</div>
                <h2 className="mt-1 text-lg font-black text-ink dark:text-white">{organ.label}</h2>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500">{organ.note}</p>
              </div>
              <div className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-[10px] font-black uppercase text-sky-800 dark:bg-sky-400/10 dark:text-sky-200">Educational 3D atlas</div>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <Body3D
                layers={layers}
                highlighted={[]}
                focusKeywords={organ.focusKeywords}
                renderMode="anatomy"
                ctWindow={CT_WINDOWS[0]}
                slicePlane="none"
                slicePos={0.5}
                motion={motion}
                unfold={0}
                dissect={organ.id === 'brain' || organ.id === 'eye' ? 2 : 1}
                onPick={(_, label) => setSelectedStructure(label)}
              />
            </div>
            {selectedStructure && <div className="mt-2 text-[10px] font-bold text-neutral-500">Selected atlas structure: {selectedStructure}</div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Meter label="Hallmark burden" value={phase.hallmarkBurden} />
              <Meter label="Cellular stress" value={phase.cellularStress} />
              <Meter label="Function index" value={phase.functionIndex} inverse />
            </div>
          </section>

          <Mechanism4D hallmark={hallmark} hypothesis={hypothesis} phaseIndex={phaseIndex} />

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <h2 className="text-sm font-black text-ink dark:text-white">What the tool would bind to real data</h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.03]">
                <div className="text-[10px] font-black uppercase text-neutral-500">DNA / omics</div>
                <div className="mt-2 text-xs font-black text-ink dark:text-white">Sequence → normalized variant → pathway</div>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">VCF/ClinVar/Ensembl identifiers, expression or epigenetic measurements can become provenance-backed overlays. The sandbox does not invent a patient mutation.</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.03]">
                <div className="text-[10px] font-black uppercase text-neutral-500">Cell / tissue</div>
                <div className="mt-2 text-xs font-black text-ink dark:text-white">Single-cell / histology → state map</div>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">Cell-type distributions, pathway activity, microscopy or WSI regions can replace the educational schematic when source IDs and measurement provenance exist.</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.03]">
                <div className="text-[10px] font-black uppercase text-neutral-500">Organ function</div>
                <div className="mt-2 text-xs font-black text-ink dark:text-white">Imaging / physiology → functional state</div>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">DICOM, physiology, laboratory and FHIR observations can be linked to the same organ graph without turning a simulation into a clinical finding.</p>
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <h2 className="text-sm font-black text-ink dark:text-white">Research intervention hypothesis</h2>
            <select
              className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink dark:border-white/10 dark:bg-[#0b141d] dark:text-white"
              value={hypothesis.id}
              onChange={(e) => setHypothesisId(e.target.value)}
            >
              {compatibleHypotheses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <div className="mt-3 flex items-center justify-between gap-2">
              <EvidenceBadge value={hypothesis.evidence} />
              <span className="text-xl font-black text-brand">{hypothesisFitScore(hypothesis, organ.id, hallmark.id)}/100</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{hypothesis.mechanism}</p>
            <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-900 dark:bg-amber-400/10 dark:text-amber-100"><strong>Safety gate:</strong> {hypothesis.safetyGate}</div>
            <div className="mt-3">
              <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Target systems</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {hypothesis.targetSystems.map((x) => <span key={x} className="rounded-full border border-neutral-200 px-2 py-1 text-[10px] font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300">{x}</span>)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-ink dark:text-white">Target / compound discovery queue</h2>
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">evidence first</span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Ranks biological hypotheses and searches known target/compound evidence. It can flag underexplored combinations for scientists; it does not output synthesis instructions or an unvalidated drug.</p>
            <div className="mt-3 space-y-2">
              {ranked.slice(0, 4).map(({ item, score }, index) => (
                <button key={item.id} onClick={() => setHypothesisId(item.id)} className="w-full rounded-xl border border-neutral-200 p-3 text-left dark:border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-neutral-400">#{index + 1}</span>
                    <span className="text-xs font-black text-brand">{score}</span>
                  </div>
                  <div className="mt-1 text-xs font-black text-ink dark:text-white">{item.label}</div>
                  <div className="mt-1 text-[10px] text-neutral-500">{item.evidence.replace('-', ' ')}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.03]">
              <div className="text-[10px] font-black uppercase text-neutral-500">Chemical / particle boundary</div>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">Known compounds, biologics and delivery-platform categories may be compared by published evidence. De novo molecular structure generation, synthesis routes, payload recipes and experimental dosing are intentionally outside this module.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <h2 className="text-sm font-black text-ink dark:text-white">Evidence adapters</h2>
            <div className="mt-3 space-y-2">
              {DISCOVERY_EVIDENCE_SOURCES.map((source) => (
                <div key={source.name} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.03]">
                  <div className="text-xs font-black text-ink dark:text-white">{source.name}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{source.purpose}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
        <h2 className="text-sm font-black text-ink dark:text-white">Quantitative research formulas</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {REGENERATION_FORMULAS.map((item) => (
            <div key={item.name} className="rounded-xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="text-xs font-black text-ink dark:text-white">{item.name}</div>
              <div className="mt-2 rounded-lg bg-neutral-950 px-3 py-2 font-mono text-xs text-emerald-300">{item.formula}</div>
              <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{item.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="rounded-2xl border border-sky-300/30 bg-sky-50 p-4 text-xs leading-relaxed text-sky-950 dark:bg-sky-400/[0.06] dark:text-sky-100">
        <strong>Scientific framing:</strong> the 12-hallmark ontology follows López-Otín et al., <em>Cell</em> 2023 (PMID 36599349). Target discovery is intended to bind evidence from Open Targets; bioactivity from ChEMBL; chemical identifiers/properties from PubChem; genomic annotation from ClinVar/Ensembl; and pathway/protein context from Reactome/UniProt. A visually improved state is never equivalent to demonstrated rejuvenation.
      </footer>
    </div>
  )
}

export default RegenerationResearchSandbox
