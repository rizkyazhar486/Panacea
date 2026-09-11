import type { AtlasManifest, AtlasNode } from './atlasKernel'
import { atlasNodeById } from './atlasKernel'
import {
  RESPIRATORY_CYCLE_STATES,
  RESPIRATORY_OVERLAY_POLICIES,
  type RespiratoryCyclePhase,
  type RespiratoryMotionState,
} from './respiratoryAtlasContract'

export type RespiratorySide = 'right' | 'left'
export type RespiratoryLobeId =
  | 'resp:right-upper-lobe'
  | 'resp:right-middle-lobe'
  | 'resp:right-lower-lobe'
  | 'resp:left-upper-lobe'
  | 'resp:left-lower-lobe'

export interface BronchopulmonarySegmentRuntime {
  atlasNodeId: string
  code: string
  side: RespiratorySide
  lobeId: RespiratoryLobeId
  bronchoscopicRoute: readonly string[]
  /** Educational topology only; not a patient-specific bronchoscopic map. */
  topologyStatus: 'reference-route'
}

export interface RespiratoryHighEndScenePlan {
  phase: RespiratoryMotionState
  focusNodeIds: readonly string[]
  airwayRoute: readonly string[]
  isolateNodeIds: readonly string[]
  contextualNodeIds: readonly string[]
  conceptualOverlays: readonly {
    id: 'airflow' | 'volume' | 'pressure' | 'gas-exchange'
    enabled: boolean
    quantitative: false
  }[]
  warnings: readonly string[]
}

const RIGHT_PREFIX = ['resp:larynx', 'resp:trachea', 'resp:carina', 'resp:right-main-bronchus'] as const
const LEFT_PREFIX = ['resp:larynx', 'resp:trachea', 'resp:carina', 'resp:left-main-bronchus'] as const

const route = (
  side: RespiratorySide,
  lobeId: RespiratoryLobeId,
  atlasNodeId: string,
) => [...(side === 'right' ? RIGHT_PREFIX : LEFT_PREFIX), lobeId, atlasNodeId] as const

/**
 * Canonical educational bronchopulmonary segment routing matrix.
 *
 * The atlas already stores segment nodes. This runtime matrix adds a deterministic
 * endoscopy/navigation path without claiming patient-specific airway anatomy.
 * Left S1+2 and S7+8 remain explicitly combined in the shipped scaffold.
 */
export const BRONCHOPULMONARY_SEGMENT_RUNTIME: readonly BronchopulmonarySegmentRuntime[] = [
  { atlasNodeId: 'resp:segment:r-s1', code: 'R-S1', side: 'right', lobeId: 'resp:right-upper-lobe', bronchoscopicRoute: route('right', 'resp:right-upper-lobe', 'resp:segment:r-s1'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s2', code: 'R-S2', side: 'right', lobeId: 'resp:right-upper-lobe', bronchoscopicRoute: route('right', 'resp:right-upper-lobe', 'resp:segment:r-s2'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s3', code: 'R-S3', side: 'right', lobeId: 'resp:right-upper-lobe', bronchoscopicRoute: route('right', 'resp:right-upper-lobe', 'resp:segment:r-s3'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s4', code: 'R-S4', side: 'right', lobeId: 'resp:right-middle-lobe', bronchoscopicRoute: route('right', 'resp:right-middle-lobe', 'resp:segment:r-s4'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s5', code: 'R-S5', side: 'right', lobeId: 'resp:right-middle-lobe', bronchoscopicRoute: route('right', 'resp:right-middle-lobe', 'resp:segment:r-s5'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s6', code: 'R-S6', side: 'right', lobeId: 'resp:right-lower-lobe', bronchoscopicRoute: route('right', 'resp:right-lower-lobe', 'resp:segment:r-s6'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s7', code: 'R-S7', side: 'right', lobeId: 'resp:right-lower-lobe', bronchoscopicRoute: route('right', 'resp:right-lower-lobe', 'resp:segment:r-s7'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s8', code: 'R-S8', side: 'right', lobeId: 'resp:right-lower-lobe', bronchoscopicRoute: route('right', 'resp:right-lower-lobe', 'resp:segment:r-s8'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s9', code: 'R-S9', side: 'right', lobeId: 'resp:right-lower-lobe', bronchoscopicRoute: route('right', 'resp:right-lower-lobe', 'resp:segment:r-s9'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:r-s10', code: 'R-S10', side: 'right', lobeId: 'resp:right-lower-lobe', bronchoscopicRoute: route('right', 'resp:right-lower-lobe', 'resp:segment:r-s10'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s1-2', code: 'L-S1+2', side: 'left', lobeId: 'resp:left-upper-lobe', bronchoscopicRoute: route('left', 'resp:left-upper-lobe', 'resp:segment:l-s1-2'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s3', code: 'L-S3', side: 'left', lobeId: 'resp:left-upper-lobe', bronchoscopicRoute: route('left', 'resp:left-upper-lobe', 'resp:segment:l-s3'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s4', code: 'L-S4', side: 'left', lobeId: 'resp:left-upper-lobe', bronchoscopicRoute: route('left', 'resp:left-upper-lobe', 'resp:segment:l-s4'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s5', code: 'L-S5', side: 'left', lobeId: 'resp:left-upper-lobe', bronchoscopicRoute: route('left', 'resp:left-upper-lobe', 'resp:segment:l-s5'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s6', code: 'L-S6', side: 'left', lobeId: 'resp:left-lower-lobe', bronchoscopicRoute: route('left', 'resp:left-lower-lobe', 'resp:segment:l-s6'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s7-8', code: 'L-S7+8', side: 'left', lobeId: 'resp:left-lower-lobe', bronchoscopicRoute: route('left', 'resp:left-lower-lobe', 'resp:segment:l-s7-8'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s9', code: 'L-S9', side: 'left', lobeId: 'resp:left-lower-lobe', bronchoscopicRoute: route('left', 'resp:left-lower-lobe', 'resp:segment:l-s9'), topologyStatus: 'reference-route' },
  { atlasNodeId: 'resp:segment:l-s10', code: 'L-S10', side: 'left', lobeId: 'resp:left-lower-lobe', bronchoscopicRoute: route('left', 'resp:left-lower-lobe', 'resp:segment:l-s10'), topologyStatus: 'reference-route' },
] as const

const segmentById = new Map(BRONCHOPULMONARY_SEGMENT_RUNTIME.map((segment) => [segment.atlasNodeId, segment]))

export function respiratorySegmentRuntime(atlasNodeId: string) {
  return segmentById.get(atlasNodeId)
}

export function respiratoryMotionState(phase: RespiratoryCyclePhase) {
  return RESPIRATORY_CYCLE_STATES.find((state) => state.phase === phase) ?? RESPIRATORY_CYCLE_STATES[0]
}

function existingNodes(manifest: AtlasManifest, ids: readonly string[]): AtlasNode[] {
  return ids.map((id) => atlasNodeById(manifest, id)).filter((node): node is AtlasNode => Boolean(node))
}

/**
 * Builds a respiratory deep-dive scene that can drive a future 3D viewer.
 * Quantitative flow/pressure/gas values are never fabricated: every overlay
 * remains conceptual until a separately validated source is attached.
 */
export function buildRespiratoryHighEndScene(
  manifest: AtlasManifest,
  options: {
    phase: RespiratoryCyclePhase
    segmentNodeId?: string
    overlays?: readonly ('airflow' | 'volume' | 'pressure' | 'gas-exchange')[]
  },
): RespiratoryHighEndScenePlan {
  const phase = respiratoryMotionState(options.phase)
  const selectedSegment = options.segmentNodeId ? respiratorySegmentRuntime(options.segmentNodeId) : undefined
  const airwayRoute = selectedSegment?.bronchoscopicRoute ?? ['resp:larynx', 'resp:trachea', 'resp:carina']
  const focusNodeIds = existingNodes(manifest, airwayRoute).map((node) => node.id)

  const isolateNodeIds = selectedSegment
    ? existingNodes(manifest, [selectedSegment.lobeId, selectedSegment.atlasNodeId]).map((node) => node.id)
    : existingNodes(manifest, ['resp:lungs', 'resp:right-lung', 'resp:left-lung']).map((node) => node.id)

  const contextualNodeIds = existingNodes(manifest, [
    'resp:pleura',
    'resp:diaphragm',
    'resp:alveolar-capillary-unit',
    'cv:heart',
    'cv:pulmonary-trunk',
  ]).map((node) => node.id)

  const requested = new Set(options.overlays ?? ['airflow'])
  const conceptualOverlays = RESPIRATORY_OVERLAY_POLICIES.map((policy) => ({
    id: policy.id,
    enabled: requested.has(policy.id),
    quantitative: false as const,
  }))

  const warnings = [
    'Respiratory route is an educational reference topology, not a patient-specific bronchoscopy map.',
    'Airflow, pressure, volume, and gas-exchange overlays remain qualitative unless separately source-validated.',
  ]
  if (selectedSegment && !atlasNodeById(manifest, selectedSegment.atlasNodeId)) {
    warnings.push(`Selected respiratory segment is absent from the active manifest: ${selectedSegment.atlasNodeId}`)
  }

  return {
    phase,
    focusNodeIds,
    airwayRoute,
    isolateNodeIds,
    contextualNodeIds,
    conceptualOverlays,
    warnings,
  }
}

export function validateRespiratoryHighEndRuntime(manifest: AtlasManifest): string[] {
  const issues: string[] = []
  const codes = new Set<string>()
  const ids = new Set<string>()

  for (const segment of BRONCHOPULMONARY_SEGMENT_RUNTIME) {
    if (codes.has(segment.code)) issues.push(`Duplicate respiratory segment code: ${segment.code}`)
    if (ids.has(segment.atlasNodeId)) issues.push(`Duplicate respiratory atlas node id in runtime matrix: ${segment.atlasNodeId}`)
    codes.add(segment.code)
    ids.add(segment.atlasNodeId)

    const atlasNode = atlasNodeById(manifest, segment.atlasNodeId)
    if (!atlasNode) {
      issues.push(`Respiratory segment missing from manifest: ${segment.atlasNodeId}`)
      continue
    }
    if (atlasNode.system !== 'respiratory') issues.push(`Respiratory runtime node is assigned to another system: ${segment.atlasNodeId}`)
    if (atlasNode.parentId !== segment.lobeId) issues.push(`Respiratory segment/lobe mismatch: ${segment.atlasNodeId} -> ${atlasNode.parentId ?? 'none'}, expected ${segment.lobeId}`)

    for (const routeId of segment.bronchoscopicRoute) {
      if (!atlasNodeById(manifest, routeId)) issues.push(`Bronchoscopic reference route contains missing atlas node: ${routeId}`)
    }
  }

  if (BRONCHOPULMONARY_SEGMENT_RUNTIME.filter((segment) => segment.side === 'right').length !== 10) {
    issues.push('Right bronchopulmonary segment runtime must expose 10 educational segment entries.')
  }
  if (BRONCHOPULMONARY_SEGMENT_RUNTIME.filter((segment) => segment.side === 'left').length !== 8) {
    issues.push('Left bronchopulmonary segment runtime must expose 8 educational entries with combined S1+2 and S7+8 scaffolds.')
  }
  return [...new Set(issues)]
}
