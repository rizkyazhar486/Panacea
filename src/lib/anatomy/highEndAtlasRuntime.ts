import type { AtlasRenderRequest, AtlasSystemId } from './atlasKernel'
import { atlasNodeById, validateAtlasManifest } from './atlasKernel'
import { COMPLETE_WHOLE_BODY_ATLAS } from './completeAtlas'
import {
  buildAtlasCoverageReport,
  buildAtlasFocusStack,
  validateMultiscaleAtlas,
} from './atlasMultiscaleNavigator'
import {
  planAtlasStreaming,
  validateAtlasStreamingPlan,
  type AtlasResidencySnapshot,
  type AtlasRuntimeTelemetry,
  type AtlasStreamingBudget,
} from './atlasStreamingKernel'
import {
  buildRespiratoryHighEndScene,
  validateRespiratoryHighEndRuntime,
} from './respiratoryHighEndRuntime'
import type { RespiratoryCyclePhase } from './respiratoryAtlasContract'

export const HIGH_END_ATLAS_SYSTEMS: readonly AtlasSystemId[] = [
  'surface',
  'skeletal',
  'articular',
  'muscular',
  'cardiovascular',
  'lymphatic',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
  'sensory',
  'fascial',
] as const

export const HIGH_END_ATLAS_CAPABILITIES = {
  architecture: 'whole-body-multiscale-streaming-knowledge-graph',
  systems: HIGH_END_ATLAS_SYSTEMS,
  scales: ['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure'] as const,
  runtime: [
    'source-node-bound atlas graph',
    'adaptive LOD scheduling',
    'out-of-core source-bundle residency',
    'selected-node pinning',
    'semantic neighborhood prefetch',
    'multiscale drill-down',
    'explicit anatomy relation traversal',
    'spatial section-plane query when authored anchors exist',
    'respiratory segment navigation',
    'qualitative respiratory cycle overlays',
    'academic-review boundary preservation',
  ] as const,
  patientSpecificGeometry: false,
  academicReviewRequired: true,
} as const

export interface HighEndAtlasFrameInput {
  request: AtlasRenderRequest
  budget: AtlasStreamingBudget
  telemetry: AtlasRuntimeTelemetry
  residency: AtlasResidencySnapshot
  respiratory?: {
    phase?: RespiratoryCyclePhase
    segmentNodeId?: string
    overlays?: readonly ('airflow' | 'volume' | 'pressure' | 'gas-exchange')[]
  }
}

export function planHighEndAtlasFrame(input: HighEndAtlasFrameInput) {
  const manifest = COMPLETE_WHOLE_BODY_ATLAS
  const selected = input.request.selectedNodeId ? atlasNodeById(manifest, input.request.selectedNodeId) : undefined
  const focusStack = selected ? buildAtlasFocusStack(manifest, selected.id, 1) : []
  const streaming = planAtlasStreaming(manifest, input.request, input.budget, input.telemetry, input.residency)

  const respiratoryRequested = selected?.system === 'respiratory'
    || input.request.systems?.includes('respiratory')
    || Boolean(input.respiratory?.segmentNodeId)

  const respiratory = respiratoryRequested
    ? buildRespiratoryHighEndScene(manifest, {
        phase: input.respiratory?.phase ?? 'inspiration',
        segmentNodeId: input.respiratory?.segmentNodeId,
        overlays: input.respiratory?.overlays,
      })
    : undefined

  return {
    manifestId: manifest.id,
    manifestRevision: manifest.revision,
    selectedNodeId: selected?.id,
    focusStack,
    streaming,
    respiratory,
  }
}

/**
 * Engineering readiness only. Canonical manifest validity is included so an
 * invalid academic-review claim cannot be hidden by otherwise healthy runtime
 * checks. A clean result still does not constitute academic publication
 * approval or qualified human review.
 */
export function highEndAtlasEngineeringReadiness() {
  const manifest = COMPLETE_WHOLE_BODY_ATLAS
  const coverage = buildAtlasCoverageReport(manifest)
  const manifestIssues = validateAtlasManifest(manifest)
  const multiscaleIssues = validateMultiscaleAtlas(manifest)
  const respiratoryIssues = validateRespiratoryHighEndRuntime(manifest)

  return {
    manifestId: manifest.id,
    manifestRevision: manifest.revision,
    nodeCount: manifest.nodes.length,
    systemsRepresented: HIGH_END_ATLAS_SYSTEMS.filter((system) => coverage.systemCoverage[system] > 0),
    scaleCoverage: coverage.scaleCoverage,
    missingSystemRegionPairs: coverage.missingSystemRegionPairs,
    blockingEngineeringIssues: [
      ...manifestIssues.map((issue) => `manifest:${issue.code}:${issue.nodeId ?? 'manifest'}:${issue.message}`),
      ...multiscaleIssues,
      ...respiratoryIssues,
    ],
    academicReviewRequired: true as const,
  }
}

export function validateHighEndAtlasFrame(input: HighEndAtlasFrameInput): string[] {
  const frame = planHighEndAtlasFrame(input)
  const issues = validateAtlasStreamingPlan(frame.streaming)
  if (input.request.selectedNodeId && !frame.selectedNodeId) {
    issues.push(`Selected node is absent from complete atlas: ${input.request.selectedNodeId}`)
  }
  if (frame.respiratory) {
    for (const routeId of frame.respiratory.airwayRoute) {
      if (!atlasNodeById(COMPLETE_WHOLE_BODY_ATLAS, routeId)) issues.push(`Respiratory scene route references missing node: ${routeId}`)
    }
  }
  return [...new Set(issues)]
}
