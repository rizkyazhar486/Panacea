/**
 * @file BodyExposureAtlasHome.tsx
 * @description Canonical 3D Human Atlas Home — whole body first, then depth, then a structure.
 *
 * Three-stage progressive workflow: [1. ANATOMY] -> [2. LIVING PHYSIOLOGY] -> [3. CLINICAL RELEVANCE].
 *
 * This file owns no WebGL. It used to carry its own small Three.js viewer, which removed its own on-canvas
 * controls when it mounted, rebuilt the whole scene (and re-downloaded 33 MB) on every layer change, framed
 * only the legs, and had a zero-width canvas on phones. The stage now projects the shared viewer that the
 * rest of Body Exposure already uses; it is handed in by the composition root (engine/atlas-stage/
 * viewerContract) because a domain may not import from src/components.
 *
 * What is decided — which layers a depth mounts, what a region frames, which side a name may state — lives
 * in engine/atlas-stage as pure, tested functions. How it is arranged lives in ui/atlas-stage (two
 * projections of the same state: phone sheet, wide panel). This file holds the state and the three stages.
 */

import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { useAdaptive } from '../../../shared/adaptive/useAdaptive'
import { CardiopulmonaryCouplingDeck } from './CardiopulmonaryCouplingDeck'
import { SoftTissueBiomechanicsDeck } from './SoftTissueBiomechanicsDeck'
import { NeuroFascicularReflexDeck } from './NeuroFascicularReflexDeck'
import { CoronaryTerritoryPanel } from './CoronaryTerritoryPanel'
import { ReferredPainDermatomeStudio } from './ReferredPainDermatomeStudio'
import { KaloLumenVolumetricStudio } from './KaloLumenVolumetricStudio'
import { LayerList, StructureCard, StructureHeader } from './atlas-stage/AnatomyInspector'
import { DepthRail } from './atlas-stage/DepthRail'
import { PhoneStage, WideStage } from './atlas-stage/StageFrame'
import { CameraButton, CouplingBadge, DepthBadge, Note, ReferenceChip, RegionChips, ResetGlyph, Segmented, StageTabs, type SegmentOption } from './atlas-stage/StagePieces'
import { StageSearch, type StageSearchHit } from './atlas-stage/StageSearch'
import { TONE, TOUCH, eyebrow, paragraph, primaryButton, subtleButton } from './atlas-stage/stageTokens'
import { ATLAS_LAYERS, ANATOMICAL_REGIONS, type AtlasStage, type SelectedStructureInfo } from '../engine/atlasHomeConfig'
import { planStageLayers, plateShows, type AtlasLayerId, type AtlasLayerOverrides, type AtlasPlateMode } from '../engine/atlas-stage/stageLayers'
import { regionFrameById } from '../engine/atlas-stage/regionFraming'
import type { SheetSnap } from '../engine/atlas-stage/sheetSnap'
import { describeStructure } from '../engine/atlas-stage/structureInfo'
import type { AtlasCameraCommand, AtlasViewerComponent } from '../engine/atlas-stage/viewerContract'
import {
  decksFor,
  type ClinicalTool,
  type PhysiologySystem,
  type StructureCouplingContext,
} from '../engine/atlasStageDecks'
import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from '../data/bodySystems'
import { systemsForStructure } from '../engine/system-physiology/structureSystem'
import type { StageSimulation } from '../engine/system-physiology/systemSimulations'

// Every body system's physiology, with the text of its sources: loaded only when the Systems view opens.
const SystemPhysiologyExplorer = lazy(() => import('./system-physiology/SystemPhysiologyExplorer'))

interface BodyExposureAtlasHomeProps {
  /** The 3D viewer, supplied by the composition root. */
  Viewer: AtlasViewerComponent
  /** Sends a camera command to that viewer. */
  sendCamera: (command: AtlasCameraCommand) => void
}

const STAGES: readonly { id: AtlasStage; label: string; short: string }[] = [
  { id: 'anatomy', label: '1. Anatomy', short: 'Anatomy' },
  { id: 'physiology', label: '2. Living Physiology', short: 'Physiology' },
  { id: 'clinical', label: '3. Clinical Relevance', short: 'Clinical' },
]
const STAGE_TITLE: Record<AtlasStage, string> = { anatomy: 'Anatomical Architecture', physiology: 'Living Human Physiology', clinical: 'Clinical & Diagnostic Suite' }
const STAGE_BLURB: Record<AtlasStage, string> = {
  anatomy: 'Seven source layers in dissection order. Tap a structure on the body, or search it by name.',
  physiology: 'Every body system’s physiology with its sources, plus simulations of haemodynamics, soft tissue and cranial reflexes.',
  clinical: 'Vascular territories (AHA 17), referred-pain dermatomes (C1–S5), syndromic deficit localizers, and multi-planar diagnostic imaging (CT/MRI MPR).',
}
/** The Systems view, or one of the simulation decks. */
type PhysiologyView = 'systems' | PhysiologySystem
// `short` fits a quarter of a phone panel; the full label stays the accessible name and contains it.
const PHYSIOLOGY: readonly SegmentOption<PhysiologyView>[] = [
  { id: 'systems', label: 'Body Systems', short: 'Systems' },
  { id: 'cardiopulmonary', label: 'Heart–Lung: Cardiopulmonary PV', short: 'Heart–Lung' },
  { id: 'soft_tissue', label: 'Soft Tissue Biomechanics', short: 'Soft Tissue' },
  { id: 'neuro', label: 'Neuro Reflexes', short: 'Neuro' },
]
const CLINICAL: readonly SegmentOption<ClinicalTool>[] = [
  { id: 'vascular', label: 'Vascular Perfusion', short: 'Vascular' },
  { id: 'referred_pain', label: 'Referred Pain', short: 'Referred' },
  { id: 'neuro_localizer', label: 'Syndromic Localizer', short: 'Localizer' },
  { id: 'diagnostic_imaging', label: 'Diagnostic Imaging', short: 'Imaging' },
]
const SYSTEM_LABEL = new Map<BodySystemId, string>(BODY_SYSTEM_SOURCE_WAVE.map((system) => [system.id, system.label]))

const layerSpec = (id: AtlasLayerId | null) => ATLAS_LAYERS.find((layer) => layer.id === id) ?? null

export { decksFor, type StructureCouplingContext }

export function BodyExposureAtlasHome({ Viewer, sendCamera }: BodyExposureAtlasHomeProps) {
  const { isDesktop } = useAdaptive()
  const [stage, setStage] = useState<AtlasStage>('anatomy')
  const [depth, setDepth] = useState(0)
  // Unset = follow the screen: a phone starts on the lighter 'focus' plate, a wide stage on the peeled body.
  const [chosenMode, setChosenMode] = useState<AtlasPlateMode | null>(null)
  const mode: AtlasPlateMode = chosenMode ?? (isDesktop ? 'peeled' : 'focus')
  const [overrides, setOverrides] = useState<AtlasLayerOverrides>({})
  const [selectedStructure, setSelectedStructure] = useState<SelectedStructureInfo | null>(null)
  const [couplingContext, setCouplingContext] = useState<StructureCouplingContext | null>(null)
  const [focusName, setFocusName] = useState<string | null>(null)
  const [regionId, setRegionId] = useState<string>('all')
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true)
  const [sheet, setSheet] = useState<SheetSnap>('peek')
  // The Physiology stage opens on the body systems; picking a structure routes to its simulation deck instead.
  const [physiologyView, setPhysiologyView] = useState<PhysiologyView>('systems')
  const [systemFocus, setSystemFocus] = useState<BodySystemId | null>(null)
  const [clinicalTool, setClinicalTool] = useState<ClinicalTool>('vascular')

  const plan = useMemo(() => planStageLayers({ depth, mode, overrides }), [depth, mode, overrides])
  const mountKey = plan.ok ? plan.mount.join('|') : ''
  // A new Set only when the mounted layers really change, so the viewer does not re-evaluate its layers per render.
  const layers = useMemo(() => new Set<AtlasLayerId>(mountKey ? (mountKey.split('|') as AtlasLayerId[]) : []), [mountKey])
  const highlighted = useMemo(() => (selectedStructure ? [selectedStructure.meshName] : []), [selectedStructure])
  const focusKeywords = useMemo(() => (focusName ? [focusName.toLowerCase()] : []), [focusName])
  const homeFrame = useMemo(() => { const frame = regionFrameById('all'); return frame.ok ? frame.frame : null }, [])

  const selectStructure = useCallback((rawName: string, layer: AtlasLayerId | null) => {
    const info = describeStructure(rawName, layer)
    const context = decksFor(info)
    const systems = systemsForStructure(info.cleanName, info.layerId)
    setSelectedStructure(info)
    setCouplingContext(context)
    setPhysiologyView(context.physiology)
    setSystemFocus(systems.ok ? systems.systems[0] ?? null : null)
    setClinicalTool(context.clinical)
    setIsSidePanelOpen(true)
  }, [])

  // A tap names the structure and highlights it; the camera stays where the person put it.
  const handlePick = useCallback((rawName: string, layer: AtlasLayerId | null) => {
    setFocusName(null)
    selectStructure(rawName, layer)
  }, [selectStructure])

  // A search result may be deep inside the body: go to its depth, stop hiding its layer, then fly to it.
  const handleSearch = useCallback((hit: StageSearchHit) => {
    const spec = layerSpec(hit.layer)
    if (!spec) return
    setDepth(spec.peelRank)
    setOverrides((current) => {
      const next: Partial<Record<AtlasLayerId, boolean>> = { ...current }
      if (next[hit.layer] === false) delete next[hit.layer]
      if (hit.layer !== 'surface' && next.surface === true) delete next.surface
      return next
    })
    selectStructure(hit.name, hit.layer)
    setFocusName(hit.name)
    setRegionId('')
  }, [selectStructure])

  const changeDepth = useCallback((next: number) => {
    setDepth(next)
    // A highlighted structure whose layer leaves the stage would be a name pointing at nothing.
    setSelectedStructure((current) => {
      if (!current?.layerId) return current
      const after = planStageLayers({ depth: next, mode, overrides })
      const keeps = after.ok && after.solid.includes(current.layerId)
      if (!keeps) setCouplingContext(null)
      return keeps ? current : null
    })
    setFocusName(null)
  }, [mode, overrides])

  const frameRegion = useCallback((id: string) => {
    setFocusName(null)
    if (id === 'all') { sendCamera({ action: 'reset' }); setRegionId('all'); return }
    const frame = regionFrameById(id)
    if (!frame.ok) return
    sendCamera({ action: 'frame', frame: frame.frame })
    setRegionId(id)
  }, [sendCamera])

  const resetView = useCallback(() => { setFocusName(null); setRegionId('all'); sendCamera({ action: 'reset' }) }, [sendCamera])
  const focusSelected = useCallback(() => {
    if (!selectedStructure) return
    setFocusName(selectedStructure.meshName)
    setRegionId('')
  }, [selectedStructure])
  const clearSelection = useCallback(() => { setSelectedStructure(null); setCouplingContext(null); setSystemFocus(null); resetView() }, [resetView])

  // The systems a picked structure belongs to (none when the atlas does not map it, two for the pancreas).
  const pickedSystems = useMemo(() => {
    if (!selectedStructure) return []
    const result = systemsForStructure(selectedStructure.cleanName, selectedStructure.layerId)
    return result.ok ? result.systems : []
  }, [selectedStructure])
  const openSystem = useCallback((id: BodySystemId | null) => { setSystemFocus(id); setPhysiologyView('systems') }, [])
  // A system card's "Simulate" hands its tab to the deck through the same context a structure pick uses.
  const simulate = useCallback((simulation: StageSimulation) => {
    setCouplingContext((current) => ({ ...(current ?? { physiology: simulation.deck, clinical: clinicalTool }), physiology: simulation.deck, softTissueTab: simulation.softTissueTab }))
    setPhysiologyView(simulation.deck)
  }, [clinicalTool])

  const toggleLayer = useCallback((id: AtlasLayerId) => {
    setOverrides((current) => {
      const plate = plateShows(id, depth, mode)
      const wanted = !(current[id] ?? plate)
      const next: Partial<Record<AtlasLayerId, boolean>> = { ...current }
      if (wanted === plate) delete next[id]
      else next[id] = wanted
      return next
    })
  }, [depth, mode])

  const openStage = (next: AtlasStage) => {
    setStage(next)
    if (!isDesktop && sheet === 'peek') setSheet('half')
  }

  const selectedLayer = layerSpec(selectedStructure?.layerId ?? null)
  const depthLayer = plan.ok ? layerSpec(plan.focus) : null

  const inspectorHeader = selectedStructure ? (
    <StructureHeader structure={selectedStructure} layer={selectedLayer} showName={isDesktop} onClear={clearSelection} />
  ) : (
    <div>
      <div style={{ ...eyebrow, color: TONE.ref }}>
        Whole-Body Exploration <span style={{ color: TONE.faint }}>· Stage {STAGES.findIndex((item) => item.id === stage) + 1}</span>
      </div>
      <h3 style={{ margin: '4px 0 0', fontSize: 20, lineHeight: 1.2, fontWeight: 800, color: TONE.text }}>{STAGE_TITLE[stage]}</h3>
      <p style={paragraph}>{STAGE_BLURB[stage]}</p>
    </div>
  )

  const anatomyBody = selectedStructure ? (
    <StructureCard
      structure={selectedStructure}
      layer={selectedLayer}
      truthClass={<><b>Truth Class:</b> ATLAS_REFERENCE_LABEL — normative reference geometry (Z-Anatomy, CC BY-SA 4.0). It is not a scan or a measurement of your body.</>}
      onFocus={focusSelected}
      onPhysiology={() => openStage('physiology')}
      onClinical={() => openStage('clinical')}
    />
  ) : (
    <LayerList layers={ATLAS_LAYERS} depth={depth} mode={mode} plan={plan} overrides={overrides} onMode={setChosenMode} onToggle={toggleLayer} />
  )

  const physiologyBody = (
    <>
      {selectedStructure && (
        <CouplingBadge prefix="Coupled to:" name={selectedStructure.cleanName} layer={selectedLayer?.short ?? 'Atlas'} onClear={clearSelection}>
          {pickedSystems.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => openSystem(id)}
              className="as-focus as-hover as-fade"
              style={{ flex: 'none', minHeight: 36, padding: '0 10px', border: `1px solid ${TONE.line}`, borderRadius: 10, background: TONE.raised, color: TONE.text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {SYSTEM_LABEL.get(id)} system ›
            </button>
          ))}
        </CouplingBadge>
      )}
      <Segmented label="Physiology view" value={physiologyView} options={PHYSIOLOGY} onChange={setPhysiologyView} />
      {physiologyView === 'systems' && (
        <Suspense fallback={<Note color={TONE.ref}>Loading body systems…</Note>}>
          <SystemPhysiologyExplorer systemId={systemFocus} onSystem={openSystem} onSimulate={simulate} />
        </Suspense>
      )}
      {physiologyView === 'cardiopulmonary' && <CardiopulmonaryCouplingDeck />}
      {physiologyView === 'soft_tissue' && (
        <SoftTissueBiomechanicsDeck
          initialOrganId={couplingContext?.softTissueOrganId}
          initialTab={couplingContext?.softTissueTab}
        />
      )}
      {physiologyView === 'neuro' && (
        <NeuroFascicularReflexDeck initialTab="reflexes" initialNerveId={couplingContext?.neuroNerveId} />
      )}
      {physiologyView !== 'systems' && (
        <Note color={TONE.sim}>
          <b>Simulation Truth Class:</b> mechanistic_simulation_proxy · Deterministic ordinary differential equations with zero synthetic biomarkers. A simulation, not a reading from a body.
        </Note>
      )}
      <button type="button" onClick={() => openStage('clinical')} className="as-focus as-fade" style={primaryButton}>Advance to Stage 3: Clinical Relevance →</button>
    </>
  )

  const clinicalBody = (
    <>
      {selectedStructure && (
        <CouplingBadge prefix="Clinical target:" name={selectedStructure.cleanName} layer={selectedLayer?.short ?? 'Atlas'} onClear={clearSelection} />
      )}
      <Segmented label="Clinical tool" value={clinicalTool} options={CLINICAL} onChange={setClinicalTool} />
      {clinicalTool === 'vascular' && (
        <CoronaryTerritoryPanel
          defaultOpen={true}
          initialSegment={couplingContext?.coronarySegment}
        />
      )}
      {clinicalTool === 'referred_pain' && (
        <ReferredPainDermatomeStudio
          initialOrgan={couplingContext?.referredPainOrgan}
        />
      )}
      {clinicalTool === 'neuro_localizer' && (
        <NeuroFascicularReflexDeck initialTab="syndromes" initialNerveId={couplingContext?.neuroNerveId} />
      )}
      {clinicalTool === 'diagnostic_imaging' && (
        <KaloLumenVolumetricStudio
          initialPresetId={couplingContext?.imagingPresetId}
        />
      )}
      <Note color={TONE.gate}>
        <b>Clinical Gate:</b> Reference correlation for educational and mechanistic study. Does not constitute autonomous patient diagnosis or signed radiological report.
      </Note>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button type="button" onClick={() => openStage('anatomy')} className="as-focus as-hover as-fade" style={subtleButton}>← Anatomy View</button>
        <button type="button" onClick={() => openStage('physiology')} className="as-focus as-hover as-fade" style={subtleButton}>← Living Physiology</button>
      </div>
    </>
  )

  const slots = {
    plate: mode,
    depth,
    viewer: !homeFrame || !plan.ok ? (
      <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, color: TONE.gate, fontSize: 13, textAlign: 'center' }}>
        The atlas stage could not be prepared, so nothing is shown rather than a wrong body.
      </div>
    ) : (
      <Viewer layers={layers} dissect={plan.dissect} highlighted={highlighted} focusKeywords={focusKeywords} homeFrame={homeFrame} onPick={handlePick} />
    ),
    search: <StageSearch compact={!isDesktop} layers={ATLAS_LAYERS} onSelect={handleSearch} />,
    rail: <DepthRail layers={ATLAS_LAYERS} depth={depth} labelled={isDesktop} onDepth={changeDepth} />,
    regionChips: <RegionChips regions={ANATOMICAL_REGIONS} active={regionId} onRegion={frameRegion} />,
    referenceChip: <ReferenceChip tight={!isDesktop} />,
    tabs: <StageTabs tabs={STAGES} value={stage} compact={!isDesktop} onChange={openStage} />,
    inspectorHeader,
    inspectorBody: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stage === 'anatomy' ? anatomyBody : stage === 'physiology' ? physiologyBody : clinicalBody}
      </div>
    ),
  }
  const resetButton = <CameraButton label="Reset to whole body" onPress={resetView}><ResetGlyph /></CameraButton>

  if (isDesktop) {
    return (
      <WideStage
        {...slots}
        title="Panacea Atlas Home"
        caption={`${ATLAS_LAYERS.length} source layers · Z-Anatomy`}
        panelOpen={isSidePanelOpen}
        onTogglePanel={() => setIsSidePanelOpen((open) => !open)}
        cameraButtons={<>
          <CameraButton label="Zoom in" onPress={() => sendCamera({ action: 'zoomIn' })}><span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>+</span></CameraButton>
          <CameraButton label="Zoom out" onPress={() => sendCamera({ action: 'zoomOut' })}><span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>−</span></CameraButton>
          <CameraButton label="Front view" onPress={() => sendCamera({ action: 'front' })}><span aria-hidden style={{ fontSize: 11, fontWeight: 800 }}>FRONT</span></CameraButton>
          <CameraButton label="Back view" onPress={() => sendCamera({ action: 'back' })}><span aria-hidden style={{ fontSize: 11, fontWeight: 800 }}>BACK</span></CameraButton>
          {resetButton}
        </>}
      />
    )
  }

  return (
    <PhoneStage
      {...slots}
      sheet={sheet}
      onSheet={setSheet}
      resetButton={resetButton}
      depthBadge={depthLayer && <DepthBadge layer={depthLayer} count={ATLAS_LAYERS.length} />}
      peekTitle={selectedStructure ? <>{selectedStructure.cleanName}{selectedStructure.side && <span style={{ color: TONE.dim, fontWeight: 600 }}> · {selectedStructure.side}</span>}</> : 'Tap any structure'}
      peekAction={selectedStructure && (
        <button type="button" onClick={focusSelected} aria-label="Focus on this structure" className="as-focus as-fade" style={{ ...primaryButton, width: 'auto', minHeight: TOUCH, padding: '0 14px', flex: 'none' }}>Focus</button>
      )}
    />
  )
}
