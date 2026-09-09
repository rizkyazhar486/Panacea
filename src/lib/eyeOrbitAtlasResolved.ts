import { EYE_ORBIT_ATLAS, type EyeAtlasNode } from './eyeOrbitAtlas'

const ID_BY_LABEL: Record<string, string> = {
  'Primary visual cortex': 'primary-visual-cortex',
  'Ophthalmic division of trigeminal nerve (V1)': 'trigeminal-v1',
}

export const RESOLVED_EYE_ORBIT_ATLAS: EyeAtlasNode[] = EYE_ORBIT_ATLAS.map((node) => ({
  ...node,
  id: ID_BY_LABEL[node.label] ?? node.id,
  parentId: node.parentId,
}))

export function resolvedEyeAtlasCoverage() {
  const ids = RESOLVED_EYE_ORBIT_ATLAS.map((node) => node.id)
  return {
    nodes: ids.length,
    uniqueIds: new Set(ids).size === ids.length,
    layers: new Set(RESOLVED_EYE_ORBIT_ATLAS.map((node) => node.layer)).size,
    sourceBacked: RESOLVED_EYE_ORBIT_ATLAS.every((node) => node.sourceIds.length > 0),
    bounded: RESOLVED_EYE_ORBIT_ATLAS.every((node) => node.clinicalBoundary.includes('Educational anatomy only')),
  }
}

export function resolvedEyeAtlasByLayer(layer: EyeAtlasNode['layer']) {
  return RESOLVED_EYE_ORBIT_ATLAS.filter((node) => node.layer === layer)
}
