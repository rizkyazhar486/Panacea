import * as THREE from 'three'
import type { AnatomySpatialAxis, AnatomySpatialVec3 } from './anatomySpatialRegistry'

export interface BodyAtlasExactSectionCandidate {
  file: string
  name: string
}

export interface BodyAtlasExactSectionSourceRoot {
  file: string
  root: THREE.Object3D
}

export interface BodyAtlasExactSectionSegment {
  sourceFile: string
  sourceName: string
  meshName: string
  triangleIndex: number
  start: AnatomySpatialVec3
  end: AnatomySpatialVec3
  length: number
}

export interface BodyAtlasExactSectionRequest {
  axis: AnatomySpatialAxis
  coordinate: number
  candidates: readonly BodyAtlasExactSectionCandidate[]
  sourceRoots: readonly BodyAtlasExactSectionSourceRoot[]
  epsilon?: number
  maxCandidates?: number
  maxTrianglesVisited?: number
  maxSegments?: number
}

export interface BodyAtlasExactSectionResult {
  axis: AnatomySpatialAxis
  coordinate: number
  segments: readonly BodyAtlasExactSectionSegment[]
  unresolvedCandidates: readonly BodyAtlasExactSectionCandidate[]
  sourceNodesExamined: number
  meshesExamined: number
  trianglesVisited: number
  coplanarTrianglesSkipped: number
  truncated: boolean
  semantics: 'exact-source-triangle-plane-segments-not-assembled-contours'
}

const AXIS_INDEX: Record<AnatomySpatialAxis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 }

function finiteOr(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback
}

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number) {
  const candidate = Math.trunc(finiteOr(value, fallback))
  return Math.max(min, Math.min(candidate, max))
}

function sourceOriginalName(object: THREE.Object3D) {
  return typeof object.userData.originalName === 'string' ? object.userData.originalName.trim() : ''
}

function findExactSourceObject(root: THREE.Object3D, sourceName: string): THREE.Object3D | null {
  let match: THREE.Object3D | null = null
  root.traverse((object) => {
    if (!match && sourceOriginalName(object) === sourceName) match = object
  })
  return match
}

function toTuple(vector: THREE.Vector3): AnatomySpatialVec3 {
  return [vector.x, vector.y, vector.z]
}

function addUniquePoint(points: THREE.Vector3[], point: THREE.Vector3, epsilonSquared: number) {
  if (points.some((candidate) => candidate.distanceToSquared(point) <= epsilonSquared)) return
  points.push(point.clone())
}

function farthestPair(points: readonly THREE.Vector3[]) {
  let first = points[0]
  let second = points[1]
  let maxDistanceSquared = first.distanceToSquared(second)
  for (let left = 0; left < points.length; left += 1) {
    for (let right = left + 1; right < points.length; right += 1) {
      const distanceSquared = points[left].distanceToSquared(points[right])
      if (distanceSquared > maxDistanceSquared) {
        maxDistanceSquared = distanceSquared
        first = points[left]
        second = points[right]
      }
    }
  }
  return { first, second, distanceSquared: maxDistanceSquared }
}

function trianglePlaneSegment(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  axisIndex: 0 | 1 | 2,
  coordinate: number,
  epsilon: number,
) {
  const distances = [a.getComponent(axisIndex) - coordinate, b.getComponent(axisIndex) - coordinate, c.getComponent(axisIndex) - coordinate]
  if (distances.every((distance) => Math.abs(distance) <= epsilon)) return { coplanar: true, pair: null as null | { first: THREE.Vector3; second: THREE.Vector3; distanceSquared: number } }

  const vertices = [a, b, c]
  const points: THREE.Vector3[] = []
  const epsilonSquared = epsilon * epsilon
  const edges: readonly [0 | 1 | 2, 0 | 1 | 2][] = [[0, 1], [1, 2], [2, 0]]

  for (const [fromIndex, toIndex] of edges) {
    const fromDistance = distances[fromIndex]
    const toDistance = distances[toIndex]
    const from = vertices[fromIndex]
    const to = vertices[toIndex]

    if (Math.abs(fromDistance) <= epsilon) addUniquePoint(points, from, epsilonSquared)
    if (Math.abs(toDistance) <= epsilon) addUniquePoint(points, to, epsilonSquared)

    const crosses = (fromDistance < -epsilon && toDistance > epsilon)
      || (fromDistance > epsilon && toDistance < -epsilon)
    if (crosses) {
      const denominator = fromDistance - toDistance
      if (Math.abs(denominator) > Number.EPSILON) {
        const t = fromDistance / denominator
        addUniquePoint(points, from.clone().lerp(to, t), epsilonSquared)
      }
    }
  }

  if (points.length < 2) return { coplanar: false, pair: null }
  const pair = farthestPair(points)
  return pair.distanceSquared > epsilonSquared ? { coplanar: false, pair } : { coplanar: false, pair: null }
}

/**
 * Exact narrow-phase plane intersection over already-loaded source triangle geometry.
 *
 * The caller should feed exact `(file, originalName)` candidates obtained from the
 * AABB broad phase. Returned line segments come only from actual source triangles
 * transformed into world space. They are deliberately NOT assembled, closed,
 * smoothed, filled, or promoted to an anatomical contour here.
 *
 * Fully coplanar triangles are skipped rather than inventing a boundary for a
 * surface that lies in the section plane. Hard budgets make an incomplete result
 * explicit through `truncated` instead of silently pretending the section is complete.
 */
export function intersectBodyAtlasSourceMeshesWithPlane(
  request: BodyAtlasExactSectionRequest,
): BodyAtlasExactSectionResult {
  const axisIndex = AXIS_INDEX[request.axis]
  const coordinate = finiteOr(request.coordinate, 0)
  const epsilon = Math.max(1e-9, Math.min(Math.abs(finiteOr(request.epsilon, 1e-6)), 1e-2))
  const maxCandidates = boundedInteger(request.maxCandidates, 128, 1, 2_000)
  const maxTrianglesVisited = boundedInteger(request.maxTrianglesVisited, 250_000, 1, 2_000_000)
  const maxSegments = boundedInteger(request.maxSegments, 25_000, 1, 250_000)
  const rootsByFile = new Map(request.sourceRoots.map((entry) => [entry.file.trim(), entry.root] as const))
  const segments: BodyAtlasExactSectionSegment[] = []
  const unresolvedCandidates: BodyAtlasExactSectionCandidate[] = []
  let sourceNodesExamined = 0
  let meshesExamined = 0
  let trianglesVisited = 0
  let coplanarTrianglesSkipped = 0
  let truncated = request.candidates.length > maxCandidates

  candidateLoop:
  for (const candidate of request.candidates.slice(0, maxCandidates)) {
    const file = candidate.file.trim()
    const name = candidate.name.trim()
    const root = rootsByFile.get(file)
    if (!root || !name) {
      unresolvedCandidates.push({ file, name })
      continue
    }

    root.updateMatrixWorld(true)
    const sourceObject = findExactSourceObject(root, name)
    if (!sourceObject) {
      unresolvedCandidates.push({ file, name })
      continue
    }
    sourceNodesExamined += 1

    const meshes: THREE.Mesh[] = []
    sourceObject.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BufferGeometry) meshes.push(object)
    })

    for (const mesh of meshes) {
      meshesExamined += 1
      const geometry = mesh.geometry
      const position = geometry.getAttribute('position')
      if (!position || position.itemSize < 3) continue
      const index = geometry.getIndex()
      const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3)
      const a = new THREE.Vector3()
      const b = new THREE.Vector3()
      const c = new THREE.Vector3()

      for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
        if (trianglesVisited >= maxTrianglesVisited || segments.length >= maxSegments) {
          truncated = true
          break candidateLoop
        }
        trianglesVisited += 1

        const base = triangleIndex * 3
        const ia = index ? index.getX(base) : base
        const ib = index ? index.getX(base + 1) : base + 1
        const ic = index ? index.getX(base + 2) : base + 2
        a.fromBufferAttribute(position, ia).applyMatrix4(mesh.matrixWorld)
        b.fromBufferAttribute(position, ib).applyMatrix4(mesh.matrixWorld)
        c.fromBufferAttribute(position, ic).applyMatrix4(mesh.matrixWorld)

        const intersection = trianglePlaneSegment(a, b, c, axisIndex, coordinate, epsilon)
        if (intersection.coplanar) {
          coplanarTrianglesSkipped += 1
          continue
        }
        if (!intersection.pair) continue

        const start = intersection.pair.first
        const end = intersection.pair.second
        segments.push({
          sourceFile: file,
          sourceName: name,
          meshName: sourceOriginalName(mesh) || mesh.name.trim() || '(unnamed-source-mesh)',
          triangleIndex,
          start: toTuple(start),
          end: toTuple(end),
          length: Math.sqrt(intersection.pair.distanceSquared),
        })
      }
    }
  }

  return {
    axis: request.axis,
    coordinate,
    segments,
    unresolvedCandidates,
    sourceNodesExamined,
    meshesExamined,
    trianglesVisited,
    coplanarTrianglesSkipped,
    truncated,
    semantics: 'exact-source-triangle-plane-segments-not-assembled-contours',
  }
}
