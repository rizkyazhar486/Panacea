import type { AnatomySpatialVec3 } from './anatomySpatialRegistry'
import type { BodyAtlasExactSectionSegment } from './bodyAtlasExactMeshSection'

export type BodyAtlasSectionTopologyKind = 'closed-loop' | 'open-chain' | 'branched'

export interface BodyAtlasSectionTopologyComponent {
  sourceFile: string
  sourceName: string
  topology: BodyAtlasSectionTopologyKind
  segmentIndices: readonly number[]
  endpointClusterCount: number
  degreeOneCount: number
  maxDegree: number
  completeSourceSection: boolean
  publishableContour: false
}

export interface BodyAtlasSectionTopologyResult {
  components: readonly BodyAtlasSectionTopologyComponent[]
  droppedDegenerateSegmentIndices: readonly number[]
  sourceSectionTruncated: boolean
  topologyTruncated: boolean
  inputSegmentsConsidered: number
  semantics: 'source-segment-topology-only-no-gap-closing-no-smoothing'
}

interface EndpointCluster {
  representative: AnatomySpatialVec3
  edgeIndices: number[]
}

interface EdgeRecord {
  segmentIndex: number
  a: number
  b: number
}

interface EndpointSpatialHash {
  cellSize: number
  buckets: Map<string, number[]>
}

function finiteOr(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback
}

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number) {
  const candidate = Math.trunc(finiteOr(value, fallback))
  return Math.max(min, Math.min(candidate, max))
}

function squaredDistance(a: AnatomySpatialVec3, b: AnatomySpatialVec3) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return dx * dx + dy * dy + dz * dz
}

function sourceKey(segment: BodyAtlasExactSectionSegment) {
  return `${segment.sourceFile}\0${segment.sourceName}`
}

function cellCoordinate(value: number, cellSize: number) {
  return Math.floor(value / cellSize)
}

function cellKey(x: number, y: number, z: number) {
  return `${x},${y},${z}`
}

function clusterEndpoint(
  point: AnatomySpatialVec3,
  clusters: EndpointCluster[],
  spatialHash: EndpointSpatialHash,
  epsilonSquared: number,
) {
  const x = cellCoordinate(point[0], spatialHash.cellSize)
  const y = cellCoordinate(point[1], spatialHash.cellSize)
  const z = cellCoordinate(point[2], spatialHash.cellSize)

  // Any endpoint within epsilon must live in this cell or one of the 26
  // neighboring cells. Search only those buckets instead of every cluster.
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        const candidates = spatialHash.buckets.get(cellKey(x + dx, y + dy, z + dz))
        if (!candidates) continue
        for (const clusterIndex of candidates) {
          if (squaredDistance(point, clusters[clusterIndex].representative) <= epsilonSquared) return clusterIndex
        }
      }
    }
  }

  const clusterIndex = clusters.length
  clusters.push({ representative: point, edgeIndices: [] })
  const key = cellKey(x, y, z)
  const bucket = spatialHash.buckets.get(key) ?? []
  bucket.push(clusterIndex)
  spatialHash.buckets.set(key, bucket)
  return clusterIndex
}

function classifyComponent(
  nodeIndices: readonly number[],
  edgeIndices: readonly number[],
  clusters: readonly EndpointCluster[],
): Pick<BodyAtlasSectionTopologyComponent, 'topology' | 'degreeOneCount' | 'maxDegree'> {
  const edgeSet = new Set(edgeIndices)
  const degrees = nodeIndices.map((nodeIndex) => clusters[nodeIndex].edgeIndices.filter((edgeIndex) => edgeSet.has(edgeIndex)).length)
  const degreeOneCount = degrees.filter((degree) => degree === 1).length
  const maxDegree = degrees.length ? Math.max(...degrees) : 0
  const allDegreeTwo = degrees.length > 0 && degrees.every((degree) => degree === 2)
  const openChain = degreeOneCount === 2 && degrees.every((degree) => degree === 1 || degree === 2)
  const topology: BodyAtlasSectionTopologyKind = allDegreeTwo && edgeIndices.length >= 3
    ? 'closed-loop'
    : openChain
      ? 'open-chain'
      : 'branched'
  return { topology, degreeOneCount, maxDegree }
}

/**
 * Classify connectivity of exact source-triangle section segments without
 * altering their geometry.
 *
 * Endpoint clustering is used only to decide graph connectivity. A spatial hash
 * bounds neighborhood lookup to adjacent epsilon-sized cells; a hard segment
 * budget prevents unbounded work. This function never snaps or averages points,
 * never inserts a missing edge, never closes a gap, never smooths a curve, and
 * never emits a filled/assembled contour.
 *
 * `closed-loop` therefore means only that the supplied raw segment graph is
 * topologically closed within epsilon. It is not an academic/anatomical review
 * status and `publishableContour` intentionally remains false. If either the
 * upstream exact section or this topology pass is truncated, the component is
 * explicitly marked incomplete.
 */
export function classifyBodyAtlasSectionTopology(
  segments: readonly BodyAtlasExactSectionSegment[],
  options: { endpointEpsilon?: number; sourceSectionTruncated?: boolean; maxSegments?: number } = {},
): BodyAtlasSectionTopologyResult {
  const epsilon = Math.max(1e-9, Math.min(Math.abs(finiteOr(options.endpointEpsilon, 1e-6)), 1e-2))
  const epsilonSquared = epsilon * epsilon
  const sourceSectionTruncated = Boolean(options.sourceSectionTruncated)
  const maxSegments = boundedInteger(options.maxSegments, 25_000, 1, 100_000)
  const inputSegmentsConsidered = Math.min(segments.length, maxSegments)
  const topologyTruncated = segments.length > maxSegments
  const completeSourceSection = !sourceSectionTruncated && !topologyTruncated
  const droppedDegenerateSegmentIndices: number[] = []
  const grouped = new Map<string, number[]>()

  for (let segmentIndex = 0; segmentIndex < inputSegmentsConsidered; segmentIndex += 1) {
    const segment = segments[segmentIndex]
    const key = sourceKey(segment)
    const indices = grouped.get(key) ?? []
    indices.push(segmentIndex)
    grouped.set(key, indices)
  }

  const components: BodyAtlasSectionTopologyComponent[] = []

  for (const segmentIndices of grouped.values()) {
    const firstSegment = segments[segmentIndices[0]]
    const clusters: EndpointCluster[] = []
    const spatialHash: EndpointSpatialHash = { cellSize: epsilon, buckets: new Map() }
    const edges: EdgeRecord[] = []

    for (const segmentIndex of segmentIndices) {
      const segment = segments[segmentIndex]
      const a = clusterEndpoint(segment.start, clusters, spatialHash, epsilonSquared)
      const b = clusterEndpoint(segment.end, clusters, spatialHash, epsilonSquared)
      if (a === b) {
        droppedDegenerateSegmentIndices.push(segmentIndex)
        continue
      }
      const edgeIndex = edges.length
      edges.push({ segmentIndex, a, b })
      clusters[a].edgeIndices.push(edgeIndex)
      clusters[b].edgeIndices.push(edgeIndex)
    }

    const unvisitedEdges = new Set(edges.map((_, index) => index))
    while (unvisitedEdges.size) {
      const seed = unvisitedEdges.values().next().value as number
      const componentEdges: number[] = []
      const componentNodes = new Set<number>()
      const stack = [seed]
      unvisitedEdges.delete(seed)

      while (stack.length) {
        const edgeIndex = stack.pop()!
        const edge = edges[edgeIndex]
        componentEdges.push(edgeIndex)
        componentNodes.add(edge.a)
        componentNodes.add(edge.b)

        for (const nodeIndex of [edge.a, edge.b]) {
          for (const neighborEdgeIndex of clusters[nodeIndex].edgeIndices) {
            if (!unvisitedEdges.has(neighborEdgeIndex)) continue
            unvisitedEdges.delete(neighborEdgeIndex)
            stack.push(neighborEdgeIndex)
          }
        }
      }

      const rawSegmentIndices = componentEdges.map((edgeIndex) => edges[edgeIndex].segmentIndex).sort((a, b) => a - b)
      const classification = classifyComponent([...componentNodes], componentEdges, clusters)
      components.push({
        sourceFile: firstSegment.sourceFile,
        sourceName: firstSegment.sourceName,
        topology: classification.topology,
        segmentIndices: rawSegmentIndices,
        endpointClusterCount: componentNodes.size,
        degreeOneCount: classification.degreeOneCount,
        maxDegree: classification.maxDegree,
        completeSourceSection,
        publishableContour: false,
      })
    }
  }

  return {
    components: components.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile)
      || a.sourceName.localeCompare(b.sourceName)
      || a.segmentIndices[0] - b.segmentIndices[0]),
    droppedDegenerateSegmentIndices: droppedDegenerateSegmentIndices.sort((a, b) => a - b),
    sourceSectionTruncated,
    topologyTruncated,
    inputSegmentsConsidered,
    semantics: 'source-segment-topology-only-no-gap-closing-no-smoothing',
  }
}
