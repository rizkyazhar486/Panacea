import { useMemo, useState, type ChangeEvent } from 'react'
import { Body3D, CT_WINDOWS, type AnatomyLayer } from '../Body3D'
import {
  COUNTERFACTUAL_SCENARIOS,
  SCALE_ORDER,
  changedNodes,
  rankLeverage,
  scaleLabel,
  simulateCounterfactual,
  type BiologyScale,
} from '../../lib/counterfactualBiology'

const pct = (value: number) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`

function valueTone(delta: number) {
  if (delta > 0.08) return 'border-amber-300/40 bg-amber-300/10 text-amber-100'
  if (delta < -0.08) return 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100'
  return 'border-white/10 bg-white/[0.04] text-white/75'
}

function ScaleColumn({ scale, scenario, frame }: {
  scale: BiologyScale
  scenario: (typeof COUNTERFACTUAL_SCENARIOS)[number]
  frame: ReturnType<typeof simulateCounterfactual>[number]
}) {
  const nodes = scenario.nodes.filter((node) => node.scale === scale)
  if (!nodes.length) return null
  return (
    <div className="min-w-[190px] flex-1">
      <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">{scaleLabel(scale)}</div>
      <div className="space-y-2">
        {nodes.map((node) => {
          const state = frame.states[node.id]
          return (
            <div key={node.id} className={`rounded-2xl border p-3 transition ${valueTone(state.delta)}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-black">{node.label}</div>
                <div className="text-[10px] font-black">{pct(state.value)}</div>
              </div>
              <div className="mt-1 text-[10px] leading-relaxed opacity-60">{node.description}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/20">
                <div className="h-full rounded-full bg-current transition-[width] duration-500" style={{ width: pct(state.value) }} />
              </div>
              <div className="mt-1 text-[9px] opacity-50">uncertainty {pct(state.low)}–{pct(state.high)} · Δ {state.delta >= 0 ? '+' : ''}{Math.round(state.delta * 100)} pts</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CounterfactualBiologyLab() {
  const [scenarioId, setScenarioId] = useState(COUNTERFACTUAL_SCENARIOS[0].id)
  const scenario = COUNTERFACTUAL_SCENARIOS.find((item) => item.id === scenarioId) ?? COUNTERFACTUAL_SCENARIOS[0]
  const [perturbationId, setPerturbationId] = useState(scenario.perturbations[0].id)
  const activePerturbation = scenario.perturbations.find((item) => item.id === perturbationId) ?? scenario.perturbations[0]
  const [magnitude, setMagnitude] = useState(activePerturbation.defaultMagnitude)
  const [step, setStep] = useState(5)
  const [selectedStructure, setSelectedStructure] = useState('')

  const signedMagnitude = magnitude * activePerturbation.direction
  const frames = useMemo(
    () => simulateCounterfactual(scenario, activePerturbation.target, signedMagnitude, 8),
    [scenario, activePerturbation.target, signedMagnitude],
  )
  const frame = frames[Math.min(step, frames.length - 1)]
  const rankedChanges = useMemo(() => changedNodes(scenario, frame), [scenario, frame])
  const leverage = useMemo(() => rankLeverage(scenario), [scenario])
  const objectiveNode = scenario.nodes.find((node) => node.id === scenario.objectiveNode)
  const objectiveState = frame.states[scenario.objectiveNode]
  const layers = useMemo(() => new Set<AnatomyLayer['key']>(scenario.layers), [scenario])

  const chooseScenario = (id: string) => {
    const next = COUNTERFACTUAL_SCENARIOS.find((item) => item.id === id) ?? COUNTERFACTUAL_SCENARIOS[0]
    setScenarioId(next.id)
    setPerturbationId(next.perturbations[0].id)
    setMagnitude(next.perturbations[0].defaultMagnitude)
    setStep(5)
    setSelectedStructure('')
  }

  const choosePerturbation = (id: string) => {
    const next = scenario.perturbations.find((item) => item.id === id) ?? scenario.perturbations[0]
    setPerturbationId(next.id)
    setMagnitude(next.defaultMagnitude)
  }

  return (
    <div className="space-y-4 pb-14">
      <header className="relative overflow-hidden rounded-[32px] border border-cyan-300/15 bg-[#040910] p-5 text-white shadow-2xl md:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">PanaceaMed invention · Counterfactual Human Biology Lab</div>
            <h1 className="mt-2 max-w-5xl text-3xl font-black tracking-tight md:text-5xl">Ask biology “what if?”—then watch the mechanism propagate across scales.</h1>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/60">Perturb one biological variable virtually, propagate the effect through a transparent causal graph, inspect uncertainty, and see which measurements would falsify the hypothesis. This is an executable hypothesis engine—not a diagnosis or treatment predictor.</p>
          </div>
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-xs leading-relaxed text-amber-100">
            <div className="font-black uppercase tracking-wide">Scientific boundary</div>
            <p className="mt-2">Outputs are normalized research states generated by a deliberately simple causal model. Patient-specific inference remains locked until real source data and a validated model are connected.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {COUNTERFACTUAL_SCENARIOS.map((item) => (
          <button
            key={item.id}
            onClick={() => chooseScenario(item.id)}
            className={`rounded-2xl border p-4 text-left transition ${item.id === scenario.id ? 'border-cyan-400 bg-cyan-400/10 shadow-lg' : 'border-neutral-200 bg-white hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.035]'}`}
          >
            <div className="text-xs font-black text-ink dark:text-white">{item.label}</div>
            <div className="mt-2 text-[10px] leading-relaxed text-neutral-500">{item.subtitle}</div>
          </button>
        ))}
      </section>

      <div className="grid gap-4 2xl:grid-cols-[310px_minmax(0,1fr)_350px]">
        <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Virtual perturbation</div>
            <h2 className="mt-1 text-base font-black text-ink dark:text-white">{scenario.label}</h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{scenario.description}</p>
            <div className="mt-4 space-y-2">
              {scenario.perturbations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => choosePerturbation(item.id)}
                  className={`w-full rounded-xl border p-3 text-left ${item.id === activePerturbation.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-400/10' : 'border-neutral-200 dark:border-white/10'}`}
                >
                  <div className="text-xs font-black text-ink dark:text-white">{item.label}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{item.rationale}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-neutral-500">
                <span>Magnitude</span><span>{Math.round(magnitude * 100)}%</span>
              </div>
              <input className="mt-2 w-full accent-violet-500" type="range" min="0.05" max="0.8" step="0.01" value={magnitude} onChange={(e: ChangeEvent<HTMLInputElement>) => setMagnitude(Number(e.target.value))} />
              <div className="mt-2 text-[10px] leading-relaxed text-neutral-500">The slider changes a normalized virtual perturbation only. It is not a dose, concentration or physiological measurement.</div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Hypothesis leverage map</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">Graph-theoretic upstream influence on <strong>{objectiveNode?.label}</strong>. This ranks model leverage, not clinical benefit.</p>
            <div className="mt-3 space-y-2">
              {leverage.slice(0, 6).map(({ node, score }, index) => (
                <div key={node.id} className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/[0.035]">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-black text-ink dark:text-white">{index + 1}. {node.label}</span>
                    <span className="font-black text-brand">{Math.round(score * 100)}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10"><div className="h-full rounded-full bg-brand" style={{ width: pct(score) }} /></div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-[#050a0f] shadow-xl dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4 text-white">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">4D body context</div>
                <h2 className="mt-1 text-lg font-black">{scenario.label}</h2>
                <p className="mt-1 text-[11px] text-white/45">3D anatomy + time-indexed causal state. Tap anatomy to identify structures.</p>
              </div>
              {selectedStructure && <div className="max-w-sm rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/65">Selected: {selectedStructure}</div>}
            </div>
            <Body3D
              layers={layers}
              highlighted={[]}
              focusKeywords={scenario.focusKeywords}
              renderMode="anatomy"
              ctWindow={CT_WINDOWS[0]}
              slicePlane="none"
              slicePos={0.5}
              motion={scenario.motion}
              unfold={0.06}
              dissect={1}
              onPick={(_: string, label: string) => setSelectedStructure(label)}
            />
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#050a10] p-4 text-white md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">Executable causal graph</div>
                <h2 className="mt-1 text-lg font-black">Molecule → organelle → cell → tissue → organ → phenotype</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black">t{step} / 8</div>
            </div>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {SCALE_ORDER.map((scale) => <ScaleColumn key={scale} scale={scale} scenario={scenario} frame={frame} />)}
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-white/45"><span>4D time index</span><span>t{step}</span></div>
              <input className="w-full accent-cyan-300" type="range" min="0" max="8" step="1" value={step} onChange={(e: ChangeEvent<HTMLInputElement>) => setStep(Number(e.target.value))} />
              <div className="mt-2 grid grid-cols-9 text-center text-[9px] text-white/30">{frames.map((item) => <span key={item.step}>t{item.step}</span>)}</div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Largest modeled changes</div>
              <div className="mt-3 space-y-2">
                {rankedChanges.slice(0, 6).map(({ node, state }) => (
                  <div key={node.id} className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.035]">
                    <div>
                      <div className="text-xs font-black text-ink dark:text-white">{node.label}</div>
                      <div className="text-[10px] text-neutral-500">{scaleLabel(node.scale)}</div>
                    </div>
                    <div className={`text-sm font-black ${state.delta > 0 ? 'text-amber-600' : state.delta < 0 ? 'text-cyan-600' : 'text-neutral-500'}`}>{state.delta >= 0 ? '+' : ''}{Math.round(state.delta * 100)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Objective readout</div>
              <div className="mt-3 rounded-2xl border border-cyan-300/30 bg-cyan-50 p-4 dark:bg-cyan-300/10">
                <div className="text-xs font-black text-cyan-900 dark:text-cyan-100">{objectiveNode?.label}</div>
                <div className="mt-1 text-3xl font-black text-cyan-900 dark:text-cyan-100">{pct(objectiveState.value)}</div>
                <div className="mt-1 text-[10px] text-cyan-800/70 dark:text-cyan-100/60">uncertainty band {pct(objectiveState.low)}–{pct(objectiveState.high)} · Δ {objectiveState.delta >= 0 ? '+' : ''}{Math.round(objectiveState.delta * 100)} pts</div>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-neutral-500">This readout is a model state, not a clinical endpoint. Its main purpose is to make assumptions inspectable and to compare mechanisms consistently.</p>
            </div>
          </section>
        </main>

        <aside className="space-y-4 2xl:sticky 2xl:top-4 2xl:self-start">
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/[0.07]">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">Falsifiability first</div>
            <h2 className="mt-1 text-sm font-black text-emerald-950 dark:text-emerald-100">What would prove this model wrong?</h2>
            <div className="mt-3 space-y-2">
              {scenario.falsificationMeasurements.map((item, index) => (
                <div key={item} className="flex gap-2 text-[11px] leading-relaxed text-emerald-900/75 dark:text-emerald-100/70"><span className="font-black">{index + 1}.</span><span>{item}</span></div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Patient-specific gate</div>
            <h2 className="mt-1 text-sm font-black text-ink dark:text-white">Locked by design</h2>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">A reference simulation cannot become a patient prediction by changing a name or age. Patient-specific mode should require traceable source objects and validation metadata.</p>
            <div className="mt-3 space-y-2">
              {scenario.patientSpecificInputs.map((item) => <div key={item} className="rounded-xl bg-neutral-50 px-3 py-2 text-[10px] font-semibold text-neutral-600 dark:bg-white/[0.035] dark:text-neutral-300">{item}</div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">Evidence anchors</div>
            <div className="mt-3 space-y-2">
              {scenario.references.map((ref) => (
                <a key={ref.url} href={ref.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-neutral-200 p-3 transition hover:border-brand dark:border-white/10">
                  <div className="text-[10px] font-black text-ink dark:text-white">{ref.label}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-wide text-neutral-400">{ref.evidence.replace(/-/g, ' ')}</div>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-300/20 bg-violet-50 p-4 dark:bg-violet-400/[0.07]">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-800 dark:text-violet-200">Why this is different</div>
            <p className="mt-2 text-[11px] leading-relaxed text-violet-950/75 dark:text-violet-100/70">Most medical apps display facts after the event. This module stores a biological hypothesis as an executable, inspectable graph: perturb → propagate → quantify uncertainty → identify leverage → specify falsifying data. Future validated mechanistic solvers can replace each simple edge without changing the user experience.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
