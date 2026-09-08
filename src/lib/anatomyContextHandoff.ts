import type {
  AtlasLayerKey,
  AtlasRegionKey,
  AtlasStructureTarget,
  GeometryProvenance,
} from './wholeBodyAtlasBlueprint'

export type AnatomyContextDestination = 'surgery' | 'biomechanics'

export interface AnatomyContextHandoff {
  structureId: string
  structureLabel: string
  region: AtlasRegionKey
  layer: AtlasLayerKey
  provenance: GeometryProvenance
  nodeHints: readonly string[]
  resolvedNodeNames: readonly string[]
  surgicalScenarioId?: string
  movementJointId?: string
}

interface CuratedHandoffRoute {
  surgicalScenarioId?: string
  movementJointId?: string
}

/**
 * Explicit curated cross-module mappings only.
 *
 * "Curated" here means deterministic repository configuration; it does NOT mean qualified human academic review.
 * A mapping may only be described as human-reviewed elsewhere when reviewer
 * identity, credentials, date and scope are recorded through the repository's
 * academic-review gates.
 *
 * Do not infer a surgery or biomechanics destination from fuzzy node-name
 * similarity. A named source mesh proves only that geometry exists; it does not
 * prove that a procedure or joint model applies to that structure.
 */
const CURATED_HANDOFF_BY_STRUCTURE: Readonly<Record<string, CuratedHandoffRoute>> = {
  'heart-great-vessels': { surgicalScenarioId: 'transseptal-anatomy' },
  hepatobiliary: { surgicalScenarioId: 'hepatocystic-triangle-spatial' },
  'hand-tendons': { surgicalScenarioId: 'carpal-tunnel-spatial' },
  'knee-complex': {
    surgicalScenarioId: 'knee-medial-parapatellar-spatial',
    movementJointId: 'knee',
  },
  'shoulder-complex': { movementJointId: 'shoulder' },
  'rotator-cuff': { movementJointId: 'shoulder' },
  'hip-complex': { movementJointId: 'hip' },
  paraspinals: { movementJointId: 'thoracolumbar-spine' },
}

function uniqueNonBlank(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export function buildAnatomyContextHandoff(
  region: AtlasRegionKey,
  structure: AtlasStructureTarget,
  resolvedNodeNames: readonly string[] = [],
): AnatomyContextHandoff {
  const route = structure.provenance === 'not-represented'
    ? undefined
    : CURATED_HANDOFF_BY_STRUCTURE[structure.id]

  return {
    structureId: structure.id,
    structureLabel: structure.label,
    region,
    layer: structure.layer,
    provenance: structure.provenance,
    nodeHints: uniqueNonBlank(structure.nodeHints),
    resolvedNodeNames: uniqueNonBlank(resolvedNodeNames),
    surgicalScenarioId: route?.surgicalScenarioId,
    movementJointId: route?.movementJointId,
  }
}

const pendingHandoff: Record<AnatomyContextDestination, AnatomyContextHandoff | null> = {
  surgery: null,
  biomechanics: null,
}

/**
 * Ephemeral same-session bridge from the Z-Anatomy workbench to the mapped
 * teaching destination. Nothing is persisted to storage and nothing is
 * interpreted as patient data. Surgery and biomechanics keep isolated slots so
 * opening one module cannot consume or overwrite the other module's context.
 */
export function publishAnatomyContextHandoff(
  context: AnatomyContextHandoff,
  destination: AnatomyContextDestination,
) {
  pendingHandoff[destination] = context
}

/** Consume once so a later manual visit is not silently pinned to stale context. */
export function consumeAnatomyContextHandoff(destination: AnatomyContextDestination) {
  const context = pendingHandoff[destination]
  pendingHandoff[destination] = null
  return context
}

export function clearAnatomyContextHandoff() {
  pendingHandoff.surgery = null
  pendingHandoff.biomechanics = null
}
