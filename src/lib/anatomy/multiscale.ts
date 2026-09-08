import type { AnatomyStructure } from './types'

export type MultiscaleLevel =
  | 'organism'
  | 'region'
  | 'system'
  | 'organ'
  | 'suborgan'
  | 'tissue'
  | 'microstructure'
  | 'cellular'
  | 'molecular'

export type MultiscaleGeometryMode = 'source-mesh' | 'derived-overlay' | 'reference-only' | 'planned'
export type MultiscaleTransitionKind = 'contains' | 'zoom-into' | 'physiology-bridge' | 'histology-bridge' | 'molecular-bridge'

export interface MultiscaleReference {
  id: string
  title: string
  locator: string
  revision: string
  scope: string
}

export interface PhysiologyVariable {
  symbol: string
  label: string
  unit: string
  domain?: readonly [number, number]
}

export interface PhysiologyEquationContract {
  id: string
  label: string
  equation: string
  variables: readonly PhysiologyVariable[]
  anchorStructureIds: readonly string[]
  educationalScope: string
  patientSpecific: false
  reference: MultiscaleReference
}

export interface MultiscaleAtlasNode {
  id: string
  label: string
  level: MultiscaleLevel
  anchorStructureIds: readonly string[]
  geometryMode: MultiscaleGeometryMode
  parentId?: string
  tags: readonly string[]
  equationIds?: readonly string[]
  reference: MultiscaleReference
}

export interface MultiscaleTransition {
  from: string
  to: string
  kind: MultiscaleTransitionKind
  weight: number
  requirement: 'none' | 'source-geometry' | 'reference-content' | 'academic-review'
}

export interface MultiscalePath {
  nodeIds: readonly string[]
  transitions: readonly MultiscaleTransition[]
  totalWeight: number
}

const OPENSTAX_RESPIRATORY: MultiscaleReference = {
  id: 'openstax-a-p-respiratory',
  title: 'OpenStax Anatomy and Physiology 2e — The Respiratory System',
  locator: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-introduction',
  revision: '2022-2e',
  scope: 'Educational respiratory anatomy and physiology terminology; not patient-specific guidance.',
}

const OPENSTAX_CARDIO: MultiscaleReference = {
  id: 'openstax-a-p-cardiovascular',
  title: 'OpenStax Anatomy and Physiology 2e — The Cardiovascular System',
  locator: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-introduction',
  revision: '2022-2e',
  scope: 'Educational cardiovascular physiology terminology and relationships.',
}

const ENGINEERING_REFERENCE: MultiscaleReference = {
  id: 'panacea-multiscale-contract',
  title: 'Panacea multiscale rendering contract',
  locator: 'src/lib/anatomy/multiscale.ts',
  revision: '2026-09-09-r1',
  scope: 'Engineering-only transition semantics. Does not constitute academic anatomy review.',
}

/**
 * Symbolic physiology contracts used to bind animation/visual explanation to
 * anatomy nodes. They deliberately do not calculate diagnoses or treatment.
 */
export const PHYSIOLOGY_EQUATIONS: readonly PhysiologyEquationContract[] = [
  {
    id: 'resp:alveolar-ventilation',
    label: 'Alveolar ventilation',
    equation: 'V_A = (V_T - V_D) × f',
    variables: [
      { symbol: 'V_A', label: 'alveolar ventilation', unit: 'volume/time' },
      { symbol: 'V_T', label: 'tidal volume', unit: 'volume' },
      { symbol: 'V_D', label: 'physiologic dead-space volume', unit: 'volume' },
      { symbol: 'f', label: 'respiratory frequency', unit: '1/time' },
    ],
    anchorStructureIds: ['trachea', 'right-lung', 'left-lung', 'alveolus'],
    educationalScope: 'Links conducting-zone volume and respiratory frequency to effective alveolar ventilation.',
    patientSpecific: false,
    reference: OPENSTAX_RESPIRATORY,
  },
  {
    id: 'resp:diffusion-capacity',
    label: 'Gas transfer across the alveolar-capillary interface',
    equation: 'V̇_gas = D_L × ΔP',
    variables: [
      { symbol: 'V̇_gas', label: 'gas transfer rate', unit: 'volume/time' },
      { symbol: 'D_L', label: 'lung diffusing capacity', unit: 'volume/(time·pressure)' },
      { symbol: 'ΔP', label: 'partial-pressure gradient', unit: 'pressure' },
    ],
    anchorStructureIds: ['alveolus', 'right-lung', 'left-lung', 'pulmonary-artery', 'pulmonary-veins'],
    educationalScope: 'Symbolic bridge between alveolar microstructure and gas transfer; not a patient DLCO calculator.',
    patientSpecific: false,
    reference: OPENSTAX_RESPIRATORY,
  },
  {
    id: 'resp:compliance',
    label: 'Respiratory compliance',
    equation: 'C = ΔV / ΔP',
    variables: [
      { symbol: 'C', label: 'compliance', unit: 'volume/pressure' },
      { symbol: 'ΔV', label: 'change in volume', unit: 'volume' },
      { symbol: 'ΔP', label: 'change in distending pressure', unit: 'pressure' },
    ],
    anchorStructureIds: ['right-lung', 'left-lung', 'pleura', 'diaphragm'],
    educationalScope: 'Connects lung/pleural mechanics to volume-pressure behavior.',
    patientSpecific: false,
    reference: OPENSTAX_RESPIRATORY,
  },
  {
    id: 'cv:flow-resistance',
    label: 'Pressure-flow relationship',
    equation: 'Q = ΔP / R',
    variables: [
      { symbol: 'Q', label: 'flow', unit: 'volume/time' },
      { symbol: 'ΔP', label: 'pressure difference', unit: 'pressure' },
      { symbol: 'R', label: 'vascular resistance', unit: 'pressure·time/volume' },
    ],
    anchorStructureIds: ['heart', 'ascending-aorta', 'abdominal-aorta', 'pulmonary-artery'],
    educationalScope: 'Links pressure gradients and vascular resistance to flow for animation/teaching.',
    patientSpecific: false,
    reference: OPENSTAX_CARDIO,
  },
]

export const MULTISCALE_ATLAS_NODES: readonly MultiscaleAtlasNode[] = [
  { id: 'scale:body', label: 'Whole human body', level: 'organism', anchorStructureIds: ['body'], geometryMode: 'source-mesh', tags: ['whole-body'], reference: ENGINEERING_REFERENCE },
  { id: 'scale:thorax', label: 'Thorax region', level: 'region', anchorStructureIds: ['thorax-region'], geometryMode: 'source-mesh', parentId: 'scale:body', tags: ['regional'], reference: ENGINEERING_REFERENCE },
  { id: 'scale:respiratory-system', label: 'Respiratory system', level: 'system', anchorStructureIds: ['respiratory-system'], geometryMode: 'source-mesh', parentId: 'scale:thorax', tags: ['respiratory'], equationIds: ['resp:alveolar-ventilation'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:lung', label: 'Lungs', level: 'organ', anchorStructureIds: ['right-lung', 'left-lung'], geometryMode: 'source-mesh', parentId: 'scale:respiratory-system', tags: ['respiratory', 'gas-exchange'], equationIds: ['resp:alveolar-ventilation', 'resp:compliance'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:bronchopulmonary-segment', label: 'Bronchopulmonary segment', level: 'suborgan', anchorStructureIds: ['rll-posterior-basal-segment', 'lll-posterior-basal-segment'], geometryMode: 'source-mesh', parentId: 'scale:lung', tags: ['segment', 'bronchoscopy'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:alveolus', label: 'Pulmonary alveolus', level: 'microstructure', anchorStructureIds: ['alveolus'], geometryMode: 'reference-only', parentId: 'scale:bronchopulmonary-segment', tags: ['gas-exchange', 'microanatomy'], equationIds: ['resp:diffusion-capacity'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:alveolar-barrier', label: 'Alveolar-capillary barrier', level: 'tissue', anchorStructureIds: ['alveolus'], geometryMode: 'reference-only', parentId: 'scale:alveolus', tags: ['histology', 'gas-exchange'], equationIds: ['resp:diffusion-capacity'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:type-i-pneumocyte', label: 'Type I pneumocyte', level: 'cellular', anchorStructureIds: ['alveolus'], geometryMode: 'reference-only', parentId: 'scale:alveolar-barrier', tags: ['cellular', 'gas-exchange'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:gas-molecule', label: 'Gas molecule / partial-pressure model', level: 'molecular', anchorStructureIds: ['alveolus'], geometryMode: 'reference-only', parentId: 'scale:type-i-pneumocyte', tags: ['molecular', 'diffusion'], equationIds: ['resp:diffusion-capacity'], reference: OPENSTAX_RESPIRATORY },

  { id: 'scale:cardiovascular-system', label: 'Cardiovascular system', level: 'system', anchorStructureIds: ['heart', 'ascending-aorta', 'pulmonary-artery'], geometryMode: 'source-mesh', parentId: 'scale:thorax', tags: ['cardiovascular'], equationIds: ['cv:flow-resistance'], reference: OPENSTAX_CARDIO },
  { id: 'scale:heart', label: 'Heart', level: 'organ', anchorStructureIds: ['heart'], geometryMode: 'source-mesh', parentId: 'scale:cardiovascular-system', tags: ['cardiac'], equationIds: ['cv:flow-resistance'], reference: OPENSTAX_CARDIO },
  { id: 'scale:vascular-tree', label: 'Vascular tree', level: 'suborgan', anchorStructureIds: ['ascending-aorta', 'abdominal-aorta', 'pulmonary-artery'], geometryMode: 'source-mesh', parentId: 'scale:cardiovascular-system', tags: ['vascular'], equationIds: ['cv:flow-resistance'], reference: OPENSTAX_CARDIO },
]

export const MULTISCALE_TRANSITIONS: readonly MultiscaleTransition[] = [
  { from: 'scale:body', to: 'scale:thorax', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:thorax', to: 'scale:respiratory-system', kind: 'contains', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:respiratory-system', to: 'scale:lung', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:lung', to: 'scale:bronchopulmonary-segment', kind: 'zoom-into', weight: 0.7, requirement: 'source-geometry' },
  { from: 'scale:bronchopulmonary-segment', to: 'scale:alveolus', kind: 'zoom-into', weight: 1.2, requirement: 'reference-content' },
  { from: 'scale:alveolus', to: 'scale:alveolar-barrier', kind: 'histology-bridge', weight: 1.3, requirement: 'academic-review' },
  { from: 'scale:alveolar-barrier', to: 'scale:type-i-pneumocyte', kind: 'zoom-into', weight: 1.4, requirement: 'academic-review' },
  { from: 'scale:type-i-pneumocyte', to: 'scale:gas-molecule', kind: 'molecular-bridge', weight: 1.8, requirement: 'academic-review' },
  { from: 'scale:lung', to: 'scale:cardiovascular-system', kind: 'physiology-bridge', weight: 1, requirement: 'reference-content' },
  { from: 'scale:thorax', to: 'scale:cardiovascular-system', kind: 'contains', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:cardiovascular-system', to: 'scale:heart', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:cardiovascular-system', to: 'scale:vascular-tree', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
]

export interface MultiscaleValidationIssue {
  code: 'duplicate-node' | 'missing-anchor' | 'missing-parent' | 'missing-transition-node' | 'missing-equation' | 'cycle'
  message: string
  nodeId?: string
}

export function validateMultiscaleAtlas(structures: readonly AnatomyStructure[]): readonly MultiscaleValidationIssue[] {
  const issues: MultiscaleValidationIssue[] = []
  const structureIds = new Set(structures.map((structure) => structure.id))
  const nodeById = new Map<string, MultiscaleAtlasNode>()
  const equationIds = new Set(PHYSIOLOGY_EQUATIONS.map((equation) => equation.id))

  for (const node of MULTISCALE_ATLAS_NODES) {
    if (nodeById.has(node.id)) issues.push({ code: 'duplicate-node', nodeId: node.id, message: `Duplicate multiscale node ${node.id}.` })
    nodeById.set(node.id, node)
    for (const anchorId of node.anchorStructureIds) {
      if (!structureIds.has(anchorId)) issues.push({ code: 'missing-anchor', nodeId: node.id, message: `${node.id} references missing anatomy anchor ${anchorId}.` })
    }
    if (node.parentId && !MULTISCALE_ATLAS_NODES.some((candidate) => candidate.id === node.parentId)) {
      issues.push({ code: 'missing-parent', nodeId: node.id, message: `${node.id} references missing multiscale parent ${node.parentId}.` })
    }
    for (const equationId of node.equationIds ?? []) {
      if (!equationIds.has(equationId)) issues.push({ code: 'missing-equation', nodeId: node.id, message: `${node.id} references missing physiology equation ${equationId}.` })
    }
  }

  for (const transition of MULTISCALE_TRANSITIONS) {
    if (!nodeById.has(transition.from) || !nodeById.has(transition.to)) {
      issues.push({ code: 'missing-transition-node', message: `Transition ${transition.from} -> ${transition.to} references a missing multiscale node.` })
    }
  }

  for (const node of MULTISCALE_ATLAS_NODES) {
    const seen = new Set([node.id])
    let cursor = node
    while (cursor.parentId) {
      if (seen.has(cursor.parentId)) {
        issues.push({ code: 'cycle', nodeId: node.id, message: `Multiscale parent cycle detected at ${cursor.parentId}.` })
        break
      }
      seen.add(cursor.parentId)
      const parent = nodeById.get(cursor.parentId)
      if (!parent) break
      cursor = parent
    }
  }

  return issues
}

export function traceMultiscalePath(fromId: string, toId: string): MultiscalePath | null {
  if (fromId === toId) return { nodeIds: [fromId], transitions: [], totalWeight: 0 }
  const nodeIds = new Set(MULTISCALE_ATLAS_NODES.map((node) => node.id))
  if (!nodeIds.has(fromId) || !nodeIds.has(toId)) return null

  const outgoing = new Map<string, MultiscaleTransition[]>()
  for (const transition of MULTISCALE_TRANSITIONS) {
    const list = outgoing.get(transition.from) ?? []
    list.push(transition)
    outgoing.set(transition.from, list)
  }

  const distance = new Map<string, number>([[fromId, 0]])
  const previous = new Map<string, MultiscaleTransition>()
  const unvisited = new Set(nodeIds)

  while (unvisited.size) {
    let current: string | undefined
    let currentDistance = Number.POSITIVE_INFINITY
    for (const candidate of unvisited) {
      const value = distance.get(candidate) ?? Number.POSITIVE_INFINITY
      if (value < currentDistance || (value === currentDistance && current && candidate < current)) {
        current = candidate
        currentDistance = value
      }
    }
    if (!current || !Number.isFinite(currentDistance)) break
    unvisited.delete(current)
    if (current === toId) break

    for (const transition of outgoing.get(current) ?? []) {
      if (!unvisited.has(transition.to)) continue
      const next = currentDistance + transition.weight
      if (next < (distance.get(transition.to) ?? Number.POSITIVE_INFINITY)) {
        distance.set(transition.to, next)
        previous.set(transition.to, transition)
      }
    }
  }

  if (!previous.has(toId)) return null
  const reversed: MultiscaleTransition[] = []
  let cursor = toId
  while (cursor !== fromId) {
    const transition = previous.get(cursor)
    if (!transition) return null
    reversed.push(transition)
    cursor = transition.from
  }
  const transitions = reversed.reverse()
  return {
    nodeIds: [fromId, ...transitions.map((transition) => transition.to)],
    transitions,
    totalWeight: transitions.reduce((sum, transition) => sum + transition.weight, 0),
  }
}

export function equationsForStructure(structureId: string) {
  return PHYSIOLOGY_EQUATIONS.filter((equation) => equation.anchorStructureIds.includes(structureId))
}
