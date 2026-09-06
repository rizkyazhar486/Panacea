import { lazy, Suspense, useState } from 'react'
import { DigitalTwinEngine } from '../components/digital-twin/DigitalTwinEngine'

const RegenerationResearchSandbox = lazy(() =>
  import('../components/digital-twin/RegenerationResearchSandbox').then((m) => ({ default: m.RegenerationResearchSandbox })),
)

type LabMode = 'digital-twin' | 'regeneration'

export function BodyExplorer() {
  const [mode, setMode] = useState<LabMode>('digital-twin')

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#071017]/95">
        <div>
          <div className="text-sm font-black text-ink dark:text-white">PanaceaMed Human Biology Engine</div>
          <div className="text-[11px] text-neutral-500">Digital anatomy + multi-scale aging/regeneration research.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode('digital-twin')}
            className={`rounded-full border px-4 py-2 text-xs font-black ${mode === 'digital-twin' ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
          >
            Digital Twin
          </button>
          <button
            onClick={() => setMode('regeneration')}
            className={`rounded-full border px-4 py-2 text-xs font-black ${mode === 'regeneration' ? 'border-violet-500 bg-violet-500 text-white' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}
          >
            Regeneration Lab
          </button>
        </div>
      </div>

      {mode === 'digital-twin' ? (
        <DigitalTwinEngine />
      ) : (
        <Suspense fallback={<div className="rounded-2xl border border-neutral-200 p-8 text-center text-sm text-neutral-500 dark:border-white/10">Loading regeneration research sandbox…</div>}>
          <RegenerationResearchSandbox />
        </Suspense>
      )}
    </div>
  )
}
