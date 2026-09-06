import { lazy, Suspense, useState } from 'react'
import { DigitalTwinEngine } from '../components/digital-twin/DigitalTwinEngine'

const RegenerationResearchSandbox = lazy(() =>
  import('../components/digital-twin/RegenerationResearchSandbox').then((m) => ({ default: m.RegenerationResearchSandbox })),
)

const RealisticAnatomyAtlas = lazy(() =>
  import('../components/digital-twin/RealisticAnatomyAtlas').then((m) => ({ default: m.RealisticAnatomyAtlas })),
)

const CounterfactualBiologyLab = lazy(() =>
  import('../components/digital-twin/CounterfactualBiologyLab').then((m) => ({ default: m.CounterfactualBiologyLab })),
)

const Workout4DLab = lazy(() =>
  import('../components/digital-twin/Workout4DLab').then((m) => ({ default: m.Workout4DLab })),
)

const SurgicalOperationAtlas = lazy(() =>
  import('../components/digital-twin/SurgicalOperationAtlasV2').then((m) => ({ default: m.SurgicalOperationAtlasV2 })),
)

type LabMode = 'digital-twin' | 'realistic-atlas' | 'workout-4d' | 'surgery' | 'counterfactual' | 'regeneration'

const MODES: Array<{ key: LabMode; label: string; active: string }> = [
  { key: 'digital-twin', label: 'Digital Twin', active: 'border-brand bg-brand text-white' },
  { key: 'realistic-atlas', label: 'Realistic Atlas', active: 'border-cyan-500 bg-cyan-500 text-white' },
  { key: 'workout-4d', label: 'Inside Workout 4D', active: 'border-emerald-500 bg-emerald-500 text-white' },
  { key: 'surgery', label: 'Operation Universe', active: 'border-amber-400 bg-amber-400 text-neutral-950' },
  { key: 'counterfactual', label: 'Counterfactual Lab', active: 'border-sky-500 bg-sky-500 text-white' },
  { key: 'regeneration', label: 'Regeneration Lab', active: 'border-violet-500 bg-violet-500 text-white' },
]

function LoadingLab({ label }: { label: string }) {
  return <div className="rounded-2xl border border-neutral-200 p-8 text-center text-sm text-neutral-500 dark:border-white/10">Loading {label}…</div>
}

export function BodyExplorer() {
  const [mode, setMode] = useState<LabMode>('digital-twin')

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-40 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#071017]/95">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-black text-ink dark:text-white">PanaceaMed Human Biology Engine</div>
            <div className="mt-0.5 max-w-3xl text-[11px] text-neutral-500">Reference anatomy, 4D workout replay + Workout DNA, a scalable surgical Operation Universe, executable counterfactual biology and multi-scale research — kept separate from patient-specific claims unless real validated data exist.</div>
          </div>
          <div className="rounded-full border border-emerald-500/15 bg-emerald-500/[.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Executable human biology</div>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {MODES.map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black ${mode === item.key ? item.active : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'digital-twin' ? (
        <DigitalTwinEngine />
      ) : mode === 'realistic-atlas' ? (
        <Suspense fallback={<LoadingLab label="realistic anatomy atlas" />}>
          <RealisticAnatomyAtlas />
        </Suspense>
      ) : mode === 'workout-4d' ? (
        <Suspense fallback={<LoadingLab label="Inside My Workout 4D" />}>
          <Workout4DLab />
        </Suspense>
      ) : mode === 'surgery' ? (
        <Suspense fallback={<LoadingLab label="Operation Universe" />}>
          <SurgicalOperationAtlas />
        </Suspense>
      ) : mode === 'counterfactual' ? (
        <Suspense fallback={<LoadingLab label="counterfactual biology lab" />}>
          <CounterfactualBiologyLab />
        </Suspense>
      ) : (
        <Suspense fallback={<LoadingLab label="regeneration research sandbox" />}>
          <RegenerationResearchSandbox />
        </Suspense>
      )}
    </div>
  )
}
