import { useMemo, useState } from 'react'
import {
  AGI_LONGEVITY_BOUNDARY,
  AGI_LONGEVITY_DOMAINS,
  evaluateAgiResearchReadiness,
  type AgiLongevityDomainId,
} from '../../lib/agiLongevitySystems'

export default function AGILongevitySystemsLab() {
  const [domainId, setDomainId] = useState<AgiLongevityDomainId>('whole-cell-digital-twin')
  const [modelFidelity, setModelFidelity] = useState(45)
  const [experimentalGrounding, setExperimentalGrounding] = useState(40)
  const [actuationControl, setActuationControl] = useState(25)
  const [prospectiveValidation, setProspectiveValidation] = useState(20)

  const domain = AGI_LONGEVITY_DOMAINS.find((item) => item.id === domainId) ?? AGI_LONGEVITY_DOMAINS[0]
  const readiness = useMemo(
    () => evaluateAgiResearchReadiness({ modelFidelity, experimentalGrounding, actuationControl, prospectiveValidation }),
    [modelFidelity, experimentalGrounding, actuationControl, prospectiveValidation],
  )

  return (
    <section className="space-y-3" aria-label="AGI longevity systems engineering research simulator">
      <header className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">Frontier Medicine · AGI Systems Engineering</div>
            <h2 className="mt-1 text-lg font-black text-ink dark:text-white">Longevity research orchestration sandbox</h2>
            <p className="mt-2 max-w-4xl text-[11px] leading-relaxed text-neutral-500">Explore how stronger models, better experiments, controllable actuation and prospective validation constrain one another. The weakest link matters more than a visually impressive average.</p>
          </div>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">CONCEPTUAL · NOT CLINICAL</span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{AGI_LONGEVITY_BOUNDARY}</p>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {AGI_LONGEVITY_DOMAINS.map((item) => (
          <button key={item.id} type="button" onClick={() => setDomainId(item.id)} aria-pressed={item.id === domain.id}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${item.id === domain.id ? 'bg-brand text-white' : 'border border-white/10 text-neutral-500'}`}>
            {item.title}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
        <article className="rounded-2xl border border-white/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-ink dark:text-white">{domain.title}</h3>
            <span className="text-[9px] font-black uppercase text-neutral-500">{domain.evidence}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">{domain.problem}</p>
          <div className="mt-3 rounded-xl bg-neutral-100/60 p-3 dark:bg-white/5">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">AGI role</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{domain.agiRole}</p>
          </div>
          <div className="mt-2 rounded-xl bg-neutral-100/60 p-3 dark:bg-white/5">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Visual model</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{domain.visualModel}</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-2.5"><div className="text-[9px] font-black uppercase text-neutral-500">Candidate capabilities</div><div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{domain.candidateCapabilities.join(' · ')}</div></div>
            <div className="rounded-xl border border-white/10 p-2.5"><div className="text-[9px] font-black uppercase text-neutral-500">Hard bottlenecks</div><div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{domain.hardBottlenecks.join(' · ')}</div></div>
          </div>
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5">
            <div className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-300">What would falsify the model?</div>
            <div className="mt-1 text-[10px] leading-relaxed text-neutral-500">{domain.falsificationChecks.join(' · ')}</div>
          </div>
        </article>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-white/10 p-3">
            <div className="flex items-baseline justify-between gap-2"><div className="text-sm font-black text-ink dark:text-white">Research translation gate</div><div className="text-xl font-black text-brand">{readiness.composite}%</div></div>
            <p className="mt-1 text-[10px] text-neutral-500">Synthetic sensitivity model only. Composite is geometric; gate fails on the weakest link.</p>
            <div className="mt-3 space-y-2">
              <Slider label="Model fidelity" value={modelFidelity} set={setModelFidelity} />
              <Slider label="Experimental grounding" value={experimentalGrounding} set={setExperimentalGrounding} />
              <Slider label="Actuation control" value={actuationControl} set={setActuationControl} />
              <Slider label="Prospective validation" value={prospectiveValidation} set={setProspectiveValidation} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-neutral-100/60 p-2 dark:bg-white/5"><div className="text-lg font-black text-ink dark:text-white">{readiness.weakestLink}%</div><div className="text-[9px] uppercase text-neutral-500">weakest link</div></div>
              <div className="rounded-xl bg-neutral-100/60 p-2 dark:bg-white/5"><div className="text-lg font-black text-ink dark:text-white">{readiness.researchGate ? 'PASS' : 'BLOCKED'}</div><div className="text-[9px] uppercase text-neutral-500">research gate</div></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 p-3">
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-500">Evidence anchors</div>
            <div className="mt-2 space-y-2">
              {domain.evidenceAnchors.map((anchor) => (
                <article key={anchor.pmid} className="rounded-xl bg-neutral-100/60 p-2.5 dark:bg-white/5">
                  <div className="text-[10px] font-black text-ink dark:text-white">PMID {anchor.pmid} · {anchor.label}</div>
                  <p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{anchor.relevance}</p>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function Slider({ label, value, set }: { label: string; value: number; set: (value: number) => void }) {
  return <label className="grid grid-cols-[130px_1fr_36px] items-center gap-2 text-[10px] text-neutral-500"><span>{label}</span><input type="range" min={0} max={100} value={value} onChange={(event) => set(Number(event.target.value))} className="w-full accent-brand" /><span className="text-right font-bold tabular-nums">{value}</span></label>
}
