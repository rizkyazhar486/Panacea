import {
  BODY_ATLAS_GRAPH,
  type BodyAtlasGraph,
  type BodyAtlasLayer,
  type BodyAtlasNode,
  normalizeAtlasTerm,
} from './bodyAtlasGraph'

export type RespiratoryCompartment =
  | 'upper-airway'
  | 'conducting-airway'
  | 'gas-exchange'
  | 'lung-parenchyma'
  | 'pleura'
  | 'respiratory-pump'
  | 'pulmonary-vasculature'

export type RespiratoryFlowDirection = 'inspiration' | 'expiration' | 'transition'

export interface RespiratoryAtlasNode {
  atlasNode: BodyAtlasNode
  compartment: RespiratoryCompartment
  ruleId: string
  airwayGeneration: number | null
  airwayGenerationLabel: string | null
}

export interface RespiratoryCompartmentSummary {
  compartment: RespiratoryCompartment
  nodeCount: number
  triangleCount: number
  sourceFiles: readonly string[]
  regions: readonly string[]
}

export interface RespiratoryCoverageTarget {
  id: string
  label: string
  compartment: RespiratoryCompartment
  requiredLayers: readonly BodyAtlasLayer[]
  reviewedTerms: readonly string[]
  minimumMeshCount: number
  note: string
}

export interface RespiratoryCoverageResult {
  target: RespiratoryCoverageTarget
  nodes: readonly RespiratoryAtlasNode[]
  present: boolean
  meshCount: number
}

export interface RespiratoryAtlas {
  nodes: readonly RespiratoryAtlasNode[]
  compartments: readonly RespiratoryCompartmentSummary[]
  airwayGenerationCounts: Readonly<Record<number, number>>
  coverage: readonly RespiratoryCoverageResult[]
  coverageFraction: number
  missingTargetIds: readonly string[]
}

export interface BreathAtlasVisualState {
  phase: number
  effort: number
  inspirationEnvelope: number
  flowSignal: number
  flowDirection: RespiratoryFlowDirection
  lungScale: number
  thoracicScale: number
  diaphragmDescent: number
  airwayScale: number
  patientSpecific: false
  units: 'normalized-visualization-only'
}

interface RespiratoryRule {
  id: string
  compartment: RespiratoryCompartment
  layers: readonly BodyAtlasLayer[]
  terms: readonly string[]
  excludeTerms?: readonly string[]
  airwayGeneration?: number
  airwayGenerationLabel?: string
}

const RESPIRATORY_COMPARTMENTS: readonly RespiratoryCompartment[] = [
  'upper-airway',
  'conducting-airway',
  'gas-exchange',
  'lung-parenchyma',
  'pleura',
  'respiratory-pump',
  'pulmonary-vasculature',
]

/**
 * Reviewed lexical rules for the shipped gross-anatomy source names.
 *
 * Ordering is deliberate: specific airway generations are evaluated before
 * generic "bronch" / "lung" terms. A rule is only allowed on the explicitly
 * listed render layers, which prevents e.g. an intercostal artery from being
 * misclassified as a respiratory muscle.
 */
const RESPIRATORY_RULES: readonly RespiratoryRule[] = [
  {
    id: 'alveolar-sac',
    compartment: 'gas-exchange',
    layers: ['visceral'],
    terms: ['alveolar sac'],
    airwayGeneration: 9,
    airwayGenerationLabel: 'alveolar sac',
  },
  {
    id: 'alveolar-duct',
    compartment: 'gas-exchange',
    layers: ['visceral'],
    terms: ['alveolar duct'],
    airwayGeneration: 8,
    airwayGenerationLabel: 'alveolar duct',
  },
  {
    id: 'alveolus',
    compartment: 'gas-exchange',
    layers: ['visceral'],
    terms: ['alveol'],
    airwayGeneration: 10,
    airwayGenerationLabel: 'alveolar unit',
  },
  {
    id: 'respiratory-bronchiole',
    compartment: 'gas-exchange',
    layers: ['visceral'],
    terms: ['respiratory bronchiole'],
    airwayGeneration: 7,
    airwayGenerationLabel: 'respiratory bronchiole',
  },
  {
    id: 'terminal-bronchiole',
    compartment: 'conducting-airway',
    layers: ['visceral'],
    terms: ['terminal bronchiole'],
    airwayGeneration: 6,
    airwayGenerationLabel: 'terminal bronchiole',
  },
  {
    id: 'bronchiole',
    compartment: 'conducting-airway',
    layers: ['visceral'],
    terms: ['bronchiole'],
    airwayGeneration: 5,
    airwayGenerationLabel: 'bronchiole',
  },
  {
    id: 'subsegmental-bronchus',
    compartment: 'conducting-airway',
    layers: ['visceral'],
    terms: ['subsegmental bronch'],
    airwayGeneration: 4,
    airwayGenerationLabel: 'subsegmental bronchus',
  },
  {
    id: 'segmental-bronchus',
    compartment: 'conducting-airway',
    layers: ['visceral'],
    terms: ['segmental bronch'],
    excludeTerms: ['subsegmental bronch'],
    airwayGeneration: 3,
    airwayGenerationLabel: 'segmental bronchus',
  },
  {
    id: 'lobar-bronchus',
    compartment: 'conducting-airway',
    layers: ['visceral'],
    terms: ['lobar bronch', 'secondary bronch'],
    airwayGeneration: 2,
    airwayGenerationLabel: 'lobar bronchus',
  },
  {
    id: 'main-bronchus',
    compartment: 'conducting-airway',
    layers: ['visceral'],
    terms: ['main bronch', 'principal bronch', 'primary bronch'],
    airwayGeneration: 1,
    airwayGenerationLabel: 'main bronchus',
  },
  {
    id: 'trachea',
    compartment: 'conducting-airway',
    layers: ['visceral'],
    terms: ['trachea'],
    airwayGeneration: 0,
    airwayGenerationLabel: 'trachea',
  },
  {
    id: 'larynx',
    compartment: 'upper-airway',
    layers: ['visceral'],
    terms: ['larynx', 'laryngeal'],
  },
  {
    id: 'pharynx',
    compartment: 'upper-airway',
    layers: ['visceral'],
    terms: ['pharynx', 'nasopharynx', 'oropharynx', 'laryngopharynx'],
  },
  {
    id: 'nasal-airway',
    compartment: 'upper-airway',
    layers: ['visceral'],
    terms: ['nasal cavity', 'nasal meatus', 'nasal concha'],
  },
  {
    id: 'pleura',
    compartment: 'pleura',
    layers: ['visceral'],
    terms: ['pleura', 'pleural'],
  },
  {
    id: 'lung-parenchyma',
    compartment: 'lung-parenchyma',
    layers: ['visceral'],
    terms: ['lung', 'pulmonary lobe'],
    excludeTerms: ['pulmonary artery', 'pulmonary vein', 'pulmonary nerve'],
  },
  {
    id: 'diaphragm',
    compartment: 'respiratory-pump',
    layers: ['muscular'],
    terms: ['diaphragm'],
  },
  {
    id: 'intercostal-muscle',
    compartment: 'respiratory-pump',
    layers: ['muscular'],
    terms: ['intercostal muscle'],
  },
  {
    id: 'scalene-muscle',
    compartment: 'respiratory-pump',
    layers: ['muscular'],
    terms: ['scalene muscle', 'scalenus'],
  },
  {
    id: 'sternocleidomastoid',
    compartment: 'respiratory-pump',
    layers: ['muscular'],
    terms: ['sternocleidomastoid'],
  },
  {
    id: 'pulmonary-artery',
    compartment: 'pulmonary-vasculature',
    layers: ['cardiovascular'],
    terms: ['pulmonary artery', 'pulmonary trunk'],
  },
  {
    id: 'pulmonary-vein',
    compartment: 'pulmonary-vasculature',
    layers: ['cardiovascular'],
    terms: ['pulmonary vein'],
  },
] as const

export const RESPIRATORY_COVERAGE_TARGETS: readonly RespiratoryCoverageTarget[] = [
  {
    id: 'upper-airway',
    label: 'Upper airway',
    compartment: 'upper-airway',
    requiredLayers: ['visceral'],
    reviewedTerms: ['nasal cavity', 'pharynx', 'larynx'],
    minimumMeshCount: 1,
    note: 'At least one reviewed upper-airway mesh must be present; absent subregions remain explicit coverage gaps.',
  },
  {
    id: 'trachea',
    label: 'Trachea',
    compartment: 'conducting-airway',
    requiredLayers: ['visceral'],
    reviewedTerms: ['trachea'],
    minimumMeshCount: 1,
    note: 'Gross conducting-airway anchor.',
  },
  {
    id: 'main-bronchi',
    label: 'Main bronchi',
    compartment: 'conducting-airway',
    requiredLayers: ['visceral'],
    reviewedTerms: ['main bronch', 'principal bronch', 'primary bronch'],
    minimumMeshCount: 1,
    note: 'Right/left main bronchi should be represented when source geometry provides them.',
  },
  {
    id: 'lobar-bronchi',
    label: 'Lobar bronchi',
    compartment: 'conducting-airway',
    requiredLayers: ['visceral'],
    reviewedTerms: ['lobar bronch', 'secondary bronch'],
    minimumMeshCount: 1,
    note: 'Secondary/lobar branching tier.',
  },
  {
    id: 'segmental-bronchi',
    label: 'Segmental bronchi',
    compartment: 'conducting-airway',
    requiredLayers: ['visceral'],
    reviewedTerms: ['segmental bronch'],
    minimumMeshCount: 1,
    note: 'Bronchopulmonary-segment airway tier.',
  },
  {
    id: 'distal-airway',
    label: 'Distal bronchiolar airway',
    compartment: 'conducting-airway',
    requiredLayers: ['visceral'],
    reviewedTerms: ['bronchiole', 'terminal bronchiole'],
    minimumMeshCount: 1,
    note: 'If gross assets do not contain bronchioles, the gap must remain visible rather than being synthesized as verified anatomy.',
  },
  {
    id: 'gas-exchange',
    label: 'Alveolar / gas-exchange unit',
    compartment: 'gas-exchange',
    requiredLayers: ['visceral'],
    reviewedTerms: ['respiratory bronchiole', 'alveolar duct', 'alveolar sac', 'alveol'],
    minimumMeshCount: 1,
    note: 'Microscopic gas-exchange structures are allowed to remain unresolved in a gross atlas; never fake them as source meshes.',
  },
  {
    id: 'lung-parenchyma',
    label: 'Lung parenchyma / lobes',
    compartment: 'lung-parenchyma',
    requiredLayers: ['visceral'],
    reviewedTerms: ['lung', 'pulmonary lobe'],
    minimumMeshCount: 1,
    note: 'Gross lung/lobar context.',
  },
  {
    id: 'pleura',
    label: 'Pleura',
    compartment: 'pleura',
    requiredLayers: ['visceral'],
    reviewedTerms: ['pleura', 'pleural'],
    minimumMeshCount: 1,
    note: 'Pleural coverage is reported independently from lung parenchyma.',
  },
  {
    id: 'respiratory-pump',
    label: 'Respiratory pump',
    compartment: 'respiratory-pump',
    requiredLayers: ['muscular'],
    reviewedTerms: ['diaphragm', 'intercostal muscle', 'scalenus', 'sternocleidomastoid'],
    minimumMeshCount: 1,
    note: 'Muscles that can participate in ventilation are a separate rendering compartment.',
  },
  {
    id: 'pulmonary-arterial',
    label: 'Pulmonary arterial tree',
    compartment: 'pulmonary-vasculature',
    requiredLayers: ['cardiovascular'],
    reviewedTerms: ['pulmonary artery', 'pulmonary trunk'],
    minimumMeshCount: 1,
    note: 'Pulmonary arterial source meshes only; capillary microvasculature is not implied.',
  },
  {
    id: 'pulmonary-venous',
    label: 'Pulmonary venous tree',
    compartment: 'pulmonary-vasculature',
    requiredLayers: ['cardiovascular'],
    reviewedTerms: ['pulmonary vein'],
    minimumMeshCount: 1,
    note: 'Pulmonary venous source meshes only.',
  },
] as const

function tokenMatches(sourceToken: string, reviewedToken: string) {
  return sourceToken === reviewedToken
    || (reviewedToken.length >= 5 && sourceToken.startsWith(reviewedToken))
}

function containsReviewedPhrase(value: string, phrase: string) {
  const sourceTokens = normalizeAtlasTerm(value).split(' ').filter(Boolean)
  const phraseTokens = normalizeAtlasTerm(phrase).split(' ').filter(Boolean)
  if (!sourceTokens.length || !phraseTokens.length || phraseTokens.length > sourceTokens.length) return false

  for (let start = 0; start <= sourceTokens.length - phraseTokens.length; start += 1) {
    let matched = true
    for (let offset = 0; offset < phraseTokens.length; offset += 1) {
      if (!tokenMatches(sourceTokens[start + offset], phraseTokens[offset])) {
        matched = false
        break
      }
    }
    if (matched) return true
  }
  return false
}

function ruleMatches(node: BodyAtlasNode, rule: RespiratoryRule) {
  if (!rule.layers.includes(node.layer)) return false
  const value = `${node.sourceName} ${node.baseName}`
  if (rule.excludeTerms?.some((term) => containsReviewedPhrase(value, term))) return false
  return rule.terms.some((term) => containsReviewedPhrase(value, term))
}

export function classifyRespiratoryAtlasNode(node: BodyAtlasNode): RespiratoryAtlasNode | null {
  const rule = RESPIRATORY_RULES.find((candidate) => ruleMatches(node, candidate))
  if (!rule) return null
  return {
    atlasNode: node,
    compartment: rule.compartment,
    ruleId: rule.id,
    airwayGeneration: rule.airwayGeneration ?? null,
    airwayGenerationLabel: rule.airwayGenerationLabel ?? null,
  }
}

function targetMatchesNode(target: RespiratoryCoverageTarget, node: RespiratoryAtlasNode) {
  if (node.compartment !== target.compartment) return false
  if (!target.requiredLayers.includes(node.atlasNode.layer)) return false
  const value = `${node.atlasNode.sourceName} ${node.atlasNode.baseName}`
  return target.reviewedTerms.some((term) => containsReviewedPhrase(value, term))
}

function summarizeCompartment(
  compartment: RespiratoryCompartment,
  nodes: readonly RespiratoryAtlasNode[],
): RespiratoryCompartmentSummary {
  const members = nodes.filter((node) => node.compartment === compartment)
  return {
    compartment,
    nodeCount: members.length,
    triangleCount: members.reduce((sum, node) => sum + node.atlasNode.triangles, 0),
    sourceFiles: [...new Set(members.map((node) => node.atlasNode.sourceFile))].sort((a, b) => a.localeCompare(b)),
    regions: [...new Set(members.map((node) => node.atlasNode.region).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  }
}

export function buildRespiratoryAtlas(graph: BodyAtlasGraph = BODY_ATLAS_GRAPH): RespiratoryAtlas {
  const nodes = graph.nodes
    .map(classifyRespiratoryAtlasNode)
    .filter((node): node is RespiratoryAtlasNode => node !== null)
    .sort((a, b) => (a.airwayGeneration ?? 999) - (b.airwayGeneration ?? 999)
      || a.atlasNode.y - b.atlasNode.y
      || a.atlasNode.sourceName.localeCompare(b.atlasNode.sourceName))

  const airwayGenerationCounts: Record<number, number> = {}
  for (const node of nodes) {
    if (node.airwayGeneration === null) continue
    airwayGenerationCounts[node.airwayGeneration] = (airwayGenerationCounts[node.airwayGeneration] ?? 0) + 1
  }

  const coverage = RESPIRATORY_COVERAGE_TARGETS.map((target) => {
    const matches = nodes.filter((node) => targetMatchesNode(target, node))
    return {
      target,
      nodes: matches,
      present: matches.length >= target.minimumMeshCount,
      meshCount: matches.length,
    }
  })

  const presentCount = coverage.filter((result) => result.present).length
  return {
    nodes,
    compartments: RESPIRATORY_COMPARTMENTS.map((compartment) => summarizeCompartment(compartment, nodes)),
    airwayGenerationCounts,
    coverage,
    coverageFraction: coverage.length ? presentCount / coverage.length : 0,
    missingTargetIds: coverage.filter((result) => !result.present).map((result) => result.target.id),
  }
}

export const BODY_RESPIRATORY_ATLAS = buildRespiratoryAtlas()

/**
 * Smooth generic breathing envelope for a visual atlas, never a patient model.
 *
 * For normalized cycle phase φ ∈ [0,1):
 *
 *   inspirationEnvelope = (1 - cos(2πφ)) / 2
 *   flowSignal         = π sin(2πφ)
 *
 * The scale amplitudes below are deliberately small, unitless display
 * transforms. They are not tidal volume, diaphragm excursion, compliance,
 * spirometry, pressure, or any other measured physiological quantity.
 */
export function computeBreathAtlasVisualState(rawPhase: number, rawEffort = 1): BreathAtlasVisualState {
  const finitePhase = Number.isFinite(rawPhase) ? rawPhase : 0
  const phase = ((finitePhase % 1) + 1) % 1
  const effort = Math.max(0, Math.min(Number.isFinite(rawEffort) ? rawEffort : 1, 1.5))
  const angle = 2 * Math.PI * phase
  const inspirationEnvelope = (1 - Math.cos(angle)) / 2
  const flowSignal = Math.PI * Math.sin(angle)
  const epsilon = 1e-8
  const flowDirection: RespiratoryFlowDirection = flowSignal > epsilon
    ? 'inspiration'
    : flowSignal < -epsilon
      ? 'expiration'
      : 'transition'

  return {
    phase,
    effort,
    inspirationEnvelope,
    flowSignal,
    flowDirection,
    lungScale: 1 + 0.04 * effort * inspirationEnvelope,
    thoracicScale: 1 + 0.02 * effort * inspirationEnvelope,
    diaphragmDescent: 0.035 * effort * inspirationEnvelope,
    airwayScale: 1 + 0.012 * effort * inspirationEnvelope,
    patientSpecific: false,
    units: 'normalized-visualization-only',
  }
}

export function validateRespiratoryAtlas(atlas: RespiratoryAtlas = BODY_RESPIRATORY_ATLAS) {
  const reasons: string[] = []
  const seenNodeIds = new Set<string>()

  for (const node of atlas.nodes) {
    if (seenNodeIds.has(node.atlasNode.id)) reasons.push(`Respiratory node classified more than once: ${node.atlasNode.id}`)
    seenNodeIds.add(node.atlasNode.id)
    if (!RESPIRATORY_COMPARTMENTS.includes(node.compartment)) reasons.push(`${node.atlasNode.id}: invalid respiratory compartment.`)
    if (node.airwayGeneration !== null && (!Number.isInteger(node.airwayGeneration) || node.airwayGeneration < 0 || node.airwayGeneration > 10)) {
      reasons.push(`${node.atlasNode.id}: invalid airway generation.`)
    }
  }

  if (atlas.coverage.length !== RESPIRATORY_COVERAGE_TARGETS.length) reasons.push('Respiratory coverage target count is stale.')
  if (!Number.isFinite(atlas.coverageFraction) || atlas.coverageFraction < 0 || atlas.coverageFraction > 1) {
    reasons.push('Respiratory coverage fraction must remain inside 0..1.')
  }

  const targetIds = new Set<string>()
  for (const result of atlas.coverage) {
    if (targetIds.has(result.target.id)) reasons.push(`Duplicate respiratory target id: ${result.target.id}`)
    targetIds.add(result.target.id)
    if (result.present !== (result.meshCount >= result.target.minimumMeshCount)) {
      reasons.push(`${result.target.id}: coverage presence flag disagrees with mesh count.`)
    }
  }

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] }
}
