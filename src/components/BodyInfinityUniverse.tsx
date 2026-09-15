import { lazy, Suspense, useState } from 'react'

const BodyInfinityLab = lazy(() => import('./BodyInfinityLab'))
const BodySimulationDeck = lazy(() => import('./BodySimulationDeck'))
const BodyTrillionLab = lazy(() => import('./BodyTrillionLab'))
const BodyOpenWorldLab = lazy(() => import('./BodyOpenWorldLab'))
const BodyUniverseCatalog = lazy(() => import('./BodyUniverseCatalog'))
const BodyExperienceCompilerLab = lazy(() => import('./BodyExperienceCompilerLab'))

type UniversePanel = 'spatial' | 'simulation' | 'trillion' | 'world' | 'catalog' | 'compiler'

const PANELS: readonly { id: UniversePanel; label: string; description: string }[] = [
  { id: 'spatial', label: 'Spatial Lab', description: 'Motion, cinematic, spatial and game prototypes.' },
  { id: 'simulation', label: 'Simulation Factory', description: 'Synthetic physiology, imaging, surgery and biomechanics controls.' },
  { id: 'trillion', label: 'Trillion Space', description: '1.73T deterministic experience coordinates without trillion-object allocation.' },
  { id: 'world', label: 'Open World', description: 'Procedural anatomical districts, missions, encounters and progression.' },
  { id: 'catalog', label: 'Universe Catalog', description: 'Surgery, micro worlds, imaging, visual FX and motion primitives.' },
  { id: 'compiler', label: 'Compiler Lab', description: 'Compile any experimental coordinate into modules, scene layers and performance plans.' },
]

function LoadingPanel({ label }: { label: string }) {
  return <div className="grid min-h-72 place-items-center rounded-[30px] border border-white/[.07] bg-black/50 text-xs font-bold text-white/30">Loading {label}…</div>
}

export default function BodyInfinityUniverse() {
  const [panel, setPanel] = useState<UniversePanel>('spatial')
  const selected = PANELS.find((item) => item.id === panel) ?? PANELS[0]

  return (
    <section className="relative" aria-label="Body Exposure experimental universe">
      <div className="sticky top-2 z-[12] mb-3 rounded-[24px] border border-white/[.085] bg-black/70 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,.32)] backdrop-blur-2xl">
        <div className="flex min-w-max gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {PANELS.map((item) => {
            const active = item.id === panel
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPanel(item.id)}
                className={`min-h-[42px] rounded-[18px] border px-4 text-[10px] font-black transition ${active ? 'border-cyan-300/25 bg-[linear-gradient(135deg,rgba(34,211,238,.14),rgba(139,92,246,.10),rgba(236,72,153,.07))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]' : 'border-transparent bg-transparent text-white/38 hover:border-white/[.08] hover:bg-white/[.035] hover:text-white/68'}`}
              >
                {item.label}
              </button>
            )
          })}
          <div className="ml-auto hidden items-center px-3 text-[9px] font-bold text-white/26 sm:flex">{selected.description}</div>
        </div>
      </div>

      {panel === 'spatial' && (
        <Suspense fallback={<LoadingPanel label="Spatial Lab" />}>
          <BodyInfinityLab />
        </Suspense>
      )}
      {panel === 'simulation' && (
        <Suspense fallback={<LoadingPanel label="Simulation Factory" />}>
          <BodySimulationDeck />
        </Suspense>
      )}
      {panel === 'trillion' && (
        <Suspense fallback={<LoadingPanel label="Trillion Space" />}>
          <BodyTrillionLab />
        </Suspense>
      )}
      {panel === 'world' && (
        <Suspense fallback={<LoadingPanel label="Open World" />}>
          <BodyOpenWorldLab />
        </Suspense>
      )}
      {panel === 'catalog' && (
        <Suspense fallback={<LoadingPanel label="Universe Catalog" />}>
          <BodyUniverseCatalog />
        </Suspense>
      )}
      {panel === 'compiler' && (
        <Suspense fallback={<LoadingPanel label="Compiler Lab" />}>
          <BodyExperienceCompilerLab />
        </Suspense>
      )}
    </section>
  )
}
