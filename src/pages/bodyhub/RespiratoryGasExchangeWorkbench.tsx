import { useMemo, useState } from 'react'
import { RESPIRATORY_GAS_EXCHANGE_BOUNDARY, RESPIRATORY_GAS_EXCHANGE_DEFAULTS, RESPIRATORY_TEACHING_EQUATIONS, deriveRespiratoryGasExchange, type RespiratoryGasExchangeInputs } from '../../lib/respiratoryGasExchangeLab'

const CONTROLS: readonly { key: keyof RespiratoryGasExchangeInputs; label: string }[] = [
  { key: 'airwayRadius', label: 'Airway calibre' }, { key: 'compliance', label: 'Compliance' },
  { key: 'ventilationDrive', label: 'Ventilation drive' }, { key: 'perfusionMatch', label: 'V/Q matching' },
  { key: 'diffusionCapacity', label: 'Diffusion capacity' }, { key: 'metabolicDemand', label: 'Metabolic demand' },
]

export default function RespiratoryGasExchangeWorkbench() {
  const [inputs, setInputs] = useState<RespiratoryGasExchangeInputs>(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)
  const outputs = useMemo(() => deriveRespiratoryGasExchange(inputs), [inputs])
  const update = (key: keyof RespiratoryGasExchangeInputs, value: number) => setInputs((current) => ({ ...current, [key]: value }))
  return <section data-body-respiratory-gas-exchange="v4" className="rounded-[28px] border border-cyan-300/10 bg-black/30 p-4 text-white">
    <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/70">Respiratory · educational physiology</div>
    <h4 className="mt-1 text-lg font-black">Airway Mechanics & Gas Exchange</h4>
    <p className="mt-2 text-[10px] leading-relaxed text-white/45">Synthetic dimensionless exploration of airway resistance, compliance, ventilation, V/Q matching and diffusion. The visual model is schematic and is not anatomical geometry.</p>
    <div className="mt-4 grid gap-2 md:grid-cols-2">{CONTROLS.map((control) => <label key={control.key} className="rounded-2xl border border-white/[.07] p-3"><span className="text-[9px] font-bold">{control.label}</span><output className="float-right text-[9px] text-cyan-100/70">{Math.round(inputs[control.key] * 100)}%</output><input aria-label={control.label} className="mt-3 w-full accent-cyan-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))}/></label>)}</div>
    <div className="mt-4 grid gap-2 sm:grid-cols-3"><Signal label="Airway resistance" value={outputs.airwayResistanceSignal}/><Signal label="Alveolar ventilation" value={outputs.alveolarVentilationSignal}/><Signal label="O₂ transfer" value={outputs.oxygenTransferSignal}/><Signal label="CO₂ clearance" value={outputs.co2ClearanceSignal}/><Signal label="Work of breathing" value={outputs.workOfBreathingSignal}/><Signal label="Gas-exchange reserve" value={outputs.gasExchangeReserveSignal}/></div>
    <div className="mt-4 rounded-2xl border border-white/[.07] p-3"><div className="text-[9px] font-black uppercase text-white/50">Formula ledger</div>{RESPIRATORY_TEACHING_EQUATIONS.map((item) => <p key={item.expression} className="mt-2 text-[9px] leading-relaxed text-white/45"><b className="text-white/75">{item.expression}</b> · {item.label}. {item.note}</p>)}</div>
    <p className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[9px] leading-relaxed text-amber-50/50">{RESPIRATORY_GAS_EXCHANGE_BOUNDARY}</p>
  </section>
}

function Signal({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/[.07] p-3"><div className="text-[8px] text-white/45">{label}</div><div className="mt-1 text-xl font-black">{Math.round(value * 100)}%</div></div> }
