import { COMPLETE_WHOLE_BODY_ATLAS } from './completeAtlas'
import { buildAtlasCoverageReport } from './atlasMultiscaleNavigator'
import { validateAtlasManifest } from './atlasKernel'
import {
  compileAtlasWorldFrame,
  validateAtlasWorldFrame,
  type AtlasWorldFrameInput,
  type AtlasWorldIntent,
} from './atlasWorldFrameCompiler'
import {
  solveAtlasDissection,
  validateAtlasDissectionPlan,
  type AtlasDissectionIntent,
} from './atlasDissectionSolver'
import {
  buildRespiratoryMotionField,
  validateRespiratoryMotionField,
  type RespiratoryMotionChannel,
} from './respiratoryMotionField'
import { validateRespiratoryHighEndRuntime } from './respiratoryHighEndRuntime'
import { validateWholeBodyDeepExpansionWave1 } from './wholeBodyDeepExpansionWave1'

export const ULTIMATE_WHOLE_BODY_CAPABILITIES = {
  benchmarkClass: 'whole-body-multiscale-streamed-source-bound-atlas',
  systems: 14,
  coordinatePolicy: 'canonical authored whole-body/source coordinates; never normalize each organ into an unrelated local cube at runtime',
  sceneCompilation: [
    'whole-body overview',
    'system isolation',
    'regional dissection context',
    'explicit cross-system graph path',
    'authored spatial section plane',
    'physiology-capable educational mode',
    'fail-closed surgery-reference mode',
    'organ-to-tissue-to-microstructure drill-down',
    'semantic peel/isolate/ghost relationship dissection solver',
  ] as const,
  rendering: [
    'adaptive LOD',
    'out-of-core asset residency',
    'semantic prefetch',
    'source-bundle de-duplication',
    'transparent context passes',
    'relationship highlight passes',
    'protected-node dissection visibility decisions',
  ] as const,
  respiratory: [
    'segment-level bronchoscopic reference route',
    'continuous dimensionless respiratory motion field',
    'lung/diaphragm/pleural/acinar/gas-exchange channels',
    'qualitative overlays only until source-validated',
  ] as const,
  clinicalBoundary: {
    patientSpecificGeometry: false,
    unreviewedSurgeryPublication: false,
    referenceOnlyGeometryAutoPromotion: false,
    academicReviewRequired: true,
  },
} as const

export interface UltimateWholeBodyFrameInput extends Omit<AtlasWorldFrameInput, 'manifest'> {
  intent: AtlasWorldIntent
  dissection?: AtlasDissectionIntent
  respiratoryMotion?: {
    cycleFraction: number
    selectedSegmentNodeId?: string
    channels?: readonly RespiratoryMotionChannel[]
  }
}

export function planUltimateWholeBodyFrame(input: UltimateWholeBodyFrameInput) {
  const world = compileAtlasWorldFrame({
    ...input,
    manifest: COMPLETE_WHOLE_BODY_ATLAS,
  })
  const dissection = input.dissection
    ? solveAtlasDissection(COMPLETE_WHOLE_BODY_ATLAS, input.dissection)
    : undefined
  const motion = input.respiratoryMotion
    ? buildRespiratoryMotionField(input.respiratoryMotion)
    : undefined

  return {
    atlas: {
      id: COMPLETE_WHOLE_BODY_ATLAS.id,
      revision: COMPLETE_WHOLE_BODY_ATLAS.revision,
      nodeCount: COMPLETE_WHOLE_BODY_ATLAS.nodes.length,
    },
    world,
    dissection,
    respiratoryMotion: motion,
    capabilities: ULTIMATE_WHOLE_BODY_CAPABILITIES,
  }
}

export function ultimateWholeBodyEngineeringReadiness() {
  const coverage = buildAtlasCoverageReport(COMPLETE_WHOLE_BODY_ATLAS)
  const manifestIssues = validateAtlasManifest(COMPLETE_WHOLE_BODY_ATLAS)
  const deepWaveIssues = validateWholeBodyDeepExpansionWave1()
  const respiratoryIssues = validateRespiratoryHighEndRuntime(COMPLETE_WHOLE_BODY_ATLAS)

  return {
    manifestId: COMPLETE_WHOLE_BODY_ATLAS.id,
    revision: COMPLETE_WHOLE_BODY_ATLAS.revision,
    nodeCount: COMPLETE_WHOLE_BODY_ATLAS.nodes.length,
    representedSystems: Object.entries(coverage.systemCoverage)
      .filter(([, count]) => count > 0)
      .map(([system]) => system),
    scaleCoverage: coverage.scaleCoverage,
    referenceOnlyNodes: COMPLETE_WHOLE_BODY_ATLAS.nodes.filter((node) => node.geometryStatus === 'reference-only').length,
    shippedOrPartialNodes: COMPLETE_WHOLE_BODY_ATLAS.nodes.filter((node) => node.geometryStatus === 'shipped' || node.geometryStatus === 'partial').length,
    blockingEngineeringIssues: [
      ...manifestIssues.map((issue) => `manifest:${issue.code}:${issue.nodeId ?? 'manifest'}:${issue.message}`),
      ...deepWaveIssues.map((issue) => `deep-wave:${issue}`),
      ...respiratoryIssues.map((issue) => `respiratory:${issue}`),
    ],
    academicReviewStillRequired: true as const,
  }
}

export function validateUltimateWholeBodyFrame(frame: ReturnType<typeof planUltimateWholeBodyFrame>): string[] {
  const issues = validateAtlasWorldFrame(frame.world)
  if (frame.dissection) issues.push(...validateAtlasDissectionPlan(frame.dissection))
  if (frame.respiratoryMotion) issues.push(...validateRespiratoryMotionField(frame.respiratoryMotion))
  if (frame.atlas.nodeCount !== COMPLETE_WHOLE_BODY_ATLAS.nodes.length) issues.push('Ultimate atlas node count drifted from canonical manifest.')
  if (frame.capabilities.clinicalBoundary.patientSpecificGeometry !== false) issues.push('Ultimate atlas must never self-enable patient-specific geometry.')
  return [...new Set(issues)]
}
