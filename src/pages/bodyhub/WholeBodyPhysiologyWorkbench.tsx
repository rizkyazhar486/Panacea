import { useMemo, useState } from 'react'
import {
  WHOLE_BODY_COUPLING_LOOPS,
  WHOLE_BODY_PHYSIOLOGY_BOUNDARY,
  WHOLE_BODY_PHYSIOLOGY_SYSTEMS,
  getWholeBodySystem,
  simulateSyntheticHomeostasis,
  type SyntheticPerturbationInput,
  type WholeBodySystemId,
} from '../../lib/wholeBodyPhysiologyOS'
import { PHYSIOLOGY_DEEP_DIVES } from '../../lib/physiologyDeepDives'

const SIGNAL_LABELS = {
  oxygenDemand: 'O₂ demand',
  ventilatoryDrive: 'Ventilatory drive',
  circulatoryDrive: 'Circulatory drive',
  renalConservation: 'Renal conservation',
  thermalLoad: 'Thermal load',
  immuneSignal: 'Immune signal',
  metabolicDemand: 'Metabolic demand',
} as const

const PERTURBATION_LABELS: Readonly<Record<keyof SyntheticPerturbationInput, { label: string; hint: string }>> = {
  activity: { label: 'Activity load', hint: 'Synthetic movement / ATP demand' },
  altitude: { label: 'Hypoxic environment', hint: 'Teaching proxy for lower inspired O₂ availability' },
  dehydration: { label: 'Water deficit', hint: 'Synthetic extracellular-volume conservation demand' },
  inflammation: { label: 'Inflammatory load', hint: 'Generic host-response teaching perturbation' },
}

function pct(value: number) {
  return `${Math.round(value * 100)}%`
}

export default function WholeBodyPhysiologyWorkbench() {
  const [selectedSystemId, setSelectedSystemId] = useState<WholeBodySystemId>('cardiovascular')
  const [perturbation, setPerturbation] = useState<SyntheticPerturbationInput>({
    activity: 0.22,
    altitude: 0,
    dehydration: 0,
    inflammation: 0,
  })

  const selectedSystem = getWholeBodySystem(selectedSystemId)
  const state = useMemo(() => simulateSyntheticHomeostasis(perturbation), [perturbation])
  const connectedSystems = useMemo(
    () => selectedSystem.couplingTargets.map((id) => getWholeBodySystem(id)),
    [selectedSystem],
  )
  const activeLoops = useMemo(
    () => WHOLE_BODY_COUPLING_LOOPS.filter((loop) => loop.path.includes(selectedSystemId)),
    [selectedSystemId],
  )

  const reset = () => setPerturbation({ activity: 0.22, altitude: 0, dehydration: 0, inflammation: 0 })

  return (
    <section
      data-whole-body-physiology-workbench="v1"
      className="overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#03070b] text-white shadow-[0_24px_80px_rgba(0,0,0,.45)]"
    >
      <div className="relative overflow-hidden border-b border-white/10 px-4 py-4 sm:px-5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,.18),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(168,85,247,.16),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,.08),transparent_36%)]" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">Body Exposure · whole-body physiology OS</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Whole-human physiology, one connected network</h3>
            <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-white/60 sm:text-xs">
              Explore organ systems and integrative physiology together: circulation, ventilation, renal conservation, endocrine control, metabolism, movement, immunity, allergy, thermoregulation, sensory processing, balance, proprioception, pain and autonomic control.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wide">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">{WHOLE_BODY_PHYSIOLOGY_SYSTEMS.length} system networks</span>
            <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-violet-200">{PHYSIOLOGY_DEEP_DIVES.length} mechanism deep dives</span>
            <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-2.5 py-1 text-fuchsia-200">{WHOLE_BODY_COUPLING_LOOPS.length} coupling loops</span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/20 p-3 xl:border-b-0 xl:border-r">
          <div className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">System navigator</div>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:grid xl:max-h-[760px] xl:grid-cols-1 xl:overflow-y-auto xl:pr-1">
            {WHOLE_BODY_PHYSIOLOGY_SYSTEMS.map((system) => {
              const active = system.id === selectedSystemId
              return (
                <button
                  key={system.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedSystemId(system.id)}
                  className={`min-h-11 min-w-[145px] rounded-2xl border px-3 py-2 text-left transition xl:min-w-0 ${active ? 'border-cyan-300/40 bg-cyan-300/[.12] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]' : 'border-white/8 bg-white/[.025] hover:border-white/15 hover:bg-white/[.05]'}`}
                >
                  <div className={`text-[10px] font-black ${active ? 'text-cyan-200' : 'text-white/75'}`}>{system.shortLabel}</div>
                  <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/40">{system.primaryRole}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="min-w-0 p-3 sm:p-4">
          <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.1fr)_minmax(330px,.9fr)]">
            <div className="space-y-3">
              <article className="rounded-[24px] border border-white/10 bg-white/[.035] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Selected system</div>
                    <h4 className="mt-1 text-lg font-black text-white">{selectedSystem.label}</h4>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-bold text-white/55">{selectedSystem.couplingTargets.length} direct couplings</span>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/60">{selectedSystem.primaryRole}</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.045] p-3">
                    <div className="text-[9px] font-black uppercase tracking-wide text-cyan-200">Anatomy anchors</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedSystem.anatomyAnchors.map((anchor) => (
                        <span key={anchor} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-bold text-white/70">{anchor}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.045] p-3">
                    <div className="text-[9px] font-black uppercase tracking-wide text-violet-200">Physiology anchors</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedSystem.physiologyAnchors.map((anchor) => (
                        <span key={anchor} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-bold text-white/70">{anchor}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-3">
                  <div className="text-[9px] font-black uppercase tracking-wide text-amber-200">Relationship ledger</div>
                  <div className="mt-1 font-mono text-sm font-black text-white">{selectedSystem.equation}</div>
                  <p className="mt-1 text-[9px] leading-relaxed text-white/45">{selectedSystem.equationNote}</p>
                </div>
              </article>

              <article className="rounded-[24px] border border-white/10 bg-white/[.025] p-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-300">Coupling graph</div>
                    <h4 className="mt-1 text-sm font-black text-white">What changes when this system moves?</h4>
                  </div>
                  <div className="text-[9px] text-white/40">Select any linked node</div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" className="min-h-10 rounded-2xl border border-cyan-300/35 bg-cyan-300/[.1] px-3 text-[10px] font-black text-cyan-100">
                    {selectedSystem.shortLabel}
                  </button>
                  <span className="text-white/25">→</span>
                  {connectedSystems.map((system) => (
                    <button
                      key={system.id}
                      type="button"
                      onClick={() => setSelectedSystemId(system.id)}
                      className="min-h-10 rounded-2xl border border-white/10 bg-white/[.035] px-3 text-[10px] font-black text-white/70 transition hover:border-violet-300/30 hover:bg-violet-300/[.08] hover:text-white"
                    >
                      {system.shortLabel}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 lg:grid-cols-2">
                  {activeLoops.map((loop) => (
                    <div key={loop.id} className="rounded-2xl border border-white/8 bg-black/20 p-3">
                      <div className="text-[10px] font-black text-white">{loop.label}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] font-bold text-cyan-200/80">
                        {loop.path.map((id, index) => (
                          <span key={id} className="contents">
                            <button type="button" onClick={() => setSelectedSystemId(id)} className="rounded-full border border-white/8 bg-white/[.03] px-2 py-1 hover:bg-white/[.07]">{getWholeBodySystem(id).shortLabel}</button>
                            {index < loop.path.length - 1 && <span aria-hidden className="text-white/20">→</span>}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-[9px] leading-relaxed text-white/45">{loop.teachingPoint}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="space-y-3">
              <article className="rounded-[24px] border border-emerald-300/15 bg-emerald-300/[.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Perturbation lab</div>
                    <h4 className="mt-1 text-sm font-black text-white">Synthetic homeostasis stress test</h4>
                  </div>
                  <button type="button" onClick={reset} className="min-h-9 rounded-xl border border-white/10 bg-black/20 px-3 text-[9px] font-black text-white/60 hover:bg-white/[.05]">Reset</button>
                </div>
                <p className="mt-2 text-[9px] leading-relaxed text-white/45">Move one environmental or physiologic teaching perturbation at a time, or combine them to visualize cross-system response pressure. Values are unitless by design.</p>

                <div className="mt-4 space-y-3">
                  {(Object.keys(PERTURBATION_LABELS) as (keyof SyntheticPerturbationInput)[]).map((key) => {
                    const meta = PERTURBATION_LABELS[key]
                    const value = perturbation[key]
                    return (
                      <label key={key} className="block rounded-2xl border border-white/8 bg-black/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-black text-white">{meta.label}</div>
                            <div className="mt-0.5 text-[8px] leading-relaxed text-white/35">{meta.hint}</div>
                          </div>
                          <output className="rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-2 py-1 text-[9px] font-black text-emerald-200">{pct(value)}</output>
                        </div>
                        <input
                          aria-label={meta.label}
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={value}
                          onChange={(event) => setPerturbation((current) => ({ ...current, [key]: Number(event.target.value) }))}
                          className="mt-3 h-2 w-full cursor-pointer accent-emerald-300"
                        />
                      </label>
                    )
                  })}
                </div>
              </article>

              <article className="rounded-[24px] border border-white/10 bg-white/[.03] p-4">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-fuchsia-300">Network response</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
                  {(Object.entries(state) as [keyof typeof state, number][]).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-white/8 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[9px] font-black text-white/70">{SIGNAL_LABELS[key]}</div>
                        <div className="text-[10px] font-black text-white">{pct(value)}</div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 transition-[width] duration-300" style={{ width: pct(value) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/8 bg-black/25 p-3 text-[9px] leading-relaxed text-white/40">
            <span className="font-black text-white/60">Boundary:</span> {WHOLE_BODY_PHYSIOLOGY_BOUNDARY}
            <div className="mt-1">Synthetic response rule: each output = clamp(base + weighted perturbation terms, 0, 1). The weights visualize directional coupling and are not validated physiologic coefficients.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
