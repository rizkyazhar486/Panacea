import {
  resolveAllAnatomySourceNodes,
  type AnatomySourceNodeBundle,
} from './anatomySourceNodeRegistry'
import {
  WHOLE_BODY_REGIONS,
  type AtlasLayerKey,
  type AtlasRegionKey,
  type AtlasStructureTarget,
} from './wholeBodyAtlasBlueprint'

export const Z_ANATOMY_SPATIAL_LAYERS: readonly AtlasLayerKey[] = [
  'surface',
  'skeletal',
  'muscular',
  'cardiovascular',
  'nervous',
  'visceral',
  'lymphoid',
]

export const Z_ANATOMY_FILE_BY_LAYER: Readonly<Record<AtlasLayerKey, string>> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

export type SpatialSourceState = 'empty' | 'resolved' | 'unresolved' | 'not-represented'

export interface ZAnatomySpatialSourceCell {
  key: string
  regionKey: AtlasRegionKey
  regionLabel: string
  layer: AtlasLayerKey
  file: string
  targets: readonly AtlasStructureTarget[]
  representedTargetCount: number
  sourceNames: readonly string[]
  nodeHints: readonly string[]
  state: SpatialSourceState
}

function unique(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))]
}

function sourceNamesForTargets(
  targets: readonly AtlasStructureTarget[],
  sourceBundles: readonly AnatomySourceNodeBundle[],
  file: string,
) {
  const bundle = sourceBundles.filter((candidate) => candidate.file === file)
  if (!bundle.length) return []

  return unique(targets
    .filter((target) => target.provenance !== 'not-represented')
    .flatMap((target) => resolveAllAnatomySourceNodes(target.nodeHints, bundle, 12))
    .flatMap((match) => match.names))
    .sort((a, b) => a.localeCompare(b))
}

/**
 * Crosses the reviewed whole-body teaching catalogue with exact names shipped
 * in the anatomy source bundles. Counts are inventory/navigation facts only:
 * they are not anatomical completeness, segmentation quality, tissue volume,
 * clinical importance, or a percentage of the human body.
 */
export function buildZAnatomySpatialSourceMap(
  sourceBundles: readonly AnatomySourceNodeBundle[],
): ZAnatomySpatialSourceCell[] {
  return WHOLE_BODY_REGIONS.flatMap((region) =>
    Z_ANATOMY_SPATIAL_LAYERS.map((layer) => {
      const targets = region.structures.filter((structure) => structure.layer === layer)
      const file = Z_ANATOMY_FILE_BY_LAYER[layer]
      const representedTargets = targets.filter((target) => target.provenance !== 'not-represented')
      const sourceNames = sourceNamesForTargets(targets, sourceBundles, file)
      const nodeHints = unique(targets.flatMap((target) => target.nodeHints))

      let state: SpatialSourceState
      if (!targets.length) state = 'empty'
      else if (!representedTargets.length) state = 'not-represented'
      else if (sourceNames.length) state = 'resolved'
      else state = 'unresolved'

      return {
        key: `${region.key}:${layer}`,
        regionKey: region.key,
        regionLabel: region.label,
        layer,
        file,
        targets,
        representedTargetCount: representedTargets.length,
        sourceNames,
        nodeHints,
        state,
      }
    }),
  )
}
