import { lazy, Suspense, useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'
import { BODY_SEMANTIC_ZOOM_STOPS, getBodySemanticZoomStop, isMicroscopicBodyScale, type BodySemanticScale } from '../../lib/bodySemanticZoom'

const BodyAllSystems3D = lazy(() => import('../../components/BodyAllSystems3D'))
const AtlasPhysiologyBridgePanel = lazy(() => import('./AtlasPhysiologyBridgePanel'))
const BodySystemDeepDiveWorkspace = lazy(() => import('./BodySystemDeepDiveWorkspace'))
const PathophysiologyNetworkPanel = lazy(() => import('./PathophysiologyNetworkPanel'))
const PharmacologyMechanismPanel = lazy(() => import('./PharmacologyMechanismPanel'))
const BiomechanicsMotionLab = lazy(() => import('./BiomechanicsMotionLab'))
const CellLab = lazy(() => import('./CellLab').then((module) => ({ default: module.CellLab })))
const AlphaGenomeAtlas = lazy(() => import('./AlphaGenomeAtlas'))
const SurgicalLab = lazy(() => import('./SurgicalLab').then((module) => ({ default: module.SurgicalLab })))
const SemanticMicroscopeStage = lazy(() => import('./SemanticMicroscopeStage'))

type SimulationDomain =
  | 'anatomy'
  | 'physiology'
  | 'pathophysiology'
  | 'biomechanics'
  | 'cell'
  | 'genome'
  | 'surgery'
  | 'pharmacology'

interface UnifiedHumanSimulationProjectorProps {
  selectedSystemId: BodySystemId
  onSystemChange: (systemId: BodySystemId) => void
}

type DomainDefinition = {
  id: SimulationDomain
  label: string
  scale: string
  description: string
}

const DOMAINS: DomainDefinition[] = [
  {
    id: 'anatomy',
    label: '3D Anatomy',
    scale: 'whole body → organ',
    description: 'Keep the source-backed whole-body atlas as the spatial anchor for every other simulation.',
  },
  {
    id: 'physiology',
    label: 'Physiology',
    scale: 'organ → system',
    description: 'Project function, coupling and organ-specific dynamics onto the currently selected body system.',
  },
  {
    id: 'pathophysiology',
    label: 'Pathophysiology',
    scale: 'failure cascade',
    description: 'Trace disease mechanisms from trigger and injury through compensation, propagation and consequence.',
  },
  {
    id: 'biomechanics',
    label: 'Biomechanics',
    scale: 'motion → load',
    description: 'Connect movement, joint excursion and source-backed musculoskeletal anatomy in the same body context.',
  },
  {
    id: 'cell',
    label: 'Cells',
    scale: 'tissue → organelle',
    description: 'Descend from organ context into cellular structure, metabolic compartments and ATP-generating pathways.',
  },
  {
    id: 'genome',
    label: 'Genome',
    scale: 'chromosome → pathway',
    description: 'Continue from cells to chromosome, locus, gene, variant, protein and pathway with explicit provenance.',
  },
  {
    id: 'surgery',
    label: 'Surgery',
    scale: 'surface → operative depth',
    description: 'Explore educational surgical layers and spatial checkpoints without turning reference anatomy into navigation.',
  },
  {
    id: 'pharmacology',
    label: 'Pharmacology',
    scale: 'target → system effect',
    description: 'Connect drug mechanisms to the same selected anatomy, physiology and disease context.',
  },
]


function readableSystem(id: BodySystemId) {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function tabClass(active: boolean) {
  const base = 'min-h-10 shrink-0 rounded-full border px-3 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 '
  return base + (active
    ? 'border-cyan-300/30 bg-cyan-300/[.12] text-white'
    : 'border-white/[.07] bg-white/[.025] text-white/45 hover:border-white/15 hover:bg-white/[.05] hover:text-white/80')
}

function ProjectorLoader({ label }: { label: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-[22px] border border-white/[.08] bg-black/35 text-[10px] font-bold text-white/35" role="status">
      Loading {label}…
    </div>
  )
}

export default function UnifiedHumanSimulationProjector({
  selectedSystemId,
  onSystemChange,
}: UnifiedHumanSimulationProjectorProps) {
  const [domain, setDomain] = useState<SimulationDomain>('anatomy')
  const [semanticZoom, setSemanticZoom] = useState<{ scale: BodySemanticScale; relativeZoom: number }>({ scale: 'whole-body', relativeZoom: 1 })
  const current = useMemo(
    () => DOMAINS.find((item) => item.id === domain) ?? DOMAINS[0],
    [domain],
  )
  const systemLabel = readableSystem(selectedSystemId)
  const semanticStop = getBodySemanticZoomStop(semanticZoom.scale)
  const microscopic = isMicroscopicBodyScale(semanticZoom.scale)

  function renderDomain() {
    switch (domain) {
      case 'physiology':
        return (
          <div className="space-y-3">
            <AtlasPhysiologyBridgePanel
              selectedAtlasSystemId={selectedSystemId}
              onSystemChange={(systemId) => onSystemChange(systemId)}
            />
            <BodySystemDeepDiveWorkspace selectedAtlasSystemId={selectedSystemId} />
          </div>
        )
      case 'pathophysiology':
        return <PathophysiologyNetworkPanel selectedAtlasSystemId={selectedSystemId} />
      case 'biomechanics':
        return <BiomechanicsMotionLab />
      case 'cell':
        return <CellLab />
      case 'genome':
        return <AlphaGenomeAtlas />
      case 'surgery':
        return <SurgicalLab />
      case 'pharmacology':
        return <PharmacologyMechanismPanel selectedAtlasSystemId={selectedSystemId} />
      case 'anatomy':
      default:
        return (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Spatial anchor', 'The 3D source atlas remains the canonical visual coordinate system.'],
              ['Persistent context', systemLabel + ' stays selected while you change simulation domain.'],
              ['Scale continuity', 'Body → organ → tissue → cell → genome is treated as one navigable hierarchy.'],
              ['Evidence boundary', 'Reference and simulated states stay visibly separate from patient-specific data.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3">
                <div className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-200/70">{title}</div>
                <p className="mt-1 text-[10px] leading-relaxed text-white/45">{copy}</p>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <section
      data-unified-human-simulation-projector="v1"
      data-selected-body-system={selectedSystemId}
      data-simulation-domain={domain}
      data-semantic-scale={semanticZoom.scale}
      className="overflow-hidden rounded-[30px] border border-white/[.09] bg-[#020508] text-white shadow-[0_28px_90px_rgba(0,0,0,.36)]"
      aria-labelledby="unified-human-simulation-title"
    >
      <header className="border-b border-white/[.08] p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/70">Body Exposure · unified human simulation projector</div>
            <h3 id="unified-human-simulation-title" className="mt-1 text-lg font-black tracking-[-.025em] sm:text-xl">
              One 3D body, one selected system, every biological scale
            </h3>
            <p className="mt-1 max-w-4xl text-[10px] leading-relaxed text-white/45 sm:text-[11px]">
              Switch the simulation layer without abandoning the spatial context. Anatomy is the anchor; physiology, disease, movement, cells, genome, surgery and pharmacology are projections over the same body model.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.055] px-3 py-2">
            <div className="text-[8px] font-black uppercase tracking-[.15em] text-cyan-200/55">Selected system</div>
            <div className="mt-0.5 text-xs font-black text-cyan-50">{systemLabel}</div>
          </div>
        </div>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Unified simulation domains">
          {DOMAINS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={domain === item.id}
              onClick={() => setDomain(item.id)}
              className={tabClass(domain === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0 border-b border-white/[.08] p-2 sm:p-3 xl:border-b-0 xl:border-r">
          <Suspense fallback={<ProjectorLoader label="3D anatomy" />}>
            <BodyAllSystems3D
              selectedSystemId={selectedSystemId}
              onSystemChange={onSystemChange}
              onSemanticZoomChange={setSemanticZoom}
            />
          </Suspense>
        </div>

        <aside className="p-3 sm:p-4">
          <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/30">Active projection</div>
          <div className="mt-1 text-sm font-black text-white/90">{current.label}</div>
          <div className="mt-0.5 text-[9px] font-bold text-cyan-200/55">{current.scale}</div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/45">{current.description}</p>

          <div className="mt-4 flex items-end justify-between gap-2">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/30">Semantic zoom</div>
              <div className="mt-1 text-xs font-black text-white/85">{semanticStop.label}</div>
            </div>
            <div className="text-right text-[8px] font-bold text-cyan-200/55">{semanticZoom.relativeZoom.toFixed(1)}× from fitted view</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BODY_SEMANTIC_ZOOM_STOPS.map((stop, index) => {
              const active = stop.id === semanticZoom.scale
              return (
                <span
                  key={stop.id}
                  title={stop.note}
                  className={active
                    ? 'rounded-full border border-cyan-300/35 bg-cyan-300/[.12] px-2 py-1 text-[8px] font-bold text-cyan-100'
                    : 'rounded-full border border-white/[.08] bg-white/[.025] px-2 py-1 text-[8px] font-bold text-white/35'}
                >
                  {index + 1}. {stop.label}
                </span>
              )
            })}
          </div>
          <p className="mt-2 text-[8px] leading-relaxed text-white/30">Relative zoom controls representation/LOD; it is not optical magnification.</p>

          <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/[.045] p-2.5 text-[9px] leading-relaxed text-amber-100/65">
            Educational/reference simulation. Generic atlas geometry and synthetic models are not patient-specific anatomy, diagnosis, operative navigation or treatment advice.
          </div>
        </aside>
      </div>

      {microscopic && (
        <div className="border-t border-white/[.08] p-2 sm:p-3" data-semantic-microscope-active={semanticZoom.scale}>
          <Suspense fallback={<ProjectorLoader label={semanticStop.label + ' detail'} />}>
            <SemanticMicroscopeStage scale={semanticZoom.scale} selectedSystemId={selectedSystemId} />
          </Suspense>
        </div>
      )}

      <div className="border-t border-white/[.08] p-2 sm:p-3">
        <Suspense fallback={<ProjectorLoader label={current.label} />}>
          {renderDomain()}
        </Suspense>
      </div>
    </section>
  )
}
