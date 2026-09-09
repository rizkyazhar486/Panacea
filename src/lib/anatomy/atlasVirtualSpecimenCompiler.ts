import type { AtlasManifest, AtlasLodTier, AtlasScale } from './atlasKernel'
import { atlasAncestors, atlasNodeById } from './atlasKernel'
import { bioScaleNodeById, type BioRepresentation, type BioScaleManifest } from './bioScaleAtlas'
import type { CrossScaleRoute, CrossScaleStep } from './atlasCrossScalePlanner'

export type VirtualSpecimenTransition = 'camera-zoom' | 'semantic-zoom' | 'microscopy-bridge' | 'molecular-bridge'
export type VirtualSpecimenCameraIntent = 'whole-body' | 'regional' | 'organ-focus' | 'macro-detail' | 'microscopy' | 'molecular-diagram'

export interface VirtualSpecimenStage {
  index: number
  step: CrossScaleStep
  cameraIntent: VirtualSpecimenCameraIntent
  transitionFromPrevious?: VirtualSpecimenTransition
  atlasFocusNodeIds: readonly string[]
  atlasContextNodeIds: readonly string[]
  bioFocusNodeIds: readonly string[]
  lodIntent?: AtlasLodTier
  representation?: BioRepresentation
  labelBudget: number
  /** True only when an AtlasNode with shipped/partial geometry is the focus. */
  geometryExpected: boolean
  /** Conceptual bio stages must never masquerade as verified mesh. */
  conceptualOnly: boolean
  provenanceBoundary: string
}

export interface VirtualSpecimenJourney {
  route: CrossScaleRoute
  stages: readonly VirtualSpecimenStage[]
  maxSimultaneousAtlasNodes: number
  warnings: readonly string[]
}

export interface VirtualSpecimenCompileOptions {
  viewportWidth: number
  viewportHeight: number
  devicePixelRatio: number
  /** Keep parent anatomy faintly visible while drilling down. */
  preserveAnatomicalContext?: boolean
}

const ATLAS_SCALE_ORDER: readonly AtlasScale[] = ['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure']

function cameraIntent(step: CrossScaleStep): VirtualSpecimenCameraIntent {
  if (step.namespace === 'bio') return step.scale === 'molecular' ? 'molecular-diagram' : 'microscopy'
  if (step.scale === 'organism') return 'whole-body'
  if (step.scale === 'region') return 'regional'
  if (step.scale === 'organ') return 'organ-focus'
  return 'macro-detail'
}

function lodIntent(step: CrossScaleStep): AtlasLodTier | undefined {
  if (step.namespace !== 'atlas') return undefined
  if (step.scale === 'organism' || step.scale === 'region') return 'macro'
  if (step.scale === 'organ') return 'standard'
  if (step.scale === 'suborgan' || step.scale === 'tissue') return 'detail'
  return 'micro'
}

function transition(previous: CrossScaleStep | undefined, current: CrossScaleStep): VirtualSpecimenTransition | undefined {
  if (!previous) return undefined
  if (previous.namespace === 'atlas' && current.namespace === 'bio') return 'microscopy-bridge'
  if (previous.namespace === 'bio' && current.namespace === 'bio' && current.scale === 'molecular') return 'molecular-bridge'
  if (previous.namespace === 'bio' || current.namespace === 'bio') return 'semantic-zoom'
  const previousRank = ATLAS_SCALE_ORDER.indexOf(previous.scale as AtlasScale)
  const currentRank = ATLAS_SCALE_ORDER.indexOf(current.scale as AtlasScale)
  return currentRank > previousRank + 1 ? 'semantic-zoom' : 'camera-zoom'
}

function deriveLabelBudget(options: VirtualSpecimenCompileOptions, step: CrossScaleStep) {
  const pixels = Math.max(1, options.viewportWidth) * Math.max(1, options.viewportHeight) * Math.max(1, options.devicePixelRatio)
  const base = pixels >= 7_000_000 ? 28 : pixels >= 3_000_000 ? 20 : pixels >= 1_000_000 ? 14 : 9
  if (step.namespace === 'bio') return Math.max(4, Math.floor(base * 0.55))
  if (step.scale === 'organism') return Math.max(6, Math.floor(base * 0.45))
  return base
}

function stageContext(
  atlas: AtlasManifest,
  bio: BioScaleManifest,
  step: CrossScaleStep,
  preserveContext: boolean,
) {
  if (step.namespace === 'atlas') {
    const node = atlasNodeById(atlas, step.id)
    const ancestors = preserveContext && node ? atlasAncestors(atlas, node.id).slice(0, 3).map((ancestor) => ancestor.id) : []
    return {
      atlasFocusNodeIds: node ? [node.id] : [],
      atlasContextNodeIds: ancestors,
      bioFocusNodeIds: [] as string[],
      representation: undefined as BioRepresentation | undefined,
      geometryExpected: Boolean(node && (node.geometryStatus === 'shipped' || node.geometryStatus === 'partial')),
      conceptualOnly: Boolean(node && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')),
      provenanceBoundary: node
        ? `${node.provenance.sourceId}@${node.provenance.sourceRevision}:${node.provenance.reviewStatus}`
        : 'missing-atlas-node',
    }
  }

  const node = bioScaleNodeById(bio, step.id)
  const anchor = node ? atlasNodeById(atlas, node.anchorAtlasNodeId) : undefined
  const atlasContextNodeIds = preserveContext && anchor
    ? [anchor.id, ...atlasAncestors(atlas, anchor.id).slice(0, 2).map((ancestor) => ancestor.id)]
    : anchor
      ? [anchor.id]
      : []
  return {
    atlasFocusNodeIds: [] as string[],
    atlasContextNodeIds,
    bioFocusNodeIds: node ? [node.id] : [],
    representation: node?.representation,
    geometryExpected: false,
    conceptualOnly: true,
    provenanceBoundary: node
      ? `${node.provenance.sourceId}@${node.provenance.sourceRevision}:${node.provenance.reviewStatus}`
      : 'missing-bioscale-node',
  }
}

/**
 * Turns a cross-scale ontology route into deterministic scene stages.
 *
 * The compiler never invents mesh, microscopy, quantitative physiology, or
 * patient-specific data. It only says what a renderer should focus, retain as
 * context, and how it should signal a change of representation domain.
 */
export function compileVirtualSpecimenJourney(
  atlas: AtlasManifest,
  bio: BioScaleManifest,
  route: CrossScaleRoute,
  options: VirtualSpecimenCompileOptions,
): VirtualSpecimenJourney {
  const preserveContext = options.preserveAnatomicalContext ?? true
  const stages = route.steps.map((step, index): VirtualSpecimenStage => {
    const context = stageContext(atlas, bio, step, preserveContext)
    return {
      index,
      step,
      cameraIntent: cameraIntent(step),
      transitionFromPrevious: transition(route.steps[index - 1], step),
      atlasFocusNodeIds: context.atlasFocusNodeIds,
      atlasContextNodeIds: context.atlasContextNodeIds,
      bioFocusNodeIds: context.bioFocusNodeIds,
      lodIntent: lodIntent(step),
      representation: context.representation,
      labelBudget: deriveLabelBudget(options, step),
      geometryExpected: context.geometryExpected,
      conceptualOnly: context.conceptualOnly,
      provenanceBoundary: context.provenanceBoundary,
    }
  })

  const maxSimultaneousAtlasNodes = stages.reduce((max, stage) =>
    Math.max(max, new Set([...stage.atlasFocusNodeIds, ...stage.atlasContextNodeIds]).size), 0)

  return {
    route,
    stages,
    maxSimultaneousAtlasNodes,
    warnings: [
      ...route.warnings,
      'Virtual specimen transitions between geometry, microscopy-reference, and molecular-reference domains must remain visually distinguishable.',
      'A molecular/subcellular stage is educational representation, not a literal zoom into the active patient or atlas mesh.',
    ],
  }
}

export function validateVirtualSpecimenJourney(journey: VirtualSpecimenJourney): string[] {
  const issues: string[] = []
  if (journey.stages.length !== journey.route.steps.length) issues.push('Virtual specimen stage count does not match route step count.')
  for (let i = 0; i < journey.stages.length; i += 1) {
    const stage = journey.stages[i]
    if (stage.index !== i) issues.push(`Virtual specimen stage index mismatch at ${i}.`)
    if (stage.step.id !== journey.route.steps[i]?.id) issues.push(`Virtual specimen route/stage mismatch at ${i}.`)
    if (stage.labelBudget <= 0) issues.push(`Virtual specimen label budget must be positive at ${stage.step.id}.`)
    if (stage.step.namespace === 'bio' && stage.geometryExpected) issues.push(`Bioscale stage must not claim verified geometry: ${stage.step.id}`)
    if (stage.step.namespace === 'bio' && !stage.conceptualOnly) issues.push(`Bioscale stage must remain conceptual/reference-only: ${stage.step.id}`)
    if (stage.step.scale === 'molecular' && stage.cameraIntent !== 'molecular-diagram') issues.push(`Molecular stage requires molecular-diagram intent: ${stage.step.id}`)
  }
  return [...new Set(issues)]
}
