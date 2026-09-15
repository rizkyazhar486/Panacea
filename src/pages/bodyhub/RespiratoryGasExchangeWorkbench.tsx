import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import {
  RESPIRATORY_EVIDENCE,
  RESPIRATORY_GAS_EXCHANGE_BOUNDARY,
  RESPIRATORY_GAS_EXCHANGE_DEFAULTS,
  RESPIRATORY_TEACHING_EQUATIONS,
  deriveRespiratoryGasExchange,
  respiratoryPercent,
  type RespiratoryGasExchangeInputs,
} from '../../lib/respiratoryGasExchangeLab'

interface RespiratoryGasExchangeWorkbenchProps {
  selectedAtlasSystemId?: BodySystemId
}

type BreathingPhase = 'inspiration' | 'expiration'
type RespiratoryFocus = 'airway' | 'alveoli' | 'pleura' | 'diaphragm'

const FOCUS: Record<RespiratoryFocus, { label: string; note: string }> = {
  airway: { label: 'Airway', note: 'Conducting airways distribute gas toward progressively smaller bronchi and bronchioles; calibre strongly changes idealized resistance.' },
  alveoli: { label: 'Alveoli', note: 'Alveolar units couple ventilation to capillary perfusion and provide the thin interface for passive gas diffusion.' },
  pleura: { label: 'Pleura', note: 'Pleural coupling transmits chest-wall and respiratory-muscle mechanics to the lungs while maintaining apposition of visceral and parietal surfaces.' },
  diaphragm: { label: 'Diaphragm', note: 'Diaphragmatic contraction increases thoracic volume during quiet inspiration; relaxation and elastic recoil contribute to passive expiration.' },
}

const CONTROL_LABELS: readonly { key: keyof RespiratoryGasExchangeInputs; label: string; note: string }[] = [
  { key: 'airwayRadius', label: 'Airway calibre', note: 'Synthetic relative radius control; resistance follows the idealized r⁻⁴ teaching relationship.' },
  { key: 'compliance', label: 'Compliance', note: 'Synthetic ease-of-inflation signal; no pressure-volume measurement is inferred.' },
  { key: 'ventilationDrive', label: 'Ventilation drive', note: 'Synthetic ventilatory input influencing alveolar ventilation and work signal.' },
  { key: 'perfusionMatch', label: 'V/Q matching', note: 'Higher means ventilation and perfusion are more evenly matched in this teaching model.' },
  { key: 'diffusionCapacity', label: 'Diffusion capacity', note: 'Synthetic alveolar-capillary transfer efficiency; not DLCO.' },
  { key: 'metabolicDemand', label: 'Metabolic demand', note: 'Synthetic whole-body demand that consumes gas-exchange reserve.' },
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

export default function RespiratoryGasExchangeWorkbench({ selectedAtlasSystemId }: RespiratoryGasExchangeWorkbenchProps) {
  const [inputs, setInputs] = useState<RespiratoryGasExchangeInputs>(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)
  const [phase, setPhase] = useState<BreathingPhase>('inspiration')
  const [focus, setFocus] = useState<RespiratoryFocus>('airway')
  const outputs = useMemo(() => deriveRespiratoryGasExchange(inputs), [inputs])
  const active = selectedAtlasSystemId === 'respiratory'
  const inspired = phase === 'inspiration'

  if (!active) return null

  function update(key: keyof RespiratoryGasExchangeInputs, value: number) {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  return (
    <section data-body-respiratory-gas-exchange="v2" className="overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[linear-gradient(145deg,rgba(34,211,238,.06),rgba(2,6,12,.95)_38%,rgba(16,185,129,.055))] text-white shadow-[0_24px_80px_rgba(0,0,0,.28)]">
      <div className="border-b border-white/[.08] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/80">Respiratory Wave · mechanics → V/Q → gas exchange</div>
            <h3 className="mt-1.5 text-lg font-black sm:text-xl">Airway, breathing mechanics & gas-exchange lab</h3>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/45 sm:text-[11px]">Explore how airway calibre, respiratory-system compliance, alveolar ventilation, regional ventilation/perfusion matching and diffusion constrain one another. Every signal is normalized synthetic teaching data.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.12em]">
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1 text-cyan-100/75">6 controls</span>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-2.5 py-1 text-emerald-100/75">8 outputs</span>
            <span className="rounded-full border border-violet-300/15 bg-violet-300/[.05] px-2.5 py-1 text-violet-100/75">PubMed anchored</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:p-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <div className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Interactive physiology</div>
                <h4 className="mt-1 text-sm font-black">Synthetic respiratory controls</h4>
              </div>
              <button type="button" onClick={() => setInputs(RESPIRATORY_GAS_EXCHANGE_DEFAULTS)} className="rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[8px] font-black text-white/45 hover:bg-white/[.06] hover:text-white/75">Reset</button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {CONTROL_LABELS.map((control) => (
                <label key={control.key} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black text-white/75">{control.label}</span>
                    <span className="font-mono text-[9px] font-black text-cyan-100/70">{Math.round(inputs[control.key] * 100)}</span>
                  </div>
                  <input className="mt-2 w-full accent-cyan-300" type="range" min="0" max="1" step="0.01" value={inputs[control.key]} onChange={(event) => update(control.key, Number(event.target.value))} />
                  <p className="mt-1 text-[8px] leading-relaxed text-white/28">{control.note}</p>
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="text-[8px] font-black uppercase tracking-[.16em] text-emerald-200/65">Breathing cycle + anatomical focus</div>
                <h4 className="mt-1 text-sm font-black">Airway → alveoli → pleura → diaphragm</h4>
              </div>
              <div className="flex gap-1.5">
                {(['inspiration', 'expiration'] as const).map((item) => <button key={item} type="button" aria-pressed={phase === item} onClick={() => setPhase(item)} className={`rounded-full border px-2.5 py-1 text-[8px] font-black capitalize ${phase === item ? 'border-cyan-300/30 bg-cyan-300/[.1] text-cyan-50' : 'border-white/[.07] bg-white/[.025] text-white/35'}`}>{item}</button>)}
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-h-56 overflow-hidden rounded-[20px] border border-cyan-300/10 bg-[radial-gradient(circle_at_50%_32%,rgba(34,211,238,.08),transparent_30%),linear-gradient(180deg,rgba(8,20,28,.9),rgba(2,6,12,.96))]" aria-label="Schematic breathing motion">
                <div className="absolute left-1/2 top-4 h-16 w-4 -translate-x-1/2 rounded-full border border-cyan-200/20 bg-cyan-200/[.04]" />
                <div className="absolute left-1/2 top-16 h-7 w-20 -translate-x-1/2 border-x border-t border-cyan-200/20" />
                <button type="button" onClick={() => setFocus('alveoli')} aria-pressed={focus === 'alveoli'} className={`absolute left-[18%] top-20 h-28 w-[30%] rounded-[48%_44%_52%_46%] border transition-transform duration-500 motion-reduce:transition-none ${inspired ? 'scale-105' : 'scale-95'} ${focus === 'alveoli' ? 'border-cyan-200/45 bg-cyan-300/[.12]' : 'border-cyan-200/18 bg-cyan-300/[.055]'}`} aria-label="Focus left lung alveoli" />
                <button type="button" onClick={() => setFocus('alveoli')} aria-pressed={focus === 'alveoli'} className={`absolute right-[18%] top-20 h-28 w-[30%] rounded-[44%_48%_46%_52%] border transition-transform duration-500 motion-reduce:transition-none ${inspired ? 'scale-105' : 'scale-95'} ${focus === 'alveoli' ? 'border-cyan-200/45 bg-cyan-300/[.12]' : 'border-cyan-200/18 bg-cyan-300/[.055]'}`} aria-label="Focus right lung alveoli" />
                <button type="button" onClick={() => setFocus('diaphragm')} aria-pressed={focus === 'diaphragm'} className={`absolute bottom-7 left-[16%] h-10 w-[68%] rounded-[50%] border border-emerald-200/25 bg-emerald-300/[.06] transition-transform duration-500 motion-reduce:transition-none ${inspired ? 'translate-y-2 scale-y-75' : '-translate-y-1'}`} aria-label="Focus diaphragm" />
                <button type="button" onClick={() => setFocus('pleura')} aria-pressed={focus === 'pleura'} className={`absolute inset-x-[13%] top-[70px] bottom-5 rounded-[42%] border ${focus === 'pleura' ? 'border-violet-200/40' : 'border-violet-200/10'}`} aria-label="Focus pleural envelope" />
                <button type="button" onClick={() => setFocus('airway')} aria-pressed={focus === 'airway'} className={`absolute left-1/2 top-3 h-[86px] w-8 -translate-x-1/2 rounded-full border ${focus === 'airway' ? 'border-amber-200/40 bg-amber-300/[.06]' : 'border-transparent'}`} aria-label="Focus airway" />
                <div className="absolute bottom-2 left-2 rounded-lg border border-white/[.06] bg-black/45 px-2 py-1 text-[8px] font-bold text-white/35">{inspired ? 'Thoracic volume ↑ · diaphragm descends' : 'Elastic recoil · diaphragm relaxes'}</div>
              </div>

              <div className="space-y-2">
                {(Object.keys(FOCUS) as RespiratoryFocus[]).map((item) => <button key={item} type="button" aria-pressed={focus === item} onClick={() => setFocus(item)} className={`w-full rounded-2xl border p-2.5 text-left ${focus === item ? 'border-cyan-300/20 bg-cyan-300/[.055]' : 'border-white/[.07] bg-white/[.02]'}`}><div className="text-[8px] font-black text-white/65">{FOCUS[item].label}</div><p className="mt-1 text-[8px] leading-relaxed text-white/28">{FOCUS[item].note}</p></button>)}
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] p-3"><div className="text-[8px] font-black uppercase tracking-wide text-cyan-100/55">Conducting airway</div><div className="mt-2 text-2xl font-black">{outputs.relativeAirwayRadius.toFixed(2)}×</div><div className="mt-1 text-[8px] text-white/28">Relative synthetic radius</div></div>
              <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[.035] p-3"><div className="text-[8px] font-black uppercase tracking-wide text-violet-100/55">Alveolar unit</div><div className="mt-2 text-2xl font-black">{respiratoryPercent(outputs.alveolarVentilationSignal)}%</div><div className="mt-1 text-[8px] text-white/28">Normalized ventilation signal</div></div>
              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[.035] p-3"><div className="text-[8px] font-black uppercase tracking-wide text-emerald-100/55">Capillary interface</div><div className="mt-2 text-2xl font-black">{respiratoryPercent(outputs.oxygenTransferSignal)}%</div><div className="mt-1 text-[8px] text-white/28">Normalized O₂ transfer signal</div></div>
            </div>
            <div className="mt-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.025] p-3 text-[9px] leading-relaxed text-amber-50/45">Dominant teaching constraint: <span className="font-black text-amber-100/75">{outputs.dominantConstraint.replaceAll('-', ' ')}</span>. This is a model-state label, not a disease classification.</div>
          </article>
        </div>

        <aside className="space-y-3">
          <article className="rounded-[22px] border border-white/[.08] bg-white/[.02] p-3.5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200/65">Signal board</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {OUTPUTS.map(([key, label]) => {
                const value = outputs[key]
                return <div key={key} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[8px] font-black text-white/45">{label}</span><span className="font-mono text-[9px] font-black text-white/70">{respiratoryPercent(value)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-white/45" style={{ width: `${respiratoryPercent(value)}%` }} /></div></div>
              })}
            </div>
          </article>

          <article className="rounded-[22px] border border-amber-300/10 bg-amber-300/[.025] p-3.5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-amber-200/65">Formula ledger</div>
            <div className="mt-2 space-y-2">
              {RESPIRATORY_TEACHING_EQUATIONS.map((equation) => <div key={equation.expression} className="rounded-2xl border border-white/[.07] bg-black/20 p-3"><div className="text-[8px] font-black text-white/35">{equation.label}</div><div className="mt-1 break-words font-mono text-[11px] font-black text-white/78">{equation.expression}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/28">{equation.note}</p></div>)}
            </div>
          </article>

          <article className="rounded-[22px] border border-cyan-300/10 bg-cyan-300/[.025] p-3.5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/65">Evidence ledger</div>
            <div className="mt-2 space-y-2">
              {RESPIRATORY_EVIDENCE.map((source) => <a key={source.pmid} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/[.07] bg-black/20 p-3 hover:border-cyan-300/20"><div className="flex items-center justify-between gap-2"><span className="text-[8px] font-black text-cyan-100/70">PMID {source.pmid}</span><span className="text-[8px] text-white/25">{source.year} ↗</span></div><div className="mt-1 text-[9px] font-black leading-snug text-white/65">{source.title}</div><p className="mt-1.5 text-[8px] leading-relaxed text-white/28">{source.role}</p></a>)}
            </div>
          </article>
        </aside>
      </div>

      <p className="mx-3 mb-3 rounded-2xl border border-rose-300/10 bg-rose-300/[.025] p-3 text-[8px] leading-relaxed text-rose-50/45 sm:mx-4 sm:mb-4"><span className="font-black text-rose-100/65">Boundary:</span> {RESPIRATORY_GAS_EXCHANGE_BOUNDARY}</p>
    </section>
  )
}
