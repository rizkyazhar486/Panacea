import type * as THREE from 'three'
import {
  clearAnatomySourceNodes,
  publishAnatomySourceNodes,
} from './anatomySourceNodeRegistry'
import {
  clearAnatomySpatialNodes,
  extractAnatomySpatialNodes,
  publishAnatomySpatialNodes,
  type AnatomySpatialNode,
} from './anatomySpatialRegistry'

export interface BodyAtlasRuntimePublication {
  file: string
  sourceNames: readonly string[]
  spatialNodes: readonly AnatomySpatialNode[]
  namedNodeCount: number
  spatialNodeCount: number
  sourceSpatialParity: boolean
}

/**
 * Publish the two runtime views of one loaded anatomy layer atomically from the
 * same source geometry traversal result:
 *
 * 1) canonical source names used by source-name hint resolution;
 * 2) source-space bounding volumes used by spatial/cross-section queries.
 *
 * A spatial record is deliberately required to have descendant geometry, so a
 * grouping-only GLTF node cannot masquerade as a selectable anatomical mesh.
 */
export function publishBodyAtlasRuntimeLayer(
  file: string,
  root: THREE.Object3D,
): BodyAtlasRuntimePublication {
  const spatialNodes = extractAnatomySpatialNodes(root, file)
  const sourceNames = [...new Set(spatialNodes.map((node) => node.name))]
    .sort((a, b) => a.localeCompare(b))

  publishAnatomySourceNodes(file, sourceNames)
  publishAnatomySpatialNodes(file, spatialNodes)

  return {
    file,
    sourceNames,
    spatialNodes,
    namedNodeCount: sourceNames.length,
    spatialNodeCount: spatialNodes.length,
    sourceSpatialParity: sourceNames.length === spatialNodes.length,
  }
}

export function clearBodyAtlasRuntimeLayer(file: string) {
  clearAnatomySourceNodes(file)
  clearAnatomySpatialNodes(file)
}
