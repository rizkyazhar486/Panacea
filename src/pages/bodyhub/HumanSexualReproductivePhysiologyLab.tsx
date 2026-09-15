import { useMemo, useState } from 'react'
import {
  HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY,
  stageAt,
  stagesForDomain,
  type SexualReproductiveDomain,
} from '../../lib/humanSexualReproductivePhysiology'

const DOMAIN_LABELS: Array<[SexualReproductiveDomain, string]> = [
  ['sexual-response', 'Sexual response'],
  ['endocrine-cycle', 'Hormonal cycle'],
  ['fertilization', 'Fertilization'],
  ['pregnancy', 'Pregnancy'],
  ['labour', 'Labour'],
  ['pregnancy-disorders', 'Pregnancy disorders'],
  ['sexual-dysfunction', 'Sexual dysfunction'],
  ['orientation-gender', 'Orientation & gender'],
]

export default function HumanSexualReproductivePhysiologyLab() {
  const [domain, setDomain] = useState<SexualReproductiveDomain>('sexual-response')
  const [progress, setProgress] = useState(0)
  const stages = useMemo(() => stagesForDomain(domain), [domain])
  const active = stageAt(domain, progress)

  return (
    <section aria-labelledby="sexual-reproductive-physiology-title" className="space-y-3 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Body Exposure · physiology</p>
        <h3 id="sexual-reproductive-physiology-title" className="text-sm font-black text-ink dark:text-white">Human sexual & reproductive physiology</h3>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
          Interactive educational mechanism map. It separates anatomy, physiology, identity and clinical disorders; it does not diagnose a person or infer identity from anatomy, hormones, genes or behavior.
        </p>
      </div>

      <div role="tablist" aria-label="Sexual and reproductive physiology domains" className="flex gap-1.5 overflow-x-auto pb-1">
        {DOMAIN_LABELS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={domain === id}
            onClick={() => { setDomain(id); setProgress(0) }}
            className={`min-h-[44px] shrink-0 rounded-full border px-3 text-[11px] font-bold ${domain === id ? 'border-brand bg-brand text-white' : 'border-neutral-200 dark:border-white/10'}`}
          >{label}</button>
        ))}
      </div>

      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
        Mechanism timeline
        <input
          aria-label="Mechanism timeline"
          type="range"
          min="0"
          max="100"
          value={Math.round(progress * 100)}
          onChange={(event) => setProgress(Number(event.target.value) / 100)}
          className="mt-2 w-full"
        />
      </label>

      {active && (
        <div role="region" aria-live="polite" className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-black text-ink dark:text-white">{active.label}</h4>
            <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{stages.indexOf(active) + 1}/{stages.length}</span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {active.mechanisms.map((item) => <li key={item} className="text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">• {item}</li>)}
          </ul>
          {active.structures.length > 0 && <p className="mt-2 text-[10.5px] text-neutral-500"><strong>Structures:</strong> {active.structures.join(' · ')}</p>}
          {active.hormones.length > 0 && <p className="mt-1 text-[10.5px] text-neutral-500"><strong>Signals:</strong> {active.hormones.join(' · ')}</p>}
          {active.clinicalBoundary && <p className="mt-2 rounded-lg border border-neutral-200 p-2 text-[10.5px] leading-relaxed text-neutral-600 dark:border-white/10 dark:text-neutral-300"><strong>Boundary:</strong> {active.clinicalBoundary}</p>}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {HUMAN_SEXUAL_REPRODUCTIVE_PHYSIOLOGY.filter((stage) => stage.domain === domain).map((stage) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => {
              const index = stages.findIndex((candidate) => candidate.id === stage.id)
              setProgress(stages.length <= 1 ? 0 : index / stages.length)
            }}
            className="min-h-[44px] rounded-xl border border-neutral-200 px-3 py-2 text-left text-[11px] font-semibold dark:border-white/10"
          >{stage.label}</button>
        ))}
      </div>

      <p className="text-[10px] leading-relaxed text-neutral-500">
        Sexual orientation, lesbian/gay/bisexual identities, transgender identity and gender expression are represented as human diversity, not disease. Sexual dysfunction, genito-pelvic pain/penetration difficulty, hyperemesis gravidarum and hypertensive pregnancy disorders remain separate clinical topics requiring individualized assessment.
      </p>
    </section>
  )
}
