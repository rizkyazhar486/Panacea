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
import { bioScaleCoverage, bioScaleNodeById, validateBioScaleManifest } from './bioScaleAtlas'
import { WHOLE_BODY_BIOSCALE_ATLAS, WHOLE_BODY_BIOSCALE_SYSTEMS } from './wholeBodyBioScaleAtlas'
import { planCrossScaleRoute, validateCrossScaleRoute } from './atlasCrossScalePlanner'

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

/**
 * External products are design/interaction benchmarks only. They are not runtime
 * dependencies and no geometry/source code is vendored from them here.
 */
export const HIGH_END_ATLAS_BENCHMARK_REFERENCES = [
  {
    id: 'thebuggeddev-anatomy',
    url: 'https://github.com/thebuggeddev/anatomy',
    role: 'interactive Three.js anatomy-explorer benchmark',
    runtimeDependency: false,
  },
  {
    id: 'thebuggeddev-breath-atlas',
    url: 'https://breath-atlas.thebuggeddev.chatgpt.site/',
    role: 'respiratory deep-dive experience benchmark',
    runtimeDependency: false,
  },
] as const

export const HIGH_END_ATLAS_CAPABILITIES = {
  architecture: 'whole-body-multiscale-streaming-knowledge-graph-with-bioscale-bridge',
  systems: HIGH_END_ATLAS_SYSTEMS,
  atlasScales: ['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure'] as const,
  bioScales: ['cellular', 'subcellular', 'molecular'] as const,
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
    'whole-body to cellular/subcellular/molecular route solving',
    'explicit atlas-to-cell semantic bridges',
    'fail-closed bioscale provenance and review boundaries',
    'academic-review boundary preservation',
  ] as const,
  patientSpecificGeometry: false,
  patientSpecificBioscaleInference: false,
  academicReviewRequired: true,
  benchmarks: HIGH_END_ATLAS_BENCHMARK_REFERENCES,
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
  crossScale?: {
    fromAtlasNodeId?: string
    targetBioNodeId: string
    strictDrillDown?: boolean
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

  const bioTarget = input.crossScale?.targetBioNodeId
    ? bioScaleNodeById(WHOLE_BODY_BIOSCALE_ATLAS, input.crossScale.targetBioNodeId)
    : undefined
  const crossScaleFrom = input.crossScale?.fromAtlasNodeId ?? selected?.id ?? bioTarget?.anchorAtlasNodeId
  const crossScale = input.crossScale?.targetBioNodeId && crossScaleFrom
    ? planCrossScaleRoute(
        manifest,
        WHOLE_BODY_BIOSCALE_ATLAS,
        crossScaleFrom,
        input.crossScale.targetBioNodeId,
        { strictDrillDown: input.crossScale.strictDrillDown ?? true },
      )
    : undefined

  return {
    manifestId: manifest.id,
    manifestRevision: manifest.revision,
    bioscaleManifestId: WHOLE_BODY_BIOSCALE_ATLAS.id,
    bioscaleManifestRevision: WHOLE_BODY_BIOSCALE_ATLAS.revision,
    selectedNodeId: selected?.id,
    focusStack,
    streaming,
    respiratory,
    crossScale,
  }
}

/**
 * Engineering readiness only. A clean result does not constitute academic
 * publication approval, qualified human review, or patient-specific validity.
 */
export function highEndAtlasEngineeringReadiness() {
  const manifest = COMPLETE_WHOLE_BODY_ATLAS
  const coverage = buildAtlasCoverageReport(manifest)
  const manifestIssues = validateAtlasManifest(manifest)
  const multiscaleIssues = validateMultiscaleAtlas(manifest)
  const respiratoryIssues = validateRespiratoryHighEndRuntime(manifest)
  const bioscaleIssues = validateBioScaleManifest(manifest, WHOLE_BODY_BIOSCALE_ATLAS)
  const bioscale = bioScaleCoverage(WHOLE_BODY_BIOSCALE_ATLAS)
  const bioscaleMissingSystems = HIGH_END_ATLAS_SYSTEMS.filter((system) => !WHOLE_BODY_BIOSCALE_SYSTEMS.includes(system))

  return {
    manifestId: manifest.id,
    manifestRevision: manifest.revision,
    nodeCount: manifest.nodes.length,
    systemsRepresented: HIGH_END_ATLAS_SYSTEMS.filter((system) => coverage.systemCoverage[system] > 0),
    scaleCoverage: coverage.scaleCoverage,
    missingSystemRegionPairs: coverage.missingSystemRegionPairs,
    bioscaleManifestId: WHOLE_BODY_BIOSCALE_ATLAS.id,
    bioscaleNodeCount: WHOLE_BODY_BIOSCALE_ATLAS.nodes.length,
    bioscaleCoverage: bioscale,
    bioscaleMissingSystems,
    blockingEngineeringIssues: [
      ...manifestIssues.map((issue) => `manifest:${issue.code}:${issue.nodeId ?? 'manifest'}:${issue.message}`),
      ...multiscaleIssues,
      ...respiratoryIssues,
      ...bioscaleIssues.map((issue) => `bioscale:${issue.code}:${issue.nodeId ?? 'manifest'}:${issue.message}`),
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
  if (input.crossScale?.targetBioNodeId) {
    if (!bioScaleNodeById(WHOLE_BODY_BIOSCALE_ATLAS, input.crossScale.targetBioNodeId)) {
      issues.push(`Cross-scale target is absent from bioscale atlas: ${input.crossScale.targetBioNodeId}`)
    } else if (!frame.crossScale) {
      issues.push(`No explicit cross-scale route could be built to: ${input.crossScale.targetBioNodeId}`)
    } else {
      issues.push(...validateCrossScaleRoute(frame.crossScale, input.crossScale.strictDrillDown ?? true))
    }
  }
  return [...new Set(issues)]
}
