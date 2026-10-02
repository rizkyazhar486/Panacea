import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { resolveBodySystemSourceWave, type BodySystemId } from '../../lib/bodySystemSourceWave'
import { getBodySemanticZoomStop, isMicroscopicBodyScale, type BodySemanticScale } from '../../lib/bodySemanticZoom'
import { penjelasanTertulis } from '../../lib/explainFallback'
import UniversalAtlasDepthRail from './UniversalAtlasDepthRail'

const BodyAllSystems3D = lazy(() => import('../../components/BodyAllSystems3D'))
const AtlasPhysiologyBridgePanel = lazy(() => import('./AtlasPhysiologyBridgePanel'))
const WholeBodyPhysiologyWorkbench = lazy(() => import('./WholeBodyPhysiologyWorkbench'))
const PhysiologyDeepDivePanel = lazy(() => import('./PhysiologyDeepDivePanel').then((module) => ({ default: module.PhysiologyDeepDivePanel })))
const BodySystemDeepDiveWorkspace = lazy(() => import('./BodySystemDeepDiveWorkspace'))
const PathophysiologyNetworkPanel = lazy(() => import('./PathophysiologyNetworkPanel'))
const PharmacologyMechanismPanel = lazy(() => import('./PharmacologyMechanismPanel'))
const BiomechanicsMotionLab = lazy(() => import('./BiomechanicsMotionLab'))
const CellLab = lazy(() => import('./CellLab').then((module) => ({ default: module.CellLab })))
const AlphaGenomeAtlas = lazy(() => import('./AlphaGenomeAtlas'))
const SurgicalLab = lazy(() => import('./SurgicalLab').then((module) => ({ default: module.SurgicalLab })))
const SemanticMicroscopeStage = lazy(() => import('./SemanticMicroscopeStage'))
const PanelEcmo = lazy(() => import('../../components/PanelEcmo').then((module) => ({ default: module.PanelEcmo })))
const LokalisasiLesiPanel = lazy(() => import('./LokalisasiLesiPanel').then((module) => ({ default: module.LokalisasiLesiPanel })))
const PencitraanVolumetrikPanel = lazy(() => import('./PencitraanVolumetrikPanel').then((module) => ({ default: module.PencitraanVolumetrikPanel })))
const VirtualEndoscopyWorkbench = lazy(() => import('./VirtualEndoscopyWorkbench'))
const PersonalAvatarCameraCapture = lazy(() => import('./PersonalAvatarCameraCapture'))

export type SimulationDomain =
  | 'anatomy'
  | 'personal-avatar'
  | 'localization'
  | 'physiology'
  | 'pathophysiology'
  | 'imaging'
  | 'endoscopy'
  | 'biomechanics'
  | 'cell'
  | 'genome'
  | 'surgery'
  | 'pharmacology'

interface UnifiedHumanSimulationProjectorProps {
  selectedSystemId: BodySystemId
  onSystemChange: (systemId: BodySystemId) => void
  requestedDomain?: SimulationDomain
  onDomainChange?: (domain: SimulationDomain) => void
  compact?: boolean
  /** Permintaan fokus struktur sumber dari luar (mis. temuan AI-EMR). `nonce` memicu ulang pilihan yang sama. */
  requestedStructure?: { name: string; nonce: number } | null
}

type DomainDefinition = {
  id: SimulationDomain
  label: string
  scale: string
  description: string
}

const DOMAINS: DomainDefinition[] = [
  {
    id: 'personal-avatar',
    label: 'My Body',
    scale: 'camera → personal surface',
    description: 'Import the patient-facing external body identity from one RGB camera while keeping internal anatomy provenance separate.',
  },
  {
    id: 'anatomy',
    label: '3D Anatomy',
    scale: 'whole body → organ',
    description: 'Keep the source-backed whole-body atlas as the spatial anchor for every other simulation.',
  },
  {
    id: 'localization',
    label: 'Localization',
    scale: 'finding → tract → level',
    description: 'Localize educational lesion patterns against tract crossings, cranial nerve levels and the same nervous-system anatomy context.',
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
    id: 'imaging',
    label: 'Imaging',
    scale: 'voxel → anatomy',
    description: 'Connect CT windowing, volumetric reconstruction and DICOM context back to the same anatomy instead of a separate radiology island.',
  },
  {
    id: 'endoscopy',
    label: 'Scope',
    scale: 'lumen → landmark',
    description: 'Move through a simulated endoluminal teaching view while a schematic anatomy route stays visible.',
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
  requestedDomain,
  onDomainChange,
  compact = false,
  requestedStructure = null,
}: UnifiedHumanSimulationProjectorProps) {
  const [internalDomain, setInternalDomain] = useState<SimulationDomain>('anatomy')
  const [selectedStructureName, setSelectedStructureName] = useState<string | null>(null)
  const [semanticZoom, setSemanticZoom] = useState<{ scale: BodySemanticScale; relativeZoom: number }>({ scale: 'whole-body', relativeZoom: 1 })
  const domain = requestedDomain ?? internalDomain
  const systems = useMemo(() => resolveBodySystemSourceWave(), [])
  const currentSystem = systems.find((system) => system.id === selectedSystemId) ?? systems[0]!
  const current = useMemo(
    () => DOMAINS.find((item) => item.id === domain) ?? DOMAINS[0],
    [domain],
  )
  const systemLabel = readableSystem(selectedSystemId)
  const semanticStop = getBodySemanticZoomStop(semanticZoom.scale)
  const microscopic = isMicroscopicBodyScale(semanticZoom.scale)
  const isEndoscopy = domain === 'endoscopy'
  const hideReferenceAtlasCanvas = isEndoscopy
  const selectedStructureEducation = useMemo(() => {
    if (!selectedStructureName) return ''
    return penjelasanTertulis(selectedStructureName, selectedStructureName).replace(/\*\*/g, '')
  }, [selectedStructureName])

  useEffect(() => {
    setSelectedStructureName(null)
  }, [selectedSystemId])

  // Dijalankan SETELAH reset sistem di atas, sehingga fokus dari temuan bertahan
  // ketika permintaan itu juga mengganti sistem.
  useEffect(() => {
    if (requestedStructure?.name) setSelectedStructureName(requestedStructure.name)
  }, [requestedStructure, selectedSystemId])

  useEffect(() => {
    if (domain === 'localization' && selectedSystemId !== 'nervous') onSystemChange('nervous')
  }, [domain, onSystemChange, selectedSystemId])

  function selectDomain(next: SimulationDomain) {
    if (requestedDomain === undefined) setInternalDomain(next)
    onDomainChange?.(next)
  }

  function openScale(scale: BodySemanticScale) {
    if (scale === 'tissue' || scale === 'cell' || scale === 'organelle') selectDomain('cell')
    else if (scale === 'molecule' || scale === 'genome') selectDomain('genome')
    else selectDomain('anatomy')
  }

  function renderDomain() {
    switch (domain) {
      case 'personal-avatar':
        return <PersonalAvatarCameraCapture />
      case 'localization':
        return <LokalisasiLesiPanel />
      case 'physiology':
        return (
          <div className="space-y-3">
            <WholeBodyPhysiologyWorkbench />
            <Suspense fallback={<div className="h-40 rounded-2xl bg-neutral-900" />}><PanelEcmo /></Suspense>
            <AtlasPhysiologyBridgePanel
              selectedAtlasSystemId={selectedSystemId}
              selectedSourceStructureName={selectedStructureName}
              onSystemChange={(systemId) => onSystemChange(systemId)}
            />
            <BodySystemDeepDiveWorkspace selectedAtlasSystemId={selectedSystemId} />
            <PhysiologyDeepDivePanel />
          </div>
        )
      case 'pathophysiology':
        return <PathophysiologyNetworkPanel selectedAtlasSystemId={selectedSystemId} selectedSourceStructureName={selectedStructureName} />
      case 'imaging':
        return <PencitraanVolumetrikPanel selectedSourceStructureName={selectedStructureName} />
      case 'endoscopy':
        return <VirtualEndoscopyWorkbench selectedSystemId={selectedSystemId} selectedSourceStructureName={selectedStructureName} onSystemChange={onSystemChange} />
      case 'biomechanics':
        return <BiomechanicsMotionLab />
      case 'cell':
        return <CellLab />
      case 'genome':
        return <AlphaGenomeAtlas />
      case 'surgery':
        return <SurgicalLab selectedSourceStructureName={selectedStructureName} />
      case 'pharmacology':
        return <PharmacologyMechanismPanel selectedAtlasSystemId={selectedSystemId} selectedSourceStructureName={selectedStructureName} />
      case 'anatomy':
      default:
        return (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.72fr)]">
            <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3">
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-200/70">Selected structure</div>
              <div className="mt-1 text-base font-black text-white/90">{selectedStructureName ?? 'Tap a rendered structure'}</div>
              <p className="mt-1 text-[10px] leading-relaxed text-white/45">
                Selection comes from the rendered source mesh, not inferred screen position. The exact structure can stay in context while the projection changes.
              </p>
              {selectedStructureName && (
                <button type="button" onClick={() => setSelectedStructureName(null)} className="mt-3 min-h-9 rounded-full border border-white/10 px-3 text-[9px] font-black text-white/55 hover:text-white">
                  Clear structure
                </button>
              )}
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3">
              <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">Source-backed structure shortcuts</div>
              <div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {currentSystem.targets.flatMap((target) => target.names.slice(0, 4)).slice(0, 18).map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selectedStructureName === name}
                    onClick={() => setSelectedStructureName(name)}
                    className="min-h-8 max-w-full truncate rounded-full border border-white/[.08] bg-black/20 px-2.5 text-[8px] font-bold text-white/45 aria-pressed:border-cyan-300/35 aria-pressed:bg-cyan-300/[.10] aria-pressed:text-cyan-100"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
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
      data-selected-source-structure={selectedStructureName ?? undefined}
      className="dark overflow-hidden rounded-[30px] border border-white/[.09] bg-[#020508] text-white shadow-[0_28px_90px_rgba(0,0,0,.36)]"
      aria-labelledby="unified-human-simulation-title"
      aria-description="Body → system → organ → tissue → cell → organelle → molecule → genome"
    >
      <header className="border-b border-white/[.08] p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/70">Body Exposure · unified human simulation projector</div>
            <h3 id="unified-human-simulation-title" className="mt-1 text-lg font-black tracking-[-.025em] sm:text-xl">
              One body. Switch the projection.
            </h3>
            <p className="mt-1 max-w-4xl text-[10px] leading-relaxed text-white/45 sm:text-[11px]">
              Anatomy · function · imaging · scope · surgery · micro — one persistent body context.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.055] px-3 py-2">
            <div className="text-[8px] font-black uppercase tracking-[.15em] text-cyan-200/55">Selected system</div>
            <div className="mt-0.5 text-xs font-black text-cyan-50">{systemLabel}</div>
          </div>
        </div>

        {!compact && (
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Unified simulation domains">
            {DOMAINS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={domain === item.id}
                onClick={() => selectDomain(item.id)}
                className={tabClass(domain === item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {!hideReferenceAtlasCanvas && (
        <UniversalAtlasDepthRail
          semanticScale={semanticZoom.scale}
          selectedSystemId={selectedSystemId}
          onOpenScale={openScale}
        />
      )}

      {!hideReferenceAtlasCanvas && (
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0 border-b border-white/[.08] p-2 sm:p-3 xl:border-b-0 xl:border-r">
          <Suspense fallback={<ProjectorLoader label="3D anatomy" />}>
            <BodyAllSystems3D
              selectedSystemId={selectedSystemId}
              onSystemChange={onSystemChange}
              onSemanticZoomChange={setSemanticZoom}
              selectedStructureName={selectedStructureName}
              onStructureSelect={setSelectedStructureName}
              focusRequest={requestedStructure}
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
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/30" title="Relative zoom controls representation/LOD; it is not optical magnification">Semantic zoom</div>
              <div className="mt-1 text-xs font-black text-white/85">{semanticStop.label}</div>
            </div>
            <div className="text-right text-[8px] font-bold text-cyan-200/55">{semanticZoom.relativeZoom.toFixed(1)}× from fitted view</div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[.08] bg-white/[.025] p-2.5">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/30">Structure context</div>
            <div className="mt-1 truncate text-[10px] font-black text-cyan-100/80">{selectedStructureName ?? 'No exact mesh selected'}</div>
            <div className="mt-1 text-[8px] leading-relaxed text-white/30">Tap the 3D atlas or choose a source node in Anatomy. Context persists across projections.</div>
            {selectedStructureEducation && (
              <details className="mt-2 border-t border-white/[.07] pt-2">
                <summary className="cursor-pointer text-[8px] font-black uppercase tracking-[.12em] text-cyan-100/55">Explain structure</summary>
                <p className="mt-1 line-clamp-6 whitespace-pre-line text-[9px] leading-relaxed text-white/42">{selectedStructureEducation}</p>
              </details>
            )}
          </div>

          <div className="mt-3 rounded-2xl border border-amber-300/12 bg-amber-300/[.045] p-2.5 text-[9px] leading-relaxed text-amber-100/65">
            Educational/reference simulation. Generic atlas geometry and synthetic models are not patient-specific anatomy, diagnosis, operative navigation or treatment advice.
          </div>
        </aside>
      </div>
      )}

      {!hideReferenceAtlasCanvas && microscopic && (
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
