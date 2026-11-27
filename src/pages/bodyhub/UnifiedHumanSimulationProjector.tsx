import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Fold } from '../../shared/ui/Fold'
import { resolveBodySystemSourceWave, type BodySystemId } from '../../lib/bodySystemSourceWave'
import { getBodySemanticZoomStop, isMicroscopicBodyScale, type BodySemanticScale } from '../../lib/bodySemanticZoom'
import { penjelasanTertulis } from '../../lib/explainFallback'
import UniversalAtlasDepthRail from './UniversalAtlasDepthRail'
import { FiveStageVisualAtlas } from '../../domains/body-exposure/ui/FiveStageVisualAtlas'
import type { Sim4DProjectionMode } from '../../domains/body-exposure/engine/bodyGoldenCompassEngine'

const BodyAllSystems3D = lazy(() => import('../../components/BodyAllSystems3D'))
const BodyGoldenCompassProjection = lazy(() => import('../../components/bodyhub/BodyGoldenCompassProjection'))
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
  /** The host renders its own domain navigation (Body scale ladder); skip the duplicate tab row. */
  hideDomainTabs?: boolean
  /** Permintaan fokus struktur sumber dari luar (mis. temuan AI-EMR). `nonce` memicu ulang pilihan yang sama. */
  requestedStructure?: { name: string; nonce: number } | null
  /** Semantic zoom stop requested by the host (Body scale ladder). `nonce` re-applies the same stop. */
  requestedScale?: { scale: BodySemanticScale; nonce: number } | null
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
  const base = 'min-h-[44px] shrink-0 rounded-full border px-3.5 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 '
  return base + (active
    ? 'border-cyan-300 bg-cyan-400 text-neutral-950'
    : 'border-white/15 bg-white/[.06] text-slate-200 hover:border-white/30 hover:bg-white/[.12] hover:text-white')
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
  hideDomainTabs = false,
  requestedStructure = null,
  requestedScale = null,
}: UnifiedHumanSimulationProjectorProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isGoldenRestored = searchParams.get('goldenRestored') === 'true'

  const [internalDomain, setInternalDomain] = useState<SimulationDomain>('anatomy')
  const [selectedStructureName, setSelectedStructureName] = useState<string | null>(null)
  const [semanticZoom, setSemanticZoom] = useState<{ scale: BodySemanticScale; relativeZoom: number }>({ scale: 'whole-body', relativeZoom: 1 })
  const [compassSimMode, setCompassSimMode] = useState<Sim4DProjectionMode | null>(null)
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
  // The cell and genome domains already render the lab the microscope stage would load; never mount it twice.
  const microscopeDuplicatesDomain =
    (domain === 'cell' && (semanticZoom.scale === 'cell' || semanticZoom.scale === 'organelle'))
    || (domain === 'genome' && semanticZoom.scale === 'genome')
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
    if (!requestedScale) return
    setSemanticZoom({ scale: requestedScale.scale, relativeZoom: getBodySemanticZoomStop(requestedScale.scale).minRelativeZoom })
  }, [requestedScale])

  useEffect(() => {
    if (domain === 'localization' && selectedSystemId !== 'nervous') onSystemChange('nervous')
  }, [domain, onSystemChange, selectedSystemId])

  useEffect(() => {
    if (isGoldenRestored) {
      if (selectedSystemId !== 'cardiovascular') {
        onSystemChange('cardiovascular')
      }
      setSelectedStructureName('heart-left-ventricle')
    }
  }, [isGoldenRestored, onSystemChange, selectedSystemId])

  function selectDomain(next: SimulationDomain) {
    if (requestedDomain === undefined) setInternalDomain(next)
    onDomainChange?.(next)
  }

  function openScale(scale: BodySemanticScale) {
    const stop = getBodySemanticZoomStop(scale)
    setSemanticZoom({ scale, relativeZoom: stop.minRelativeZoom })
    if (scale === 'tissue' || scale === 'cell' || scale === 'organelle') selectDomain('cell')
    else if (scale === 'molecule' || scale === 'genome') selectDomain('genome')
    else selectDomain('anatomy')
  }

  function renderDomain() {
    switch (domain) {
      case 'personal-avatar':
        return <Fold label="Scan"><PersonalAvatarCameraCapture /></Fold>
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
          <div className="grid gap-3 @[44rem]:grid-cols-[minmax(0,1fr)_minmax(280px,.72fr)]">
            <div className="rounded-2xl border border-white/15 bg-white/[.04] p-3">
              <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#a5f3fc]">Selected structure</div>
              <div className="mt-1 text-base font-black text-white">{selectedStructureName ?? 'Tap a rendered structure'}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                Selection comes from the rendered source mesh. The selected structure stays active across projections.
              </p>
              {selectedStructureName && (
                <button type="button" data-pmd-native="true" onClick={() => setSelectedStructureName(null)} className="mt-3 min-h-[44px] rounded-full border border-white/20 bg-white/[.06] px-3.5 text-[11px] font-black text-white hover:bg-white/[.14]">
                  Clear structure
                </button>
              )}
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[.04] p-3">
              <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-300">Source-backed structure shortcuts</div>
              <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {currentSystem.targets.flatMap((target) => target.names.slice(0, 4)).slice(0, 18).map((name) => (
                  <button
                    key={name}
                    type="button"
                    data-pmd-native="true"
                    aria-pressed={selectedStructureName === name}
                    onClick={() => setSelectedStructureName(name)}
                    className="min-h-[44px] max-w-full truncate rounded-full border border-white/15 bg-black/30 px-3 text-[11px] font-bold text-slate-200 aria-pressed:border-cyan-300 aria-pressed:bg-cyan-400/20 aria-pressed:text-cyan-100"
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
      className="@container dark overflow-hidden rounded-[30px] border border-white/15 bg-[#020508] text-white shadow-[0_28px_90px_rgba(0,0,0,.36)]"
      aria-labelledby="unified-human-simulation-title"
      aria-description="Body → system → organ → tissue → cell → organelle → molecule → genome"
    >
      <header className="border-b border-white/10 p-2.5 sm:px-3.5 sm:py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="unified-human-simulation-title" className="text-base font-black tracking-[-.02em] text-white sm:text-lg">
            One body. Every projection.
          </h3>
          <div className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-black text-cyan-100">
            {systemLabel}
          </div>
        </div>

        {!compact && !hideDomainTabs && (
          <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Unified simulation domains">
            {DOMAINS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                data-pmd-native="true"
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
      <div className="grid gap-0 @[56rem]:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0 border-b border-white/10 p-2 sm:p-3 @[56rem]:border-b-0 @[56rem]:border-r">
          <Suspense fallback={<ProjectorLoader label="3D anatomy" />}>
            <BodyAllSystems3D
              selectedSystemId={selectedSystemId}
              onSystemChange={onSystemChange}
              onSemanticZoomChange={setSemanticZoom}
              selectedStructureName={selectedStructureName}
              onStructureSelect={setSelectedStructureName}
              externalSimMode={compassSimMode}
              focusRequest={requestedStructure}
            />
          </Suspense>
        </div>

        <div className="min-w-0 border-b border-white/10 @[56rem]:border-b-0">
          <Suspense fallback={<ProjectorLoader label="Golden Compass" />}>
            <BodyGoldenCompassProjection
              selectedSystemId={selectedSystemId}
              onSelectSystem={onSystemChange}
              onSimModeChange={setCompassSimMode}
              selectedStructureName={selectedStructureName}
              semanticScaleLabel={semanticStop.label}
              relativeZoom={semanticZoom.relativeZoom}
              structureEducation={selectedStructureEducation}
              onNavigateGoldenJourney={() => navigate('/med-study?bagian=golden-journey')}
              isGoldenRestored={isGoldenRestored}
            />
          </Suspense>
          <p className="sr-only">
            Educational/reference simulation. Generic atlas geometry and synthetic models are not patient-specific anatomy, diagnosis, operative navigation or treatment advice.
          </p>
        </div>
      </div>
      )}

      {!hideReferenceAtlasCanvas && (
        <UniversalAtlasDepthRail
          semanticScale={semanticZoom.scale}
          selectedSystemId={selectedSystemId}
          onOpenScale={openScale}
        />
      )}

      {!compact && !hideReferenceAtlasCanvas && (
        <FiveStageVisualAtlas
          selectedSystemId={selectedSystemId}
          semanticScale={semanticZoom.scale}
          selectedStructureName={selectedStructureName}
          defaultExpanded
          onOpenScale={openScale}
          onSelectDomain={(nextDomain) => selectDomain(nextDomain)}
          onSelectStructure={setSelectedStructureName}
        />
      )}

      {!hideReferenceAtlasCanvas && microscopic && !microscopeDuplicatesDomain && (
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
