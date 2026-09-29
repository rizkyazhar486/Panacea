import { useMemo, useState } from 'react'
import {
  MENTAL_HEALTH_COMPOUND_MODELS,
  MENTAL_HEALTH_DAILY_BEHAVIORS,
  compoundsForMentalHealthDomain,
  simulateNormalizedExposure,
  simulateReceptorOccupancy,
  type MentalHealthResearchDomain,
} from '../lib/mentalHealthClinicalResearch'

const DOMAIN_LABELS: Record<MentalHealthResearchDomain, string> = {
  depression: 'Depression',
  anxiety: 'Anxiety',
  loneliness: 'Loneliness',
}

const EVIDENCE_LABELS = {
  'established-clinical': 'Established clinical',
  'approved-context': 'Approved context',
  'emerging-human': 'Emerging human',
  'mechanistic-hypothesis': 'Mechanistic hypothesis',
  'research-only': 'Research only',
} as const

export function MentalHealthClinicalResearchLab() {
  const [domain, setDomain] = useState<MentalHealthResearchDomain>('depression')
  const available = useMemo(() => compoundsForMentalHealthDomain(domain), [domain])
  const [compoundId, setCompoundId] = useState(MENTAL_HEALTH_COMPOUND_MODELS[0].id)
  const [halfLife, setHalfLife] = useState('12')
  const [elapsed, setElapsed] = useState('6')
  const [ligand, setLigand] = useState('1')
  const [kd, setKd] = useState('1')

  const selected =
    available.find((item) => item.id === compoundId) ??
    available[0] ??
    MENTAL_HEALTH_COMPOUND_MODELS[0]

  const exposure = simulateNormalizedExposure({
    halfLifeHours: Number(halfLife),
    elapsedHours: Number(elapsed),
  })
  const occupancy = simulateReceptorOccupancy({
    ligandConcentration: Number(ligand),
    dissociationConstant: Number(kd),
  })

  function chooseDomain(next: MentalHealthResearchDomain) {
    setDomain(next)
    const first = compoundsForMentalHealthDomain(next)[0]
    if (first) setCompoundId(first.id)
  }

  return (
    <section
      aria-labelledby="mental-health-clinical-research-title"
      className="border-y border-white/10 py-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-200/60">
            Clinical research surface
          </div>
          <h2
            id="mental-health-clinical-research-title"
            className="mt-1 text-xl font-black tracking-[-.035em]"
          >
            Neuropsychiatric mechanism + routine lab
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-white/50">
            Molecular pharmacology, social biology and longitudinal behavior in one
            clinician-facing research surface. It is deliberately not a chatbot and
            does not prescribe medication.
          </p>
        </div>
        <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/30">
          mechanism ≠ recommendation
        </div>
      </div>

      <div className="mt-6 flex gap-5 overflow-x-auto border-b border-white/10" role="tablist" aria-label="Mental-health research domain">
        {(Object.keys(DOMAIN_LABELS) as MentalHealthResearchDomain[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={domain === item}
            onClick={() => chooseDomain(item)}
            className={`min-h-[44px] shrink-0 border-b px-1 text-xs font-black transition ${
              domain === item
                ? 'border-emerald-300 text-white'
                : 'border-transparent text-white/38 hover:text-white/70'
            }`}
          >
            {DOMAIN_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <div>
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                Compound / mechanism model
              </div>
              <select
                value={selected.id}
                onChange={(event) => setCompoundId(event.target.value)}
                className="mt-2 min-h-[44px] w-full max-w-xl border-b border-white/20 bg-black py-2 text-sm font-black text-white outline-none sm:min-w-[380px]"
              >
                {available.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="w-fit rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.1em] text-white/55">
              {EVIDENCE_LABELS[selected.evidenceClass]}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-white/66">
            {selected.clinicalContext}
          </p>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Mechanistic targets">
            {selected.targets.map((target) => (
              <span
                key={target}
                className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/50"
              >
                {target}
              </span>
            ))}
          </div>

          <ol className="mt-6 border-l border-white/10 pl-5">
            {selected.mechanism.map((step, index) => (
              <li key={step.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[25px] top-1 grid h-3 w-3 place-items-center rounded-full bg-emerald-300 text-[0px]">
                  {index + 1}
                </span>
                <div className="text-[9px] font-black uppercase tracking-[.13em] text-white/30">
                  {step.layer}
                </div>
                <div className="mt-1 text-sm font-black text-white">{step.label}</div>
                <p className="mt-1 text-xs leading-relaxed text-white/48">{step.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
              Evidence anchors
            </div>
            <div className="mt-3 space-y-3">
              {selected.evidence.map((source) => (
                <a
                  key={source.pmid}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border-b border-white/10 pb-3 text-xs text-white/55 transition hover:text-white"
                >
                  <strong className="text-white/78">{source.title}</strong>
                  <span className="ml-2 text-white/28">PMID {source.pmid} · {source.year}</span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-white/35">{source.role}</span>
                </a>
              ))}
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-amber-100/55">{selected.guardrail}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="border-t border-white/10 pt-4">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
              Generic PK / target-engagement sandbox
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/42">
              User-supplied teaching parameters only. These are not defaults for the
              selected compound and are never converted into a dose.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <label className="border-b border-white/10 pb-2">
                <span className="block text-[9px] font-black uppercase tracking-[.11em] text-white/30">
                  Half-life · h
                </span>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0.01"
                  value={halfLife}
                  onChange={(event) => setHalfLife(event.target.value)}
                  className="mt-2 w-full bg-transparent text-lg font-black outline-none"
                />
              </label>
              <label className="border-b border-white/10 pb-2">
                <span className="block text-[9px] font-black uppercase tracking-[.11em] text-white/30">
                  Elapsed · h
                </span>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  value={elapsed}
                  onChange={(event) => setElapsed(event.target.value)}
                  className="mt-2 w-full bg-transparent text-lg font-black outline-none"
                />
              </label>
              <label className="border-b border-white/10 pb-2">
                <span className="block text-[9px] font-black uppercase tracking-[.11em] text-white/30">
                  [L] · same units
                </span>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  value={ligand}
                  onChange={(event) => setLigand(event.target.value)}
                  className="mt-2 w-full bg-transparent text-lg font-black outline-none"
                />
              </label>
              <label className="border-b border-white/10 pb-2">
                <span className="block text-[9px] font-black uppercase tracking-[.11em] text-white/30">
                  Kd · same units
                </span>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0.000001"
                  value={kd}
                  onChange={(event) => setKd(event.target.value)}
                  className="mt-2 w-full bg-transparent text-lg font-black outline-none"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-5">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.11em] text-white/30">
                  Relative concentration
                </div>
                <output className="mt-1 block text-3xl font-black tabular-nums">
                  {exposure ? `${(exposure.fractionRemaining * 100).toFixed(1)}%` : '—'}
                </output>
                <div className="mt-1 text-[9px] font-bold text-white/28">
                  C(t)/C₀ = 2<sup>−t/t½</sup>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.11em] text-white/30">
                  Simple occupancy
                </div>
                <output className="mt-1 block text-3xl font-black tabular-nums">
                  {occupancy ? `${(occupancy.occupancyFraction * 100).toFixed(1)}%` : '—'}
                </output>
                <div className="mt-1 text-[9px] font-bold text-white/28">
                  θ = [L] ÷ (Kd + [L])
                </div>
              </div>
            </div>

            <p className="mt-4 text-[10px] leading-relaxed text-white/32">
              These equations are deliberately generic. Real psychiatric PK/PD can
              include absorption, active metabolites, protein binding, nonlinear
              kinetics, brain exposure, receptor kinetics and delayed network adaptation.
            </p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
              Longitudinal behavior foundation
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/42">
              Reset-style daily actions become measured exposures across weeks and
              months, not moral streaks or a substitute for treatment.
            </p>

            <div className="mt-4 divide-y divide-white/10">
              {MENTAL_HEALTH_DAILY_BEHAVIORS.map((item) => (
                <details key={item.id} className="group py-3">
                  <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-3 text-xs font-black text-white/72">
                    <span>{item.label}</span>
                    <span className="text-white/25 transition group-open:rotate-45" aria-hidden>＋</span>
                  </summary>
                  <div className="pb-2 text-[10px] leading-relaxed text-white/42">
                    <p><strong className="text-white/60">Intent:</strong> {item.intent}</p>
                    <p className="mt-1"><strong className="text-white/60">Track:</strong> {item.measurement}</p>
                    <p className="mt-1 text-amber-100/48"><strong>Boundary:</strong> {item.boundary}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3 text-[9px] font-bold text-white/30">
              adherence = completed observed actions ÷ all observed actions · missing data excluded
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MentalHealthClinicalResearchLab
