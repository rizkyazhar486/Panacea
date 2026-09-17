import { useMemo, useState } from 'react'
import {
  NEUROVASCULAR_EVIDENCE,
  NEUROVASCULAR_NETWORK,
  NEUROVASCULAR_PERFUSION_BOUNDARY,
  NEUROVASCULAR_RELATIONSHIPS,
  buildAutoregulationTeachingCurve,
  simulateSyntheticNeurovascularState,
  type SyntheticNeurovascularInput,
} from '../../lib/neurovascularPerfusionLab'

const BASELINE: SyntheticNeurovascularInput = {
  systemicPressureDrive: 0.56,
  intracranialVolumeLoad: 0.18,
  baselineVascularResistance: 0.48,
  arterialOxygenContent: 0.68,
  metabolicDemand: 0.55,
  autoregulatoryReserve: 0.70,
}

const INPUT_META: Readonly<Record<keyof SyntheticNeurovascularInput, { label: string; hint: string }>> = {
  systemicPressureDrive: { label: 'Systemic pressure drive', hint: 'Normalized upstream arterial-pressure signal' },
  intracranialVolumeLoad: { label: 'Intracranial volume load', hint: 'Synthetic brain/blood/CSF volume load on compliance reserve' },
  baselineVascularResistance: { label: 'Baseline vascular resistance', hint: 'Synthetic cerebrovascular resistance before autoregulatory adjustment' },
  arterialOxygenContent: { label: 'Arterial O₂ content', hint: 'Normalized oxygen-carrying content; not SpO₂ or PaO₂' },
  metabolicDemand: { label: 'Neural metabolic demand', hint: 'Synthetic tissue substrate and oxygen demand' },
  autoregulatoryReserve: { label: 'Autoregulatory reserve', hint: 'Synthetic ability to alter vascular resistance as pressure changes' },
}

const OUTPUT_META = {
  cerebralPerfusionPressureSignal: 'CPP signal',
  effectiveVascularResistanceSignal: 'Effective CVR signal',
  cerebralBloodFlowSignal: 'CBF signal',
  oxygenDeliverySignal: 'O₂-delivery signal',
  autoregulationStrainSignal: 'Autoregulation strain',
  intracranialComplianceStress: 'Compliance stress',
  metabolicMismatchSignal: 'Metabolic mismatch',
} as const

const LAYER_CLASS = {
  systemic: 'border-cyan-300/15 bg-cyan-300/[.04]',
  intracranial: 'border-rose-300/15 bg-rose-300/[.04]',
  vascular: 'border-violet-300/15 bg-violet-300/[.04]',
  delivery: 'border-emerald-300/15 bg-emerald-300/[.04]',
  metabolic: 'border-amber-300/15 bg-amber-300/[.04]',
} as const

const pct = (value: number) => `${Math.round(value * 100)}%`

export default function NeurovascularPerfusionWorkbench() {
  const [input, setInput] = useState<SyntheticNeurovascularInput>(BASELINE)
  const state = useMemo(() => simulateSyntheticNeurovascularState(input), [input])
  const curve = useMemo(
    () => buildAutoregulationTeachingCurve(input.baselineVascularResistance, input.intracranialVolumeLoad, input.autoregulatoryReserve),
    [input.baselineVascularResistance, input.intracranialVolumeLoad, input.autoregulatoryReserve],
  )
  const toX = (value: number) => 26 + value * 220
  const toY = (value: number) => 214 - value * 170
  const curvePath = curve.map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(point.pressureDrive)} ${toY(point.flowSignal)}`).join(' ')

  return (
    <section data-neurovascular-perfusion-workbench="v2" className="overflow-hidden rounded-[28px] border border-violet-300/12 bg-[linear-gradient(145deg,rgba(124,58,237,.05),rgba(2,6,12,.97)_42%,rgba(34,211,238,.035))] text-white">
      <header className="border-b border-white/[.08] p-4 sm:p-5">
        <div className="text-[9px] font-black uppercase tracking-[.22em] text-violet-200/75">Body Exposure · brain / neurovascular</div>
        <h3 className="mt-1.5 text-lg font-black tracking-[-.02em]">Neurovascular Perfusion & Intracranial Dynamics Lab</h3>
        <p className="mt-1.5 max-w-3xl text-[11px] leading-relaxed text-white/45">Explore normalized pressure-gradient, vascular-resistance, oxygen-delivery and autoregulatory coupling. The model is deliberately dimensionless and does not infer patient ICP, CPP, CBF or treatment thresholds.</p>
      </header>

      <div className="grid gap-3 p-3 sm:p-4 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div><div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Synthetic inputs</div><h4 className="mt-1 text-sm font-black">Pressure, resistance, oxygen & demand</h4></div>
            <button type="button" onClick={() => setInput(BASELINE)} className="min-h-9 rounded-xl border border-white/[.09] px-3 text-[8px] font-black text-white/55 transition hover:bg-white/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/55">Reset</button>
          </div>
          <div className="mt-3 space-y-2">
            {(Object.keys(INPUT_META) as (keyof SyntheticNeurovascularInput)[]).map((key) => (
              <label key={key} className="block rounded-2xl border border-white/[.07] bg-white/[.022] p-3">
                <div className="flex justify-between gap-3">
                  <div><div className="text-[9px] font-black text-white/75">{INPUT_META[key].label}</div><div className="mt-0.5 text-[8px] leading-relaxed text-white/30">{INPUT_META[key].hint}</div></div>
                  <output className="text-[8px] font-black text-violet-100/70">{pct(input[key])}</output>
                </div>
                <input aria-label={INPUT_META[key].label} type="range" min="0" max="1" step="0.01" value={input[key]} onChange={(event) => setInput((current) => ({ ...current, [key]: Number(event.target.value) }))} className="mt-3 w-full accent-violet-300" />
              </label>
            ))}
          </div>
        </article>

        <div className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-[#02060b] p-3.5">
            <div className="flex flex-wrap items-end justify-between gap-2"><div><div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Autoregulation teaching curve</div><h4 className="mt-1 text-sm font-black">Pressure drive → buffered flow response</h4></div><span className="text-[8px] text-white/25">normalized axes · no clinical cutoffs</span></div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <svg viewBox="0 0 275 240" role="img" aria-label="Normalized synthetic cerebral autoregulation teaching curve" className="min-h-[260px] w-full rounded-[18px] border border-white/[.07] bg-black/40 p-2">
                <defs><linearGradient id="neuro-curve-v2" x1="0" x2="1"><stop offset="0%" stopColor="rgba(34,211,238,.88)" /><stop offset="52%" stopColor="rgba(167,139,250,.95)" /><stop offset="100%" stopColor="rgba(251,113,133,.88)" /></linearGradient></defs>
                <line x1="26" y1="214" x2="252" y2="214" stroke="rgba(255,255,255,.14)" /><line x1="26" y1="214" x2="26" y2="28" stroke="rgba(255,255,255,.14)" />
                <path d={curvePath} fill="none" stroke="url(#neuro-curve-v2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {curve.map((point, index) => <circle key={point.pressureDrive} cx={toX(point.pressureDrive)} cy={toY(point.flowSignal)} r={index % 2 === 0 ? 3.1 : 2.1} fill="rgba(255,255,255,.82)" />)}
                <circle cx={toX(input.systemicPressureDrive)} cy={toY(state.cerebralBloodFlowSignal)} r="6" fill="white" stroke="rgba(167,139,250,.95)" strokeWidth="2.5" />
                <text x="139" y="234" textAnchor="middle" fill="rgba(255,255,255,.34)" fontSize="8">systemic pressure drive →</text><text x="9" y="121" textAnchor="middle" fill="rgba(255,255,255,.34)" fontSize="8" transform="rotate(-90 9 121)">synthetic CBF →</text>
              </svg>
              <div className="space-y-2">
                <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[.03] p-3"><div className="text-[8px] font-black uppercase text-violet-100/50">Current state</div><div className="mt-2 space-y-1.5 text-[8px]"><div className="flex justify-between"><span className="text-white/35">Pressure drive</span><b>{pct(input.systemicPressureDrive)}</b></div><div className="flex justify-between"><span className="text-white/35">CBF signal</span><b>{pct(state.cerebralBloodFlowSignal)}</b></div><div className="flex justify-between"><span className="text-white/35">Reserve</span><b>{pct(input.autoregulatoryReserve)}</b></div></div></div>
                <p className="rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[8px] leading-relaxed text-amber-50/40">Directional buffering only. Real autoregulatory limits vary by patient and context.</p>
              </div>
            </div>
          </article>
          <article className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{(Object.entries(OUTPUT_META) as [keyof typeof OUTPUT_META, string][]).map(([key, label]) => <div key={key} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="flex justify-between gap-2 text-[8px]"><span className="text-white/50">{label}</span><b>{pct(state[key])}</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,.9),rgba(167,139,250,.9),rgba(251,113,133,.8))] transition-[width]" style={{ width: pct(state[key]) }} /></div></div>)}</article>
        </div>
      </div>

      <article className="mx-3 mb-3 rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:mx-4 sm:mb-4"><div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Neurovascular systems chain</div><div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{NEUROVASCULAR_NETWORK.map((node, index) => <div key={node.id} className={`rounded-[18px] border p-3 ${LAYER_CLASS[node.layer]}`}><div className="flex justify-between"><span className="grid h-6 w-6 place-items-center rounded-full border border-white/[.08] text-[8px] font-black">{index + 1}</span><span className="text-[7px] font-black uppercase text-white/25">{node.layer}</span></div><div className="mt-2 text-[10px] font-black text-white/72">{node.label}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/32">{node.role}</p></div>)}</div></article>

      <div className="grid gap-3 px-3 pb-3 sm:px-4 sm:pb-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
        <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div><div className="mt-3 grid gap-2 md:grid-cols-2">{NEUROVASCULAR_RELATIONSHIPS.map((relationship) => <div key={relationship.id} className="rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3"><code className="text-[10px] font-black text-white/78">{relationship.expression}</code><p className="mt-1.5 text-[8px] leading-relaxed text-white/38">{relationship.meaning}</p><p className="mt-1.5 text-[7px] leading-relaxed text-amber-50/35">{relationship.boundary}</p></div>)}</div></article>
        <article className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[.025] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Evidence anchors</div><div className="mt-2 space-y-2">{NEUROVASCULAR_EVIDENCE.map((source) => <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 transition hover:bg-white/[.035]"><div className="text-[7px] font-black uppercase text-cyan-100/45">PMID {source.pmid}</div><div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/30">{source.role}</p></a>)}</div></article>
      </div>
      <footer className="border-t border-rose-300/10 bg-rose-300/[.025] px-4 py-3 text-[8px] leading-relaxed text-rose-50/45"><b className="text-rose-100/65">Boundary:</b> {NEUROVASCULAR_PERFUSION_BOUNDARY}</footer>
    </section>
  )
}
