import { INDEKS_TUBUH, type StrukturTubuh } from '../bodyIndex.gen'
import {
  anatomySourceNodeOrigin,
  resolveAllAnatomySourceNodes,
  resolveAnatomySourceNodes,
  type AnatomySourceNodeBundle,
  type AnatomySourceNodeMatch,
  type AnatomySourceNodeOrigin,
} from '../anatomySourceNodeRegistry'
import type { AtlasManifest, AtlasNode, AtlasSystemId } from './atlasKernel'

export type AtlasGeometryResolution =
  | 'resolved-shipped'
  | 'resolved-partial'
  | 'missing-shipped'
  | 'reference-only'
  | 'planned'

export interface AtlasSourceFootprint {
  sourceFiles: readonly string[]
  sourceNodeNames: readonly string[]
  sourceNodeCount: number
  triangleCount: number
  indexedRegions: readonly string[]
  yMin?: number
  yMax?: number
  radialMax?: number
  laterality: readonly StrukturTubuh['s'][]
}

export interface CompiledAtlasNode {
  node: AtlasNode
  resolution: AtlasGeometryResolution
  sourceMatches: readonly AnatomySourceNodeMatch[]
  sourceOrigins: Readonly<Record<string, AnatomySourceNodeOrigin>>
  footprint: AtlasSourceFootprint
}

export interface AtlasSystemCoverage {
  system: AtlasSystemId
  nodeCount: number
  shippedNodeCount: number
  resolvedShippedNodeCount: number
  partialNodeCount: number
  resolvedPartialNodeCount: number
  referenceOnlyNodeCount: number
  missingShippedNodeIds: readonly string[]
  resolvedSourceNodeCount: number
  resolvedTriangles: number
  shippedCoverageRatio: number
}

export interface CompiledAtlas {
  manifestId: string
  manifestRevision: string
  nodes: readonly CompiledAtlasNode[]
  systems: readonly AtlasSystemCoverage[]
  totals: {
    nodeCount: number
    resolvedSourceNodeCount: number
    resolvedTriangles: number
    shippedNodeCount: number
    resolvedShippedNodeCount: number
    shippedCoverageRatio: number
  }
}

const BODY_INDEX_BY_NAME = new Map(INDEKS_TUBUH.map((entry) => [entry.n, entry] as const))

function sourceMatchesFor(node: AtlasNode, bundles: readonly AnatomySourceNodeBundle[]) {
  const scoped = node.source.files?.length
    ? bundles.filter((bundle) => node.source.files!.includes(bundle.file))
    : bundles
  return node.source.mode === 'composite'
    ? resolveAllAnatomySourceNodes(node.source.nodeHints, scoped, 32)
    : resolveAnatomySourceNodes(node.source.nodeHints, scoped, 32)
}

function flattenMatches(matches: readonly AnatomySourceNodeMatch[]) {
  const sourceFiles = [...new Set(matches.map((match) => match.file))].sort()
  const sourceNodeNames = [...new Set(matches.flatMap((match) => match.names))].sort()
  return { sourceFiles, sourceNodeNames }
}

function footprintFor(matches: readonly AnatomySourceNodeMatch[]): AtlasSourceFootprint {
  const { sourceFiles, sourceNodeNames } = flattenMatches(matches)
  const indexed = sourceNodeNames
    .map((name) => BODY_INDEX_BY_NAME.get(name))
    .filter((entry): entry is StrukturTubuh => Boolean(entry))

  const ys = indexed.map((entry) => entry.y)
  const radii = indexed.map((entry) => entry.r)
  return {
    sourceFiles,
    sourceNodeNames,
    sourceNodeCount: sourceNodeNames.length,
    triangleCount: indexed.reduce((sum, entry) => sum + entry.t, 0),
    indexedRegions: [...new Set(indexed.map((entry) => entry.w))].sort(),
    yMin: ys.length ? Math.min(...ys) : undefined,
    yMax: ys.length ? Math.max(...ys) : undefined,
    radialMax: radii.length ? Math.max(...radii) : undefined,
    laterality: [...new Set(indexed.map((entry) => entry.s))].sort(),
  }
}

function geometryResolution(node: AtlasNode, matches: readonly AnatomySourceNodeMatch[]): AtlasGeometryResolution {
  if (node.geometryStatus === 'reference-only') return 'reference-only'
  if (node.geometryStatus === 'planned') return 'planned'
  if (node.geometryStatus === 'shipped') return matches.length ? 'resolved-shipped' : 'missing-shipped'
  return matches.length ? 'resolved-partial' : 'planned'
}

export function compileAtlasAgainstSource(
  manifest: AtlasManifest,
  bundles: readonly AnatomySourceNodeBundle[],
): CompiledAtlas {
  const nodes: CompiledAtlasNode[] = manifest.nodes.map((node) => {
    const sourceMatches = sourceMatchesFor(node, bundles)
    const sourceFiles = [...new Set(sourceMatches.map((match) => match.file))]
    return {
      node,
      resolution: geometryResolution(node, sourceMatches),
      sourceMatches,
      sourceOrigins: Object.fromEntries(sourceFiles.map((file) => [file, anatomySourceNodeOrigin(file)])),
      footprint: footprintFor(sourceMatches),
    }
  })

  const systemIds = [...new Set(manifest.nodes.map((node) => node.system))].sort()
  const systems: AtlasSystemCoverage[] = systemIds.map((system) => {
    const entries = nodes.filter((entry) => entry.node.system === system)
    const shipped = entries.filter((entry) => entry.node.geometryStatus === 'shipped')
    const resolvedShipped = shipped.filter((entry) => entry.resolution === 'resolved-shipped')
    const partial = entries.filter((entry) => entry.node.geometryStatus === 'partial')
    const resolvedPartial = partial.filter((entry) => entry.resolution === 'resolved-partial')
    const referenceOnly = entries.filter((entry) => entry.node.geometryStatus === 'reference-only')
    const sourceNames = new Set(entries.flatMap((entry) => entry.footprint.sourceNodeNames))
    const triangleEntries = new Set<string>()
    let resolvedTriangles = 0
    for (const entry of entries) {
      for (const name of entry.footprint.sourceNodeNames) {
        if (triangleEntries.has(name)) continue
        triangleEntries.add(name)
        resolvedTriangles += BODY_INDEX_BY_NAME.get(name)?.t ?? 0
      }
    }

    return {
      system,
      nodeCount: entries.length,
      shippedNodeCount: shipped.length,
      resolvedShippedNodeCount: resolvedShipped.length,
      partialNodeCount: partial.length,
      resolvedPartialNodeCount: resolvedPartial.length,
      referenceOnlyNodeCount: referenceOnly.length,
      missingShippedNodeIds: shipped.filter((entry) => entry.resolution === 'missing-shipped').map((entry) => entry.node.id).sort(),
      resolvedSourceNodeCount: sourceNames.size,
      resolvedTriangles,
      shippedCoverageRatio: shipped.length ? resolvedShipped.length / shipped.length : 1,
    }
  })

  const shipped = nodes.filter((entry) => entry.node.geometryStatus === 'shipped')
  const resolvedShipped = shipped.filter((entry) => entry.resolution === 'resolved-shipped')
  const uniqueSourceNames = new Set(nodes.flatMap((entry) => entry.footprint.sourceNodeNames))
  let resolvedTriangles = 0
  for (const name of uniqueSourceNames) resolvedTriangles += BODY_INDEX_BY_NAME.get(name)?.t ?? 0

  return {
    manifestId: manifest.id,
    manifestRevision: manifest.revision,
    nodes,
    systems,
    totals: {
      nodeCount: nodes.length,
      resolvedSourceNodeCount: uniqueSourceNames.size,
      resolvedTriangles,
      shippedNodeCount: shipped.length,
      resolvedShippedNodeCount: resolvedShipped.length,
      shippedCoverageRatio: shipped.length ? resolvedShipped.length / shipped.length : 1,
    },
  }
}

export function atlasCoverageFailures(compiled: CompiledAtlas) {
  return compiled.nodes
    .filter((entry) => entry.resolution === 'missing-shipped')
    .map((entry) => ({
      nodeId: entry.node.id,
      label: entry.node.label,
      system: entry.node.system,
      hints: entry.node.source.nodeHints,
      files: entry.node.source.files ?? [],
    }))
}

export function atlasCoverageBySystem(compiled: CompiledAtlas, system: AtlasSystemId) {
  return compiled.systems.find((entry) => entry.system === system)
}
