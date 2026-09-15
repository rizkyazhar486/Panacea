import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CAUSAL_DOMAINS,
  CAUSAL_FORMULA_LEDGER,
  SCALE_LABELS,
  SCALE_ORDER,
  causalTimeline,
  deriveCounterfactualPair,
  scaleConcept,
  type CausalDomain,
  type CausalScale,
} from '../../lib/causalTimeMachine'

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/45">{label}</div>
      <div className="mt-1 text-xl font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] leading-relaxed text-white/45">{note}</div>
    </div>
  )
}

function Slider({ label, value, onChange, hint }: { label: string; value: number; onChange: (value: number) => void; hint: string }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[.14em] text-white/60">{label}</span>
        <span className="font-mono text-xs font-bold text-cyan-200">{Math.round(value * 100)}</span>
      </div>
      <input
        className="mt-3 w-full accent-cyan-300"
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <div className="mt-1 text-[9px] leading-relaxed text-white/35">{hint}</div>
    </label>
  )
}

function TimelineChart({ domain, perturbation, reserve, demand, forked }: {
  domain: CausalDomain
  perturbation: number
  reserve: number
  demand: number
  forked: boolean
}) {
  const points = useMemo(() => causalTimeline(domain, { perturbation, reserve, demand }), [domain, perturbation, reserve, demand])
  const toPath = (key: 'primary' | 'relief') => points.map((point, index) => {
    const x = (point.time / 100) * 280
    const y = 88 - point[key].transport * 72
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/40">Forkable worldline</div>
          <div className="text-xs font-bold text-white/80">Drag time, then compare alternate authored states</div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wide text-white/45">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-300" />Primary</span>
          {forked && <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-fuchsia-300" />Fork</span>}
        </div>
      </div>
      <svg viewBox="0 0 280 100" className="h-36 w-full" preserveAspectRatio="none" aria-label="Synthetic causal timeline comparison">
        {[16, 34, 52, 70, 88].map((y) => <path key={y} d={`M0 ${y} H280`} stroke="rgba(255,255,255,.055)" />)}
        <path d={toPath('primary')} fill="none" stroke="#4de7ff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {forked && <path d={toPath('relief')} fill="none" stroke="#ff63d8" strokeWidth="2.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />}
        {points.map((point) => {
          const x = (point.time / 100) * 280
          const y = 88 - point.primary.transport * 72
          return <circle key={point.time} cx={x} cy={y} r="2.8" fill="#dffcff" />
        })}
      </svg>
      <div className="flex justify-between text-[8px] font-bold uppercase tracking-[.15em] text-white/25"><span>before</span><span>propagation</span><span>late authored state</span></div>
    </div>
  )
}

function CausalTunnel({ domain, perturbation, time, forked }: { domain: CausalDomain; perturbation: number; time: number; forked: boolean }) {
  const reduceMotion = useReducedMotion()
  const active = Math.max(0.08, perturbation * (time / 100))
  const labels = domain === 'coronary'
    ? ['radius', 'resistance', 'transport', 'demand', 'mismatch']
    : domain === 'airway'
      ? ['calibre', 'resistance', 'airflow', 'demand', 'work']
      : ['compression', 'conduction', 'transport', 'task', 'mismatch']

  return (
    <div className="relative min-h-[310px] overflow-hidden rounded-[32px] border border-white/10 bg-[#020308] p-5">
      <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(77,231,255,.12), transparent 28%), radial-gradient(circle at 72% 32%, rgba(156,124,255,.13), transparent 28%), linear-gradient(145deg,#020308,#080613 58%,#020308)' }} />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/70">Causal tunnel</div>
          <div className="mt-1 text-lg font-black text-white">Touch biology as a chain, not a card</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-white/45">synthetic world</div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-5 items-center gap-1">
        {labels.map((label, index) => (
          <div key={label} className="relative flex min-w-0 flex-col items-center">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full border text-[10px] font-black uppercase"
              style={{
                borderColor: index <= Math.ceil(active * 4) ? 'rgba(77,231,255,.72)' : 'rgba(255,255,255,.12)',
                background: index <= Math.ceil(active * 4) ? 'radial-gradient(circle,rgba(77,231,255,.22),rgba(156,124,255,.08))' : 'rgba(255,255,255,.025)',
                boxShadow: index <= Math.ceil(active * 4) ? '0 0 30px rgba(77,231,255,.14)' : 'none',
              }}
              animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8 + index * 0.2, repeat: Infinity }}
            >
              {index + 1}
            </motion.div>
            <span className="mt-2 max-w-full truncate text-[8px] font-black uppercase tracking-wide text-white/45">{label}</span>
            {index < labels.length - 1 && <div className="absolute left-[64%] top-6 h-px w-[72%] bg-gradient-to-r from-cyan-300/55 to-violet-400/20" />}
          </div>
        ))}
      </div>

      <motion.div
        className="relative z-10 mt-8 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.035] p-4"
        animate={reduceMotion ? undefined : { boxShadow: ['0 0 0 rgba(77,231,255,0)', '0 0 42px rgba(77,231,255,.08)', '0 0 0 rgba(77,231,255,0)'] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[.14em] text-white/45">
          <span>World-frame progression</span><span>{Math.round(time)} / 100</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-300" style={{ width: `${time}%` }} />
        </div>
        <div className="mt-3 text-[10px] leading-relaxed text-white/48">
          {forked
            ? 'Two authored worlds now coexist: the primary perturbation and a reduced-perturbation counterfactual. Neither predicts a patient outcome.'
            : 'One authored world is active. Fork it to compare how the same demand context behaves after a synthetic reduction in perturbation.'}
        </div>
      </motion.div>
    </div>
  )
}

export function PanaceaCausalTimeMachine() {
  const [domain, setDomain] = useState<CausalDomain>('coronary')
  const [scale, setScale] = useState<CausalScale>('person')
  const [perturbation, setPerturbation] = useState(0.62)
  const [reserve, setReserve] = useState(0.66)
  const [demand, setDemand] = useState(0.7)
  const [time, setTime] = useState(68)
  const [forked, setForked] = useState(true)
  const pair = useMemo(() => deriveCounterfactualPair(domain, { perturbation, reserve, demand, time }), [domain, perturbation, reserve, demand, time])
  const domainMeta = CAUSAL_DOMAINS.find((item) => item.id === domain) ?? CAUSAL_DOMAINS[0]

  const resetWorld = () => {
    setPerturbation(0)
    setReserve(0.72)
    setDemand(0.45)
    setTime(0)
    setForked(false)
  }

  return (
    <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[#020306] text-white shadow-[0_24px_90px_rgba(0,0,0,.32)]">
      <div className="border-b border-white/10 p-5 sm:p-6" style={{ backgroundImage: 'radial-gradient(circle at 8% 0%,rgba(77,231,255,.14),transparent 32%),radial-gradient(circle at 92% 0%,rgba(255,99,216,.12),transparent 28%)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200">Panacea Causal Time Machine · Reality Engine II</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Fork physiology. Rewind mechanisms. Descend through scale.</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              A deterministic synthetic world where one perturbation can be scrubbed through time, forked into an alternate counterfactual, and inspected from person → organ → tissue → cell → molecule without pretending to predict a real patient.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForked((value) => !value)} className="rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-fuchsia-100">
              {forked ? 'Collapse fork' : 'Fork timeline'}
            </button>
            <button type="button" onClick={resetWorld} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/60">Reset world</button>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {CAUSAL_DOMAINS.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setDomain(item.id)}
              className={`shrink-0 rounded-2xl border px-3 py-2 text-left transition ${domain === item.id ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-white/10 bg-white/[0.025]'}`}
            >
              <div className={`text-[10px] font-black uppercase tracking-wide ${domain === item.id ? 'text-cyan-100' : 'text-white/50'}`}>{item.label}</div>
              <div className="mt-0.5 max-w-[260px] text-[9px] text-white/30">{item.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.22fr_.78fr]">
        <div className="space-y-4">
          <CausalTunnel domain={domain} perturbation={perturbation} time={time} forked={forked} />
          <TimelineChart domain={domain} perturbation={perturbation} reserve={reserve} demand={demand} forked={forked} />

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-200/80">Scale elevator</div>
            <div className="mt-3 flex gap-1 overflow-x-auto rounded-2xl bg-black/30 p-1">
              {SCALE_ORDER.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setScale(item)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black transition ${scale === item ? 'bg-violet-400/18 text-violet-100 ring-1 ring-violet-300/30' : 'text-white/35'}`}
                >
                  {SCALE_LABELS[item]}
                </button>
              ))}
            </div>
            <motion.div key={`${domain}-${scale}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl border border-violet-300/15 bg-violet-300/[0.04] p-4">
              <div className="text-xs font-black text-violet-100">{SCALE_LABELS[scale]} view</div>
              <p className="mt-1 text-xs leading-relaxed text-white/48">{scaleConcept(domain, scale)}</p>
            </motion.div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/40">World controls · {domainMeta.label}</div>
            <div className="mt-3 space-y-2">
              <Slider label={domainMeta.perturbationLabel} value={perturbation} onChange={setPerturbation} hint="Authored normalized perturbation. Not a measured stenosis, obstruction, compression, or severity value." />
              <Slider label="System reserve" value={reserve} onChange={setReserve} hint="Synthetic reserve modifier only." />
              <Slider label="Demand" value={demand} onChange={setDemand} hint="Synthetic task/metabolic demand modifier only." />
              <label className="block rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.14em] text-white/60">Time scrubber</span><span className="font-mono text-xs font-bold text-fuchsia-200">{Math.round(time)}</span></div>
                <input className="mt-3 w-full accent-fuchsia-300" type="range" min="0" max="100" value={time} onChange={(event) => setTime(Number(event.target.value))} />
                <div className="mt-1 flex justify-between text-[8px] font-bold uppercase tracking-wide text-white/25"><span>rewind</span><span>propagate</span></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Primary transport" value={percent(pair.primary.transport)} note="Normalized synthetic transport index" />
            <Metric label="Primary stress" value={percent(pair.primary.stress)} note="Interface mismatch signal only" />
            {forked ? (
              <>
                <Metric label="Fork transport" value={percent(pair.relief.transport)} note="Reduced-perturbation authored branch" />
                <Metric label="Fork stress" value={percent(pair.relief.stress)} note="Counterfactual interface signal" />
              </>
            ) : (
              <>
                <Metric label="Resistance index" value={`${pair.primary.resistance.toFixed(2)}×`} note="Relative idealized index" />
                <Metric label="Reserve signal" value={percent(pair.primary.reserveSignal)} note="Normalized authored reserve" />
              </>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-200/80">Formula ledger</div>
            <div className="mt-3 space-y-3">
              {CAUSAL_FORMULA_LEDGER.filter((item) => item.appliesTo.includes(domain)).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                  <code className="text-[10px] font-bold text-cyan-100">{item.formula}</code>
                  <p className="mt-1 text-[9px] leading-relaxed text-white/35">{item.boundary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-300/18 bg-amber-300/[0.055] p-4">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-200">Truth boundary</div>
            <p className="mt-2 text-[10px] leading-relaxed text-amber-50/65">
              Every value here is authored and normalized for mechanism visualization. The fork is not treatment response. It does not estimate stenosis, flow, oxygen delivery, airway resistance, nerve conduction, diagnosis, severity, prognosis, eligibility, dose, or patient-specific outcome.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PanaceaCausalTimeMachine
