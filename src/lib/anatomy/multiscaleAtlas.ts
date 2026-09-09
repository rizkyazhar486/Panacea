import type { AtlasManifest } from './atlasKernel'

export type MultiscaleLevel =
  | 'organism'
  | 'region'
  | 'system'
  | 'organ'
  | 'suborgan'
  | 'tissue'
  | 'microstructure'
  | 'cellular'
  | 'organelle'
  | 'molecular'

export type MultiscaleGeometryMode = 'source-mesh' | 'derived-overlay' | 'reference-only' | 'planned'
export type MultiscaleTransitionKind = 'contains' | 'zoom-into' | 'physiology-bridge' | 'histology-bridge' | 'cellular-bridge' | 'molecular-bridge'
export type MultiscaleRequirement = 'none' | 'source-geometry' | 'reference-content' | 'academic-review'

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
}

export interface PhysiologyEquationContract {
  id: string
  label: string
  equation: string
  variables: readonly PhysiologyVariable[]
  anchorAtlasNodeIds: readonly string[]
  educationalScope: string
  patientSpecific: false
  reference: MultiscaleReference
}

export interface MultiscaleAtlasNode {
  id: string
  label: string
  level: MultiscaleLevel
  anchorAtlasNodeIds: readonly string[]
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
  requirement: MultiscaleRequirement
}

export interface MultiscalePath {
  nodeIds: readonly string[]
  transitions: readonly MultiscaleTransition[]
  totalWeight: number
}

export interface MultiscaleValidationIssue {
  code:
    | 'duplicate-node'
    | 'missing-anchor'
    | 'missing-parent'
    | 'missing-transition-node'
    | 'invalid-transition-weight'
    | 'missing-equation'
    | 'cycle'
  nodeId?: string
  message: string
}

const OPENSTAX_RESPIRATORY: MultiscaleReference = {
  id: 'openstax-a-p-respiratory-2e',
  title: 'OpenStax Anatomy and Physiology 2e — Respiratory System',
  locator: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-introduction',
  revision: '2022-2e',
  scope: 'Educational respiratory anatomy and physiology terminology; not patient-specific guidance.',
}

const OPENSTAX_CARDIO: MultiscaleReference = {
  id: 'openstax-a-p-cardiovascular-2e',
  title: 'OpenStax Anatomy and Physiology 2e — Cardiovascular System',
  locator: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-introduction',
  revision: '2022-2e',
  scope: 'Educational cardiovascular physiology relationships; not a patient calculator.',
}

const ENGINEERING_REFERENCE: MultiscaleReference = {
  id: 'panacea-multiscale-engineering-contract',
  title: 'Panacea multiscale atlas engineering contract',
  locator: 'src/lib/anatomy/multiscaleAtlas.ts',
  revision: '2026-09-09-r1',
  scope: 'Engineering navigation semantics only; does not constitute academic anatomy review.',
}

/**
 * Symbolic educational equations. No equation consumes patient data or produces
 * diagnosis/treatment recommendations. Units are intentionally dimensional
 * rather than prescribing a clinical measurement convention.
 */
export const MULTISCALE_PHYSIOLOGY_EQUATIONS: readonly PhysiologyEquationContract[] = [
  {
    id: 'resp:alveolar-ventilation',
    label: 'Alveolar ventilation',
    equation: 'V̇_A = (V_T - V_D) × f',
    variables: [
      { symbol: 'V̇_A', label: 'alveolar ventilation', unit: 'volume/time' },
      { symbol: 'V_T', label: 'tidal volume', unit: 'volume' },
      { symbol: 'V_D', label: 'dead-space volume', unit: 'volume' },
      { symbol: 'f', label: 'respiratory frequency', unit: '1/time' },
    ],
    anchorAtlasNodeIds: ['resp:trachea', 'resp:lungs', 'resp:alveolus'],
    educationalScope: 'Visual bridge from conducting airway volume to effective alveolar ventilation.',
    patientSpecific: false,
    reference: OPENSTAX_RESPIRATORY,
  },
  {
    id: 'resp:gas-diffusion',
    label: 'Alveolar-capillary gas diffusion',
    equation: 'V̇_gas = D_L × ΔP',
    variables: [
      { symbol: 'V̇_gas', label: 'gas transfer rate', unit: 'volume/time' },
      { symbol: 'D_L', label: 'lung diffusing capacity', unit: 'volume/(time·pressure)' },
      { symbol: 'ΔP', label: 'partial-pressure gradient', unit: 'pressure' },
    ],
    anchorAtlasNodeIds: ['resp:alveolus', 'resp:alveolar-capillary-unit', 'resp:capillary-endothelium'],
    educationalScope: 'Symbolic gas-transfer bridge; not a DLCO or blood-gas calculator.',
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
    anchorAtlasNodeIds: ['resp:lungs', 'resp:pleura', 'resp:diaphragm'],
    educationalScope: 'Links lung/pleural mechanics to volume-pressure behavior.',
    patientSpecific: false,
    reference: OPENSTAX_RESPIRATORY,
  },
  {
    id: 'cv:pressure-flow',
    label: 'Pressure-flow relationship',
    equation: 'Q = ΔP / R',
    variables: [
      { symbol: 'Q', label: 'flow', unit: 'volume/time' },
      { symbol: 'ΔP', label: 'pressure difference', unit: 'pressure' },
      { symbol: 'R', label: 'vascular resistance', unit: 'pressure·time/volume' },
    ],
    anchorAtlasNodeIds: ['cv:heart', 'cv:aorta', 'cv:coronary'],
    educationalScope: 'Symbolic pressure-flow visualization; not patient hemodynamic inference.',
    patientSpecific: false,
    reference: OPENSTAX_CARDIO,
  },
  {
    id: 'cv:poiseuille-resistance',
    label: 'Idealized laminar tube resistance',
    equation: 'R = 8ηL / (πr⁴)',
    variables: [
      { symbol: 'R', label: 'hydraulic resistance', unit: 'pressure·time/volume' },
      { symbol: 'η', label: 'dynamic viscosity', unit: 'pressure·time' },
      { symbol: 'L', label: 'tube length', unit: 'length' },
      { symbol: 'r', label: 'tube radius', unit: 'length' },
    ],
    anchorAtlasNodeIds: ['cv:lad', 'cv:right-middle-cerebral-artery', 'cv:right-femoral-artery'],
    educationalScope: 'Idealized laminar-flow concept only; real vessels are compliant, pulsatile, branching structures.',
    patientSpecific: false,
    reference: OPENSTAX_CARDIO,
  },
]

export const MULTISCALE_ATLAS_NODES: readonly MultiscaleAtlasNode[] = [
  { id: 'scale:body', label: 'Whole human body', level: 'organism', anchorAtlasNodeIds: ['system:surface'], geometryMode: 'source-mesh', tags: ['whole-body'], reference: ENGINEERING_REFERENCE },
  { id: 'scale:thorax', label: 'Thorax', level: 'region', anchorAtlasNodeIds: ['region:thorax'], geometryMode: 'source-mesh', parentId: 'scale:body', tags: ['regional'], reference: ENGINEERING_REFERENCE },

  { id: 'scale:respiratory-system', label: 'Respiratory system', level: 'system', anchorAtlasNodeIds: ['system:respiratory'], geometryMode: 'source-mesh', parentId: 'scale:thorax', tags: ['respiratory'], equationIds: ['resp:alveolar-ventilation'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:lungs', label: 'Lungs', level: 'organ', anchorAtlasNodeIds: ['resp:lungs'], geometryMode: 'source-mesh', parentId: 'scale:respiratory-system', tags: ['respiratory', 'gas-exchange'], equationIds: ['resp:alveolar-ventilation', 'resp:compliance'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:segment', label: 'Bronchopulmonary segment', level: 'suborgan', anchorAtlasNodeIds: ['resp:segment:r-s10', 'resp:segment:l-s10'], geometryMode: 'source-mesh', parentId: 'scale:lungs', tags: ['segment', 'bronchoscopy'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:distal-airway', label: 'Distal conducting-to-respiratory airway', level: 'microstructure', anchorAtlasNodeIds: ['resp:terminal-bronchiole', 'resp:respiratory-bronchiole', 'resp:alveolar-duct'], geometryMode: 'reference-only', parentId: 'scale:segment', tags: ['distal-airway'], equationIds: ['resp:alveolar-ventilation'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:alveolus', label: 'Pulmonary alveolus', level: 'microstructure', anchorAtlasNodeIds: ['resp:alveolus'], geometryMode: 'reference-only', parentId: 'scale:distal-airway', tags: ['alveolus', 'gas-exchange'], equationIds: ['resp:gas-diffusion'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:alveolar-barrier', label: 'Alveolar-capillary barrier', level: 'tissue', anchorAtlasNodeIds: ['resp:alveolar-capillary-unit', 'resp:alveolar-epithelium', 'resp:capillary-endothelium'], geometryMode: 'reference-only', parentId: 'scale:alveolus', tags: ['histology', 'gas-exchange'], equationIds: ['resp:gas-diffusion'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:type-i-pneumocyte', label: 'Type I pneumocyte', level: 'cellular', anchorAtlasNodeIds: ['resp:type-i-pneumocyte'], geometryMode: 'reference-only', parentId: 'scale:alveolar-barrier', tags: ['cellular', 'gas-exchange'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:type-ii-pneumocyte', label: 'Type II pneumocyte', level: 'cellular', anchorAtlasNodeIds: ['resp:type-ii-pneumocyte', 'resp:surfactant-layer'], geometryMode: 'reference-only', parentId: 'scale:alveolar-barrier', tags: ['cellular', 'surfactant'], reference: OPENSTAX_RESPIRATORY },
  { id: 'scale:gas-molecule', label: 'Gas molecule / partial-pressure model', level: 'molecular', anchorAtlasNodeIds: ['resp:alveolus'], geometryMode: 'reference-only', parentId: 'scale:type-i-pneumocyte', tags: ['molecular', 'diffusion'], equationIds: ['resp:gas-diffusion'], reference: OPENSTAX_RESPIRATORY },

  { id: 'scale:cardiovascular-system', label: 'Cardiovascular system', level: 'system', anchorAtlasNodeIds: ['system:cardiovascular'], geometryMode: 'source-mesh', parentId: 'scale:thorax', tags: ['cardiovascular'], equationIds: ['cv:pressure-flow'], reference: OPENSTAX_CARDIO },
  { id: 'scale:heart', label: 'Heart', level: 'organ', anchorAtlasNodeIds: ['cv:heart'], geometryMode: 'source-mesh', parentId: 'scale:cardiovascular-system', tags: ['cardiac'], equationIds: ['cv:pressure-flow'], reference: OPENSTAX_CARDIO },
  { id: 'scale:left-ventricle', label: 'Left ventricle', level: 'suborgan', anchorAtlasNodeIds: ['cv:left-ventricle'], geometryMode: 'source-mesh', parentId: 'scale:heart', tags: ['cardiac-chamber'], equationIds: ['cv:pressure-flow'], reference: OPENSTAX_CARDIO },
  { id: 'scale:coronary-tree', label: 'Coronary arterial tree', level: 'suborgan', anchorAtlasNodeIds: ['cv:coronary', 'cv:lad', 'cv:lcx', 'cv:rca'], geometryMode: 'source-mesh', parentId: 'scale:heart', tags: ['coronary'], equationIds: ['cv:pressure-flow', 'cv:poiseuille-resistance'], reference: OPENSTAX_CARDIO },
  { id: 'scale:vascular-wall', label: 'Vascular wall reference layer', level: 'tissue', anchorAtlasNodeIds: ['cv:lad'], geometryMode: 'reference-only', parentId: 'scale:coronary-tree', tags: ['vascular-wall', 'histology'], equationIds: ['cv:poiseuille-resistance'], reference: OPENSTAX_CARDIO },
  { id: 'scale:endothelium', label: 'Endothelium reference layer', level: 'cellular', anchorAtlasNodeIds: ['cv:lad'], geometryMode: 'reference-only', parentId: 'scale:vascular-wall', tags: ['endothelium', 'cellular'], reference: OPENSTAX_CARDIO },

  { id: 'scale:nervous-system', label: 'Nervous system', level: 'system', anchorAtlasNodeIds: ['system:nervous'], geometryMode: 'source-mesh', parentId: 'scale:body', tags: ['nervous-system'], reference: ENGINEERING_REFERENCE },
  { id: 'scale:brain', label: 'Brain', level: 'organ', anchorAtlasNodeIds: ['neuro:brain'], geometryMode: 'source-mesh', parentId: 'scale:nervous-system', tags: ['brain'], reference: ENGINEERING_REFERENCE },
  { id: 'scale:cerebral-territory', label: 'Cerebral arterial territory reference', level: 'tissue', anchorAtlasNodeIds: ['neuro:territory:right-mca-lateral-frontal', 'cv:right-middle-cerebral-artery'], geometryMode: 'reference-only', parentId: 'scale:brain', tags: ['neurovascular', 'territory'], reference: ENGINEERING_REFERENCE },
]

export const MULTISCALE_TRANSITIONS: readonly MultiscaleTransition[] = [
  { from: 'scale:body', to: 'scale:thorax', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:thorax', to: 'scale:respiratory-system', kind: 'contains', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:respiratory-system', to: 'scale:lungs', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:lungs', to: 'scale:segment', kind: 'zoom-into', weight: 0.7, requirement: 'source-geometry' },
  { from: 'scale:segment', to: 'scale:distal-airway', kind: 'zoom-into', weight: 1.1, requirement: 'reference-content' },
  { from: 'scale:distal-airway', to: 'scale:alveolus', kind: 'zoom-into', weight: 1.1, requirement: 'reference-content' },
  { from: 'scale:alveolus', to: 'scale:alveolar-barrier', kind: 'histology-bridge', weight: 1.3, requirement: 'academic-review' },
  { from: 'scale:alveolar-barrier', to: 'scale:type-i-pneumocyte', kind: 'cellular-bridge', weight: 1.4, requirement: 'academic-review' },
  { from: 'scale:alveolar-barrier', to: 'scale:type-ii-pneumocyte', kind: 'cellular-bridge', weight: 1.4, requirement: 'academic-review' },
  { from: 'scale:type-i-pneumocyte', to: 'scale:gas-molecule', kind: 'molecular-bridge', weight: 1.8, requirement: 'academic-review' },

  { from: 'scale:thorax', to: 'scale:cardiovascular-system', kind: 'contains', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:cardiovascular-system', to: 'scale:heart', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:heart', to: 'scale:left-ventricle', kind: 'zoom-into', weight: 0.6, requirement: 'source-geometry' },
  { from: 'scale:heart', to: 'scale:coronary-tree', kind: 'zoom-into', weight: 0.6, requirement: 'source-geometry' },
  { from: 'scale:coronary-tree', to: 'scale:vascular-wall', kind: 'histology-bridge', weight: 1.2, requirement: 'academic-review' },
  { from: 'scale:vascular-wall', to: 'scale:endothelium', kind: 'cellular-bridge', weight: 1.3, requirement: 'academic-review' },

  { from: 'scale:body', to: 'scale:nervous-system', kind: 'contains', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:nervous-system', to: 'scale:brain', kind: 'zoom-into', weight: 0.5, requirement: 'source-geometry' },
  { from: 'scale:brain', to: 'scale:cerebral-territory', kind: 'physiology-bridge', weight: 1.1, requirement: 'academic-review' },
  { from: 'scale:lungs', to: 'scale:cardiovascular-system', kind: 'physiology-bridge', weight: 1, requirement: 'reference-content' },
]

export function validateMultiscaleAtlas(manifest: AtlasManifest): readonly MultiscaleValidationIssue[] {
  const issues: MultiscaleValidationIssue[] = []
  const atlasIds = new Set(manifest.nodes.map((node) => node.id))
  const nodeById = new Map<string, MultiscaleAtlasNode>()
  const equationIds = new Set(MULTISCALE_PHYSIOLOGY_EQUATIONS.map((equation) => equation.id))

  for (const node of MULTISCALE_ATLAS_NODES) {
    if (nodeById.has(node.id)) issues.push({ code: 'duplicate-node', nodeId: node.id, message: `Duplicate multiscale node ${node.id}.` })
    nodeById.set(node.id, node)
    for (const anchorId of node.anchorAtlasNodeIds) {
      if (!atlasIds.has(anchorId)) issues.push({ code: 'missing-anchor', nodeId: node.id, message: `${node.id} references missing atlas anchor ${anchorId}.` })
    }
    if (node.parentId && !MULTISCALE_ATLAS_NODES.some((candidate) => candidate.id === node.parentId)) {
      issues.push({ code: 'missing-parent', nodeId: node.id, message: `${node.id} references missing multiscale parent ${node.parentId}.` })
    }
    for (const equationId of node.equationIds ?? []) {
      if (!equationIds.has(equationId)) issues.push({ code: 'missing-equation', nodeId: node.id, message: `${node.id} references missing physiology equation ${equationId}.` })
    }
  }

  for (const equation of MULTISCALE_PHYSIOLOGY_EQUATIONS) {
    for (const anchorId of equation.anchorAtlasNodeIds) {
      if (!atlasIds.has(anchorId)) issues.push({ code: 'missing-anchor', message: `${equation.id} references missing atlas anchor ${anchorId}.` })
    }
  }

  for (const transition of MULTISCALE_TRANSITIONS) {
    if (!nodeById.has(transition.from) || !nodeById.has(transition.to)) {
      issues.push({ code: 'missing-transition-node', message: `Transition ${transition.from} -> ${transition.to} references a missing multiscale node.` })
    }
    if (!(transition.weight > 0) || !Number.isFinite(transition.weight)) {
      issues.push({ code: 'invalid-transition-weight', message: `Transition ${transition.from} -> ${transition.to} has invalid weight ${transition.weight}.` })
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

export function traceMultiscalePath(
  fromId: string,
  toId: string,
  allowedRequirements?: readonly MultiscaleRequirement[],
): MultiscalePath | null {
  if (fromId === toId) return { nodeIds: [fromId], transitions: [], totalWeight: 0 }
  const nodeIds = new Set(MULTISCALE_ATLAS_NODES.map((node) => node.id))
  if (!nodeIds.has(fromId) || !nodeIds.has(toId)) return null

  const outgoing = new Map<string, MultiscaleTransition[]>()
  for (const transition of MULTISCALE_TRANSITIONS) {
    if (allowedRequirements?.length && !allowedRequirements.includes(transition.requirement)) continue
    const list = outgoing.get(transition.from) ?? []
    list.push(transition)
    outgoing.set(transition.from, list)
  }

  const distance = new Map<string, number>([[fromId, 0]])
  const previous = new Map<string, MultiscaleTransition>()
  const unvisited = new Set(nodeIds)

  while (unvisited.size) {
    let current: string | undefined
    let best = Number.POSITIVE_INFINITY
    for (const id of unvisited) {
      const candidate = distance.get(id) ?? Number.POSITIVE_INFINITY
      if (candidate < best || (candidate === best && current !== undefined && id < current)) {
        current = id
        best = candidate
      }
    }
    if (!current || !Number.isFinite(best)) break
    unvisited.delete(current)
    if (current === toId) break

    for (const transition of outgoing.get(current) ?? []) {
      if (!unvisited.has(transition.to)) continue
      const next = best + transition.weight
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
