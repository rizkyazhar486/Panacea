import { useMemo, useState } from 'react'
import {
  RESPIRATORY_EVIDENCE,
  RESPIRATORY_GAS_EXCHANGE_BOUNDARY,
  RESPIRATORY_GAS_EXCHANGE_DEFAULTS,
  RESPIRATORY_TEACHING_EQUATIONS,
  deriveRespiratoryGasExchange,
  respiratoryPercent,
  type RespiratoryGasExchangeInputs,
} from '../../lib/respiratoryGasExchangeLab'

type BreathingPhase = 'inspiration' | 'expiration'
type RespiratoryFocus = 'airway' | 'alveoli' | 'pleura' | 'diaphragm'

const FOCUS: Record<RespiratoryFocus, { label: string; note: string }> = {
  airway: { label: 'Airway', note: 'Conducting airways distribute gas toward bronchi and bronchioles; calibre strongly alters idealized resistance.' },
  alveoli: { label: 'Alveoli', note: 'Alveolar units couple ventilation with capillary perfusion across a thin diffusion interface.' },
  pleura: { label: 'Pleura', note: 'Pleural coupling transfers chest-wall and respiratory-muscle mechanics to the lungs.' },
  diaphragm: { label: 'Diaphragm', note: 'Contraction increases thoracic volume during inspiration; relaxation and recoil contribute to expiration.' },
}

const CONTROLS: readonly { key: keyof RespiratoryGasExchangeInputs; label: string; note: string }[] = [
  { key: 'airwayRadius', label: 'Airway calibre', note: 'Synthetic relative radius; idealized resistance follows r⁻⁴.' },
  { key: 'compliance', label: 'Compliance', note: 'Synthetic ease-of-inflation signal; not a measured pressure-volume curve.' },
  { key: 'ventilationDrive', label: 'Ventilation drive', note: 'Synthetic ventilatory drive influencing ventilation and work.' },
  { key: 'perfusionMatch', label: 'V/Q matching', note: 'Higher means ventilation and perfusion are better matched in this model.' },
  { key: 'diffusionCapacity', label: 'Diffusion capacity', note: 'Synthetic alveolar-capillary transfer efficiency; not DLCO.' },
  { key: 'metabolicDemand', label: 'Metabolic demand', note: 'Synthetic demand consuming gas-exchange reserve.' },
] as const

const OUTPUTS = [
  ['airwayResistanceSignal', 'Airway resistance'],
  ['alveolarVentilationSignal', 'Alveolar ventilation'],
  ['vqMatchingSignal', 'V/Q matching'],
  ['diffusionSignal', 'Diffusion'],
  ['oxygenTransferSignal', 'O₂ transfer'],
  ['co2ClearanceSignal', 'CO₂ clearance'],
  ['workOfBreathingSignal', 'Work of breathing'],
  ['gasExchangeReserveSignal', 'Gas-exchange reserve'],
] as const

export default function RespiratoryGasExchangeWorkbench() {
  const [inputs, setInputs] = useState<RespiratoryGasExchangeInputs>(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)
  const [phase, setPhase] = useState<BreathingPhase>('inspiration')
  const [focus, setFocus] = useState<RespiratoryFocus>('airway')
  const outputs = useMemo(() => deriveRespiratoryGasExchange(inputs), [inputs])
  const inspired = phase === 'inspiration'

  const update = (key: keyof RespiratoryGasExchangeInputs, value: number) => setInputs((current) => ({ ...current, [key]: value }))

  return (
    <section data-body-respiratory-gas-exchange="v3" className="overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(34,211,238,.055),rgba(2,6,12,.97)_40%,rgba(16,185,129,.045))] text-white">
      <header className="border-b border-white/[.08] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/80">Body Exposure · respiratory / gas exchange</div>
            <h3 className="mt-1.5 text-lg font-black tracking-[-.02em] sm:text-xl">Airway, Breathing Mechanics & Gas-Exchange Lab</h3>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/45 sm:text-[11px]">Explore normalized coupling among airway calibre, compliance, alveolar ventilation, V/Q matching, diffusion and metabolic demand. No slider or output represents a patient measurement.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1 text-cyan-100/75">6 controls</span>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-2.5 py-1 text-emerald-100/75">8 signals</span>
            <span className="rounded-full border border-violet-300/15 bg-violet-300/[.05] px-2.5 py-1 text-violet-100/75">evidence anchored</span>
          </div>
        </div>
      </header>

      <div className="grid gap-3 p-3 sm:p-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <div className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div><div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Interactive physiology</div><h4 className="mt-1 text-sm font-black">Synthetic respiratory controls</h4></div>
              <button type="button" onClick={() => setInputs(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)} className="min-h-10 rounded-xl border border-white/[.09] px-3 text-[8px] font-black text-white/55 transition hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55">Reset</button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {CONTROLS.map((control) => (
                <label key={control.key} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
                  <div className="flex items-start justify-between gap-2"><div><div className="text-[9px] font-black text-white/75">{control.label}</div><div className="mt-0.5 text-[8px] leading-relaxed text-white/30">{control.note}</div></div><output className="text-[9px] font-black text-cyan-100/70">{Math.round(inputs[control.key] * 100)}%</output></div>
                  <input aria-label={control.label} className="mt-3 w-full accent-cyan-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))} />
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Breathing cycle + anatomical focus</div><h4 className="mt-1 text-sm font-black">Airway → alveoli → pleura → diaphragm</h4></div>
              <div className="flex gap-1.5">{(['inspiration', 'expiration'] as const).map((item) => <button key={item} type="button" aria-pressed={phase === item} onClick={() => setPhase(item)} className={`min-h-10 rounded-full border px-3 text-[8px] font-black capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 ${phase === item ? 'border-cyan-300/30 bg-cyan-300/[.1] text-cyan-50' : 'border-white/[.07] bg-white/[.025] text-white/40'}`}>{item}</button>)}</div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px]">
              <div className="relative min-h-64 overflow-hidden rounded-[20px] border border-cyan-300/10 bg-[radial-gradient(circle_at_50%_32%,rgba(34,211,238,.08),transparent_30%),linear-gradient(180deg,rgba(8,20,28,.9),rgba(2,6,12,.96))]" aria-label="Schematic breathing motion">
                <div aria-hidden className="absolute left-1/2 top-4 h-16 w-4 -translate-x-1/2 rounded-full border border-cyan-200/20 bg-cyan-200/[.04]" />
                <div aria-hidden className="absolute left-1/2 top-16 h-7 w-20 -translate-x-1/2 border-x border-t border-cyan-200/20" />
                <button type="button" onClick={() => setFocus('alveoli')} aria-pressed={focus === 'alveoli'} className={`absolute left-[18%] top-20 h-32 w-[30%] rounded-[48%_44%_52%_46%] border transition-transform duration-500 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 ${inspired ? 'scale-105' : 'scale-95'} ${focus === 'alveoli' ? 'border-cyan-200/45 bg-cyan-300/[.12]' : 'border-cyan-200/18 bg-cyan-300/[.055]'}`} aria-label="Focus left lung alveoli" />
                <button type="button" onClick={() => setFocus('alveoli')} aria-pressed={focus === 'alveoli'} className={`absolute right-[18%] top-20 h-32 w-[30%] rounded-[44%_48%_46%_52%] border transition-transform duration-500 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 ${inspired ? 'scale-105' : 'scale-95'} ${focus === 'alveoli' ? 'border-cyan-200/45 bg-cyan-300/[.12]' : 'border-cyan-200/18 bg-cyan-300/[.055]'}`} aria-label="Focus right lung alveoli" />
                <button type="button" onClick={() => setFocus('diaphragm')} aria-pressed={focus === 'diaphragm'} className={`absolute bottom-7 left-[16%] h-10 w-[68%] rounded-[50%] border border-emerald-200/25 bg-emerald-300/[.06] transition-transform duration-500 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/55 ${inspired ? 'translate-y-2 scale-y-75' : '-translate-y-1'}`} aria-label="Focus diaphragm" />
                <button type="button" onClick={() => setFocus('pleura')} aria-pressed={focus === 'pleura'} className={`absolute inset-x-[13%] top-[70px] bottom-5 rounded-[42%] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/55 ${focus === 'pleura' ? 'border-violet-200/40' : 'border-violet-200/10'}`} aria-label="Focus pleural envelope" />
                <button type="button" onClick={() => setFocus('airway')} aria-pressed={focus === 'airway'} className={`absolute left-1/2 top-3 h-[88px] w-8 -translate-x-1/2 rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/55 ${focus === 'airway' ? 'border-amber-200/40 bg-amber-300/[.06]' : 'border-transparent'}`} aria-label="Focus airway" />
                <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg border border-white/[.06] bg-black/55 px-2 py-1 text-[8px] font-bold text-white/40">{inspired ? 'Thoracic volume ↑ · diaphragm descends' : 'Elastic recoil · diaphragm relaxes'}</div>
              </div>
              <div className="space-y-2">{(Object.keys(FOCUS) as RespiratoryFocus[]).map((item) => <button key={item} type="button" aria-pressed={focus === item} onClick={() => setFocus(item)} className={`min-h-12 w-full rounded-2xl border p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 ${focus === item ? 'border-cyan-300/20 bg-cyan-300/[.055]' : 'border-white/[.07] bg-white/[.02]'}`}><div className="text-[9px] font-black text-white/70">{FOCUS[item].label}</div><p className="mt-1 text-[8px] leading-relaxed text-white/30">{FOCUS[item].note}</p></button>)}</div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] p-3"><div className="text-[8px] font-black uppercase text-cyan-100/55">Conducting airway</div><div className="mt-2 text-2xl font-black">{outputs.relativeAirwayRadius.toFixed(2)}×</div><div className="mt-1 text-[8px] text-white/28">Relative synthetic radius</div></div>
              <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[.035] p-3"><div className="text-[8px] font-black uppercase text-violet-100/55">Alveolar unit</div><div className="mt-2 text-2xl font-black">{respiratoryPercent(outputs.alveolarVentilationSignal)}%</div><div className="mt-1 text-[8px] text-white/28">Ventilation signal</div></div>
              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[.035] p-3"><div className="text-[8px] font-black uppercase text-emerald-100/55">Capillary interface</div><div className="mt-2 text-2xl font-black">{respiratoryPercent(outputs.oxygenTransferSignal)}%</div><div className="mt-1 text-[8px] text-white/28">O₂-transfer signal</div></div>
            </div>
            <p className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[9px] leading-relaxed text-amber-50/45">Dominant teaching constraint: <b className="text-amber-100/75">{outputs.dominantConstraint.replaceAll('-', ' ')}</b>. This is a synthetic model-state label, not a disease classification.</p>
          </article>
        </div>

        <aside className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Signal board</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{OUTPUTS.map(([key, label]) => { const value = outputs[key]; return <div key={key} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="flex justify-between gap-2"><span className="text-[8px] font-black text-white/45">{label}</span><b className="text-[9px] text-white/70">{respiratoryPercent(value)}%</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,.9),rgba(52,211,153,.85),rgba(167,139,250,.8))] transition-[width]" style={{ width: `${respiratoryPercent(value)}%` }} /></div></div> })}</div></article>

          <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div><div className="mt-2 space-y-2">{RESPIRATORY_TEACHING_EQUATIONS.map((equation) => <div key={equation.expression} className="rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3"><code className="text-[10px] font-black text-white/78">{equation.expression}</code><div className="mt-1 text-[8px] font-black text-amber-100/55">{equation.label}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/32">{equation.note}</p></div>)}</div></article>

          <article className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[.025] p-3.5"><div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Evidence anchors</div><div className="mt-2 space-y-2">{RESPIRATORY_EVIDENCE.map((source) => <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 transition hover:bg-white/[.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55"><div className="text-[7px] font-black uppercase text-cyan-100/45">PMID {source.pmid} · {source.year}</div><div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/30">{source.role}</p></a>)}</div></article>
        </aside>
      </div>

      <footer className="border-t border-rose-300/10 bg-rose-300/[.025] px-4 py-3 text-[8px] leading-relaxed text-rose-50/45"><b className="text-rose-100/65">Boundary:</b> {RESPIRATORY_GAS_EXCHANGE_BOUNDARY}</footer>
    </section>
  )
}
