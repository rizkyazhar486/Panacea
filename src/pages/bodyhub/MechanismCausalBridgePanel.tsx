import { useMemo, useState } from 'react'
import {
  BODY_MECHANISM_CAUSAL_BRIDGE,
  BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY,
  listCausalLinksForScenario,
  type CausalBridgeRelation,
} from '../../lib/bodyMechanismCausalBridge'
import {
  BODY_PATHOPHYSIOLOGY_NETWORK,
  getBodyPathophysiologyScenario,
  type BodyPathophysiologyScenarioId,
} from '../../lib/bodyPathophysiologyNetwork'
import { getBodyPharmacologyMechanism } from '../../lib/bodyPharmacologyMechanismNetwork'

const RELATION_LABELS: Record<CausalBridgeRelation, string> = {
  'upstream-driver': 'Upstream driver',
  'propagation-node': 'Propagation node',
  'downstream-modifier': 'Downstream modifier',
  'systems-context': 'Systems context',
}

const RELATION_CLASS: Record<CausalBridgeRelation, string> = {
  'upstream-driver': 'border-cyan-300/20 bg-cyan-300/[.06] text-cyan-100',
  'propagation-node': 'border-fuchsia-300/20 bg-fuchsia-300/[.06] text-fuchsia-100',
  'downstream-modifier': 'border-amber-200/20 bg-amber-200/[.055] text-amber-100',
  'systems-context': 'border-violet-300/20 bg-violet-300/[.055] text-violet-100',
}

export function MechanismCausalBridgePanel() {
  const [scenarioId, setScenarioId] = useState<BodyPathophysiologyScenarioId>('atherosclerosis')
  const scenario = getBodyPathophysiologyScenario(scenarioId)
  const links = useMemo(() => listCausalLinksForScenario(scenarioId), [scenarioId])

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/[.08] bg-black/55 p-3 shadow-[0_24px_90px_rgba(0,0,0,.25)] backdrop-blur-2xl sm:p-4 lg:p-5" aria-labelledby="causal-bridge-title">
      <div className="pointer-events-none absolute -left-14 bottom-0 h-40 w-40 rounded-full bg-violet-500/[.05] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-cyan-400/[.05] blur-3xl" aria-hidden />

      <header className="relative max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[.22em] text-fuchsia-100/80">Disease ↔ Mechanism Causal Bridge</span>
          <span className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-white/45">intersection map</span>
          <span className="rounded-full border border-amber-200/10 bg-amber-200/[.035] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-amber-50/55">not prescribing</span>
        </div>
        <h3 id="causal-bridge-title" className="mt-2 text-xl font-black tracking-[-.025em] text-white sm:text-2xl">
          Connect a disease cascade to the exact biological node a drug class touches.
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-white/52">
          Instead of a flat “drug for disease” list, this layer shows where target biology intersects an existing pathophysiology chain—and explicitly states what the link does not prove.
        </p>
      </header>

      <div className="relative mt-4 flex snap-x gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pathophysiology scenarios">
        {BODY_PATHOPHYSIOLOGY_NETWORK.map((item) => {
          const active = item.id === scenarioId
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setScenarioId(item.id)}
              className={`min-h-[44px] shrink-0 snap-start rounded-2xl border px-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/55 ${active ? 'border-fuchsia-300/20 bg-fuchsia-300/[.08] text-white' : 'border-white/[.07] bg-white/[.025] text-white/45 hover:bg-white/[.05] hover:text-white/75'}`}
            >
              <span className="block text-[9px] font-black uppercase tracking-[.11em] text-white/30">{item.id}</span>
              <span className="mt-0.5 block text-xs font-black">{item.shortLabel}</span>
            </button>
          )
        })}
      </div>

      <div className="relative mt-3 rounded-[22px] border border-white/[.07] bg-white/[.022] p-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.15em] text-white/30">Active disease network</div>
            <h4 className="mt-1 text-base font-black text-white/85">{scenario.title}</h4>
            <p className="mt-1.5 max-w-4xl text-xs font-medium leading-relaxed text-white/44">{scenario.summary}</p>
          </div>
          <div className="shrink-0 rounded-full border border-cyan-300/12 bg-cyan-300/[.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-cyan-100/65">
            {links.length} mechanism links
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid gap-3">
        {links.map((link) => {
          const mechanism = getBodyPharmacologyMechanism(link.pharmacologyMechanismId)
          const linkedSteps = link.scenarioStepIds
            .map((stepId) => scenario.cascade.find((step) => step.id === stepId))
            .filter(Boolean)

          return (
            <article key={link.id} className="rounded-[24px] border border-white/[.07] bg-black/32 p-3.5 sm:p-4">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,.95fr)_34px_minmax(0,1.05fr)] xl:items-stretch">
                <div className="rounded-[20px] border border-rose-300/10 bg-rose-300/[.025] p-3.5">
                  <div className="text-[9px] font-black uppercase tracking-[.14em] text-rose-100/55">Pathophysiology node</div>
                  <div className="mt-2 grid gap-2">
                    {linkedSteps.map((step) => step && (
                      <div key={step.id} className="rounded-2xl border border-white/[.06] bg-black/25 p-2.5">
                        <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/30">{step.kind}</div>
                        <div className="mt-0.5 text-[11px] font-black text-white/72">{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden items-center justify-center xl:flex" aria-hidden>
                  <div className="relative h-full min-h-28 w-px bg-gradient-to-b from-rose-300/10 via-fuchsia-300/35 to-cyan-300/10">
                    <div className="absolute left-1/2 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-fuchsia-200/20 bg-black text-xs text-fuchsia-100/70">↔</div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-cyan-300/10 bg-cyan-300/[.025] p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-100/55">Pharmacology mechanism</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[.1em] ${RELATION_CLASS[link.relation]}`}>
                      {RELATION_LABELS[link.relation]}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-black text-white/82">{mechanism.classLabel}</div>
                  <div className="mt-0.5 text-[10px] font-bold text-cyan-100/50">{mechanism.targetLabel}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mechanism.representativeExamples.map((example) => (
                      <span key={example} className="rounded-full border border-white/[.07] bg-black/25 px-2 py-0.5 text-[8px] font-bold text-white/38">{example}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
                <div className="rounded-[18px] border border-emerald-300/10 bg-emerald-300/[.025] p-3">
                  <div className="text-[8px] font-black uppercase tracking-[.13em] text-emerald-100/55">Mechanistic intersection</div>
                  <div className="mt-1 text-xs font-black text-white/78">{link.title}</div>
                  <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/42">{link.explanation}</p>
                </div>
                <div className="rounded-[18px] border border-amber-200/10 bg-amber-200/[.025] p-3">
                  <div className="text-[8px] font-black uppercase tracking-[.13em] text-amber-100/55">Does not imply</div>
                  <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-amber-50/45">{link.doesNotImply}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {mechanism.evidence.map((source) => (
                  <a
                    key={source.pmid}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/[.07] bg-white/[.025] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.1em] text-white/42 transition hover:border-cyan-300/15 hover:text-cyan-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45"
                  >
                    PMID {source.pmid}
                  </a>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <footer className="relative mt-3 flex flex-col gap-2 rounded-[20px] border border-white/[.07] bg-white/[.02] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">
          {BODY_MECHANISM_CAUSAL_BRIDGE.length} curated causal intersections · {BODY_PATHOPHYSIOLOGY_NETWORK.length} disease networks
        </div>
        <p className="max-w-4xl text-[9px] font-semibold leading-relaxed text-white/30">{BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY}</p>
      </footer>
    </section>
  )
}

export default MechanismCausalBridgePanel
