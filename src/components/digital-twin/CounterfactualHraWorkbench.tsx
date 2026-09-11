import { useMemo, useState, type ChangeEvent } from 'react'
import {
  COUNTERFACTUAL_SCENARIOS,
  changedNodes,
  simulateCounterfactual,
} from '../../lib/counterfactualBiology'
import { HraResolvedAnatomyViewer } from './HraResolvedAnatomyViewer'

const pct = (value: number) => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`

export function CounterfactualHraWorkbench() {
  const [scenarioId, setScenarioId] = useState(COUNTERFACTUAL_SCENARIOS[0].id)
  const scenario = COUNTERFACTUAL_SCENARIOS.find((item) => item.id === scenarioId) ?? COUNTERFACTUAL_SCENARIOS[0]
  const [perturbationId, setPerturbationId] = useState(scenario.perturbations[0].id)
  const perturbation = scenario.perturbations.find((item) => item.id === perturbationId) ?? scenario.perturbations[0]
  const [magnitude, setMagnitude] = useState(perturbation.defaultMagnitude)
  const [step, setStep] = useState(5)

  const frames = useMemo(
    () => simulateCounterfactual(scenario, perturbation.target, magnitude * perturbation.direction, 8),
    [scenario, perturbation.target, perturbation.direction, magnitude],
  )
  const frame = frames[Math.min(step, frames.length - 1)]
  const objective = scenario.nodes.find((node) => node.id === scenario.objectiveNode)
  const objectiveState = frame.states[scenario.objectiveNode]
  const changes = useMemo(() => changedNodes(scenario, frame).slice(0, 6), [scenario, frame])
  const targetNode = scenario.nodes.find((node) => node.id === perturbation.target)
  const anatomyTerms = useMemo(() => {
    const structural = scenario.nodes
      .filter((node) => node.scale === 'organ' || node.scale === 'tissue')
      .map((node) => node.label)
    return [...new Set([...scenario.focusKeywords, ...structural, targetNode?.label || ''])].filter(Boolean).slice(0, 14)
  }, [scenario, targetNode])

  function chooseScenario(id: string) {
    const next = COUNTERFACTUAL_SCENARIOS.find((item) => item.id === id) ?? COUNTERFACTUAL_SCENARIOS[0]
    setScenarioId(next.id)
    setPerturbationId(next.perturbations[0].id)
    setMagnitude(next.perturbations[0].defaultMagnitude)
    setStep(5)
  }

  function choosePerturbation(id: string) {
    const next = scenario.perturbations.find((item) => item.id === id) ?? scenario.perturbations[0]
    setPerturbationId(next.id)
    setMagnitude(next.defaultMagnitude)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#090d11] sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300">What-if · source-first</div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white">Hypothesis model attached to real HRA anatomy</h2>
            <p className="mt-1 max-w-4xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The anatomy below is upstream HuBMAP HRA geometry. Only the numerical causal graph changes with the virtual perturbation. Panacea does not stretch, pulse, recolor or deform source anatomy to imply a biological response.</p>
          </div>
          <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-black text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">Model ≠ patient prediction</div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {COUNTERFACTUAL_SCENARIOS.map((item) => (
            <button key={item.id} onClick={() => chooseScenario(item.id)} className={`min-w-[220px] shrink-0 rounded-2xl border p-3 text-left ${item.id === scenario.id ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10' : 'border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
              <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.subtitle}</div>
            </button>
          ))}
        </div>
      </section>

      <HraResolvedAnatomyViewer
        title={`${scenario.label} · source anatomy`}
        description={`Resolved from scenario anatomy terms: ${anatomyTerms.join(', ')}.`}
        terms={anatomyTerms}
      />

      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <aside className="rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-700 dark:text-violet-300">Virtual perturbation</div>
          <div className="mt-3 space-y-2">
            {scenario.perturbations.map((item) => (
              <button key={item.id} onClick={() => choosePerturbation(item.id)} className={`w-full rounded-2xl border p-3 text-left ${item.id === perturbation.id ? 'border-violet-300 bg-violet-50 dark:border-violet-300/30 dark:bg-violet-300/10' : 'border-neutral-200 dark:border-white/10'}`}>
                <div className="text-[11px] font-black text-neutral-950 dark:text-white">{item.label}</div>
                <div className="mt-1 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.rationale}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-neutral-50 p-3 dark:bg-white/[.035]">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wide text-neutral-500"><span>Normalized magnitude</span><span>{Math.round(magnitude * 100)}%</span></div>
            <input className="mt-2 w-full accent-violet-500" type="range" min="0.05" max="0.8" step="0.01" value={magnitude} onChange={(event: ChangeEvent<HTMLInputElement>) => setMagnitude(Number(event.target.value))} />
            <p className="mt-2 text-[9px] leading-relaxed text-neutral-400">This value is dimensionless. It is not a dose, concentration, pressure, flow or laboratory value.</p>
          </div>
        </aside>

        <main className="rounded-[26px] border border-neutral-200 bg-[#071019] p-4 text-white dark:border-white/10 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.17em] text-cyan-300">Executable causal state</div>
              <h3 className="mt-1 text-lg font-black">{scenario.label}</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5 text-[9px] font-black">t{step}/8</div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {changes.map(({ node, state }) => (
              <div key={node.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-3">
                <div className="text-[10px] font-black">{node.label}</div>
                <div className="mt-1 text-[9px] text-white/45">{node.scale}</div>
                <div className="mt-3 flex items-end justify-between gap-2"><span className="text-xl font-black">{pct(state.value)}</span><span className={`text-[10px] font-black ${state.delta > 0 ? 'text-amber-300' : state.delta < 0 ? 'text-cyan-300' : 'text-white/50'}`}>{state.delta >= 0 ? '+' : ''}{Math.round(state.delta * 100)} pts</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: pct(state.value) }} /></div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wide text-white/45"><span>Model time index</span><span>t{step}</span></div>
            <input className="mt-2 w-full accent-cyan-300" type="range" min="0" max="8" step="1" value={step} onChange={(event: ChangeEvent<HTMLInputElement>) => setStep(Number(event.target.value))} />
          </div>
        </main>

        <aside className="space-y-3">
          <section className="rounded-[26px] border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/[.07]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-800 dark:text-cyan-200">Objective state</div>
            <div className="mt-2 text-[12px] font-black text-cyan-950 dark:text-cyan-100">{objective?.label}</div>
            <div className="mt-1 text-4xl font-black tracking-tight text-cyan-950 dark:text-cyan-100">{pct(objectiveState.value)}</div>
            <div className="mt-1 text-[9px] text-cyan-800/70 dark:text-cyan-100/60">uncertainty {pct(objectiveState.low)}–{pct(objectiveState.high)}</div>
          </section>
          <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/20 dark:bg-emerald-300/[.07]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-800 dark:text-emerald-200">What would falsify it?</div>
            <div className="mt-3 space-y-2">{scenario.falsificationMeasurements.slice(0, 4).map((item, index) => <div key={item} className="flex gap-2 text-[9px] leading-relaxed text-emerald-900/75 dark:text-emerald-100/70"><span className="font-black">{index + 1}.</span><span>{item}</span></div>)}</div>
          </section>
          <section className="rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-400">Evidence anchors</div>
            <div className="mt-2 space-y-2">{scenario.references.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-neutral-200 p-2.5 text-[9px] font-bold text-neutral-700 hover:border-cyan-300 dark:border-white/10 dark:text-neutral-300">{reference.label} ↗</a>)}</div>
          </section>
        </aside>
      </section>
    </div>
  )
}
