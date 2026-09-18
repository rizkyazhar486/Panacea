import { useEffect, useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_PATHOPHYSIOLOGY_BOUNDARY,
  BODY_PATHOPHYSIOLOGY_NETWORK,
  getBodyPathophysiologyScenario,
  listBodyPathophysiologyScenariosForAtlasSystem,
  type BodyPathophysiologyScenarioId,
  type PathophysiologyStepKind,
} from '../../lib/bodyPathophysiologyNetwork'
import { getWholeBodySystem } from '../../lib/wholeBodyPhysiologyOS'

const STEP_KIND_LABEL: Record<PathophysiologyStepKind, string> = {
  trigger: 'Trigger',
  injury: 'Injury',
  compensation: 'Compensation',
  propagation: 'Propagation',
  consequence: 'Consequence',
}

const STEP_KIND_CLASS: Record<PathophysiologyStepKind, string> = {
  trigger: 'border-cyan-300/15 bg-cyan-300/[.045] text-cyan-100',
  injury: 'border-rose-300/15 bg-rose-300/[.045] text-rose-100',
  compensation: 'border-amber-300/15 bg-amber-300/[.045] text-amber-100',
  propagation: 'border-violet-300/15 bg-violet-300/[.045] text-violet-100',
  consequence: 'border-fuchsia-300/15 bg-fuchsia-300/[.045] text-fuchsia-100',
}

interface PathophysiologyNetworkPanelProps {
  selectedAtlasSystemId?: BodySystemId
  selectedSourceStructureName?: string | null
}

export default function PathophysiologyNetworkPanel({ selectedAtlasSystemId, selectedSourceStructureName }: PathophysiologyNetworkPanelProps) {
  const related = useMemo(
    () => selectedAtlasSystemId ? listBodyPathophysiologyScenariosForAtlasSystem(selectedAtlasSystemId) : BODY_PATHOPHYSIOLOGY_NETWORK,
    [selectedAtlasSystemId],
  )
  const [scenarioId, setScenarioId] = useState<BodyPathophysiologyScenarioId>(related[0]?.id ?? 'atherosclerosis')

  useEffect(() => {
    if (related.length > 0 && !related.some((scenario) => scenario.id === scenarioId)) setScenarioId(related[0].id)
  }, [related, scenarioId])

  const scenario = getBodyPathophysiologyScenario(scenarioId)
  const selectedIsRelated = selectedAtlasSystemId ? scenario.atlasSystemIds.includes(selectedAtlasSystemId) : true

  return (
    <section data-body-pathophysiology-network="v1" data-pathophysiology-scenario={scenario.id} data-selected-source-structure={selectedSourceStructureName ?? undefined} data-structure-specific-mechanism="not-inferred" className="overflow-hidden rounded-[28px] border border-white/[.09] bg-[linear-gradient(145deg,rgba(244,63,94,.045),rgba(2,6,12,.94)_38%,rgba(79,70,229,.055))] text-white shadow-[0_24px_80px_rgba(0,0,0,.28)]">
      <div className="relative overflow-hidden border-b border-white/[.08] p-4 sm:p-5">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(244,63,94,.12),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(34,211,238,.1),transparent_30%)]" />
        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-rose-200/80">Body Exposure · pathophysiology network</div>
            <h3 className="mt-1.5 text-lg font-black tracking-[-.02em] sm:text-xl">Anatomy → physiology → system failure cascade</h3>
            <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/45 sm:text-[11px]">Trace literature-backed disease mechanisms across multiple organ systems without collapsing them into a single organ card. Every scenario carries PubMed provenance and an explicit non-diagnostic boundary.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-rose-300/15 bg-rose-300/[.055] px-2.5 py-1 text-rose-100/75">4 network scenarios</span>
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1 text-cyan-100/75">PubMed anchored</span>
            <span className="rounded-full border border-violet-300/15 bg-violet-300/[.05] px-2.5 py-1 text-violet-100/75">multisystem</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {selectedAtlasSystemId && related.length > 0 && (
          <div className="mb-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] px-3 py-2 text-[9px] leading-relaxed text-cyan-50/55">
            Showing mechanisms related to the currently selected source-atlas system. <span className="font-black text-cyan-100/80">{related.length} of {BODY_PATHOPHYSIOLOGY_NETWORK.length}</span> scenarios directly reference this system.
          </div>
        )}

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Pathophysiology scenarios">
          {(related.length > 0 ? related : BODY_PATHOPHYSIOLOGY_NETWORK).map((item) => {
            const active = item.id === scenario.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setScenarioId(item.id)}
                className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition ${active ? 'border-rose-300/30 bg-rose-300/[.11] text-white' : 'border-white/[.07] bg-white/[.025] text-white/45 hover:bg-white/[.05] hover:text-white/75'}`}
              >
                {item.shortLabel}
              </button>
            )
          })}
        </div>

        {!selectedIsRelated && selectedAtlasSystemId && (
          <div className="mt-2 text-[9px] text-amber-100/55">This scenario is not directly mapped to the currently selected atlas system; select a related scenario above to return to synchronized context.</div>
        )}

        <div className="mt-3 grid gap-3 2xl:grid-cols-[minmax(0,1.22fr)_minmax(330px,.78fr)]">
          <div className="space-y-3">
            <article className="rounded-[22px] border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-rose-200/65">Mechanistic scenario</div>
                  <h4 className="mt-1 text-base font-black text-white">{scenario.title}</h4>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">{scenario.summary}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scenario.physiologySystemIds.map((id) => (
                    <span key={id} className="rounded-full border border-white/[.07] bg-black/20 px-2 py-1 text-[8px] font-black text-white/50">{getWholeBodySystem(id).shortLabel}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Mechanism cascade</div>
                  <h4 className="mt-1 text-sm font-black text-white">Follow the failure chain</h4>
                </div>
                <div className="text-[8px] font-bold text-white/25">{scenario.cascade.length} mechanistic steps</div>
              </div>

              <div className="mt-3 space-y-2">
                {scenario.cascade.map((step, index) => (
                  <div key={step.id} className="grid grid-cols-[30px_minmax(0,1fr)] gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className="grid h-7 w-7 place-items-center rounded-full border border-white/[.09] bg-white/[.04] text-[9px] font-black text-white/60">{index + 1}</div>
                      {index < scenario.cascade.length - 1 && <div aria-hidden className="mt-1 min-h-8 w-px flex-1 bg-gradient-to-b from-white/15 to-white/[.03]" />}
                    </div>
                    <div className={`rounded-[18px] border p-3 ${STEP_KIND_CLASS[step.kind]}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-[8px] font-black uppercase tracking-[.13em] opacity-60">{STEP_KIND_LABEL[step.kind]}</div>
                          <div className="mt-1 text-[10px] font-black text-white/85">{step.label}</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {step.systemIds.map((id) => (
                            <span key={id} className="rounded-full border border-white/[.08] bg-black/20 px-1.5 py-0.5 text-[7px] font-black text-white/45">{getWholeBodySystem(id).shortLabel}</span>
                          ))}
                        </div>
                      </div>
                      <p className="mt-1.5 text-[9px] leading-relaxed text-white/42">{step.mechanism}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-3">
            <article className="rounded-[22px] border border-amber-300/10 bg-amber-300/[.025] p-3.5">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div>
              <div className="mt-2 space-y-2">
                {scenario.equations.map((equation) => (
                  <div key={equation.expression} className="rounded-2xl border border-white/[.07] bg-black/25 p-3">
                    <div className="text-[8px] font-black uppercase tracking-[.12em] text-white/28">{equation.label}</div>
                    <div className="mt-1 break-words font-mono text-[12px] font-black text-white/80">{equation.expression}</div>
                    <p className="mt-1.5 text-[8px] leading-relaxed text-white/34">{equation.note}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[.025] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Evidence ledger</div>
                <span className="rounded-full border border-white/[.07] bg-black/20 px-2 py-1 text-[7px] font-black text-white/35">{scenario.evidence.length} sources</span>
              </div>
              <div className="mt-2 space-y-2">
                {scenario.evidence.map((source) => (
                  <a
                    key={source.pmid}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 transition hover:border-cyan-300/20 hover:bg-cyan-300/[.035]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-black text-cyan-100/70">PMID {source.pmid}</span>
                      <span className="text-[8px] font-bold text-white/25">{source.year} ↗</span>
                    </div>
                    <div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div>
                    <p className="mt-1.5 text-[8px] leading-relaxed text-white/32">{source.role}</p>
                  </a>
                ))}
              </div>
            </article>
          </aside>
        </div>

        <p className="mt-3 rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45"><span className="font-black text-rose-100/65">Boundary:</span> {BODY_PATHOPHYSIOLOGY_BOUNDARY}</p>
      </div>
    </section>
  )
}