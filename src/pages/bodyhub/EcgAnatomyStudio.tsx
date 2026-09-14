import { useMemo, useState } from 'react'

interface Props {
  heartRate: number
  onHeartRateChange?: (value: number) => void
}

type Focus = 'p' | 'qrs' | 't'

const FOCUS: Record<Focus, { label: string; anatomy: string; explanation: string }> = {
  p: {
    label: 'P wave',
    anatomy: 'Atria',
    explanation: 'Educational correspondence: atrial depolarisation precedes atrial contraction. The surface ECG is an electrical projection, not a photograph of atrial motion.',
  },
  qrs: {
    label: 'QRS complex',
    anatomy: 'Ventricles',
    explanation: 'Educational correspondence: rapid ventricular depolarisation produces the QRS complex. QRS shape depends on lead orientation and conduction, so this synthetic trace is not a diagnostic template.',
  },
  t: {
    label: 'T wave',
    anatomy: 'Ventricular myocardium',
    explanation: 'Educational correspondence: ventricular repolarisation is represented by the T wave. It is intentionally simplified and carries no patient-state inference.',
  },
}

function gaussian(x: number, centre: number, width: number, amplitude: number) {
  const z = (x - centre) / width
  return amplitude * Math.exp(-0.5 * z * z)
}

function syntheticEcg(phase: number) {
  const p = gaussian(phase, 0.18, 0.035, 0.16)
  const q = gaussian(phase, 0.34, 0.012, -0.12)
  const r = gaussian(phase, 0.365, 0.014, 1.0)
  const s = gaussian(phase, 0.405, 0.018, -0.32)
  const t = gaussian(phase, 0.67, 0.07, 0.34)
  return p + q + r + s + t
}

export function EcgAnatomyStudio({ heartRate, onHeartRateChange }: Props) {
  const [focus, setFocus] = useState<Focus>('qrs')
  const rrSeconds = 60 / Math.max(1, heartRate)
  const points = useMemo(() => {
    const count = 240
    return Array.from({ length: count }, (_, index) => {
      const phase = index / (count - 1)
      const x = 8 + phase * 304
      const y = 78 - syntheticEcg(phase) * 55
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [heartRate])

  const marker = focus === 'p' ? 0.18 : focus === 'qrs' ? 0.37 : 0.67
  const markerX = 8 + marker * 304

  return (
    <section data-ecg-anatomy-studio="v1" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-sky-500/[0.08] p-3 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">Heart anatomy × ECG</div>
        <h3 className="mt-1 text-sm font-black text-ink dark:text-white">See the electrical cycle beside the source-backed heart atlas</h3>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
          The trace below is generated locally for teaching. It is not recorded ECG data, does not classify a patient rhythm, and does not reproduce code or assets from HaneenElyamani/ECG-classification because repository-level reuse terms have not been verified.
        </p>
      </div>

      <div className="p-3">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-white/10 dark:bg-white/[0.035]">
          <svg viewBox="0 0 320 112" role="img" aria-label={`Synthetic educational ECG at ${heartRate} beats per minute`} className="w-full">
            {Array.from({ length: 17 }, (_, i) => <line key={`v-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={112} stroke="currentColor" className="text-neutral-200 dark:text-white/5" strokeWidth="0.5" />)}
            {Array.from({ length: 7 }, (_, i) => <line key={`h-${i}`} x1={0} y1={i * 18.7} x2={320} y2={i * 18.7} stroke="currentColor" className="text-neutral-200 dark:text-white/5" strokeWidth="0.5" />)}
            <line x1={0} y1={78} x2={320} y2={78} stroke="currentColor" className="text-neutral-300 dark:text-white/10" strokeWidth="1" />
            <polyline points={points} fill="none" stroke="currentColor" className="text-brand" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            <line x1={markerX} y1={7} x2={markerX} y2={105} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx={markerX} cy={9} r={3.5} fill="#0ea5e9" />
          </svg>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label="ECG phase focus">
          {(Object.keys(FOCUS) as Focus[]).map((key) => (
            <button key={key} type="button" aria-pressed={focus === key} onClick={() => setFocus(key)} className={`min-h-11 rounded-xl border px-2 text-[10.5px] font-black ${focus === key ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>
              {FOCUS[key].label}
            </button>
          ))}
        </div>

        <div className="mt-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-2.5">
          <div className="text-[9px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-300">{FOCUS[focus].anatomy}</div>
          <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">{FOCUS[focus].explanation}</p>
        </div>

        <label className="mt-3 block text-[10px] font-black uppercase tracking-wide text-neutral-500">
          Heart rate · {heartRate} bpm · RR {rrSeconds.toFixed(2)} s
          <input type="range" min={40} max={180} value={heartRate} onChange={(event) => onHeartRateChange?.(Number(event.target.value))} className="mt-1 block min-h-11 w-full accent-[var(--brand,#00bf63)]" aria-label="Synthetic ECG heart rate" />
        </label>

        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-2 text-[9.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          <b className="text-amber-600 dark:text-amber-300">Boundary.</b> Formula used only for timing: RR = 60 / heart rate. Wave morphology is a smooth synthetic teaching construction, not a diagnostic ECG generator, validated classifier, measured voltage, or patient-specific rhythm. HaneenElyamani/ECG-classification is treated as a capability reference only until its reuse terms are independently verified.
        </div>
      </div>
    </section>
  )
}

export default EcgAnatomyStudio
