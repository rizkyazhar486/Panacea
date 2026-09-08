import { useMemo, useState } from 'react'
import {
  RESPIRATORY_MODEL_BOUNDARY,
  RESPIRATORY_PHASES,
  RESPIRATORY_REFERENCE_INPUTS,
  calculateRespiratoryMetrics,
  respiratoryPhaseById,
  type RespiratoryInputs,
  type RespiratoryPhaseId,
} from '../../lib/respiratoryAtlas'
import { RESPIRATORY_TEACHING_REFERENCES } from '../../lib/respiratoryReferences'

function Metric({ label, value, equation }: { label: string; value: string; equation: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[8px] font-black uppercase tracking-[0.14em] text-neutral-500">{label}</div>
      <div className="mt-1 text-lg font-black tabular-nums text-white">{value}</div>
      <div className="mt-1 font-mono text-[8px] text-cyan-300">{equation}</div>
    </div>
  )
}

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block rounded-xl border border-white/10 bg-black/20 p-3">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-bold text-neutral-400">{label}</span>
        <span className="text-[10px] font-black tabular-nums text-white">{value} {unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="mt-2 w-full accent-cyan-400"
        aria-label={`${label}: ${value} ${unit}`}
      />
    </label>
  )
}

export function RespiratoryQuantitativePanel() {
  const [phaseId, setPhaseId] = useState<RespiratoryPhaseId>('end-expiration')
  const [inputs, setInputs] = useState<RespiratoryInputs>(RESPIRATORY_REFERENCE_INPUTS)
  const metrics = useMemo(() => calculateRespiratoryMetrics(inputs), [inputs])
  const phase = respiratoryPhaseById(phaseId)

  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-neutral-950 text-white" aria-labelledby="respiratory-quantitative-title">
      <div className="border-b border-white/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Breath Atlas · quantitative mechanics</div>
            <h5 id="respiratory-quantitative-title" className="mt-1 text-lg font-black">One breath through time, pressure direction and ventilation math.</h5>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-400">A deterministic teaching layer complements the source-aware 3D anatomy above. Slider values are reference inputs, not readings from a patient, wearable or spirometer.</p>
          </div>
          <button type="button" onClick={() => setInputs(RESPIRATORY_REFERENCE_INPUTS)} className="min-h-10 rounded-full border border-white/15 px-3 text-[9px] font-black text-neutral-300 hover:border-cyan-300/50 hover:text-cyan-200">Reset reference</button>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" aria-label="Four respiratory cycle phase markers">
            {RESPIRATORY_PHASES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={phaseId === item.id}
                onClick={() => setPhaseId(item.id)}
                className={`min-h-12 rounded-xl border px-2 py-2 text-left transition ${phaseId === item.id ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:border-cyan-300/30'}`}
              >
                <span className="block text-[7px] font-black uppercase tracking-wider opacity-70">T{index + 1} · {Math.round(item.cyclePosition * 100)}%</span>
                <span className="mt-0.5 block text-[9px] font-black">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
            <div className="text-[8px] font-black uppercase tracking-[0.16em] text-cyan-300">{phase.label}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                ['Diaphragm', phase.diaphragm],
                ['Thorax', phase.thorax],
                ['Pleural pressure', phase.pleuralPressure],
                ['Alveolar pressure', phase.alveolarPressure],
                ['Airflow', phase.airflow],
                ['Elastic recoil', phase.elasticRecoil],
              ].map(([label, text]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                  <div className="text-[7.5px] font-black uppercase tracking-wide text-neutral-500">{label}</div>
                  <p className="mt-1 text-[9px] leading-relaxed text-neutral-300">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[8.5px] leading-relaxed text-cyan-100/75">{phase.teachingNote}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Slider label="Respiratory rate" value={metrics.respiratoryRate} min={4} max={40} step={1} unit="/min" onChange={(value) => setInputs((current) => ({ ...current, respiratoryRate: value }))} />
            <Slider label="Tidal volume" value={metrics.tidalVolumeMl} min={150} max={1200} step={25} unit="mL" onChange={(value) => setInputs((current) => ({ ...current, tidalVolumeMl: value }))} />
            <Slider label="Dead-space volume" value={metrics.deadSpaceMl} min={0} max={Math.min(500, metrics.tidalVolumeMl)} step={10} unit="mL" onChange={(value) => setInputs((current) => ({ ...current, deadSpaceMl: value }))} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Minute ventilation" value={`${metrics.minuteVentilationLMin.toFixed(2)} L/min`} equation="V̇E = RR × VT" />
            <Metric label="Alveolar ventilation" value={`${metrics.alveolarVentilationLMin.toFixed(2)} L/min`} equation="V̇A = RR × (VT − VD)" />
            <Metric label="Dead-space ventilation" value={`${metrics.deadSpaceVentilationLMin.toFixed(2)} L/min`} equation="V̇D = RR × VD" />
            <Metric label="Alveolar fraction" value={`${metrics.alveolarFractionPct.toFixed(1)}%`} equation="(VT − VD) / VT" />
          </div>

          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
            <div className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-200">Measured ≠ modeled</div>
            <p className="mt-1 text-[9px] leading-relaxed text-amber-100/80">{RESPIRATORY_MODEL_BOUNDARY}</p>
            <p className="mt-2 text-[8.5px] leading-relaxed text-neutral-400">No compliance, airway resistance, gas exchange, FEV₁/FVC, ventilator setting, respiratory work, V/Q distribution or disease severity is inferred from these controls.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="text-[8px] font-black uppercase tracking-[0.16em] text-neutral-500">Physiology references · verify at source</div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {RESPIRATORY_TEACHING_REFERENCES.map((reference) => (
            <a key={reference.href} href={reference.href} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-cyan-300/30">
              <div className="text-[9px] font-black text-cyan-200">{reference.label} ↗</div>
              <p className="mt-1 text-[8.5px] leading-relaxed text-neutral-400">{reference.supports}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RespiratoryQuantitativePanel
