import * as THREE from 'three'

export type AnatomySpatialAxis = 'x' | 'y' | 'z'
export type AnatomySpatialVec3 = readonly [number, number, number]

export interface AnatomySpatialNode {
  file: string
  name: string
  min: AnatomySpatialVec3
  max: AnatomySpatialVec3
  center: AnatomySpatialVec3
  size: AnatomySpatialVec3
  radius: number
  volume: number
}

export interface AnatomySpatialPlaneQuery {
  axis: AnatomySpatialAxis
  coordinate: number
  tolerance?: number
  files?: readonly string[]
  limit?: number
}

export interface AnatomySpatialPlaneHit {
  node: AnatomySpatialNode
  distanceToPlane: number
  projectedBoxArea: number
}

export interface AnatomySpatialNearestHit {
  node: AnatomySpatialNode
  distance: number
}

export interface AnatomySpatialBounds {
  min: AnatomySpatialVec3
  max: AnatomySpatialVec3
  center: AnatomySpatialVec3
  size: AnatomySpatialVec3
}

interface AnatomySpatialAxisIndex {
  byMin: readonly AnatomySpatialNode[]
}

export interface AnatomySpatialIndex {
  nodes: readonly AnatomySpatialNode[]
  byFile: ReadonlyMap<string, readonly AnatomySpatialNode[]>
  axes: Readonly<Record<AnatomySpatialAxis, AnatomySpatialAxisIndex>>
  bounds: AnatomySpatialBounds | null
}

type Listener = () => void

const AXIS_INDEX: Record<AnatomySpatialAxis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 }
const listeners = new Set<Listener>()
const runtimeByFile = new Map<string, readonly AnatomySpatialNode[]>()
let snapshot: AnatomySpatialIndex = buildAnatomySpatialIndex([])

function finite(value: number) {
  return Number.isFinite(value) ? value : 0
}

function vec3(vector: THREE.Vector3): AnatomySpatialVec3 {
  return [finite(vector.x), finite(vector.y), finite(vector.z)]
}

function boundsFromNodes(nodes: readonly AnatomySpatialNode[]): AnatomySpatialBounds | null {
  if (!nodes.length) return null
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
  for (const node of nodes) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], node.min[axis])
      max[axis] = Math.max(max[axis], node.max[axis])
    }
  }
  const center: AnatomySpatialVec3 = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ]
  const size: AnatomySpatialVec3 = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ]
  return {
    min: [min[0], min[1], min[2]],
    max: [max[0], max[1], max[2]],
    center,
    size,
  }
}

function binaryUpperBoundByMin(nodes: readonly AnatomySpatialNode[], axis: 0 | 1 | 2, value: number) {
  let low = 0
  let high = nodes.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (nodes[middle].min[axis] <= value) low = middle + 1
    else high = middle
  }
  return low
}

export function buildAnatomySpatialIndex(rawNodes: readonly AnatomySpatialNode[]): AnatomySpatialIndex {
  const nodes = [...rawNodes].sort((a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name))
  const byFileMutable = new Map<string, AnatomySpatialNode[]>()
  for (const node of nodes) {
    const group = byFileMutable.get(node.file) ?? []
    group.push(node)
    byFileMutable.set(node.file, group)
  }
  const byFile = new Map([...byFileMutable.entries()].map(([file, group]) => [file, group as readonly AnatomySpatialNode[]] as const))
  const axisIndex = (axis: 0 | 1 | 2): AnatomySpatialAxisIndex => ({
    byMin: [...nodes].sort((a, b) => a.min[axis] - b.min[axis] || a.max[axis] - b.max[axis] || a.name.localeCompare(b.name)),
  })
  return {
    nodes,
    byFile,
    axes: { x: axisIndex(0), y: axisIndex(1), z: axisIndex(2) },
    bounds: boundsFromNodes(nodes),
  }
}

export function extractAnatomySpatialNodes(root: THREE.Object3D, file: string): AnatomySpatialNode[] {
  const normalizedFile = file.trim()
  if (!normalizedFile) return []
  root.updateMatrixWorld(true)
  const records: AnatomySpatialNode[] = []
  const seenNames = new Set<string>()

  function visit(object: THREE.Object3D): THREE.Box3 | null {
    const aggregate = new THREE.Box3()
    let hasBounds = false

    if (object instanceof THREE.Mesh) {
      const geometry = object.geometry
      if (!geometry.boundingBox) geometry.computeBoundingBox()
      if (geometry.boundingBox && !geometry.boundingBox.isEmpty()) {
        aggregate.copy(geometry.boundingBox).applyMatrix4(object.matrixWorld)
        hasBounds = true
      }
    }

    for (const child of object.children) {
      const childBounds = visit(child)
      if (!childBounds) continue
      if (!hasBounds) {
        aggregate.copy(childBounds)
        hasBounds = true
      } else {
        aggregate.union(childBounds)
      }
    }

    if (!hasBounds || aggregate.isEmpty()) return null

    const rawName = typeof object.userData.originalName === 'string'
      ? object.userData.originalName.trim()
      : ''
    if (rawName && !rawName.startsWith('HOW TO') && /[A-Za-z]/.test(rawName) && !seenNames.has(rawName)) {
      seenNames.add(rawName)
      const center = aggregate.getCenter(new THREE.Vector3())
      const size = aggregate.getSize(new THREE.Vector3())
      records.push({
        file: normalizedFile,
        name: rawName,
        min: vec3(aggregate.min),
        max: vec3(aggregate.max),
        center: vec3(center),
        size: vec3(size),
        radius: size.length() / 2,
        volume: Math.max(0, size.x * size.y * size.z),
      })
    }
    return aggregate
  }

  visit(root)
  return records.sort((a, b) => a.name.localeCompare(b.name))
}

function rebuildRuntimeSnapshot() {
  snapshot = buildAnatomySpatialIndex([...runtimeByFile.values()].flat())
  for (const listener of listeners) listener()
}

export function publishAnatomySpatialNodes(file: string, nodes: readonly AnatomySpatialNode[]) {
  const key = file.trim()
  if (!key) return
  const normalized = nodes
    .filter((node) => node.file === key && node.name.trim())
    .sort((a, b) => a.name.localeCompare(b.name))
  runtimeByFile.set(key, normalized)
  rebuildRuntimeSnapshot()
}

export function clearAnatomySpatialNodes(file: string) {
  if (!runtimeByFile.delete(file.trim())) return
  rebuildRuntimeSnapshot()
}

export function clearAllAnatomySpatialNodes() {
  if (!runtimeByFile.size) return
  runtimeByFile.clear()
  rebuildRuntimeSnapshot()
}

export function subscribeAnatomySpatialNodes(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAnatomySpatialIndex() {
  return snapshot
}

function intervalDistance(min: number, max: number, coordinate: number) {
  if (coordinate < min) return min - coordinate
  if (coordinate > max) return coordinate - max
  return 0
}

function projectedArea(node: AnatomySpatialNode, axis: 0 | 1 | 2) {
  if (axis === 0) return node.size[1] * node.size[2]
  if (axis === 1) return node.size[0] * node.size[2]
  return node.size[0] * node.size[1]
}

export function queryAnatomyPlane(
  query: AnatomySpatialPlaneQuery,
  index: AnatomySpatialIndex = snapshot,
): AnatomySpatialPlaneHit[] {
  const axis = AXIS_INDEX[query.axis]
  const tolerance = Math.max(0, finite(query.tolerance ?? 0))
  const coordinate = finite(query.coordinate)
  const allowedFiles = query.files ? new Set(query.files) : null
  const sorted = index.axes[query.axis].byMin
  const candidateCount = binaryUpperBoundByMin(sorted, axis, coordinate + tolerance)
  const hits: AnatomySpatialPlaneHit[] = []

  for (let position = 0; position < candidateCount; position += 1) {
    const node = sorted[position]
    if (allowedFiles && !allowedFiles.has(node.file)) continue
    if (node.max[axis] < coordinate - tolerance) continue
    hits.push({
      node,
      distanceToPlane: intervalDistance(node.min[axis], node.max[axis], coordinate),
      projectedBoxArea: projectedArea(node, axis),
    })
  }

  const limit = Math.max(1, Math.min(Math.trunc(query.limit ?? 200), 2_000))
  return hits
    .sort((a, b) => a.distanceToPlane - b.distanceToPlane
      || b.projectedBoxArea - a.projectedBoxArea
      || a.node.name.localeCompare(b.node.name))
    .slice(0, limit)
}

export function queryAnatomyNormalizedPlane(
  axis: AnatomySpatialAxis,
  normalizedPosition: number,
  options: Omit<AnatomySpatialPlaneQuery, 'axis' | 'coordinate'> = {},
  index: AnatomySpatialIndex = snapshot,
) {
  if (!index.bounds) return { coordinate: 0, hits: [] as AnatomySpatialPlaneHit[] }
  const axisIndex = AXIS_INDEX[axis]
  const position = Math.max(0, Math.min(finite(normalizedPosition), 1))
  const coordinate = index.bounds.min[axisIndex]
    + (index.bounds.max[axisIndex] - index.bounds.min[axisIndex]) * position
  return { coordinate, hits: queryAnatomyPlane({ ...options, axis, coordinate }, index) }
}

function pointToAabbDistanceSquared(point: AnatomySpatialVec3, node: AnatomySpatialNode) {
  let distanceSquared = 0
  for (let axis = 0; axis < 3; axis += 1) {
    const value = point[axis]
    const delta = value < node.min[axis]
      ? node.min[axis] - value
      : value > node.max[axis]
        ? value - node.max[axis]
        : 0
    distanceSquared += delta * delta
  }
  return distanceSquared
}

export function nearestAnatomySpatialNodes(
  point: AnatomySpatialVec3,
  options: { maxDistance?: number; limit?: number; files?: readonly string[] } = {},
  index: AnatomySpatialIndex = snapshot,
): AnatomySpatialNearestHit[] {
  const allowedFiles = options.files ? new Set(options.files) : null
  const maxDistance = Math.max(0, finite(options.maxDistance ?? Number.POSITIVE_INFINITY))
  const maxDistanceSquared = maxDistance * maxDistance
  const limit = Math.max(1, Math.min(Math.trunc(options.limit ?? 20), 500))

  return index.nodes
    .filter((node) => !allowedFiles || allowedFiles.has(node.file))
    .map((node) => ({ node, distanceSquared: pointToAabbDistanceSquared(point, node) }))
    .filter((hit) => hit.distanceSquared <= maxDistanceSquared)
    .sort((a, b) => a.distanceSquared - b.distanceSquared || a.node.volume - b.node.volume || a.node.name.localeCompare(b.node.name))
    .slice(0, limit)
    .map((hit) => ({ node: hit.node, distance: Math.sqrt(hit.distanceSquared) }))
}

export function unionAnatomySpatialBounds(
  nodes: readonly AnatomySpatialNode[],
): AnatomySpatialBounds | null {
  return boundsFromNodes(nodes)
}

export function validateAnatomySpatialIndex(index: AnatomySpatialIndex = snapshot) {
  const reasons: string[] = []
  const seen = new Set<string>()
  for (const node of index.nodes) {
    const key = `${node.file}\0${node.name}`
    if (seen.has(key)) reasons.push(`Duplicate spatial source node: ${node.file}:${node.name}`)
    seen.add(key)
    for (let axis = 0; axis < 3; axis += 1) {
      if (!Number.isFinite(node.min[axis]) || !Number.isFinite(node.max[axis])) reasons.push(`${node.name}: non-finite bounds.`)
      if (node.min[axis] > node.max[axis]) reasons.push(`${node.name}: inverted bounds.`)
      if (node.center[axis] < node.min[axis] || node.center[axis] > node.max[axis]) reasons.push(`${node.name}: center outside bounds.`)
      if (node.size[axis] < 0) reasons.push(`${node.name}: negative size.`)
    }
    if (!Number.isFinite(node.radius) || node.radius < 0) reasons.push(`${node.name}: invalid radius.`)
    if (!Number.isFinite(node.volume) || node.volume < 0) reasons.push(`${node.name}: invalid bounding volume.`)
  }
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] }
}
