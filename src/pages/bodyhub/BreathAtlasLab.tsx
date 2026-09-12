import { lazy, Suspense, useState } from 'react'
import type { AtlasLayerKey } from '../../lib/wholeBodyAtlasBlueprint'
import type { RespiratoryFlowPhase } from '../../lib/respiratoryFlowVisual'
import BreathAtlasContent from './BreathAtlasContent'

const RespiratoryFlow3D = lazy(() => import('../../components/RespiratoryFlow3D'))

interface Props {
  onHighlight?: (nodeHints: string[]) => void
  onFocusRegion?: (nodeHints: string[]) => void
  onEnableLayer?: (layer: AtlasLayerKey) => void
}

const FLOW_PHASES: { id: RespiratoryFlowPhase; label: string }[] = [
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'exchange', label: 'Exchange context' },
  { id: 'expiration', label: 'Expiration' },
]

export function BreathAtlasLab(props: Props) {
  const [show3D, setShow3D] = useState(false)
  const [flowPhase, setFlowPhase] = useState<RespiratoryFlowPhase>('inspiration')

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-neutral-950 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Respiratory source render</div>
            <div className="mt-1 text-sm font-black">Airflow 3D · shipped visceral geometry</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-black">
              <a href="https://github.com/thebuggeddev/anatomy" target="_blank" rel="noreferrer" className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-neutral-300 transition hover:border-cyan-300/50 hover:text-cyan-200">thebuggeddev/anatomy ↗</a>
              <a href="https://breath-atlas.thebuggeddev.chatgpt.site/" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1 text-cyan-200 transition hover:bg-cyan-300/10">Breath Atlas reference ↗</a>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-2.5 py-1 text-amber-100">interaction reference only · license check required</span>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={show3D}
            onClick={() => setShow3D((value) => !value)}
            className="min-h-11 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 text-[10px] font-black text-cyan-100 transition hover:bg-cyan-300/15"
          >
            {show3D ? 'Close 3D render' : 'Open 3D airflow'}
          </button>
        </div>

        {show3D && (
          <div className="space-y-3 p-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Respiratory 3D phase">
              {FLOW_PHASES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={flowPhase === item.id}
                  onClick={() => setFlowPhase(item.id)}
                  className={`min-h-10 rounded-full border px-3 text-[9px] font-black transition ${flowPhase === item.id ? 'border-cyan-300 bg-cyan-300 text-neutral-950' : 'border-white/10 bg-white/5 text-neutral-300'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 text-xs font-semibold text-neutral-400" role="status">Loading respiratory WebGL…</div>}>
              <RespiratoryFlow3D phase={flowPhase} />
            </Suspense>
          </div>
        )}
      </section>

      <BreathAtlasContent {...props} />
    </div>
  )
}

export default BreathAtlasLab
