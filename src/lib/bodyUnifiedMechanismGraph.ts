import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from './bodySystemSourceWave'
import { BODY_SYSTEM_PHYSIOLOGY_BRIDGE } from './bodySystemPhysiologyBridge'
import { WHOLE_BODY_PHYSIOLOGY_SYSTEMS, type WholeBodySystemId } from './wholeBodyPhysiologyOS'
import { BODY_PATHOPHYSIOLOGY_NETWORK, type BodyPathophysiologyScenarioId } from './bodyPathophysiologyNetwork'
import { BODY_PHARMACOLOGY_MECHANISM_NETWORK, type PharmacologyMechanismId } from './bodyPharmacologyMechanismNetwork'
import { BODY_MECHANISM_CAUSAL_BRIDGE } from './bodyMechanismCausalBridge'

export type UnifiedMechanismNodeKind =
  | 'atlas-system'
  | 'physiology-system'
  | 'pathophysiology-scenario'
  | 'pathophysiology-step'
  | 'pharmacology-class'
  | 'pharmacology-step'

export type UnifiedMechanismEdgeKind =
  | 'maps-to'
  | 'couples-to'
  | 'participates-in'
  | 'contains'
  | 'progresses-to'
  | 'acts-through'
  | 'mechanistically-intersects'

export interface UnifiedMechanismGraphNode {
  id: string
  kind: UnifiedMechanismNodeKind
  label: string
  subtitle: string
  domainId: string
}

export interface UnifiedMechanismGraphEdge {
  id: string
  from: string
  to: string
  kind: UnifiedMechanismEdgeKind
  label: string
  note: string
}

export interface UnifiedMechanismGraph {
  nodes: readonly UnifiedMechanismGraphNode[]
  edges: readonly UnifiedMechanismGraphEdge[]
}

export interface UnifiedMechanismNeighborhood {
  seed: UnifiedMechanismGraphNode
  nodes: readonly UnifiedMechanismGraphNode[]
  edges: readonly UnifiedMechanismGraphEdge[]
}

export interface UnifiedMechanismRoute {
  nodeIds: readonly string[]
  edgeIds: readonly string[]
}

const atlasNodeId = (id: BodySystemId) => `atlas:${id}`
const physiologyNodeId = (id: WholeBodySystemId) => `physiology:${id}`
const scenarioNodeId = (id: BodyPathophysiologyScenarioId) => `pathophysiology:${id}`
const scenarioStepNodeId = (scenarioId: BodyPathophysiologyScenarioId, stepId: string) => `pathophysiology-step:${scenarioId}:${stepId}`
const pharmacologyNodeId = (id: PharmacologyMechanismId) => `pharmacology:${id}`
const pharmacologyStepNodeId = (mechanismId: PharmacologyMechanismId, stepId: string) => `pharmacology-step:${mechanismId}:${stepId}`

function pushUniqueNode(target: UnifiedMechanismGraphNode[], node: UnifiedMechanismGraphNode) {
  if (!target.some((candidate) => candidate.id === node.id)) target.push(node)
}

function pushUniqueEdge(target: UnifiedMechanismGraphEdge[], edge: UnifiedMechanismGraphEdge) {
  if (!target.some((candidate) => candidate.id === edge.id)) target.push(edge)
}

function compileUnifiedMechanismGraph(): UnifiedMechanismGraph {
  const nodes: UnifiedMechanismGraphNode[] = []
  const edges: UnifiedMechanismGraphEdge[] = []

  for (const system of BODY_SYSTEM_SOURCE_WAVE) {
    pushUniqueNode(nodes, {
      id: atlasNodeId(system.id),
      kind: 'atlas-system',
      label: system.label,
      subtitle: `${system.targets.length} source-backed anatomical anchors`,
      domainId: system.id,
    })
  }

  for (const system of WHOLE_BODY_PHYSIOLOGY_SYSTEMS) {
    pushUniqueNode(nodes, {
      id: physiologyNodeId(system.id),
      kind: 'physiology-system',
      label: system.shortLabel,
      subtitle: system.primaryRole,
      domainId: system.id,
    })

    for (const targetId of system.couplingTargets) {
      pushUniqueEdge(edges, {
        id: `physiology-coupling:${system.id}:${targetId}`,
        from: physiologyNodeId(system.id),
        to: physiologyNodeId(targetId),
        kind: 'couples-to',
        label: 'whole-body coupling',
        note: 'Directional navigation edge copied from the curated physiology coupling model; it is not a coupling coefficient or causal-effect estimate.',
      })
    }
  }

  for (const bridge of BODY_SYSTEM_PHYSIOLOGY_BRIDGE) {
    for (const physiologyId of bridge.physiologySystemIds) {
      pushUniqueEdge(edges, {
        id: `atlas-physiology:${bridge.atlasSystemId}:${physiologyId}`,
        from: atlasNodeId(bridge.atlasSystemId),
        to: physiologyNodeId(physiologyId),
        kind: 'maps-to',
        label: `${bridge.fidelity} atlas → physiology`,
        note: bridge.rationale,
      })
    }
  }

  for (const scenario of BODY_PATHOPHYSIOLOGY_NETWORK) {
    pushUniqueNode(nodes, {
      id: scenarioNodeId(scenario.id),
      kind: 'pathophysiology-scenario',
      label: scenario.shortLabel,
      subtitle: scenario.summary,
      domainId: scenario.id,
    })

    for (const physiologyId of scenario.physiologySystemIds) {
      pushUniqueEdge(edges, {
        id: `physiology-scenario:${physiologyId}:${scenario.id}`,
        from: physiologyNodeId(physiologyId),
        to: scenarioNodeId(scenario.id),
        kind: 'participates-in',
        label: 'system participates in disease network',
        note: 'Scenario-level participation is inherited from the curated pathophysiology model and does not establish patient diagnosis, severity or etiology.',
      })
    }

    scenario.cascade.forEach((step, index) => {
      const stepNode = scenarioStepNodeId(scenario.id, step.id)
      pushUniqueNode(nodes, {
        id: stepNode,
        kind: 'pathophysiology-step',
        label: step.label,
        subtitle: step.mechanism,
        domainId: scenario.id,
      })

      if (index === 0) {
        pushUniqueEdge(edges, {
          id: `scenario-entry:${scenario.id}:${step.id}`,
          from: scenarioNodeId(scenario.id),
          to: stepNode,
          kind: 'contains',
          label: 'cascade entry',
          note: 'Structural graph edge into the curated mechanistic teaching cascade.',
        })
      } else {
        const previous = scenario.cascade[index - 1]
        pushUniqueEdge(edges, {
          id: `scenario-progression:${scenario.id}:${previous.id}:${step.id}`,
          from: scenarioStepNodeId(scenario.id, previous.id),
          to: stepNode,
          kind: 'progresses-to',
          label: `${previous.kind} → ${step.kind}`,
          note: 'Teaching sequence from the curated disease cascade; clinical disease can be nonlinear, heterogeneous and patient-specific.',
        })
      }
    })
  }

  for (const mechanism of BODY_PHARMACOLOGY_MECHANISM_NETWORK) {
    pushUniqueNode(nodes, {
      id: pharmacologyNodeId(mechanism.id),
      kind: 'pharmacology-class',
      label: mechanism.classLabel,
      subtitle: mechanism.targetLabel,
      domainId: mechanism.id,
    })

    mechanism.mechanismChain.forEach((step, index) => {
      const stepNode = pharmacologyStepNodeId(mechanism.id, step.id)
      pushUniqueNode(nodes, {
        id: stepNode,
        kind: 'pharmacology-step',
        label: step.label,
        subtitle: step.mechanism,
        domainId: mechanism.id,
      })

      if (index === 0) {
        pushUniqueEdge(edges, {
          id: `pharmacology-entry:${mechanism.id}:${step.id}`,
          from: pharmacologyNodeId(mechanism.id),
          to: stepNode,
          kind: 'acts-through',
          label: 'class → primary target mechanism',
          note: 'Class-level teaching edge. It does not encode dose, affinity, exposure, efficacy, contraindications or an individual response.',
        })
      } else {
        const previous = mechanism.mechanismChain[index - 1]
        pushUniqueEdge(edges, {
          id: `pharmacology-progression:${mechanism.id}:${previous.id}:${step.id}`,
          from: pharmacologyStepNodeId(mechanism.id, previous.id),
          to: stepNode,
          kind: 'progresses-to',
          label: `${previous.layer} → ${step.layer}`,
          note: 'Curated scale transition from target biology toward systems context; it is qualitative rather than a quantitative pharmacodynamic model.',
        })
      }
    })
  }

  for (const link of BODY_MECHANISM_CAUSAL_BRIDGE) {
    for (const stepId of link.scenarioStepIds) {
      pushUniqueEdge(edges, {
        id: `causal-intersection:${link.id}:${stepId}`,
        from: scenarioStepNodeId(link.scenarioId, stepId),
        to: pharmacologyNodeId(link.pharmacologyMechanismId),
        kind: 'mechanistically-intersects',
        label: link.relation,
        note: `${link.explanation} ${link.doesNotImply}`,
      })
    }
  }

  return { nodes, edges }
}

export const BODY_UNIFIED_MECHANISM_GRAPH = compileUnifiedMechanismGraph()

export const BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY =
  'Educational graph-navigation layer only. A graph path means that curated atlas, physiology, pathophysiology and pharmacology relationships can be traversed in sequence; path length, degree, adjacency and shortest-path results are interface/navigation properties, not diagnostic probability, causal-effect magnitude, treatment priority, comparative efficacy, dose-response, risk score or patient-specific clinical inference.'

export function getUnifiedMechanismNode(id: string): UnifiedMechanismGraphNode {
  const node = BODY_UNIFIED_MECHANISM_GRAPH.nodes.find((candidate) => candidate.id === id)
  if (!node) throw new Error(`Unknown unified mechanism graph node: ${id}`)
  return node
}

export function listUnifiedMechanismNodesByKind(kind: UnifiedMechanismNodeKind): readonly UnifiedMechanismGraphNode[] {
  return BODY_UNIFIED_MECHANISM_GRAPH.nodes.filter((node) => node.kind === kind)
}

export function getUnifiedMechanismNeighborhood(seedId: string, depth = 1): UnifiedMechanismNeighborhood {
  const safeDepth = Math.max(0, Math.min(3, Math.floor(depth)))
  const seed = getUnifiedMechanismNode(seedId)
  const visited = new Set<string>([seedId])
  let frontier = new Set<string>([seedId])

  for (let level = 0; level < safeDepth; level += 1) {
    const next = new Set<string>()
    for (const edge of BODY_UNIFIED_MECHANISM_GRAPH.edges) {
      if (frontier.has(edge.from) && !visited.has(edge.to)) next.add(edge.to)
      if (frontier.has(edge.to) && !visited.has(edge.from)) next.add(edge.from)
    }
    for (const id of next) visited.add(id)
    frontier = next
    if (frontier.size === 0) break
  }

  const nodes = BODY_UNIFIED_MECHANISM_GRAPH.nodes.filter((node) => visited.has(node.id))
  const edges = BODY_UNIFIED_MECHANISM_GRAPH.edges.filter((edge) => visited.has(edge.from) && visited.has(edge.to))
  return { seed, nodes, edges }
}

export function traceUnifiedMechanismRoute(fromId: string, toId: string): UnifiedMechanismRoute | null {
  getUnifiedMechanismNode(fromId)
  getUnifiedMechanismNode(toId)
  if (fromId === toId) return { nodeIds: [fromId], edgeIds: [] }

  const queue: string[] = [fromId]
  const previousNode = new Map<string, string>()
  const previousEdge = new Map<string, string>()
  const visited = new Set<string>([fromId])

  while (queue.length > 0) {
    const current = queue.shift()!
    const adjacent = BODY_UNIFIED_MECHANISM_GRAPH.edges
      .filter((edge) => edge.from === current || edge.to === current)
      .map((edge) => ({ edge, next: edge.from === current ? edge.to : edge.from }))

    for (const { edge, next } of adjacent) {
      if (visited.has(next)) continue
      visited.add(next)
      previousNode.set(next, current)
      previousEdge.set(next, edge.id)
      if (next === toId) {
        const nodeIds = [toId]
        const edgeIds: string[] = []
        let cursor = toId
        while (cursor !== fromId) {
          const parent = previousNode.get(cursor)
          const edgeId = previousEdge.get(cursor)
          if (!parent || !edgeId) return null
          edgeIds.unshift(edgeId)
          nodeIds.unshift(parent)
          cursor = parent
        }
        return { nodeIds, edgeIds }
      }
      queue.push(next)
    }
  }

  return null
}

export function atlasSystemGraphNodeId(systemId: BodySystemId): string {
  return atlasNodeId(systemId)
}
