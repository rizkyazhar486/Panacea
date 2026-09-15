import { useMemo, useState } from 'react'
import {
  PRECISION_CARE_DEMO_SERVICES,
  PRECISION_CARE_STAGES,
  informationValue,
  precisionCareGate,
  serviceEconomics,
} from '../lib/precisionCareOrchestration'

function rupiah(value: number | undefined) {
  if (value === undefined) return '—'
  return `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)}`
}

function clamp100(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function PrecisionCareOrchestrationBoard() {
  const [selectedId, setSelectedId] = useState(PRECISION_CARE_DEMO_SERVICES[0].id)
  const base = PRECISION_CARE_DEMO_SERVICES.find((service) => service.id === selectedId) ?? PRECISION_CARE_DEMO_SERVICES[0]
  const [patientSpecific, setPatientSpecific] = useState(true)
  const [clinicianReviewed, setClinicianReviewed] = useState(false)
  const [dataGapFit, setDataGapFit] = useState(base.dataGapFit)
  const [burden, setBurden] = useState(base.burden)
  const [redundancy, setRedundancy] = useState(base.redundancy)
  const [costTransparency, setCostTransparency] = useState(base.costTransparency)
  const [platformRatePct, setPlatformRatePct] = useState(10)
  const [listPriceIdr, setListPriceIdr] = useState(base.estimatedPriceIdr ?? 0)

  const current = useMemo(
    () => ({ ...base, dataGapFit, burden, redundancy, costTransparency }),
    [base, dataGapFit, burden, redundancy, costTransparency],
  )
  const value = informationValue(current)
  const gate = precisionCareGate(current, { patientSpecific, clinicianReviewed })
  const economics = serviceEconomics(listPriceIdr, platformRatePct / 100)

  function selectService(id: string) {
    const next = PRECISION_CARE_DEMO_SERVICES.find((service) => service.id === id)
    if (!next) return
    setSelectedId(next.id)
    setDataGapFit(next.dataGapFit)
    setBurden(next.burden)
    setRedundancy(next.redundancy)
    setCostTransparency(next.costTransparency)
    setListPriceIdr(next.estimatedPriceIdr ?? 0)
  }

  return (
    <section className="space-y-4" aria-labelledby="precision-care-title">
      <div className="relative overflow-hidden rounded-[28px] border border-emerald-300/15 bg-[#020509] p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,.34)] sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-200">Panacea Precision + Care</div>
          <h2 id="precision-care-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Turn diagnostics into an evidence-gated care loop
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-white/64">
            The commercial layer should not reward more tests by default. It should reward the least-burdensome next step that closes a real information gap,
            survives evidence review, receives the required clinician decision, and returns measurable outcomes to the Health Graph.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Service candidates</div>
          <h3 className="mt-1 text-lg font-black">Compare by information value, not sales value</h3>
          <div className="mt-4 space-y-2">
            {PRECISION_CARE_DEMO_SERVICES.map((service) => {
              const score = informationValue(service).net
              const selected = service.id === selectedId
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => selectService(service.id)}
                  aria-pressed={selected}
                  className={`w-full rounded-2xl border p-3 text-left transition active:scale-[.99] ${
                    selected ? 'border-cyan-300/30 bg-cyan-300/[.07]' : 'border-white/8 bg-white/[.025] hover:border-white/14'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-white">{service.label}</div>
                      <p className="mt-1 text-[10px] leading-relaxed text-white/46">{service.purpose}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[9px] font-black uppercase tracking-wide text-white/38">Net info</div>
                      <div className="text-lg font-black text-cyan-100">{score}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-wide">
                    <span className="rounded-full border border-white/10 px-2 py-1 text-white/55">Evidence {service.evidenceTier}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-white/55">{service.category}</span>
                    {service.requiresClinician ? <span className="rounded-full border border-amber-300/20 bg-amber-300/[.06] px-2 py-1 text-amber-100">Clinician gate</span> : null}
                  </div>
                </button>
              )
            })}
          </div>
        </article>

        <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Information-value workbench</div>
              <h3 className="mt-1 text-lg font-black">{base.label}</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white/66">
              Gate: {gate.replaceAll('-', ' ')}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <RangeControl label="Data-gap fit" value={dataGapFit} onChange={setDataGapFit} />
            <RangeControl label="Cost transparency" value={costTransparency} onChange={setCostTransparency} />
            <RangeControl label="Patient burden" value={burden} onChange={setBurden} inverse />
            <RangeControl label="Redundancy" value={redundancy} onChange={setRedundancy} inverse />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Gross value" value={value.gross.toFixed(1)} />
            <Metric label="Burden penalty" value={`−${value.penalty.toFixed(1)}`} />
            <Metric label="Net information" value={value.net.toFixed(1)} />
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
            NetInfo = 0.30E + 0.25I + 0.20A + 0.15G + 0.10C − 0.15B − 0.10R. This is a transparent Panacea product-triage heuristic,
            not a validated clinical equation, diagnostic score, coverage rule, or authorization to order a service.
          </p>
        </article>
      </div>

      <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
        <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-200">Care orchestration contract</div>
        <h3 className="mt-1 text-lg font-black">Every paid service must return to an outcome loop</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRECISION_CARE_STAGES.map((stage, index) => (
            <div key={stage} className="relative rounded-2xl border border-white/8 bg-white/[.025] p-3">
              <div className="text-[10px] font-black text-cyan-100">0{index + 1}</div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-white/72">{stage}</p>
              {index < PRECISION_CARE_STAGES.length - 1 ? (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-white/20 lg:block" aria-hidden>→</span>
              ) : null}
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <article className="rounded-[26px] border border-white/10 bg-[#03070b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Transparent marketplace economics</div>
          <h3 className="mt-1 text-lg font-black">Model the transaction without hiding incentives</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NumberField label="Illustrative list price (IDR)" value={listPriceIdr} min={0} max={100000000} step={50000} onChange={setListPriceIdr} />
            <NumberField label="Illustrative platform rate (%)" value={platformRatePct} min={0} max={30} step={1} onChange={setPlatformRatePct} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Patient price" value={rupiah(economics?.listPriceIdr)} />
            <Metric label="Provider payout" value={rupiah(economics?.providerPayoutIdr)} />
            <Metric label="Platform gross" value={rupiah(economics?.platformGrossIdr)} />
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-white/38">
            Sandbox economics only. Actual fees must account for payment processing, tax, refunds, provider contracts, clinical compensation rules, anti-kickback/referral restrictions,
            consumer protection, and local regulation before launch.
          </p>
        </article>

        <article className="rounded-[26px] border border-emerald-300/15 bg-gradient-to-br from-[#03070b] to-emerald-400/[.045] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.24)] sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">Commercial rule</div>
          <h3 className="mt-1 text-lg font-black">Panacea gets paid for coordination, not unnecessary intensity</h3>
          <div className="mt-4 space-y-2 text-xs leading-relaxed text-white/64">
            <p className="rounded-2xl border border-white/8 bg-white/[.025] p-3">A service stays visible even when its information value is low; the system should explain why instead of silently suppressing alternatives.</p>
            <p className="rounded-2xl border border-white/8 bg-white/[.025] p-3">Research-only and blocked evidence states cannot be promoted by a higher price, margin, engagement score, or growth target.</p>
            <p className="rounded-2xl border border-white/8 bg-white/[.025] p-3">No order, booking, payment, diagnosis, or treatment decision is executed from this board. It defines the product contract that later production adapters must satisfy.</p>
          </div>
        </article>
      </div>
    </section>
  )
}

function RangeControl({
  label,
  value,
  onChange,
  inverse = false,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  inverse?: boolean
}) {
  return (
    <label className="rounded-2xl border border-white/8 bg-white/[.025] p-3">
      <span className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wide text-white/42">
        <span>{label}</span><span className={inverse ? 'text-amber-100' : 'text-cyan-100'}>{clamp100(value)}</span>
      </span>
      <input
        className="mt-3 w-full accent-cyan-300"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[.025] p-3 text-center">
      <div className="text-[9px] font-black uppercase tracking-wide text-white/38">{label}</div>
      <div className="mt-1 text-sm font-black text-white sm:text-base">{value}</div>
    </div>
  )
}
