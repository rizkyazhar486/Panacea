import { useMemo, useState } from 'react'

type Preset = 'slow' | 'alpha' | 'mixed'
type Electrode = { id: string; x: number; y: number; region: string }

const ELECTRODES: Electrode[] = [
  { id: 'Fp1', x: 38, y: 20, region: 'left frontal pole' },
  { id: 'Fp2', x: 62, y: 20, region: 'right frontal pole' },
  { id: 'F3', x: 34, y: 34, region: 'left frontal' },
  { id: 'F4', x: 66, y: 34, region: 'right frontal' },
  { id: 'C3', x: 31, y: 50, region: 'left central' },
  { id: 'Cz', x: 50, y: 50, region: 'vertex' },
  { id: 'C4', x: 69, y: 50, region: 'right central' },
  { id: 'P3', x: 34, y: 66, region: 'left parietal' },
  { id: 'P4', x: 66, y: 66, region: 'right parietal' },
  { id: 'O1', x: 40, y: 81, region: 'left occipital' },
  { id: 'O2', x: 60, y: 81, region: 'right occipital' },
]

const PRESETS: Record<Preset, { label: string; components: Array<[number, number]>; description: string }> = {
  slow: {
    label: 'Slow dominant',
    components: [[2.5, 0.8], [5.5, 0.2], [10, 0.08]],
    description: 'Synthetic trace with most energy in slower components. This is a signal-shape lesson, not sleep staging or encephalopathy detection.',
  },
  alpha: {
    label: 'Alpha dominant',
    components: [[10, 0.75], [4, 0.12], [20, 0.08]],
    description: 'Synthetic trace emphasizing a 10 Hz component to make spectral concentration visible. It is not evidence of a person’s alertness or cognitive state.',
  },
  mixed: {
    label: 'Fast mixed',
    components: [[18, 0.38], [24, 0.25], [10, 0.18], [5, 0.12]],
    description: 'Synthetic mixture of several frequencies. The display is intentionally generic and cannot infer medication, anxiety, seizure, cognition, or other patient states.',
  },
}

const BANDS = [
  { key: 'delta', label: 'Delta', lo: 0.5, hi: 4 },
  { key: 'theta', label: 'Theta', lo: 4, hi: 8 },
  { key: 'alpha', label: 'Alpha', lo: 8, hi: 13 },
  { key: 'beta', label: 'Beta', lo: 13, hi: 30 },
] as const

function bandPowers(components: Array<[number, number]>) {
  const raw = BANDS.map((band) => components
    .filter(([f]) => f >= band.lo && f < band.hi)
    .reduce((sum, [, amplitude]) => sum + amplitude * amplitude, 0))
  const total = raw.reduce((sum, value) => sum + value, 0) || 1
  return raw.map((value) => value / total)
}

export function EegScalpStudio() {
  const [preset, setPreset] = useState<Preset>('alpha')
  const [electrodeId, setElectrodeId] = useState('Cz')
  const selected = ELECTRODES.find((item) => item.id === electrodeId) ?? ELECTRODES[5]
  const config = PRESETS[preset]
  const powers = useMemo(() => bandPowers(config.components), [config])

  const trace = useMemo(() => {
    const count = 260
    return Array.from({ length: count }, (_, index) => {
      const t = (index / (count - 1)) * 1.8
      const signal = config.components.reduce((sum, [frequency, amplitude], componentIndex) =>
        sum + amplitude * Math.sin(2 * Math.PI * frequency * t + componentIndex * 0.9), 0)
      const x = 5 + (index / (count - 1)) * 310
      const y = 54 - signal * 25
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [config])

  return (
    <section data-eeg-scalp-studio="v1" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-sky-500/[0.08] p-3 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">Brain / scalp × EEG</div>
        <h3 className="mt-1 text-sm font-black text-ink dark:text-white">Move between electrode context and a synthetic signal</h3>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
          Select a scalp site, change the synthetic frequency mixture and watch the trace and relative band-power display change together. Nothing here reads a patient EEG or estimates a mental or neurologic state.
        </p>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="relative mx-auto aspect-square max-w-[260px] rounded-full border-2 border-neutral-300 bg-white dark:border-white/15 dark:bg-neutral-950" role="group" aria-label="Schematic scalp electrode selector">
            <div className="absolute left-1/2 top-[-7px] h-4 w-5 -translate-x-1/2 rounded-t-full border border-neutral-300 bg-white dark:border-white/15 dark:bg-neutral-950" />
            <div className="absolute left-[-5px] top-1/2 h-10 w-3 -translate-y-1/2 rounded-l-full border border-neutral-300 dark:border-white/15" />
            <div className="absolute right-[-5px] top-1/2 h-10 w-3 -translate-y-1/2 rounded-r-full border border-neutral-300 dark:border-white/15" />
            {ELECTRODES.map((electrode) => (
              <button key={electrode.id} type="button" aria-pressed={electrodeId === electrode.id} aria-label={`${electrode.id}, ${electrode.region}`} onClick={() => setElectrodeId(electrode.id)}
                className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[9px] font-black ${electrodeId === electrode.id ? 'border-violet-400 bg-violet-500 text-white' : 'border-neutral-300 bg-white text-neutral-600 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-300'}`}
                style={{ left: `${electrode.x}%`, top: `${electrode.y}%` }}>
                {electrode.id}
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-lg bg-violet-500/[0.07] p-2 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            <b>{selected.id}</b> · {selected.region}. Positions are an educational schematic inspired by the 10–20 naming convention, not measured sensor coordinates or a patient head model.
          </div>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Synthetic EEG signal preset">
            {(Object.keys(PRESETS) as Preset[]).map((key) => (
              <button key={key} type="button" aria-pressed={preset === key} onClick={() => setPreset(key)} className={`min-h-11 rounded-xl border px-2 text-[10px] font-black ${preset === key ? 'border-violet-400 bg-violet-500 text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>
                {PRESETS[key].label}
              </button>
            ))}
          </div>

          <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03]">
            <svg viewBox="0 0 320 108" role="img" aria-label={`Synthetic EEG trace at ${selected.id}`} className="w-full">
              {Array.from({ length: 9 }, (_, i) => <line key={i} x1={0} y1={i * 13.5} x2={320} y2={i * 13.5} stroke="currentColor" className="text-neutral-200 dark:text-white/5" strokeWidth="0.5" />)}
              <line x1={0} y1={54} x2={320} y2={54} stroke="currentColor" className="text-neutral-300 dark:text-white/10" strokeWidth="0.8" />
              <polyline points={trace} fill="none" stroke="currentColor" className="text-violet-500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{config.description}</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {BANDS.map((band, index) => (
              <div key={band.key} className="rounded-xl border border-neutral-200 p-2 dark:border-white/10">
                <div className="flex items-center justify-between text-[9.5px]"><span className="font-black text-neutral-600 dark:text-neutral-300">{band.label} · {band.lo}–{band.hi} Hz</span><span className="font-mono text-neutral-500">{Math.round(powers[index] * 100)}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/5"><div className="h-full rounded-full bg-violet-500" style={{ width: `${powers[index] * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 p-3 text-[9.5px] leading-relaxed text-neutral-500 dark:border-white/10">
        <b className="text-violet-600 dark:text-violet-300">Boundary.</b> Relative band power is shown as P_band / P_total using squared synthetic component amplitudes. This is not a clinical PSD pipeline. NeuroTechX/dl-eeg-playground is a capability reference only because repository-level reuse terms have not been verified; no code, assets, weights or reported performance are copied. No seizure detection, sleep staging, consciousness, mood, cognition or patient-state inference is performed.
      </div>
    </section>
  )
}

export default EegScalpStudio
