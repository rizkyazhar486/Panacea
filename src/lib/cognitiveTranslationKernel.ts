import type {
  HumanStatePhysiologyField,
  HumanStateProjection,
  HumanStateTruthLane,
} from './humanStateProjection.ts'

export type CognitiveAudience = 'public' | 'student' | 'clinician' | 'specialist' | 'researcher'
export type CognitiveIntent = 'see' | 'ask' | 'zoom' | 'why' | 'what-if' | 'act'
export type CognitiveDepth = 'orientation' | 'mechanism' | 'quantitative' | 'specialist' | 'research'

export interface CognitiveTranslationRequest {
  audience: CognitiveAudience
  intent: CognitiveIntent
  requestedDepth?: CognitiveDepth
}

export interface CognitiveTranslationPlan {
  audience: CognitiveAudience
  intent: CognitiveIntent
  visibleDepth: CognitiveDepth
  recoverableDepth: 'research'
  visibleTruthLanes: readonly HumanStateTruthLane[]
  requirements: {
    preserveScientificState: true
    preserveTruthLaneLabels: true
    provenanceRecoverable: true
    uncertaintyRecoverable: true
    counterfactualIsolation: true
    surfaceMayOwnIndependentHumanState: false
    translationMayInventScientificState: false
  }
}

export interface CognitivePhysiologyProjection {
  plan: CognitiveTranslationPlan
  visible: {
    observed: readonly HumanStatePhysiologyField[]
    estimated: readonly HumanStatePhysiologyField[]
    simulated: readonly HumanStatePhysiologyField[]
  }
  recoverable: {
    observed: readonly HumanStatePhysiologyField[]
    estimated: readonly HumanStatePhysiologyField[]
    simulated: readonly HumanStatePhysiologyField[]
  }
}

const DEPTH_ORDER: readonly CognitiveDepth[] = [
  'orientation',
  'mechanism',
  'quantitative',
  'specialist',
  'research',
] as const

const DEFAULT_DEPTH_BY_AUDIENCE: Readonly<Record<CognitiveAudience, CognitiveDepth>> = {
  public: 'orientation',
  student: 'mechanism',
  clinician: 'quantitative',
  specialist: 'specialist',
  researcher: 'research',
}

function depthIndex(depth: CognitiveDepth) {
  return DEPTH_ORDER.indexOf(depth)
}

function maxDepth(a: CognitiveDepth, b: CognitiveDepth): CognitiveDepth {
  return depthIndex(a) >= depthIndex(b) ? a : b
}

function minimumDepthForIntent(intent: CognitiveIntent): CognitiveDepth {
  if (intent === 'why') return 'mechanism'
  if (intent === 'what-if') return 'mechanism'
  if (intent === 'act') return 'quantitative'
  return 'orientation'
}

function truthLanesFor(depth: CognitiveDepth, intent: CognitiveIntent): readonly HumanStateTruthLane[] {
  const lanes: HumanStateTruthLane[] = ['observed']
  if (depthIndex(depth) >= depthIndex('mechanism') || intent === 'why' || intent === 'what-if') {
    lanes.push('estimated')
  }
  if (depth === 'research' || intent === 'what-if') lanes.push('simulated')
  return lanes
}

/**
 * Panacea's Cognitive Translation Kernel.
 *
 * It does not simplify, mutate, or manufacture the underlying human state.
 * It decides only what is visible first and what remains one interaction away.
 * Scientific depth is therefore compressed at the representation layer while
 * the complete source state, provenance, uncertainty, and truth lanes remain
 * recoverable.
 */
export function planCognitiveTranslation(request: CognitiveTranslationRequest): CognitiveTranslationPlan {
  const audienceDepth = DEFAULT_DEPTH_BY_AUDIENCE[request.audience]
  const requestedDepth = request.requestedDepth ?? audienceDepth
  const visibleDepth = maxDepth(requestedDepth, minimumDepthForIntent(request.intent))

  return {
    audience: request.audience,
    intent: request.intent,
    visibleDepth,
    recoverableDepth: 'research',
    visibleTruthLanes: truthLanesFor(visibleDepth, request.intent),
    requirements: {
      preserveScientificState: true,
      preserveTruthLaneLabels: true,
      provenanceRecoverable: true,
      uncertaintyRecoverable: true,
      counterfactualIsolation: true,
      surfaceMayOwnIndependentHumanState: false,
      translationMayInventScientificState: false,
    },
  }
}

function partitionLane(
  fields: readonly HumanStatePhysiologyField[],
  lane: HumanStateTruthLane,
  visibleLanes: readonly HumanStateTruthLane[],
) {
  return visibleLanes.includes(lane)
    ? { visible: fields, recoverable: [] as readonly HumanStatePhysiologyField[] }
    : { visible: [] as readonly HumanStatePhysiologyField[], recoverable: fields }
}

/**
 * Applies cognitive compression to a permission-scoped Human State projection.
 *
 * Every admitted physiological field remains present exactly once: either
 * visible now or recoverable at a deeper cognitive layer. This function never
 * changes values, uncertainty, provenance, source-event lineage, or truth class.
 */
export function projectPhysiologyForCognition(
  physiology: HumanStateProjection['physiology'],
  request: CognitiveTranslationRequest,
): CognitivePhysiologyProjection {
  const plan = planCognitiveTranslation(request)
  const observed = partitionLane(physiology.observed, 'observed', plan.visibleTruthLanes)
  const estimated = partitionLane(physiology.estimated, 'estimated', plan.visibleTruthLanes)
  const simulated = partitionLane(physiology.simulated, 'simulated', plan.visibleTruthLanes)

  return {
    plan,
    visible: {
      observed: observed.visible,
      estimated: estimated.visible,
      simulated: simulated.visible,
    },
    recoverable: {
      observed: observed.recoverable,
      estimated: estimated.recoverable,
      simulated: simulated.recoverable,
    },
  }
}

export function cognitiveProjectionPreservesAllAdmittedFields(
  source: HumanStateProjection['physiology'],
  projection: CognitivePhysiologyProjection,
) {
  const count = (lanes: CognitivePhysiologyProjection['visible'] | CognitivePhysiologyProjection['recoverable']) =>
    lanes.observed.length + lanes.estimated.length + lanes.simulated.length

  const sourceCount = source.observed.length + source.estimated.length + source.simulated.length
  return count(projection.visible) + count(projection.recoverable) === sourceCount
}
