import { INDEKS_TUBUH } from '../bodyIndex.gen'
import type { CompiledAtlas, CompiledAtlasNode } from './atlasCompiler'
import {
  atlasRenderScore,
  chooseAtlasLod,
  type AtlasDeviceBudget,
  type AtlasLodProfile,
  type AtlasRenderRequest,
  type AtlasResolvedNode,
  type AtlasSystemId,
} from './atlasKernel'

export type AtlasCostBasis = 'measured-index' | 'lod-upper-bound'

export interface MeasuredAtlasResolvedNode extends AtlasResolvedNode {
  measuredTriangles: number
  incrementalTriangles: number
  sourceNodeCount: number
  incrementalSourceNodeCount: number
  costBasis: AtlasCostBasis
  resourceEfficiencyScore: number
}

export interface MeasuredAtlasRenderPlan {
  selectedNodeId?: string
  nodes: readonly MeasuredAtlasResolvedNode[]
  skipped: readonly { nodeId: string; reason: string }[]
  totalTriangles: number
  totalEstimatedTextureMegabytes: number
  totalUniqueSourceNodes: number
  triangleHeadroom: number
  textureHeadroomMegabytes: number
  nodeHeadroom: number
}

const TRIANGLES_BY_SOURCE_NAME = new Map(INDEKS_TUBUH.map((entry) => [entry.n, entry.t] as const))

function matchesRequest(entry: CompiledAtlasNode, request: AtlasRenderRequest) {
  const node = entry.node
  if (request.systems?.length && !request.systems.includes(node.system)) return false
  if (request.regions?.length && !node.regions.some((region) => request.regions!.includes(region))) return false
  if (!request.includeReferenceOnly && (entry.resolution === 'reference-only' || entry.resolution === 'planned')) return false
  return true
}

function sourceKeys(entry: CompiledAtlasNode) {
  const keys: string[] = []
  for (const match of entry.sourceMatches) {
    for (const name of match.names) keys.push(`${match.file}|${name}`)
  }
  return [...new Set(keys)].sort()
}

function triangleCostForSourceKey(key: string) {
  const separator = key.indexOf('|')
  const sourceName = separator >= 0 ? key.slice(separator + 1) : key
  return TRIANGLES_BY_SOURCE_NAME.get(sourceName) ?? 0
}

function nominalTriangleCost(entry: CompiledAtlasNode, lod: AtlasLodProfile) {
  if (entry.footprint.triangleCount > 0) return { triangles: entry.footprint.triangleCount, basis: 'measured-index' as const }
  return { triangles: lod.maxTriangles, basis: 'lod-upper-bound' as const }
}

/**
 * Build a deterministic render residency plan from the compiled source index.
 *
 * Unlike the generic planner, this planner:
 * - never pretends reference-only nodes have renderable 3D geometry;
 * - uses indexed triangle counts whenever they exist;
 * - de-duplicates exact source nodes already resident for another semantic node;
 * - keeps LOD values as an upper-bound fallback when source cost is unmeasured.
 *
 * The score is purely a graphics scheduling heuristic:
 * resourceEfficiency = atlasRenderScore / max(1, triangles/100000 + textureMB/8 + sourceNodes/16)
 * It is never a disease probability, severity score, or patient prioritization rule.
 */
export function buildMeasuredAtlasRenderPlan(
  compiled: CompiledAtlas,
  request: AtlasRenderRequest,
  budget: AtlasDeviceBudget,
): MeasuredAtlasRenderPlan {
  const skipped: { nodeId: string; reason: string }[] = []
  const candidates: Array<{
    entry: CompiledAtlasNode
    lod: AtlasLodProfile
    sourceKeys: readonly string[]
    nominalTriangles: number
    basis: AtlasCostBasis
    score: number
    efficiency: number
  }> = []

  for (const entry of compiled.nodes) {
    if (!matchesRequest(entry, request)) continue
    const node = entry.node
    if (entry.resolution === 'reference-only' || entry.resolution === 'planned') {
      skipped.push({ nodeId: node.id, reason: 'Logical/reference atlas node has no publishable source mesh residency.' })
      continue
    }
    if (entry.resolution === 'missing-shipped' || entry.sourceMatches.length === 0) {
      skipped.push({ nodeId: node.id, reason: 'No reviewed source-node match is available for this render candidate.' })
      continue
    }

    const projected = request.projectedPixelsByNodeId?.[node.id] ?? 120
    const lod = chooseAtlasLod(node, projected, budget)
    const nominal = nominalTriangleCost(entry, lod)
    const keys = sourceKeys(entry)
    const score = atlasRenderScore(node, request)
    const resourceUnits = Math.max(
      1,
      nominal.triangles / 100_000
        + lod.maxTextureMegabytes / 8
        + Math.max(keys.length, 1) / 16,
    )
    candidates.push({
      entry,
      lod,
      sourceKeys: keys,
      nominalTriangles: nominal.triangles,
      basis: nominal.basis,
      score,
      efficiency: score / resourceUnits,
    })
  }

  candidates.sort((a, b) =>
    b.efficiency - a.efficiency
    || b.score - a.score
    || a.entry.node.id.localeCompare(b.entry.node.id),
  )

  const residentSourceKeys = new Set<string>()
  const accepted: MeasuredAtlasResolvedNode[] = []
  let triangles = 0
  let textures = 0

  for (const candidate of candidates) {
    if (accepted.length >= budget.nodeBudget) {
      skipped.push({ nodeId: candidate.entry.node.id, reason: 'Semantic node budget exhausted.' })
      continue
    }

    const newKeys = candidate.sourceKeys.filter((key) => !residentSourceKeys.has(key))
    let incrementalTriangles = newKeys.reduce((sum, key) => sum + triangleCostForSourceKey(key), 0)
    if (incrementalTriangles === 0 && newKeys.length > 0) incrementalTriangles = candidate.nominalTriangles
    const incrementalTexture = candidate.lod.maxTextureMegabytes

    if (triangles + incrementalTriangles > budget.triangleBudget) {
      skipped.push({ nodeId: candidate.entry.node.id, reason: 'Measured/fallback triangle budget exhausted.' })
      continue
    }
    if (textures + incrementalTexture > budget.textureBudgetMegabytes) {
      skipped.push({ nodeId: candidate.entry.node.id, reason: 'Estimated texture budget exhausted.' })
      continue
    }

    for (const key of newKeys) residentSourceKeys.add(key)
    triangles += incrementalTriangles
    textures += incrementalTexture
    accepted.push({
      node: candidate.entry.node,
      sourceMatches: candidate.entry.sourceMatches,
      lod: candidate.lod,
      score: candidate.score,
      estimatedTriangles: candidate.nominalTriangles,
      estimatedTextureMegabytes: candidate.lod.maxTextureMegabytes,
      measuredTriangles: candidate.entry.footprint.triangleCount,
      incrementalTriangles,
      sourceNodeCount: candidate.sourceKeys.length,
      incrementalSourceNodeCount: newKeys.length,
      costBasis: candidate.basis,
      resourceEfficiencyScore: candidate.efficiency,
    })
  }

  return {
    selectedNodeId: request.selectedNodeId,
    nodes: accepted,
    skipped,
    totalTriangles: triangles,
    totalEstimatedTextureMegabytes: textures,
    totalUniqueSourceNodes: residentSourceKeys.size,
    triangleHeadroom: Math.max(0, budget.triangleBudget - triangles),
    textureHeadroomMegabytes: Math.max(0, budget.textureBudgetMegabytes - textures),
    nodeHeadroom: Math.max(0, budget.nodeBudget - accepted.length),
  }
}

/**
 * Sparse by design: a system absent from the compiled manifest is absent from
 * the result rather than being falsely advertised as measured zero coverage.
 */
export function measuredCoverageBySystem(
  compiled: CompiledAtlas,
): Readonly<Partial<Record<AtlasSystemId, { nodes: number; triangles: number }>>> {
  const systems: Partial<Record<AtlasSystemId, { nodes: number; triangles: number }>> = {}
  for (const entry of compiled.nodes) {
    const current = systems[entry.node.system] ?? { nodes: 0, triangles: 0 }
    current.nodes += 1
    current.triangles += entry.footprint.triangleCount
    systems[entry.node.system] = current
  }
  return systems
}
