import { useMemo, useState } from 'react'
import {
  DEFENSIBILITY_FLYWHEEL,
  EVIDENCE_TIERS,
  HEALTH_GRAPH_DOMAINS,
  PANACEA_POSITIONING,
  REVENUE_LAYERS,
  VALUE_LOOP,
  deliveryGate,
  estimateCacPaybackMonths,
  estimateLtv,
  healthGraphCoverage,
  ltvCacRatio,
  type EvidenceTier,
} from '../lib/panaceaOperatingModel'

function money(value: number | undefined) {
  if (value === undefined) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function decimal(value: number | undefined, digits = 1) {
  if (value === undefined) return '—'
  return value.toFixed(digits)
}

export function PanaceaOperatingModelBoard() {
  const [monthlyArpu, setMonthlyArpu] = useState(29)
  const [grossMarginPct, setGrossMarginPct] = useState(78)
  const [monthlyChurnPct, setMonthlyChurnPct] = useState(3)
  const [cac, setCac] = useState(70)
  const [observedDomains, setObservedDomains] = useState(6)
  const [tier, setTier] = useState<EvidenceTier>('B')
  const [patientSpecific, setPatientSpecific] = useState(true)
  const [clinicianReviewed, setClinicianReviewed] = useState(false)

  const economics = useMemo(() => {
    const grossMarginRate = grossMarginPct / 100
    const monthlyChurnRate = monthlyChurnPct / 100
    const ltv = estimateLtv(monthlyArpu, grossMarginRate, monthlyChurnRate)
    const payback = estimateCacPaybackMonths(cac, monthlyArpu, grossMarginRate)
    const ratio = ltv === undefined ? undefined : ltvCacRatio(ltv, cac)
    return { ltv, payback, ratio }
  }, [monthlyArpu, grossMarginPct, monthlyChurnPct, cac])

  const gate = deliveryGate(tier, { patientSpecific, clinicianReviewed })
  const coverage = healthGraphCoverage(observedDomains)

  return (
    <section className="space-y-4" aria-labelledby="panacea-intelligence-os-title">
      <div className="relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[#020509] p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,.36)] sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Recommended strategic core</div>
          <h2 id="panacea-intelligence-os-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Panacea Intelligence OS
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-white/64">{PANACEA_POSITIONING}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide">
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-emerald-100">Intelligence-first</span>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">Longitudinal</span>
            <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1.5 text-violet-100">Evidence-gated</span>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-amber-100">Clinician-centered</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Health Graph</div>
              <h3 className="mt-1 text-lg font-black">One longitudinal model of the person</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.035] px-3 py-2 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/42">Demo completeness</div>
              <div className="text-xl font-black text-cyan-100">{coverage}%</div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {HEALTH_GRAPH_DOMAINS.map((domain, index) => {
              const active = index < observedDomains
              return (
                <button
                  key={domain.key}
                  type="button"
                  onClick={() => setObservedDomains(active && index === observedDomains - 1 ? Math.max(0, index) : index + 1)}
                  className={`min-h-[74px] rounded-2xl border p-3 text-left transition active:scale-[.99] ${
                    active
                      ? 'border-cyan-300/25 bg-gradient-to-br from-emerald-300/[.08] via-cyan-300/[.06] to-violet-400/[.07]'
                      : 'border-white/8 bg-white/[.025] hover:border-white/14'
                  }`}
                >
                  <div className="text-xs font-black text-white">{domain.label}</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/45">{domain.examples}</p>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-white/38">
            Completeness is only data coverage. It is not a health score, risk prediction or clinical conclusion.
          </p>
        </article>

        <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-200">Closed-loop advantage</div>
          <h3 className="mt-1 text-lg font-black">Do not stop at measurement</h3>
          <div className="mt-4 space-y-2">
            {VALUE_LOOP.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[.025] px-3 py-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 via-cyan-300 to-violet-300 text-[11px] font-black text-[#020509]">
                  {index + 1}
                </span>
                <div className="text-xs font-bold text-white/82">{step}</div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Evidence Engine</div>
            <h3 className="mt-1 text-lg font-black">Make trust a product feature</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white/62">
            Gate: {gate.replaceAll('-', ' ')}
          </span>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {EVIDENCE_TIERS.map((definition) => (
            <button
              key={definition.tier}
              type="button"
              onClick={() => setTier(definition.tier)}
              aria-pressed={tier === definition.tier}
              className={`rounded-2xl border p-3 text-left transition active:scale-[.99] ${
                tier === definition.tier
                  ? 'border-cyan-200/35 bg-cyan-300/[.08] shadow-[0_10px_32px_rgba(34,211,238,.08)]'
                  : 'border-white/8 bg-white/[.025] hover:border-white/14'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-black text-white">{definition.tier}</span>
                <span className="text-[9px] font-black uppercase tracking-wide text-white/38">{definition.label}</span>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-white/48">{definition.meaning}</p>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPatientSpecific((value) => !value)}
            className={`min-h-[42px] rounded-xl border px-3 text-xs font-bold ${patientSpecific ? 'border-violet-300/35 bg-violet-300/10 text-violet-100' : 'border-white/10 bg-white/[.025] text-white/55'}`}
          >
            Patient-specific: {patientSpecific ? 'yes' : 'no'}
          </button>
          <button
            type="button"
            onClick={() => setClinicianReviewed((value) => !value)}
            className={`min-h-[42px] rounded-xl border px-3 text-xs font-bold ${clinicianReviewed ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/[.025] text-white/55'}`}
          >
            Clinician reviewed: {clinicianReviewed ? 'yes' : 'no'}
          </button>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-white/38">
          This gate is a product-governance rule, not a treatment recommendation. Patient-specific clinical actions remain clinician-controlled.
        </p>
      </article>

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Business engine</div>
          <h3 className="mt-1 text-lg font-black">Subscription economics simulator</h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NumberField label="Monthly ARPU ($)" value={monthlyArpu} min={1} max={1000} step={1} onChange={setMonthlyArpu} />
            <NumberField label="Gross margin (%)" value={grossMarginPct} min={1} max={100} step={1} onChange={setGrossMarginPct} />
            <NumberField label="Monthly churn (%)" value={monthlyChurnPct} min={0.1} max={100} step={0.1} onChange={setMonthlyChurnPct} />
            <NumberField label="CAC ($)" value={cac} min={0} max={10000} step={5} onChange={setCac} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Estimated LTV" value={`$${money(economics.ltv)}`} />
            <Metric label="CAC payback" value={`${decimal(economics.payback)} mo`} />
            <Metric label="LTV / CAC" value={`${decimal(economics.ratio)}×`} />
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-white/38">
            LTV = monthly ARPU × gross margin ÷ monthly churn. CAC payback = CAC ÷ monthly contribution margin. These are planning heuristics, not forecasts.
          </p>
        </article>

        <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Monetization architecture</div>
          <h3 className="mt-1 text-lg font-black">Several businesses, one shared intelligence layer</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {REVENUE_LAYERS.map((layer) => (
              <div key={layer.name} className="rounded-2xl border border-white/8 bg-white/[.025] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-white">{layer.name}</div>
                  <div className="text-[9px] font-black uppercase tracking-wide text-cyan-100/70">{layer.role}</div>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-white/45">{layer.monetization}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
        <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-200">Defensibility</div>
        <h3 className="mt-1 text-lg font-black">The moat is the learning loop, not a biomarker count</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {DEFENSIBILITY_FLYWHEEL.map((item, index) => (
            <div key={item} className="relative rounded-2xl border border-white/8 bg-white/[.025] p-3">
              <div className="text-[10px] font-black text-cyan-100">0{index + 1}</div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-white/72">{item}</p>
              {index < DEFENSIBILITY_FLYWHEEL.length - 1 ? (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-white/20 xl:block" aria-hidden>→</span>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-white/38">
          Any learning or model improvement must use appropriately consented, governed and privacy-preserving data. Identifiable health data is not a resale product.
        </p>
      </article>
    </section>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="rounded-2xl border border-white/8 bg-white/[.025] p-3">
      <span className="block text-[10px] font-black uppercase tracking-wide text-white/42">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none transition focus:border-cyan-300/40"
      />
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-white/[.045] to-white/[.02] p-3 text-center">
      <div className="text-base font-black text-cyan-100 sm:text-lg">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-wide text-white/38">{label}</div>
    </div>
  )
}
