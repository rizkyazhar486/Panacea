import type { BodySystemId } from './bodySystemSourceWave'
import {
  BODY_UNIFIED_MECHANISM_GRAPH,
  atlasSystemGraphNodeId,
  getUnifiedMechanismNode,
  traceUnifiedMechanismRoute,
  type UnifiedMechanismGraphNode,
  type UnifiedMechanismNodeKind,
} from './bodyUnifiedMechanismGraph'
import { getBodyEvidenceClaim } from './bodyEvidenceProvenance'

export interface BodyLearningRouteStep {
  index: number
  nodeId: string
  nodeKind: UnifiedMechanismNodeKind
  label: string
  objective: string
  context: string
  transitionFromPrevious: string | null
  referencePmids: readonly string[]
}

export interface BodyLearningRoute {
  startAtlasSystemId: BodySystemId
  targetId: string
  targetLabel: string
  steps: readonly BodyLearningRouteStep[]
  biomedicalStepCount: number
  evidenceAnchoredBiomedicalStepCount: number
  evidenceCoverageFraction: number
}

const biomedicalKinds = new Set<UnifiedMechanismNodeKind>([
  'pathophysiology-scenario',
  'pathophysiology-step',
  'pharmacology-class',
  'pharmacology-step',
])

function evidencePmidsForNode(node: UnifiedMechanismGraphNode): readonly string[] {
  if (node.kind === 'pathophysiology-scenario' || node.kind === 'pathophysiology-step') {
    return getBodyEvidenceClaim(`pathophysiology:${node.domainId}`).evidencePmids
  }
  if (node.kind === 'pharmacology-class' || node.kind === 'pharmacology-step') {
    return getBodyEvidenceClaim(`pharmacology:${node.domainId}`).evidencePmids
  }
  return []
}

function objectiveForNode(node: UnifiedMechanismGraphNode): string {
  switch (node.kind) {
    case 'atlas-system':
      return `Orient the anatomical system: identify the source-backed ${node.label} domain before moving into function.`
    case 'physiology-system':
      return `Explain the systems role of ${node.label} and how its curated coupling relationships connect it to the next layer.`
    case 'pathophysiology-scenario':
      return `State the central pathophysiology question represented by ${node.label} before entering the mechanistic cascade.`
    case 'pathophysiology-step':
      return `Explain this disease-mechanism step in sequence: ${node.label}.`
    case 'pharmacology-class':
      return `Identify the class-level target context for ${node.label} without converting mechanism knowledge into prescribing advice.`
    case 'pharmacology-step':
      return `Trace how this pharmacology mechanism changes across biological scale at the ${node.label} step.`
  }
}

function transitionLabel(edgeId: string | undefined): string | null {
  if (!edgeId) return null
  const edge = BODY_UNIFIED_MECHANISM_GRAPH.edges.find((candidate) => candidate.id === edgeId)
  return edge ? `${edge.kind}: ${edge.label}` : null
}

export const BODY_LEARNING_ROUTE_BOUNDARY =
  'Educational route composer only. A route orders existing curated graph nodes into a teachable sequence. Route length, completion percentage, evidence-anchor coverage and graph transitions are learning-interface metadata; they do not represent disease severity, diagnostic probability, causal strength, treatment ranking, expected benefit, risk, dose, timing or a patient-specific clinical plan.'

export function listBodyLearningRouteTargets(): readonly UnifiedMechanismGraphNode[] {
  return BODY_UNIFIED_MECHANISM_GRAPH.nodes.filter(
    (node) => node.kind === 'pathophysiology-scenario' || node.kind === 'pharmacology-class',
  )
}

export function buildBodyLearningRoute(startAtlasSystemId: BodySystemId, targetId: string): BodyLearningRoute | null {
  const startId = atlasSystemGraphNodeId(startAtlasSystemId)
  const target = getUnifiedMechanismNode(targetId)
  if (target.kind !== 'pathophysiology-scenario' && target.kind !== 'pharmacology-class') {
    throw new Error(`Learning-route target must be a disease network or pharmacology class: ${targetId}`)
  }

  const route = traceUnifiedMechanismRoute(startId, targetId)
  if (!route) return null

  const steps = route.nodeIds.map((nodeId, index): BodyLearningRouteStep => {
    const node = getUnifiedMechanismNode(nodeId)
    return {
      index,
      nodeId,
      nodeKind: node.kind,
      label: node.label,
      objective: objectiveForNode(node),
      context: node.subtitle,
      transitionFromPrevious: index === 0 ? null : transitionLabel(route.edgeIds[index - 1]),
      referencePmids: evidencePmidsForNode(node),
    }
  })

  const biomedicalSteps = steps.filter((step) => biomedicalKinds.has(step.nodeKind))
  const evidenceAnchoredBiomedicalSteps = biomedicalSteps.filter((step) => step.referencePmids.length > 0)

  return {
    startAtlasSystemId,
    targetId,
    targetLabel: target.label,
    steps,
    biomedicalStepCount: biomedicalSteps.length,
    evidenceAnchoredBiomedicalStepCount: evidenceAnchoredBiomedicalSteps.length,
    evidenceCoverageFraction: biomedicalSteps.length === 0 ? 0 : evidenceAnchoredBiomedicalSteps.length / biomedicalSteps.length,
  }
}
