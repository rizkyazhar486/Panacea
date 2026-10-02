import type {
  BiologicalScale,
  VerticalBiologicalGraph,
  VerticalBiologicalNode,
} from './verticalBiologyGraph.ts'
import type {
  PhysiologicalSimulationResult,
  PhysiologicalValue,
} from '../physiology/runtime.ts'

export type VerticalProjectionPolicy = 'model-overlay-only'

export interface VerticalPhysiologyBinding {
  field: string
  nodeId: string
  expectedScales: readonly BiologicalScale[]
  expectedDomain: string
  projectionPolicy: VerticalProjectionPolicy
}

export interface VerticalProjectedPhysiologicalState {
  field: string
  nodeId: string
  nodeScale: BiologicalScale
  nodeTruthScope: VerticalBiologicalNode['truthScope']
  projectionKind: 'state-overlay'
  value: PhysiologicalValue
}

export const CARDIOVASCULAR_PHYSIOLOGY_BINDINGS: readonly VerticalPhysiologyBinding[] = [
  {
    field: 'cardio.lv.stroke_volume',
    nodeId: 'left-ventricle',
    expectedScales: ['substructure'],
    expectedDomain: 'cardiovascular',
    projectionPolicy: 'model-overlay-only',
  },
  {
    field: 'cardio.lv.ejection_fraction',
    nodeId: 'left-ventricle',
    expectedScales: ['substructure'],
    expectedDomain: 'cardiovascular',
    projectionPolicy: 'model-overlay-only',
  },
  {
    field: 'cardio.cardiac_output',
    nodeId: 'heart',
    expectedScales: ['organ'],
    expectedDomain: 'cardiovascular',
    projectionPolicy: 'model-overlay-only',
  },
  {
    field: 'arterial.oxygen_content',
    nodeId: 'cardiovascular-system',
    expectedScales: ['system'],
    expectedDomain: 'cardiovascular',
    projectionPolicy: 'model-overlay-only',
  },
  {
    field: 'systemic.oxygen_delivery',
    nodeId: 'human',
    expectedScales: ['person'],
    expectedDomain: 'whole-human',
    projectionPolicy: 'model-overlay-only',
  },
]

function nodeMap(graph: VerticalBiologicalGraph): Map<string, VerticalBiologicalNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]))
}

export function validateVerticalPhysiologyBindings(
  graph: VerticalBiologicalGraph,
  bindings: readonly VerticalPhysiologyBinding[],
): string[] {
  const errors: string[] = []
  const nodes = nodeMap(graph)
  const seen = new Set<string>()

  for (const binding of bindings) {
    const key = `${binding.field}::${binding.nodeId}`
    if (seen.has(key)) errors.push(`duplicate physiological vertical binding ${key}`)
    seen.add(key)

    if (!binding.field.trim()) errors.push('physiological binding field must not be empty')
    if (!binding.nodeId.trim()) errors.push(`binding ${binding.field}: nodeId must not be empty`)
    if (!binding.expectedScales.length) errors.push(`binding ${binding.field}: expectedScales must not be empty`)
    if (!binding.expectedDomain.trim()) errors.push(`binding ${binding.field}: expectedDomain must not be empty`)

    const node = nodes.get(binding.nodeId)
    if (!node) {
      errors.push(`binding ${binding.field}: missing node ${binding.nodeId}`)
      continue
    }

    if (!binding.expectedScales.includes(node.scale)) {
      errors.push(
        `binding ${binding.field}: scale mismatch for ${node.id} (${node.scale} not in ${binding.expectedScales.join(', ')})`,
      )
    }

    if (node.domain !== binding.expectedDomain) {
      errors.push(
        `binding ${binding.field}: domain mismatch for ${node.id} (${node.domain ?? 'unknown'} vs ${binding.expectedDomain})`,
      )
    }

    if (binding.projectionPolicy !== 'model-overlay-only') {
      errors.push(`binding ${binding.field}: unsupported projection policy ${String(binding.projectionPolicy)}`)
    }
  }

  return errors
}

function requireModelOverlayTruth(binding: VerticalPhysiologyBinding, value: PhysiologicalValue): void {
  if (binding.projectionPolicy === 'model-overlay-only' && value.truthClass !== 'model-derived' && value.truthClass !== 'simulated') {
    throw new Error(
      `model-overlay-only binding ${binding.field} rejected truth class ${value.truthClass}`,
    )
  }
}

export function projectPhysiologicalStateToVerticalGraph(
  graph: VerticalBiologicalGraph,
  result: PhysiologicalSimulationResult,
  bindings: readonly VerticalPhysiologyBinding[],
): readonly VerticalProjectedPhysiologicalState[] {
  const errors = validateVerticalPhysiologyBindings(graph, bindings)
  if (errors.length) throw new Error(`invalid vertical physiology bindings: ${errors.join('; ')}`)

  const nodes = nodeMap(graph)
  return bindings.map((binding) => {
    const value = result.latest[binding.field]
    if (!value) throw new Error(`no physiological value for bound field ${binding.field}`)
    requireModelOverlayTruth(binding, value)

    const node = nodes.get(binding.nodeId)
    if (!node) throw new Error(`missing vertical node ${binding.nodeId}`)

    return {
      field: binding.field,
      nodeId: node.id,
      nodeScale: node.scale,
      nodeTruthScope: node.truthScope,
      projectionKind: 'state-overlay' as const,
      value,
    }
  })
}
