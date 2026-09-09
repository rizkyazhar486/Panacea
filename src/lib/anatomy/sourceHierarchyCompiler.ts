import type { AtlasSystemId } from './atlasKernel'
import {
  SHIPPED_SOURCE_TOPOLOGY,
  type SourceAnatomyLayer,
  type SourceLaterality,
  type SourceTopologyIndex,
  type SourceTopologyLeaf,
} from './sourceTopologyCompiler'

export type SourceHierarchyKind = 'root' | 'layer' | 'region' | 'structure' | 'mesh'
export type SourcePairingStatus = 'bilateral-pair' | 'midline-only' | 'left-only' | 'right-only' | 'mixed' | 'unknown'

export interface SourceHierarchyNode {
  id: string
  kind: SourceHierarchyKind
  label: string
  parentId?: string
  children: readonly string[]
  layer?: SourceAnatomyLayer
  sourceRegion?: string
  systems: readonly AtlasSystemId[]
  triangleCount: number
  meshCount: number
  pairingStatus?: SourcePairingStatus
  leafId?: string
}

export interface SourceHierarchy {
  revision: string
  rootId: string
  nodes: readonly SourceHierarchyNode[]
  byId: ReadonlyMap<string, SourceHierarchyNode>
  parentById: ReadonlyMap<string, string>
  structureGroupByLeafId: ReadonlyMap<string, string>
}

export interface SourcePairComparisonPlan {
  structureGroup: SourceHierarchyNode
  left: readonly SourceTopologyLeaf[]
  right: readonly SourceTopologyLeaf[]
  midline: readonly SourceTopologyLeaf[]
  other: readonly SourceTopologyLeaf[]
  status: SourcePairingStatus
  triangleCount: number
}

export interface SourceHierarchyFocus {
  leaf: SourceTopologyLeaf
  path: readonly SourceHierarchyNode[]
  siblingMeshIds: readonly string[]
  structureMeshIds: readonly string[]
}

const ROOT_ID = 'source-hierarchy:whole-body'

const normalize = (value: string) => value
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ')

function fnv1a(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function safeIdPart(value: string) {
  return normalize(value).replace(/ /g, '-').slice(0, 48) || 'unnamed'
}

function sortedUnique<T>(values: readonly T[]) {
  return [...new Set(values)].sort() as T[]
}

function systemsForLeaves(leaves: readonly SourceTopologyLeaf[]) {
  return sortedUnique(leaves.map((leaf) => leaf.domain.system).filter((system): system is AtlasSystemId => Boolean(system)))
}

function pairingStatus(leaves: readonly SourceTopologyLeaf[]): SourcePairingStatus {
  const sides = new Set(leaves.map((leaf) => leaf.laterality))
  const left = sides.has('kiri')
  const right = sides.has('kanan')
  const midline = sides.has('tengah')
  if (left && right && !midline) return 'bilateral-pair'
  if (!left && !right && midline) return 'midline-only'
  if (left && !right && !midline) return 'left-only'
  if (!left && right && !midline) return 'right-only'
  if (sides.size) return 'mixed'
  return 'unknown'
}

function aggregateNode(
  input: Omit<SourceHierarchyNode, 'triangleCount' | 'meshCount' | 'systems'>,
  leaves: readonly SourceTopologyLeaf[],
): SourceHierarchyNode {
  return {
    ...input,
    systems: systemsForLeaves(leaves),
    triangleCount: leaves.reduce((sum, leaf) => sum + leaf.triangles, 0),
    meshCount: leaves.length,
  }
}

/**
 * Compile every indexed mesh into a lossless hierarchy:
 * whole body → source layer → source body region → base structure → exact mesh.
 *
 * The hierarchy is intentionally based only on metadata already extracted from
 * shipped GLB nodes. It does not infer anatomical containment from proximity.
 */
export function compileSourceHierarchy(
  index: SourceTopologyIndex = SHIPPED_SOURCE_TOPOLOGY,
): SourceHierarchy {
  const nodes: SourceHierarchyNode[] = []
  const structureGroupByLeafId = new Map<string, string>()
  const parentById = new Map<string, string>()

  const layerGroups = new Map<SourceAnatomyLayer, SourceTopologyLeaf[]>()
  for (const leaf of index.leaves) {
    const group = layerGroups.get(leaf.layer) ?? []
    group.push(leaf)
    layerGroups.set(leaf.layer, group)
  }

  const layerIds = [...layerGroups.keys()].sort().map((layer) => `source-layer:${layer}`)
  nodes.push(aggregateNode({
    id: ROOT_ID,
    kind: 'root',
    label: 'Whole body — shipped mesh topology',
    children: layerIds,
  }, index.leaves))

  for (const [layer, rawLayerLeaves] of [...layerGroups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const layerLeaves = [...rawLayerLeaves].sort((a, b) => a.sourceName.localeCompare(b.sourceName))
    const layerId = `source-layer:${layer}`
    parentById.set(layerId, ROOT_ID)

    const regionGroups = new Map<string, SourceTopologyLeaf[]>()
    for (const leaf of layerLeaves) {
      const group = regionGroups.get(leaf.sourceRegion) ?? []
      group.push(leaf)
      regionGroups.set(leaf.sourceRegion, group)
    }
    const regionIds = [...regionGroups.keys()].sort().map((region) => `${layerId}:region:${safeIdPart(region)}`)

    nodes.push(aggregateNode({
      id: layerId,
      kind: 'layer',
      label: layer,
      parentId: ROOT_ID,
      children: regionIds,
      layer,
    }, layerLeaves))

    for (const [sourceRegion, rawRegionLeaves] of [...regionGroups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const regionLeaves = [...rawRegionLeaves].sort((a, b) => a.baseName.localeCompare(b.baseName) || a.sourceName.localeCompare(b.sourceName))
      const regionId = `${layerId}:region:${safeIdPart(sourceRegion)}`
      parentById.set(regionId, layerId)

      const structureGroups = new Map<string, SourceTopologyLeaf[]>()
      for (const leaf of regionLeaves) {
        // Side suffixes have already been removed in baseName by bodyIndex.gen.
        // Keep region+layer in the key so repeated names in distinct anatomical
        // source buckets never collapse into one implied structure.
        const key = normalize(leaf.baseName)
        const group = structureGroups.get(key) ?? []
        group.push(leaf)
        structureGroups.set(key, group)
      }

      const structureRecords = [...structureGroups.entries()]
        .map(([key, leaves]) => ({
          key,
          leaves,
          id: `${regionId}:structure:${fnv1a(`${layer}|${sourceRegion}|${key}`)}:${safeIdPart(leaves[0]!.baseName)}`,
        }))
        .sort((a, b) => a.leaves[0]!.baseName.localeCompare(b.leaves[0]!.baseName) || a.id.localeCompare(b.id))

      nodes.push(aggregateNode({
        id: regionId,
        kind: 'region',
        label: sourceRegion,
        parentId: layerId,
        children: structureRecords.map((record) => record.id),
        layer,
        sourceRegion,
      }, regionLeaves))

      for (const record of structureRecords) {
        const structureLeaves = [...record.leaves].sort((a, b) => a.laterality.localeCompare(b.laterality) || a.sourceName.localeCompare(b.sourceName))
        parentById.set(record.id, regionId)
        const meshIds = structureLeaves.map((leaf) => `source-mesh-node:${leaf.id}`)

        nodes.push(aggregateNode({
          id: record.id,
          kind: 'structure',
          label: structureLeaves[0]!.baseName,
          parentId: regionId,
          children: meshIds,
          layer,
          sourceRegion,
          pairingStatus: pairingStatus(structureLeaves),
        }, structureLeaves))

        for (const leaf of structureLeaves) {
          const meshId = `source-mesh-node:${leaf.id}`
          structureGroupByLeafId.set(leaf.id, record.id)
          parentById.set(meshId, record.id)
          nodes.push({
            id: meshId,
            kind: 'mesh',
            label: leaf.sourceName,
            parentId: record.id,
            children: [],
            layer,
            sourceRegion,
            systems: leaf.domain.system ? [leaf.domain.system] : [],
            triangleCount: leaf.triangles,
            meshCount: 1,
            leafId: leaf.id,
          })
        }
      }
    }
  }

  const byId = new Map(nodes.map((node) => [node.id, node]))
  return {
    revision: 'whole-body-source-hierarchy-2026-09-09-r1',
    rootId: ROOT_ID,
    nodes,
    byId,
    parentById,
    structureGroupByLeafId,
  }
}

export const SHIPPED_SOURCE_HIERARCHY = compileSourceHierarchy()

export function sourceHierarchyAncestors(
  nodeId: string,
  hierarchy: SourceHierarchy = SHIPPED_SOURCE_HIERARCHY,
) {
  const result: SourceHierarchyNode[] = []
  const seen = new Set<string>()
  let current = hierarchy.byId.get(nodeId)
  while (current?.parentId) {
    if (seen.has(current.parentId)) break
    seen.add(current.parentId)
    const parent = hierarchy.byId.get(current.parentId)
    if (!parent) break
    result.push(parent)
    current = parent
  }
  return result
}

export function sourceHierarchyDescendants(
  nodeId: string,
  maxDepth = Number.POSITIVE_INFINITY,
  hierarchy: SourceHierarchy = SHIPPED_SOURCE_HIERARCHY,
) {
  const start = hierarchy.byId.get(nodeId)
  if (!start) return []
  const result: { node: SourceHierarchyNode; depth: number }[] = []
  let frontier = start.children.map((id) => ({ id, depth: 1 }))
  const seen = new Set<string>([nodeId])

  while (frontier.length) {
    const next: typeof frontier = []
    for (const item of frontier) {
      if (seen.has(item.id) || item.depth > maxDepth) continue
      seen.add(item.id)
      const node = hierarchy.byId.get(item.id)
      if (!node) continue
      result.push({ node, depth: item.depth })
      if (item.depth < maxDepth) {
        next.push(...node.children.map((id) => ({ id, depth: item.depth + 1 })))
      }
    }
    frontier = next
  }
  return result
}

export function buildSourcePairComparison(
  leafId: string,
  index: SourceTopologyIndex = SHIPPED_SOURCE_TOPOLOGY,
  hierarchy: SourceHierarchy = SHIPPED_SOURCE_HIERARCHY,
): SourcePairComparisonPlan | null {
  const structureId = hierarchy.structureGroupByLeafId.get(leafId)
  const structureGroup = structureId ? hierarchy.byId.get(structureId) : undefined
  if (!structureGroup || structureGroup.kind !== 'structure') return null

  const leaves = structureGroup.children
    .map((meshId) => hierarchy.byId.get(meshId)?.leafId)
    .filter((id): id is string => Boolean(id))
    .map((id) => index.byId.get(id))
    .filter((leaf): leaf is SourceTopologyLeaf => Boolean(leaf))

  const bySide = (side: SourceLaterality) => leaves.filter((leaf) => leaf.laterality === side)
  const left = bySide('kiri')
  const right = bySide('kanan')
  const midline = bySide('tengah')
  const known = new Set([...left, ...right, ...midline].map((leaf) => leaf.id))
  return {
    structureGroup,
    left,
    right,
    midline,
    other: leaves.filter((leaf) => !known.has(leaf.id)),
    status: structureGroup.pairingStatus ?? 'unknown',
    triangleCount: leaves.reduce((sum, leaf) => sum + leaf.triangles, 0),
  }
}

export function buildSourceHierarchyFocus(
  leafId: string,
  index: SourceTopologyIndex = SHIPPED_SOURCE_TOPOLOGY,
  hierarchy: SourceHierarchy = SHIPPED_SOURCE_HIERARCHY,
): SourceHierarchyFocus | null {
  const leaf = index.byId.get(leafId)
  if (!leaf) return null
  const meshNode = hierarchy.byId.get(`source-mesh-node:${leafId}`)
  if (!meshNode) return null
  const ancestors = sourceHierarchyAncestors(meshNode.id, hierarchy).reverse()
  const structure = ancestors.find((node) => node.kind === 'structure')
  return {
    leaf,
    path: [...ancestors, meshNode],
    siblingMeshIds: structure?.children.filter((id) => id !== meshNode.id) ?? [],
    structureMeshIds: structure?.children ?? [meshNode.id],
  }
}

export function validateSourceHierarchy(
  hierarchy: SourceHierarchy = SHIPPED_SOURCE_HIERARCHY,
  index: SourceTopologyIndex = SHIPPED_SOURCE_TOPOLOGY,
): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const node of hierarchy.nodes) {
    if (ids.has(node.id)) issues.push(`Duplicate source hierarchy id: ${node.id}`)
    ids.add(node.id)
    if (node.parentId && !hierarchy.byId.has(node.parentId)) issues.push(`Missing source hierarchy parent: ${node.id} -> ${node.parentId}`)
    for (const childId of node.children) {
      const child = hierarchy.byId.get(childId)
      if (!child) issues.push(`Missing source hierarchy child: ${node.id} -> ${childId}`)
      else if (child.parentId !== node.id) issues.push(`Non-reciprocal source hierarchy edge: ${node.id} -> ${childId}`)
    }
    if (node.triangleCount < 0 || node.meshCount < 0) issues.push(`Invalid source hierarchy aggregate: ${node.id}`)
  }

  const leafIds = hierarchy.nodes
    .filter((node) => node.kind === 'mesh')
    .map((node) => node.leafId)
    .filter((id): id is string => Boolean(id))
  if (leafIds.length !== index.leaves.length) issues.push(`Mesh leaf coverage mismatch: hierarchy=${leafIds.length}, source=${index.leaves.length}`)
  if (new Set(leafIds).size !== leafIds.length) issues.push('A shipped source leaf is represented more than once in the source hierarchy.')
  for (const leaf of index.leaves) if (!hierarchy.structureGroupByLeafId.has(leaf.id)) issues.push(`Missing structure group for source leaf: ${leaf.id}`)

  const root = hierarchy.byId.get(hierarchy.rootId)
  if (!root || root.kind !== 'root') issues.push('Source hierarchy root is missing or invalid.')
  else {
    if (root.meshCount !== index.leaves.length) issues.push('Source hierarchy root mesh count does not equal shipped source topology leaf count.')
    if (root.triangleCount !== index.totalTriangles) issues.push('Source hierarchy root triangle count does not equal shipped source topology triangle count.')
  }

  // Parent-chain cycle check.
  for (const node of hierarchy.nodes) {
    const seen = new Set<string>([node.id])
    let current: SourceHierarchyNode | undefined = node
    while (current?.parentId) {
      if (seen.has(current.parentId)) {
        issues.push(`Source hierarchy cycle detected from ${node.id} at ${current.parentId}`)
        break
      }
      seen.add(current.parentId)
      current = hierarchy.byId.get(current.parentId)
    }
  }

  return [...new Set(issues)]
}
