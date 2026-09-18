import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  BODY_PHARMACOLOGY_MECHANISM_NETWORK,
  BODY_PHARMACOLOGY_NETWORK_BOUNDARY,
  PHARMACOLOGY_TEACHING_EQUATIONS,
  listBodyPharmacologyForAtlasSystem,
  type PharmacologyMechanismId,
  type PharmacologyMechanismLayer,
} from '../../lib/bodyPharmacologyMechanismNetwork'

const LAYER_LABELS: Record<PharmacologyMechanismLayer, string> = {
  target: 'Target',
  molecular: 'Molecular',
  cellular: 'Cellular',
  organ: 'Organ',
  systems: 'Systems',
}

const LAYER_ACCENT: Record<PharmacologyMechanismLayer, string> = {
  target: 'border-cyan-300/25 bg-cyan-300/[.07] text-cyan-100',
  molecular: 'border-violet-300/20 bg-violet-300/[.065] text-violet-100',
  cellular: 'border-fuchsia-300/20 bg-fuchsia-300/[.06] text-fuchsia-100',
  organ: 'border-amber-200/20 bg-amber-200/[.055] text-amber-100',
  systems: 'border-emerald-300/20 bg-emerald-300/[.055] text-emerald-100',
}

interface PharmacologyMechanismPanelProps {
  selectedAtlasSystemId: BodySystemId
  selectedSourceStructureName?: string | null
}

export function PharmacologyMechanismPanel({ selectedAtlasSystemId, selectedSourceStructureName }: PharmacologyMechanismPanelProps) {
  const visibleMechanisms = useMemo(
    () => listBodyPharmacologyForAtlasSystem(selectedAtlasSystemId),
    [selectedAtlasSystemId],
  )
  const [selectedId, setSelectedId] = useState<PharmacologyMechanismId>('statin-hmgcr')

  const selected =
    visibleMechanisms.find((mechanism) => mechanism.id === selectedId) ??
    visibleMechanisms[0] ??
    BODY_PHARMACOLOGY_MECHANISM_NETWORK[0]

  const atlasHasDirectMechanism = visibleMechanisms.length > 0

  return (
    <section
      data-selected-source-structure={selectedSourceStructureName ?? undefined}
      data-structure-specific-mechanism="not-inferred"
      className="relative overflow-hidden rounded-[28px] border border-white/[.08] bg-black/55 p-3 shadow-[0_24px_90px_rgba(0,0,0,.26)] backdrop-blur-2xl sm:p-4 lg:p-5"
      aria-labelledby="body-pharmacology-title"
    >
      <div className="pointer-events-none absolute -left-12 top-4 h-36 w-36 rounded-full bg-cyan-400/[.055] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-[8%] top-0 h-40 w-40 rounded-full bg-fuchsia-500/[.045] blur-3xl" aria-hidden />

      <header className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Pharmacology Mechanism Network</span>
            <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-white/55">target → system</span>
            <span className="rounded-full border border-amber-200/10 bg-amber-200/[.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] text-amber-100/65">no dosing</span>
          </div>
          <h3 id="body-pharmacology-title" className="mt-2 text-xl font-black tracking-[-.025em] text-white sm:text-2xl">See where a drug class touches the biology — not just its name.</h3>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-white/55">Traverse a class-level mechanism from molecular target through cell, organ and whole-body consequence. The layer is synchronized to the selected source-atlas system and intentionally stops before prescribing decisions.</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[330px]">
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-3 py-2.5"><div className="text-lg font-black text-white">{BODY_PHARMACOLOGY_MECHANISM_NETWORK.length}</div><div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">mechanisms</div></div>
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-3 py-2.5"><div className="text-lg font-black text-white">5</div><div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">scales each</div></div>
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] px-3 py-2.5"><div className="text-lg font-black text-white">PMID</div><div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">provenance</div></div>
        </div>
      </header>

      <div className="relative mt-4 rounded-[22px] border border-white/[.07] bg-black/35 p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-3">
          <div><div className="text-[9px] font-black uppercase tracking-[.17em] text-white/30">Selected atlas context</div><div className="mt-1 text-sm font-black text-white/80">{selectedAtlasSystemId}</div></div>
          <div className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${atlasHasDirectMechanism ? 'border-emerald-300/20 bg-emerald-300/[.06] text-emerald-100' : 'border-white/10 bg-white/[.035] text-white/45'}`}>{atlasHasDirectMechanism ? `${visibleMechanisms.length} mapped` : 'no invented mapping'}</div>
        </div>

        {atlasHasDirectMechanism ? (
          <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pharmacology mechanisms for selected body system">
            {visibleMechanisms.map((mechanism) => {
              const active = mechanism.id === selected.id
              return (
                <button key={mechanism.id} type="button" role="tab" aria-selected={active} onClick={() => setSelectedId(mechanism.id)} className={`min-h-[44px] shrink-0 snap-start rounded-2xl border px-3.5 text-left text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${active ? 'border-cyan-300/25 bg-cyan-300/[.09] text-white' : 'border-white/[.07] bg-white/[.025] text-white/45 hover:bg-white/[.05] hover:text-white/75'}`}>
                  <span className="block text-[9px] uppercase tracking-[.12em] text-white/30">{mechanism.targetLabel}</span><span className="mt-0.5 block">{mechanism.classLabel}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs font-semibold leading-relaxed text-white/42">This source-atlas system has no direct mechanism in the current evidence wave. The panel deliberately stays empty instead of fabricating a pharmacology relationship.</p>
        )}
      </div>

      {atlasHasDirectMechanism && (
        <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.8fr)]">
          <article className="rounded-[24px] border border-white/[.07] bg-white/[.025] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="text-[9px] font-black uppercase tracking-[.17em] text-cyan-200/75">{selected.targetLabel}</div><h4 className="mt-1 text-lg font-black text-white">{selected.classLabel}</h4><p className="mt-1.5 max-w-3xl text-xs font-medium leading-relaxed text-white/50">{selected.summary}</p></div>
              <div className="flex flex-wrap gap-1.5 sm:max-w-[240px] sm:justify-end">{selected.representativeExamples.map((example) => <span key={example} className="rounded-full border border-white/[.08] bg-black/30 px-2.5 py-1 text-[9px] font-bold text-white/45">{example}</span>)}</div>
            </div>

            <div className="mt-4 grid gap-2.5">
              {selected.mechanismChain.map((step, index) => (
                <div key={step.id} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2.5">
                  <div className="flex flex-col items-center"><div className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/45 text-[10px] font-black text-white/60">{index + 1}</div>{index < selected.mechanismChain.length - 1 && <div className="my-1 min-h-7 w-px flex-1 bg-gradient-to-b from-white/14 to-white/[.035]" aria-hidden />}</div>
                  <div className="rounded-[18px] border border-white/[.065] bg-black/25 p-3"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[.12em] ${LAYER_ACCENT[step.layer]}`}>{LAYER_LABELS[step.layer]}</span><strong className="text-xs font-black text-white/85">{step.label}</strong></div><p className="mt-1.5 text-[11px] font-medium leading-relaxed text-white/46">{step.mechanism}</p></div>
                </div>
              ))}
            </div>
          </article>

          <aside className="grid content-start gap-3">
            <div className="rounded-[22px] border border-violet-300/10 bg-violet-300/[.035] p-3.5"><div className="text-[9px] font-black uppercase tracking-[.16em] text-violet-100/65">Pathophysiology links</div><div className="mt-2 flex flex-wrap gap-1.5">{selected.linkedScenarioIds.map((scenarioId) => <span key={scenarioId} className="rounded-full border border-violet-200/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-violet-50/70">{scenarioId}</span>)}</div><p className="mt-2.5 text-[10px] font-medium leading-relaxed text-white/38">A link means the mechanism intersects that disease network. It does not mean the class is automatically indicated for every presentation of that disease.</p></div>
            <div className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[.025] p-3.5"><div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/65">Teaching relationship</div>{selected.equations.map((equation) => <div key={equation.expression} className="mt-2 rounded-2xl border border-white/[.06] bg-black/25 p-3"><div className="font-mono text-[11px] font-black text-cyan-100/80">{equation.expression}</div><div className="mt-1 text-[10px] font-black text-white/65">{equation.label}</div><p className="mt-1 text-[9px] font-medium leading-relaxed text-white/35">{equation.note}</p></div>)}</div>
            <div className="rounded-[22px] border border-white/[.07] bg-white/[.022] p-3.5"><div className="text-[9px] font-black uppercase tracking-[.16em] text-white/40">Evidence anchors</div><div className="mt-2 grid gap-2">{selected.evidence.map((source) => <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/[.06] bg-black/25 p-2.5 transition hover:border-cyan-300/15 hover:bg-white/[.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"><div className="text-[9px] font-black uppercase tracking-[.12em] text-cyan-100/60">PMID {source.pmid} · {source.year}</div><div className="mt-1 text-[10px] font-bold leading-snug text-white/62">{source.title}</div><div className="mt-1 text-[9px] font-medium leading-relaxed text-white/34">{source.role}</div></a>)}</div></div>
          </aside>
        </div>
      )}

      <details className="relative mt-3 rounded-[22px] border border-white/[.07] bg-black/30 p-3"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[.15em] text-white/55">General PK/PD teaching equations</summary><div className="mt-3 grid gap-2 md:grid-cols-2">{PHARMACOLOGY_TEACHING_EQUATIONS.map((equation) => <div key={equation.expression} className="rounded-2xl border border-white/[.06] bg-white/[.022] p-3"><div className="font-mono text-[11px] font-black text-fuchsia-100/75">{equation.expression}</div><div className="mt-1 text-[10px] font-black text-white/62">{equation.label}</div><p className="mt-1 text-[9px] font-medium leading-relaxed text-white/34">{equation.note}</p></div>)}</div></details>

      <p className="relative mt-3 rounded-[20px] border border-amber-200/10 bg-amber-200/[.035] px-3 py-2.5 text-[10px] font-semibold leading-relaxed text-amber-50/52">{BODY_PHARMACOLOGY_NETWORK_BOUNDARY}</p>
    </section>
  )
}

export default PharmacologyMechanismPanel
