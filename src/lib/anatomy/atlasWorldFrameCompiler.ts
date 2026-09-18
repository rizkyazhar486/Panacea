import type {
  AtlasGeometryStatus,
  AtlasLodTier,
  AtlasManifest,
  AtlasNode,
  AtlasRegionId,
  AtlasRenderRequest,
  AtlasReviewStatus,
  AtlasSystemId,
} from './atlasKernel'
import { atlasAncestors, atlasNeighborhood, atlasNodeById } from './atlasKernel'
import { atlasSubgraph, traceAtlasPath, type AtlasGraphEdge } from './atlasGraph'
import {
  buildAtlasFocusStack,
  queryAtlasSectionPlane,
  type AtlasSectionPlane,
} from './atlasMultiscaleNavigator'
import {
  planAtlasStreaming,
  validateAtlasStreamingPlan,
  type AtlasResidencySnapshot,
  type AtlasRuntimeTelemetry,
  type AtlasStreamingBudget,
  type AtlasStreamingDecision,
} from './atlasStreamingKernel'
import {
  buildRespiratoryHighEndScene,
  type RespiratoryHighEndScenePlan,
} from './respiratoryHighEndRuntime'
import type { RespiratoryCyclePhase } from './respiratoryAtlasContract'

/**
 * High-end whole-body world-frame compiler.
 *
 * This module is renderer-agnostic. It compiles one deterministic educational
 * anatomy frame from the canonical manifest, graph, spatial anchors, adaptive
 * streaming state, and explicit provenance. It never invents patient anatomy,
 * missing mesh intersections, clinical measurements, or unreviewed surgical
 * landmarks.
 */

export type AtlasWorldMode =
  | 'whole-body'
  | 'system-isolation'
  | 'regional-dissection'
  | 'cross-system-path'
  | 'section'
  | 'physiology'
  | 'surgery-reference'
  | 'microstructure'

export type AtlasWorldLayerRole =
  | 'primary'
  | 'path'
  | 'section'
  | 'relation-context'
  | 'hierarchy-context'
  | 'system-context'

export type AtlasWorldPassId =
  | 'context-opaque'
  | 'context-ghost'
  | 'primary-anatomy'
  | 'relationship-highlight'
  | 'section-highlight'
  | 'educational-overlay'

export interface AtlasWorldIntent {
  mode: AtlasWorldMode
  selectedNodeId?: string
  targetNodeId?: string
  systems?: readonly AtlasSystemId[]
  regions?: readonly AtlasRegionId[]
  relationDepth?: number
  sectionPlane?: AtlasSectionPlane
  contextOpacity?: number
  respiratory?: {
    phase?: RespiratoryCyclePhase
    segmentNodeId?: string
    overlays?: readonly ('airflow' | 'volume' | 'pressure' | 'gas-exchange')[]
  }
}

export interface AtlasWorldLayer {
  nodeId: string
  label: string
  system: AtlasSystemId
  role: AtlasWorldLayerRole
  geometryStatus: AtlasGeometryStatus
  reviewStatus: AtlasReviewStatus
  lodTier?: AtlasLodTier
  opacity: number
  selectable: boolean
  sourceAssetKeys: readonly string[]
  reasons: readonly string[]
}

export interface AtlasWorldMetadataReference {
  nodeId: string
  label: string
  system: AtlasSystemId
  role: AtlasWorldLayerRole
  reason: 'reference-only' | 'planned' | 'not-resident'
  reviewStatus: AtlasReviewStatus
}

export interface AtlasWorldPass {
  id: AtlasWorldPassId
  nodeIds: readonly string[]
  depthWrite: boolean
  interactionEnabled: boolean
  purpose: string
}

export interface AtlasWorldCameraEnvelope {
  /** Derived only from authored normalized spatial anchors. */
  center: readonly [number, number, number]
  radius: number
  authoredAnchorCount: number
}

export interface AtlasWorldProvenanceLedger {
  totalReferencedNodes: number
  academicReviewed: number
  academicReviewRequired: number
  engineeringReviewed: number
  unreviewed: number
  shippedGeometry: number
  partialGeometry: number
  referenceOnlyGeometry: number
  plannedGeometry: number
}

export interface AtlasWorldPublicationGate {
  educationalDisplayAllowed: true
  patientSpecificGeometryAllowed: false
  surgicalReferenceAllowed: boolean
  blockingReasons: readonly string[]
}

export interface AtlasWorldFrame {
  manifestId: string
  manifestRevision: string
  mode: AtlasWorldMode
  selectedNodeId?: string
  targetNodeId?: string
  renderLayers: readonly AtlasWorldLayer[]
  metadataReferences: readonly AtlasWorldMetadataReference[]
  passes: readonly AtlasWorldPass[]
  path?: {
    nodeIds: readonly string[]
    edges: readonly AtlasGraphEdge[]
    totalWeight: number
  }
  respiratory?: RespiratoryHighEndScenePlan
  cameraEnvelope?: AtlasWorldCameraEnvelope
  streaming: ReturnType<typeof planAtlasStreaming>
  provenance: AtlasWorldProvenanceLedger
  publicationGate: AtlasWorldPublicationGate
  warnings: readonly string[]
}

export interface AtlasWorldFrameInput {
  manifest: AtlasManifest
  intent: AtlasWorldIntent
  budget: AtlasStreamingBudget
  telemetry: AtlasRuntimeTelemetry
  residency: AtlasResidencySnapshot
  projectedPixelsByNodeId?: Readonly<Record<string, number>>
  distanceByNodeId?: Readonly<Record<string, number>>
}

type CandidateRole = {
  node: AtlasNode
  role: AtlasWorldLayerRole
  reasons: string[]
}

const ROLE_RANK: Record<AtlasWorldLayerRole, number> = {
  primary: 6,
  path: 5,
  section: 4,
  'relation-context': 3,
  'hierarchy-context': 2,
  'system-context': 1,
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function stableUnique<T>(values: readonly T[]) {
  return [...new Set(values)]
}

function nodeAssetKeys(node: AtlasNode): string[] {
  return node.source.files?.length
    ? node.source.files.map((file) => `bundle:${file}`)
    : [`node:${node.id}`]
}

function addCandidate(map: Map<string, CandidateRole>, node: AtlasNode | undefined, role: AtlasWorldLayerRole, reason: string) {
  if (!node) return
  const current = map.get(node.id)
  if (!current) {
    map.set(node.id, { node, role, reasons: [reason] })
    return
  }
  if (ROLE_RANK[role] > ROLE_RANK[current.role]) current.role = role
  if (!current.reasons.includes(reason)) current.reasons.push(reason)
}

function matchesScope(node: AtlasNode, intent: AtlasWorldIntent) {
  if (intent.systems?.length && !intent.systems.includes(node.system)) return false
  if (intent.regions?.length && !node.regions.some((region) => intent.regions!.includes(region))) return false
  return true
}

function collectCandidates(manifest: AtlasManifest, intent: AtlasWorldIntent) {
  const candidates = new Map<string, CandidateRole>()
  const selected = intent.selectedNodeId ? atlasNodeById(manifest, intent.selectedNodeId) : undefined

  if (selected) {
    addCandidate(candidates, selected, 'primary', 'Explicitly selected anatomy node.')

    for (const ancestor of atlasAncestors(manifest, selected.id)) {
      addCandidate(candidates, ancestor, 'hierarchy-context', 'Canonical hierarchy ancestor of selected anatomy.')
    }

    for (const neighbor of atlasNeighborhood(manifest, selected.id)) {
      addCandidate(candidates, neighbor, 'relation-context', 'Explicit hierarchy/relation neighbor of selected anatomy.')
    }

    const subgraph = atlasSubgraph(manifest, selected.id, clamp(Math.floor(intent.relationDepth ?? 1), 0, 3))
    for (const id of subgraph.nodeIds) {
      if (id === selected.id) continue
      addCandidate(candidates, atlasNodeById(manifest, id), 'relation-context', 'Explicit bounded anatomy graph context.')
    }

    for (const focus of buildAtlasFocusStack(manifest, selected.id, intent.mode === 'microstructure' ? 3 : 1)) {
      if (focus.role === 'selected') continue
      addCandidate(candidates, focus.node, 'hierarchy-context', `Multiscale ${focus.role} context.`)
    }
  }

  if (intent.mode === 'whole-body' || intent.mode === 'system-isolation' || intent.mode === 'regional-dissection') {
    for (const node of manifest.nodes) {
      if (!matchesScope(node, intent)) continue
      if (node.scale === 'organism' || node.scale === 'region' || node.educationalPriority >= 0.9) {
        addCandidate(candidates, node, 'system-context', 'High-priority whole-body/system/regional context.')
      }
    }
  }

  if (intent.sectionPlane) {
    for (const hit of queryAtlasSectionPlane(manifest, intent.sectionPlane, intent.systems)) {
      addCandidate(candidates, hit.node, 'section', 'Authored spatial anchor intersects requested section slab.')
    }
  }

  let path: ReturnType<typeof traceAtlasPath> | null = null
  if (intent.mode === 'cross-system-path' && selected && intent.targetNodeId) {
    path = traceAtlasPath(manifest, selected.id, intent.targetNodeId)
    for (const id of path?.nodeIds ?? []) {
      addCandidate(candidates, atlasNodeById(manifest, id), id === selected.id ? 'primary' : 'path', 'Explicit anatomy graph path.')
    }
  }

  return { candidates, selected, path }
}

function buildRenderRequest(intent: AtlasWorldIntent): AtlasRenderRequest {
  return {
    selectedNodeId: intent.selectedNodeId,
    systems: intent.systems,
    regions: intent.regions,
    includeReferenceOnly: false,
  }
}

function lodByNode(decisions: readonly AtlasStreamingDecision[]) {
  const result = new Map<string, AtlasLodTier>()
  const rank: Record<AtlasLodTier, number> = { macro: 0, standard: 1, detail: 2, micro: 3 }
  for (const decision of decisions) {
    for (const nodeId of decision.nodeIds) {
      const current = result.get(nodeId)
      if (!current || rank[decision.lod.tier] > rank[current]) result.set(nodeId, decision.lod.tier)
    }
  }
  return result
}

function layerOpacity(role: AtlasWorldLayerRole, contextOpacity: number) {
  switch (role) {
    case 'primary': return 1
    case 'path': return 0.96
    case 'section': return 0.9
    case 'relation-context': return clamp(contextOpacity + 0.16, 0.16, 0.72)
    case 'hierarchy-context': return clamp(contextOpacity + 0.08, 0.12, 0.62)
    case 'system-context': return contextOpacity
  }
}

function compileLayers(
  candidates: Map<string, CandidateRole>,
  streaming: ReturnType<typeof planAtlasStreaming>,
  contextOpacity: number,
) {
  const lod = lodByNode(streaming.decisions)
  const activeKeys = new Set(streaming.decisions.map((decision) => decision.key))
  const layers: AtlasWorldLayer[] = []
  const metadata: AtlasWorldMetadataReference[] = []

  for (const candidate of candidates.values()) {
    const { node, role, reasons } = candidate
    const keys = nodeAssetKeys(node)
    const geometryRenderable = node.geometryStatus === 'shipped' || node.geometryStatus === 'partial'
    const residentOrDemanded = keys.some((key) => activeKeys.has(key))

    if (!geometryRenderable) {
      metadata.push({
        nodeId: node.id,
        label: node.label,
        system: node.system,
        role,
        reason: node.geometryStatus === 'planned' ? 'planned' : 'reference-only',
        reviewStatus: node.provenance.reviewStatus,
      })
      continue
    }

    if (!residentOrDemanded) {
      metadata.push({
        nodeId: node.id,
        label: node.label,
        system: node.system,
        role,
        reason: 'not-resident',
        reviewStatus: node.provenance.reviewStatus,
      })
      continue
    }

    layers.push({
      nodeId: node.id,
      label: node.label,
      system: node.system,
      role,
      geometryStatus: node.geometryStatus,
      reviewStatus: node.provenance.reviewStatus,
      lodTier: lod.get(node.id),
      opacity: layerOpacity(role, contextOpacity),
      selectable: true,
      sourceAssetKeys: keys,
      reasons,
    })
  }

  layers.sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role] || b.opacity - a.opacity || a.nodeId.localeCompare(b.nodeId))
  metadata.sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role] || a.nodeId.localeCompare(b.nodeId))
  return { layers, metadata }
}

function buildPasses(layers: readonly AtlasWorldLayer[], respiratory?: RespiratoryHighEndScenePlan): AtlasWorldPass[] {
  const idsFor = (...roles: AtlasWorldLayerRole[]) => layers.filter((layer) => roles.includes(layer.role)).map((layer) => layer.nodeId)
  const opaqueContext = layers.filter((layer) => layer.role === 'system-context' && layer.opacity >= 0.98).map((layer) => layer.nodeId)
  const ghostContext = stableUnique([
    ...idsFor('system-context', 'hierarchy-context', 'relation-context'),
  ]).filter((id) => !opaqueContext.includes(id))
  const primary = idsFor('primary')
  const path = idsFor('path')
  const section = idsFor('section')

  const passes: AtlasWorldPass[] = []
  if (opaqueContext.length) passes.push({ id: 'context-opaque', nodeIds: opaqueContext, depthWrite: true, interactionEnabled: true, purpose: 'Opaque gross-anatomy context.' })
  if (ghostContext.length) passes.push({ id: 'context-ghost', nodeIds: ghostContext, depthWrite: false, interactionEnabled: true, purpose: 'Transparent hierarchy/system context without obscuring the target.' })
  if (primary.length) passes.push({ id: 'primary-anatomy', nodeIds: primary, depthWrite: true, interactionEnabled: true, purpose: 'Selected anatomy target.' })
  if (path.length) passes.push({ id: 'relationship-highlight', nodeIds: path, depthWrite: false, interactionEnabled: true, purpose: 'Explicit graph path between anatomy targets.' })
  if (section.length) passes.push({ id: 'section-highlight', nodeIds: section, depthWrite: false, interactionEnabled: true, purpose: 'Authored spatial anchors intersecting the requested educational section slab.' })
  if (respiratory?.conceptualOverlays.some((overlay) => overlay.enabled)) {
    passes.push({ id: 'educational-overlay', nodeIds: respiratory.focusNodeIds, depthWrite: false, interactionEnabled: false, purpose: 'Qualitative respiratory physiology overlay; no fabricated quantitative measurements.' })
  }
  return passes
}

function cameraEnvelope(nodes: readonly AtlasNode[]): AtlasWorldCameraEnvelope | undefined {
  const anchored = nodes.filter((node) => node.spatial)
  if (!anchored.length) return undefined

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY
  for (const node of anchored) {
    const spatial = node.spatial!
    minX = Math.min(minX, spatial.center[0] - spatial.radius)
    minY = Math.min(minY, spatial.center[1] - spatial.radius)
    minZ = Math.min(minZ, spatial.center[2] - spatial.radius)
    maxX = Math.max(maxX, spatial.center[0] + spatial.radius)
    maxY = Math.max(maxY, spatial.center[1] + spatial.radius)
    maxZ = Math.max(maxZ, spatial.center[2] + spatial.radius)
  }
  const center: readonly [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ]
  const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2
  return { center, radius, authoredAnchorCount: anchored.length }
}

function provenanceLedger(nodes: readonly AtlasNode[]): AtlasWorldProvenanceLedger {
  const countReview = (status: AtlasReviewStatus) => nodes.filter((node) => node.provenance.reviewStatus === status).length
  const countGeometry = (status: AtlasGeometryStatus) => nodes.filter((node) => node.geometryStatus === status).length
  return {
    totalReferencedNodes: nodes.length,
    academicReviewed: countReview('academic-reviewed'),
    academicReviewRequired: countReview('academic-review-required'),
    engineeringReviewed: countReview('engineering-reviewed'),
    unreviewed: countReview('unreviewed'),
    shippedGeometry: countGeometry('shipped'),
    partialGeometry: countGeometry('partial'),
    referenceOnlyGeometry: countGeometry('reference-only'),
    plannedGeometry: countGeometry('planned'),
  }
}

function publicationGate(intent: AtlasWorldIntent, selected: AtlasNode | undefined): AtlasWorldPublicationGate {
  const reasons: string[] = []
  if (intent.mode === 'surgery-reference') {
    if (!selected) reasons.push('Surgery-reference mode requires an explicit selected anatomy node.')
    if (selected && !selected.surgicalLandmark) reasons.push('Selected anatomy node is not explicitly authored as a surgical landmark.')
    if (selected && !['shipped', 'partial'].includes(selected.geometryStatus)) reasons.push('Selected surgical-reference anatomy has no renderable verified-source geometry binding.')
    if (selected && selected.provenance.reviewStatus !== 'academic-reviewed') reasons.push('Selected surgical-reference anatomy has not completed qualified academic review.')
  }
  return {
    educationalDisplayAllowed: true,
    patientSpecificGeometryAllowed: false,
    surgicalReferenceAllowed: intent.mode !== 'surgery-reference' || reasons.length === 0,
    blockingReasons: reasons,
  }
}

export function compileAtlasWorldFrame(input: AtlasWorldFrameInput): AtlasWorldFrame {
  const { manifest, intent } = input
  const { candidates, selected, path } = collectCandidates(manifest, intent)
  const request: AtlasRenderRequest = {
    ...buildRenderRequest(intent),
    projectedPixelsByNodeId: input.projectedPixelsByNodeId,
    distanceByNodeId: input.distanceByNodeId,
  }
  const streaming = planAtlasStreaming(manifest, request, input.budget, input.telemetry, input.residency)
  const contextOpacity = clamp(intent.contextOpacity ?? 0.24, 0.06, 0.78)
  const compiled = compileLayers(candidates, streaming, contextOpacity)

  const respiratoryRequested = selected?.system === 'respiratory'
    || intent.systems?.includes('respiratory')
    || Boolean(intent.respiratory?.segmentNodeId)
  const respiratory = respiratoryRequested
    ? buildRespiratoryHighEndScene(manifest, {
        phase: intent.respiratory?.phase ?? 'inspiration',
        segmentNodeId: intent.respiratory?.segmentNodeId,
        overlays: intent.respiratory?.overlays,
      })
    : undefined

  const referencedNodes = stableUnique([
    ...compiled.layers.map((layer) => layer.nodeId),
    ...compiled.metadata.map((item) => item.nodeId),
  ]).map((id) => atlasNodeById(manifest, id)).filter((node): node is AtlasNode => Boolean(node))

  const warnings: string[] = [
    'World-frame anatomy is educational and source-bound; it is not patient-specific geometry.',
    'Reference-only nodes are retained as metadata and are never silently promoted to renderable anatomy.',
  ]
  if (intent.selectedNodeId && !selected) warnings.push(`Selected anatomy node is absent from manifest: ${intent.selectedNodeId}`)
  if (intent.mode === 'cross-system-path' && intent.targetNodeId && !path) warnings.push('No explicit anatomy-graph path exists between the requested nodes; no synthetic relationship was inferred.')
  if (intent.mode === 'section' && !intent.sectionPlane) warnings.push('Section mode requested without an authored section plane.')
  if (intent.mode === 'physiology' && selected && !selected.physiologyCapable) warnings.push('Selected anatomy node is not authored as physiology-capable; physiology overlay is withheld.')
  if (intent.mode === 'microstructure' && selected && selected.scale !== 'microstructure') warnings.push('Microstructure mode is active, but the selected node is not itself a microstructure node; descendant metadata may be shown without fabricated geometry.')
  if (respiratory) warnings.push(...respiratory.warnings)

  return {
    manifestId: manifest.id,
    manifestRevision: manifest.revision,
    mode: intent.mode,
    selectedNodeId: selected?.id,
    targetNodeId: intent.targetNodeId,
    renderLayers: compiled.layers,
    metadataReferences: compiled.metadata,
    passes: buildPasses(compiled.layers, respiratory),
    path: path ? { nodeIds: path.nodeIds, edges: path.edges, totalWeight: path.totalWeight } : undefined,
    respiratory,
    cameraEnvelope: cameraEnvelope(referencedNodes),
    streaming,
    provenance: provenanceLedger(referencedNodes),
    publicationGate: publicationGate(intent, selected),
    warnings: stableUnique(warnings),
  }
}

export function validateAtlasWorldFrame(frame: AtlasWorldFrame): string[] {
  const issues = [...validateAtlasStreamingPlan(frame.streaming)]
  const renderIds = new Set<string>()
  for (const layer of frame.renderLayers) {
    if (renderIds.has(layer.nodeId)) issues.push(`Duplicate rendered world-layer node: ${layer.nodeId}`)
    renderIds.add(layer.nodeId)
    if (layer.geometryStatus === 'reference-only' || layer.geometryStatus === 'planned') {
      issues.push(`Reference/planned geometry leaked into render layers: ${layer.nodeId}`)
    }
    if (!(layer.opacity > 0 && layer.opacity <= 1)) issues.push(`Invalid world-layer opacity for ${layer.nodeId}: ${layer.opacity}`)
  }

  const metadataIds = new Set<string>()
  for (const item of frame.metadataReferences) {
    if (metadataIds.has(item.nodeId)) issues.push(`Duplicate world metadata node: ${item.nodeId}`)
    metadataIds.add(item.nodeId)
    if (renderIds.has(item.nodeId)) issues.push(`World node appears in both render and metadata sets: ${item.nodeId}`)
  }

  for (const pass of frame.passes) {
    for (const nodeId of pass.nodeIds) {
      if (!renderIds.has(nodeId)) issues.push(`Render pass references a non-rendered node: ${pass.id}:${nodeId}`)
    }
  }

  if (frame.mode === 'surgery-reference' && frame.publicationGate.surgicalReferenceAllowed && frame.publicationGate.blockingReasons.length) {
    issues.push('Surgery-reference publication gate is internally inconsistent.')
  }
  if (frame.publicationGate.patientSpecificGeometryAllowed) issues.push('World-frame compiler must never self-enable patient-specific geometry.')
  if (frame.path && frame.path.nodeIds.length < 2) issues.push('Cross-system path must contain at least two nodes.')
  if (frame.provenance.totalReferencedNodes !== frame.renderLayers.length + frame.metadataReferences.length) {
    issues.push('World-frame provenance total does not match unique referenced nodes.')
  }
  return stableUnique(issues)
}
