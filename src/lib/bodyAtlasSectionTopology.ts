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

function finiteOr(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback
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

function clusterEndpoint(
  point: AnatomySpatialVec3,
  clusters: EndpointCluster[],
  epsilonSquared: number,
) {
  for (let index = 0; index < clusters.length; index += 1) {
    if (squaredDistance(point, clusters[index].representative) <= epsilonSquared) return index
  }
  clusters.push({ representative: point, edgeIndices: [] })
  return clusters.length - 1
}

function classifyComponent(
  nodeIndices: readonly number[],
  edgeIndices: readonly number[],
  clusters: readonly EndpointCluster[],
): Pick<BodyAtlasSectionTopologyComponent, 'topology' | 'degreeOneCount' | 'maxDegree'> {
  const degrees = nodeIndices.map((nodeIndex) => clusters[nodeIndex].edgeIndices.filter((edgeIndex) => edgeIndices.includes(edgeIndex)).length)
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
 * Endpoint clustering is used only to decide graph connectivity. This function
 * never snaps or averages points, never inserts a missing edge, never closes a
 * gap, never smooths a curve, and never emits a filled/assembled contour.
 * `closed-loop` therefore means only that the supplied raw segment graph is
 * topologically closed within epsilon. It is not an academic/anatomical review
 * status and `publishableContour` intentionally remains false.
 */
export function classifyBodyAtlasSectionTopology(
  segments: readonly BodyAtlasExactSectionSegment[],
  options: { endpointEpsilon?: number; sourceSectionTruncated?: boolean } = {},
): BodyAtlasSectionTopologyResult {
  const epsilon = Math.max(1e-9, Math.min(Math.abs(finiteOr(options.endpointEpsilon, 1e-6)), 1e-2))
  const epsilonSquared = epsilon * epsilon
  const sourceSectionTruncated = Boolean(options.sourceSectionTruncated)
  const droppedDegenerateSegmentIndices: number[] = []
  const grouped = new Map<string, number[]>()

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
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
    const edges: EdgeRecord[] = []

    for (const segmentIndex of segmentIndices) {
      const segment = segments[segmentIndex]
      const a = clusterEndpoint(segment.start, clusters, epsilonSquared)
      const b = clusterEndpoint(segment.end, clusters, epsilonSquared)
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
        completeSourceSection: !sourceSectionTruncated,
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
    semantics: 'source-segment-topology-only-no-gap-closing-no-smoothing',
  }
}
