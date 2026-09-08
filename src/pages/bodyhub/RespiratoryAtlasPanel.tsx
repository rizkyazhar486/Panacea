import { useEffect, useMemo, useState } from 'react'
import {
  RESPIRATORY_MODEL_BOUNDARY,
  RESPIRATORY_PHASES,
  RESPIRATORY_REFERENCE_INPUTS,
  RESPIRATORY_STRUCTURE_CHAIN,
  calculateRespiratoryMetrics,
  respiratoryPhaseById,
  type RespiratoryInputs,
  type RespiratoryPhaseId,
} from '../../lib/respiratoryAtlas'

interface Props {
  onFocus3D: () => void
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/80 p-2.5 dark:bg-white/[0.04]">
      <div className="text-[8px] font-black uppercase tracking-[0.14em] text-neutral-500">{label}</div>
      <div className="mt-1 text-base font-black tabular-nums text-ink dark:text-white">{value}</div>
      <div className="mt-0.5 text-[8.5px] leading-relaxed text-neutral-500">{note}</div>
    </div>
  )
}

function TeachingSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block rounded-xl border border-neutral-200 bg-white/70 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-bold text-neutral-500">{label}</span>
        <span className="text-[10px] font-black tabular-nums text-ink dark:text-white">{value} {unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="mt-2 w-full accent-brand"
        aria-label={`${label}: ${value} ${unit}`}
      />
    </label>
  )
}

export function RespiratoryAtlasPanel({ onFocus3D }: Props) {
  const [phaseId, setPhaseId] = useState<RespiratoryPhaseId>('end-expiration')
  const [playing, setPlaying] = useState(false)
  const [inputs, setInputs] = useState<RespiratoryInputs>(RESPIRATORY_REFERENCE_INPUTS)

  const phase = respiratoryPhaseById(phaseId)
  const metrics = useMemo(() => calculateRespiratoryMetrics(inputs), [inputs])

  useEffect(() => {
    if (!playing) return undefined
    const timer = setInterval(() => {
      setPhaseId((current) => {
        const index = RESPIRATORY_PHASES.findIndex((item) => item.id === current)
        return RESPIRATORY_PHASES[(index + 1) % RESPIRATORY_PHASES.length].id
      })
    }, 1400)
    return () => clearInterval(timer)
  }, [playing])

  const diaphragmY = 72 + phase.schematic.diaphragmOffset
  const lungScale = phase.schematic.lungScale
  const flowLabel = phase.schematic.airflowDirection > 0
    ? 'Airflow inward'
    : phase.schematic.airflowDirection < 0
      ? 'Airflow outward'
      : 'Flow pause / turning point'

  return (
    <section className="overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-emerald-50/60 dark:border-sky-400/20 dark:from-sky-400/[0.05] dark:via-transparent dark:to-emerald-400/[0.04]" aria-labelledby="respiratory-atlas-title">
      <div className="border-b border-sky-100/80 p-3 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-sky-300/60 bg-sky-100/70 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">Panacea Breath Atlas</span>
              <span className="rounded-full border border-emerald-300/60 bg-emerald-100/70 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">4D teaching timeline</span>
              <span className="rounded-full border border-neutral-200 bg-white/70 px-2 py-0.5 text-[8.5px] font-bold text-neutral-500 dark:border-white/10 dark:bg-white/5">Source mesh unchanged</span>
            </div>
            <h5 id="respiratory-atlas-title" className="mt-2 text-base font-black text-ink dark:text-white">Respiratory mechanics through one breath</h5>
            <p className="mt-0.5 max-w-3xl text-[10px] leading-relaxed text-neutral-500">
              A deterministic phase model links diaphragm motion, thoracic volume, pleural pressure, alveolar pressure, airflow and elastic recoil without pretending the reference anatomy is a patient-specific simulation.
            </p>
          </div>
          <button
            type="button"
            onClick={onFocus3D}
            className="min-h-11 shrink-0 rounded-full border border-sky-500 px-3 text-[9.5px] font-black text-sky-700 transition hover:bg-sky-600 hover:text-white dark:text-sky-200"
          >
            Focus lungs + diaphragm in 3D →
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="space-y-3">
          <div className="rounded-xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[8.5px] font-black uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Cycle phase</div>
                <div className="mt-0.5 text-sm font-black text-ink dark:text-white">{phase.label}</div>
              </div>
              <button
                type="button"
                aria-pressed={playing}
                onClick={() => setPlaying((value) => !value)}
                className="min-h-11 rounded-full border border-neutral-200 px-3 text-[9px] font-black text-neutral-600 transition hover:border-sky-400 hover:text-sky-700 dark:border-white/10 dark:text-neutral-300"
              >
                {playing ? 'Pause cycle' : 'Play teaching cycle'}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1" aria-label="Respiratory cycle phases">
              {RESPIRATORY_PHASES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={phase.id === item.id}
                  onClick={() => {
                    setPlaying(false)
                    setPhaseId(item.id)
                  }}
                  className={`min-h-12 rounded-xl border px-1.5 py-1.5 text-[8.5px] font-bold leading-tight transition ${
                    phase.id === item.id
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-neutral-200 bg-white/60 text-neutral-500 hover:border-sky-300 dark:border-white/10 dark:bg-white/[0.03]'
                  }`}
                >
                  <span className="block text-[7.5px] opacity-75">T{index + 1}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid items-center gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
              <figure className="rounded-xl border border-sky-100 bg-sky-50/60 p-2 dark:border-sky-400/10 dark:bg-sky-400/[0.03]">
                <svg viewBox="0 0 180 112" className="h-32 w-full" role="img" aria-label={`Teaching schematic: ${phase.label}, ${flowLabel}`}>
                  <path d="M45 18 Q90 2 135 18 L145 86 Q90 108 35 86 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300 dark:text-neutral-600" />
                  <g style={{ transformOrigin: '90px 55px', transform: `scale(${lungScale})` }} className="transition-transform duration-500">
                    <ellipse cx="67" cy="55" rx="20" ry="34" className="fill-sky-300/70 stroke-sky-600 dark:fill-sky-400/20 dark:stroke-sky-300" strokeWidth="1.5" />
                    <ellipse cx="113" cy="55" rx="20" ry="34" className="fill-sky-300/70 stroke-sky-600 dark:fill-sky-400/20 dark:stroke-sky-300" strokeWidth="1.5" />
                  </g>
                  <path d={`M47 ${diaphragmY} Q90 ${diaphragmY + 18} 133 ${diaphragmY}`} fill="none" className="stroke-emerald-600 dark:stroke-emerald-300 transition-all duration-500" strokeWidth="3" strokeLinecap="round" />
                  <path d="M90 10 L90 38" className="stroke-neutral-500 dark:stroke-neutral-300" strokeWidth="3" strokeLinecap="round" />
                  {phase.schematic.airflowDirection !== 0 && (
                    <g className="fill-sky-700 dark:fill-sky-200">
                      <text x="90" y="9" textAnchor="middle" fontSize="8">{phase.schematic.airflowDirection > 0 ? '↓ IN' : '↑ OUT'}</text>
                    </g>
                  )}
                </svg>
                <figcaption className="text-center text-[8px] leading-relaxed text-neutral-500">
                  Direction-of-change schematic only · not source anatomy · not to scale
                </figcaption>
              </figure>

              <div className="grid gap-1.5 sm:grid-cols-2">
                {[
                  ['Diaphragm', phase.diaphragm],
                  ['Thorax', phase.thorax],
                  ['Pleural pressure', phase.pleuralPressure],
                  ['Alveolar pressure', phase.alveolarPressure],
                  ['Airflow', phase.airflow],
                  ['Elastic recoil', phase.elasticRecoil],
                ].map(([label, text]) => (
                  <div key={label} className="rounded-lg border border-neutral-100 bg-white/70 p-2 dark:border-white/5 dark:bg-white/[0.025]">
                    <div className="text-[8px] font-black uppercase tracking-wide text-neutral-400">{label}</div>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-2 rounded-lg bg-sky-50 px-2.5 py-2 text-[9px] leading-relaxed text-sky-900 dark:bg-sky-400/10 dark:text-sky-100">{phase.teachingNote}</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-[8.5px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Mechanistic chain</div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {RESPIRATORY_STRUCTURE_CHAIN.map((item, index) => (
                <div key={item} className="flex items-center gap-1">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8.5px] font-bold text-emerald-800 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-200">{item}</span>
                  {index < RESPIRATORY_STRUCTURE_CHAIN.length - 1 && <span aria-hidden="true" className="text-[9px] text-emerald-500">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-neutral-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[8.5px] font-black uppercase tracking-[0.16em] text-neutral-500">Reference ventilation sandbox</div>
                <p className="mt-0.5 text-[9px] leading-relaxed text-neutral-500">Change teaching inputs; values are not read from a patient or wearable.</p>
              </div>
              <button
                type="button"
                onClick={() => setInputs(RESPIRATORY_REFERENCE_INPUTS)}
                className="min-h-9 shrink-0 rounded-full border border-neutral-200 px-2.5 text-[8.5px] font-bold text-neutral-500 hover:border-brand hover:text-brand dark:border-white/10"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <TeachingSlider label="Respiratory rate" value={metrics.respiratoryRate} min={4} max={40} step={1} unit="/min" onChange={(value) => setInputs((current) => ({ ...current, respiratoryRate: value }))} />
              <TeachingSlider label="Tidal volume" value={metrics.tidalVolumeMl} min={150} max={1200} step={25} unit="mL" onChange={(value) => setInputs((current) => ({ ...current, tidalVolumeMl: value }))} />
              <TeachingSlider label="Dead-space volume" value={metrics.deadSpaceMl} min={0} max={Math.min(500, metrics.tidalVolumeMl)} step={10} unit="mL" onChange={(value) => setInputs((current) => ({ ...current, deadSpaceMl: value }))} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <MetricCard label="Minute ventilation" value={`${metrics.minuteVentilationLMin.toFixed(2)} L/min`} note="V̇E = RR × VT" />
              <MetricCard label="Alveolar ventilation" value={`${metrics.alveolarVentilationLMin.toFixed(2)} L/min`} note="V̇A = RR × (VT − VD)" />
              <MetricCard label="Dead-space ventilation" value={`${metrics.deadSpaceVentilationLMin.toFixed(2)} L/min`} note="RR × VD" />
              <MetricCard label="Alveolar fraction" value={`${metrics.alveolarFractionPct.toFixed(1)}%`} note="(VT − VD) / VT" />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="text-[8.5px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Measured ≠ modeled</div>
            <p className="mt-1 text-[9.5px] leading-relaxed text-amber-950 dark:text-amber-100">{RESPIRATORY_MODEL_BOUNDARY}</p>
            <div className="mt-2 grid gap-1 text-[8.5px] leading-relaxed text-amber-900/80 dark:text-amber-100/80">
              <div>• Spirometry values such as FEV₁ and FVC must come from an acceptable measured maneuver and appropriate reference equations.</div>
              <div>• This atlas does not infer compliance, airway resistance, gas exchange, disease severity or ventilator settings from slider positions.</div>
              <div>• Shared 3D focus highlights evidence-bearing structures; the schematic above remains a separate teaching layer.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RespiratoryAtlasPanel
