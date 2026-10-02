import { useMemo, useState } from 'react'
import {
  RESPIRATORY_GAS_EXCHANGE_BOUNDARY,
  RESPIRATORY_GAS_EXCHANGE_DEFAULTS,
  RESPIRATORY_GAS_EXCHANGE_PROVENANCE,
  RESPIRATORY_TEACHING_EQUATIONS,
  deriveRespiratoryGasExchange,
  type RespiratoryGasExchangeInputs,
} from '../../lib/respiratoryGasExchangeLab'

const CONTROLS: ReadonlyArray<{ key: keyof RespiratoryGasExchangeInputs; label: string }> = [
  { key: 'airwayRadius', label: 'Airway calibre' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'ventilationDrive', label: 'Ventilation drive' },
  { key: 'deadSpaceFraction', label: 'Dead-space fraction' },
  { key: 'perfusionMatch', label: 'V/Q matching' },
  { key: 'diffusionCapacity', label: 'Diffusion capacity' },
  { key: 'metabolicDemand', label: 'Metabolic demand' },
]

function Signal({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[.07] p-3"><div className="text-[9px] text-white/45">{label}</div><div className="mt-1 text-lg font-black tabular-nums">{Math.round(value * 100)}%</div></div>
}

export default function RespiratoryGasExchangeWorkbench() {
  const [inputs, setInputs] = useState<RespiratoryGasExchangeInputs>(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)
  const outputs = useMemo(() => deriveRespiratoryGasExchange(inputs), [inputs])
  const update = (key: keyof RespiratoryGasExchangeInputs, value: number) => setInputs((current) => ({ ...current, [key]: value }))

  return <section data-body-respiratory-gas-exchange="v5" className="rounded-[28px] border border-cyan-300/10 bg-black/30 p-4 text-white">
    <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/70">Respiratory · educational physiology</div>
    <h4 className="mt-1 text-lg font-black">Airway Mechanics & Gas Exchange</h4>
    <p className="mt-2 text-[10px] leading-relaxed text-white/45">Interactive schematic using normalized synthetic signals; not patient-specific and not anatomical geometry.</p>
    <div className="mt-4 grid gap-2 md:grid-cols-2">{CONTROLS.map((control) => <label key={control.key} className="rounded-2xl border border-white/[.07] p-3"><span className="text-[9px] font-bold">{control.label}</span><output className="float-right text-[9px] text-cyan-100/70">{Math.round(inputs[control.key] * 100)}%</output><input aria-label={control.label} className="mt-3 w-full accent-cyan-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))}/></label>)}</div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Signal label="Airway resistance" value={outputs.airwayResistanceSignal}/><Signal label="Alveolar ventilation" value={outputs.alveolarVentilationSignal}/><Signal label="O₂ transfer" value={outputs.oxygenTransferSignal}/><Signal label="Gas-exchange reserve" value={outputs.gasExchangeReserveSignal}/></div>
    <div className="mt-4 rounded-2xl border border-white/[.07] p-3"><div className="text-[9px] font-black uppercase text-white/50">Formula ledger</div>{RESPIRATORY_TEACHING_EQUATIONS.map((item) => <div key={item.expression} className="mt-2 grid gap-1 sm:grid-cols-[150px_1fr]"><code className="text-[10px] text-cyan-100/75">{item.expression}</code><span className="text-[9px] leading-relaxed text-white/40">{item.meaning}</span></div>)}</div>
    <details className="mt-3 rounded-2xl border border-white/[.07] p-3"><summary className="cursor-pointer text-[9px] font-black uppercase text-white/50">Evidence & boundary</summary><p className="mt-2 text-[9px] leading-relaxed text-white/40">{RESPIRATORY_GAS_EXCHANGE_BOUNDARY}</p>{RESPIRATORY_GAS_EXCHANGE_PROVENANCE.map((source) => <p key={source.pmid} className="mt-2 text-[9px] leading-relaxed text-white/35">PMID {source.pmid} · {source.citation} · {source.supports} {source.reviewState}</p>)}</details>
  </section>
}
